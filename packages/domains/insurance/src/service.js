import { randomBytes } from "crypto";
import { AppError, coverEndDate } from "@travel-suite/utils";

export function createInsuranceService({
  InsuranceApplication,
  Affiliate,
  wis,
  brevo,
  logger,
  notifications,
}) {
  const validateForm = (body) => {
    const { adults = 0, children = 0, seniors = 0 } = body.quantity || {};
    const totalPeople = adults + children + seniors;

    const isMultiYear =
      body.journeyType === "annual" || body.journeyType === "biennial";
    if (!body.startDate) throw new AppError("Start date is missing");
    if (!isMultiYear && !body.endDate)
      throw new AppError("End date is missing");
    if (!body.region) throw new AppError("Region is missing");
    if (adults < 1 || totalPeople === 0)
      throw new AppError("Please select at least 1 adult");
  };

  const validateCreateBody = (body) => {
    if (!body.email) throw new AppError("Email address is required", 400);
    if (!body.streetAddress) throw new AppError("Address is required", 400);
    if (!body.city) throw new AppError("City is required", 400);
    if (!body.country) throw new AppError("Country is required", 400);
    if (!body.mobile?.digits)
      throw new AppError("Phone number is required", 400);
    if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
      throw new AppError("At least one passenger is required", 400);
    }
    body.passengers.forEach((pax, i) => {
      const n = i + 1;
      if (!pax.firstName)
        throw new AppError(`Passenger ${n}: first name is required`, 400);
      if (!pax.lastName)
        throw new AppError(`Passenger ${n}: last name is required`, 400);
      if (!pax.dob)
        throw new AppError(`Passenger ${n}: date of birth is required`, 400);
      if (!pax.passport)
        throw new AppError(`Passenger ${n}: passport number is required`, 400);
      if (!pax.nationality)
        throw new AppError(`Passenger ${n}: nationality is required`, 400);
    });
  };

  const validateApplicationBody = (body) => {
    if (!body.quoteId) throw new AppError("Quote ID missing");
    if (!body.schemeId) throw new AppError("Scheme ID missing");
    if (!body.email) throw new AppError("Email address not entered");
    if (!body.streetAddress) throw new AppError("Address is missing");
    if (!body.city) throw new AppError("City is missing");
    if (!body.country) throw new AppError("Country is missing");
    if (!body.mobile?.digits) throw new AppError("Phone Number missing");
    if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
      throw new AppError("At least one passenger is required");
    }
    body.passengers.forEach((pax) => {
      if (!pax.firstName) throw new AppError("First name is missing");
      if (!pax.lastName) throw new AppError("Last name is missing");
      if (!pax.nationality) throw new AppError("Nationality is missing");
      if (!pax.dob) throw new AppError("Date of birth is missing");
      if (!pax.passport) throw new AppError("Passport number is missing");
    });
    return true;
  };

  const resolveAffiliateForApplication = async (affiliateIdInput) => {
    const normalizedAffiliateId = String(affiliateIdInput || "").trim();
    if (!normalizedAffiliateId) return null;

    if (!Affiliate) {
      logger.warn("Affiliate id supplied but no Affiliate model is wired; ignoring", {
        affiliateId: normalizedAffiliateId,
      });
      return null;
    }

    const affiliate = await Affiliate.findOne({
      affiliateId: normalizedAffiliateId,
      isActive: true,
    }).select("_id affiliateId name email commissionPercent isActive");

    if (!affiliate) throw new AppError("Affiliate not found or inactive", 400);

    return affiliate;
  };

  const generatePaymentSyncToken = () => randomBytes(24).toString("hex");

  const serializeApplicationForClient = (application, syncStatus) => {
    if (!application) return application;
    const payload =
      typeof application.toObject === "function"
        ? application.toObject()
        : { ...application };
    delete payload.paymentSyncToken;
    if (syncStatus) payload.syncStatus = syncStatus;
    return payload;
  };


  // The provider generates PDFs a few seconds after issuance; a first miss is
  // normal, so retry briefly rather than send an email with no documents.
  const fetchPolicyDocuments = async (policyId) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const docs = await wis.downloadWISInsuranceDocuments(policyId);
        if (Array.isArray(docs) && docs.length) return docs.map((d) => ({ name: d.name, url: d.url }));
      } catch (err) {
        logger.warn("Policy documents not ready yet", { policyId, attempt, error: err?.message });
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    return [];
  };

  const downloadAttachments = async (documents) => {
    const out = [];
    for (const doc of documents) {
      try {
        const res = await fetch(doc.url);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const name = `${String(doc.name).replace(/[^\w\- ]+/g, "").trim() || "document"}.pdf`;
        out.push({ name, content: buf.toString("base64") });
      } catch (err) {
        logger.warn("Policy document download failed", { url: doc.url, error: err?.message });
      }
    }
    return out;
  };


  // Sends the customer's policy email and records the outcome on the
  // application, so the admin can see it and resend. Never throws: the
  // policy is already issued by the time this runs.
  const sendPolicyEmail = async (application) => {
    if (!notifications.policyIssuedEmail || !application?.policyId) return null;
    const documents = await fetchPolicyDocuments(application.policyId);
    const attachments = await downloadAttachments(documents);
    let result;
    try {
      result = await notifications.policyIssuedEmail({
        email: application.email,
        firstName: application.passengers?.[0]?.firstName,
        policyNumber: application.policyNumber,
        journeyType: application.journeyType,
        region: application.region?.name || application.region?.id || application.region,
        startDate: application.startDate,
        endDate: application.endDate,
        passengers: application.passengers || [],
        amount: application.amountPaid?.amount,
        currency: application.amountPaid?.currency,
        documents,
        attachments,
      });
    } catch (err) {
      result = { ok: false, error: err?.message || String(err) };
    }
    const ok = result?.ok !== false;
    await InsuranceApplication.updateOne(
      { _id: application._id },
      {
        $set: {
          policyEmail: {
            status: ok ? "SENT" : "FAILED",
            sentAt: ok ? new Date() : application.policyEmail?.sentAt,
            attachments: ok ? attachments.length : application.policyEmail?.attachments,
            error: ok ? undefined : String(result?.error || "Unknown error").slice(0, 500),
          },
        },
      },
    );
    if (!ok) logger.warn("Policy email failed", { policyId: application.policyId, error: result?.error });
    return { ok, attachments: attachments.length, error: ok ? undefined : result?.error };
  };

  const resendPolicyEmail = async (sessionId) => {
    const application = await InsuranceApplication.findOne({ sessionId });
    if (!application) throw new AppError("Insurance application not found", 404);
    if (application.issuanceStatus !== "ISSUED" || !application.policyId) {
      throw new AppError("Policy is not issued yet, so there is nothing to send", 400);
    }
    const result = await sendPolicyEmail(application);
    const fresh = await InsuranceApplication.findOne({ sessionId });
    return { result, application: fresh };
  };

  const createInsuranceMongoDbDocument = async (body) => {
    const affiliate = await resolveAffiliateForApplication(body.affiliateId);

    return await InsuranceApplication.create({
      sessionId: body.sessionId,
      affiliate: affiliate?._id || null,
      affiliateId: affiliate?.affiliateId || null,
      quoteId: body.quoteId != null ? String(body.quoteId) : undefined,
      schemeId: body.schemeId != null ? String(body.schemeId) : undefined,
      supplier: body.supplier || undefined,
      journeyType: body.journeyType,
      startDate: body.startDate,
      endDate: coverEndDate(body.journeyType, body.startDate, body.endDate),
      region: body.region,
      quantity: body.quantity || {},
      passengers: body.passengers.map((pax) => ({
        type: pax.type,
        title: pax.title,
        firstName: pax.firstName,
        lastName: pax.lastName,
        dob: pax.dob,
        nationality: pax.nationality?.nationality || pax.nationality,
        nationalityId: pax.nationality?.id || null,
        passport: pax.passport,
      })),
      email: body.email,
      streetAddress: body.streetAddress,
      addressLine2: body.addressLine2 || "",
      city: body.city,
      country: body.country,
      mobile: body.mobile,
      paymentStatus: "UNPAID",
    });
  };

  const finalizeInsuranceMongoDbDocument = async (
    sessionId,
    policyId,
    premium,
    currency,
    paymentSyncToken,
  ) => {
    const normalizedAmount = premium != null ? Number(premium) : undefined;
    const normalizedCurrency =
      currency != null ? String(currency).toUpperCase() : undefined;

    const application = await InsuranceApplication.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          policyId,
          paymentStatus: "PENDING",
          issuanceStatus: "PENDING",
          paymentSyncToken,
          paymentReturnStatus: "PENDING",
          paymentVerifiedAt: null,
          issuedAt: null,
          ...(normalizedAmount !== undefined && !Number.isNaN(normalizedAmount)
            ? {
                amountPaid: {
                  currency: normalizedCurrency,
                  amount: normalizedAmount,
                },
              }
            : {}),
        },
      },
      { new: true, runValidators: true },
    );

    if (!application)
      throw new AppError(
        "Insurance application not found. Please restart the booking.",
        404,
      );

    return application;
  };

  const confirmDirectPayInsurance = async (
    sessionId,
    paymentSyncToken,
    paymentReturnStatus = "PAID",
  ) => {
    const normalizedToken = String(paymentSyncToken || "").trim();
    const application = await InsuranceApplication.findOne({
      sessionId,
    }).select("+paymentSyncToken");

    if (!application)
      throw new AppError("Insurance application not found", 404);

    if (
      !normalizedToken ||
      !application.paymentSyncToken ||
      normalizedToken !== application.paymentSyncToken
    ) {
      throw new AppError("Invalid payment confirmation token", 403);
    }

    if (paymentReturnStatus && paymentReturnStatus !== "PAID") {
      const failedApplication = await InsuranceApplication.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            paymentStatus: "FAILED",
            issuanceStatus: "FAILED",
            paymentReturnStatus,
          },
        },
        { new: true },
      );
      return {
        ...serializeApplicationForClient(failedApplication),
        syncStatus: "FAILED",
      };
    }

    if (
      application.paymentStatus === "PAID" &&
      application.issuanceStatus === "ISSUED"
    ) {
      return serializeApplicationForClient(application, "ISSUED");
    }

    let policyNumber;

    try {
      policyNumber = await wis.issueWISInsurance(application.policyId);
    } catch (err) {
      logger.warn("WIS issue confirmation is still pending or unavailable", {
        sessionId,
        policyId: application.policyId,
        error: err,
      });

      const pendingApplication = await InsuranceApplication.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            paymentStatus: "PENDING",
            issuanceStatus: "PENDING",
            paymentReturnStatus: "PAID",
          },
        },
        { new: true },
      );
      return {
        ...serializeApplicationForClient(pendingApplication),
        syncStatus: "PENDING_CONFIRMATION",
      };
    }

    if (!policyNumber) {
      const pendingApplication = await InsuranceApplication.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            paymentStatus: "PENDING",
            issuanceStatus: "PENDING",
            paymentReturnStatus: "PAID",
          },
        },
        { new: true },
      );
      return {
        ...serializeApplicationForClient(pendingApplication),
        syncStatus: "PENDING_CONFIRMATION",
      };
    }

    // Two confirmations can race (a double-mounted effect, a reload, a retry).
    // Claiming the ISSUED transition atomically means only the winner sends
    // the emails; the loser returns the already-issued application.
    const updated = await InsuranceApplication.findOneAndUpdate(
      { sessionId, issuanceStatus: { $ne: "ISSUED" } },
      {
        $set: {
          policyNumber,
          paymentStatus: "PAID",
          issuanceStatus: "ISSUED",
          paymentReturnStatus: "PAID",
          paymentVerifiedAt: new Date(),
          issuedAt: new Date(),
          amountPaid: {
            currency: application?.amountPaid?.currency || "AED",
            amount: application?.amountPaid?.amount || 0,
          },
          transactionId: `WIS_DIRECTPAY_${application.policyId}`,
        },
      },
      { new: true },
    );

    if (!updated) {
      const issued = await InsuranceApplication.findOne({ sessionId });
      return serializeApplicationForClient(issued, "ISSUED");
    }

    await sendPolicyEmail(updated);

    await notifications.insurancePaymentCompletionEmail({
      leadTraveler: updated?.leadPassenger,
      email: updated?.email,
      sessionId: updated?.sessionId,
      policyId: updated?.policyId,
      policyNumber: updated?.policyNumber,
      amount: updated?.amountPaid?.amount,
      currency: updated?.amountPaid?.currency,
      journeyType: updated?.journeyType,
      startDate: updated?.startDate,
      endDate: updated?.endDate,
      region: updated?.region?.id || updated?.region?.name,
      quoteId: updated?.quoteId,
      mobile:
        updated?.mobile?.code && updated?.mobile?.digits
          ? `${updated.mobile.code}${updated.mobile.digits}`
          : "",
    });

    try {
      await brevo.updateContactAttribute({
        email: updated.email,
        attribute: "PAYMENT_STATUS",
        value: "PAID",
      });
    } catch (err) {
      logger.warn("Brevo updateContactAttribute failed", {
        email: updated.email,
        error: err,
      });
    }

    return serializeApplicationForClient(updated, "ISSUED");
  };

  return {
    validateForm,
    validateCreateBody,
    validateApplicationBody,
    resolveAffiliateForApplication,
    generatePaymentSyncToken,
    createInsuranceMongoDbDocument,
    finalizeInsuranceMongoDbDocument,
    confirmDirectPayInsurance,
    resendPolicyEmail,
  };
}
