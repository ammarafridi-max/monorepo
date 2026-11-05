"use client";

import { Tooltip } from "react-tooltip";
import { FaCircle, FaInfo } from "react-icons/fa";
import { compareDateOnly } from "../../../utils/dates";
import { InsuranceContext } from "../../../contexts/InsuranceContext.js";
import { useContext, useRef, useState, Fragment } from "react";
import { useLocalStorage } from "../../../hooks/general/useLocalStorage";
import { pixelLead } from "../../../utils/pixel";
import { trackQuoteStarted } from "../../../utils/analytics";
import { todayDateOnly } from "../../../utils/dates";
import Label from "../../form-elements/v1/Label";
import DatePicker from "../../form-elements/v1/DatePicker";
import SearchableSelect from "../../form-elements/v1/SearchableSelect";
import Counter from "../../form-elements/v1/Counter";
import FieldError from "../../ui/v1/FieldError";
import PrimaryButton from "../../ui/v1/PrimaryButton";
import { useRouter } from "next/navigation";

export default function TravelInsuranceForm() {
  const {
    REGIONS,
    ageCategories,
    journeyType,
    setJourneyType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    maxStartDate,
    region,
    setRegion,
    group,
    quantity,
    handleQuantityChange,
    setSchemeId,
    setQuoteId,
  } = useContext(InsuranceContext);
  const { updateLocalStorage } = useLocalStorage();
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const regionRef = useRef(null);
  const travellersRef = useRef(null);

  const totalTravellers =
    quantity.adults + quantity.children + quantity.seniors;

  const isMultiYear = journeyType === "annual" || journeyType === "biennial";

  function clearError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }

  function buildErrors() {
    const next = {};
    if (!startDate) next.startDate = "Select the date your cover starts";
    if (!isMultiYear && !endDate) next.endDate = "Select the date your trip ends";
    if (!isMultiYear && startDate && endDate && compareDateOnly(endDate, startDate) < 0) {
      next.endDate = "Your end date cannot be before your start date";
    }
    if (!region?.id) next.region = "Select the region you are travelling to";
    if (totalTravellers === 0) next.travellers = "Add at least one traveller";
    return next;
  }

  function focusFirstError(next) {
    const order = [
      ["startDate", startDateRef],
      ["endDate", endDateRef],
      ["region", regionRef],
      ["travellers", travellersRef],
    ];
    for (const [key, ref] of order) {
      if (next[key] && ref.current) {
        ref.current.focus();
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }

  function handleStartDate(value) {
    setStartDate(value);
    if (value && endDate && compareDateOnly(endDate, value) < 0) {
      setEndDate("");
      clearError("endDate");
    }
    if (value) clearError("startDate");
  }

  function handleEndDate(value) {
    setEndDate(value);
    if (value) clearError("endDate");
  }

  function handleRegion(value) {
    setRegion(value);
    if (value?.id) clearError("region");
  }

  function handleTravellers(field, delta) {
    handleQuantityChange(field, delta);
    clearError("travellers");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const next = buildErrors();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      focusFirstError(next);
      return;
    }
    setErrors({});

    setSchemeId(null);
    setQuoteId(null);

    updateLocalStorage("travelInsurance", {
      journeyType,
      startDate,
      endDate,
      region,
      group,
      quantity,
      schemeId: null,
      quoteId: null,
    });

    trackQuoteStarted({
      journeyType,
      startDate,
      endDate,
      region: region?.name,
      adults: quantity.adults,
      children: quantity.children,
      seniors: quantity.seniors,
    });

    pixelLead();

    router.push("/insurance-booking/quote");
  }

  return (
    <form
      className="m-0 py-7 px-4 md:p-6 rounded-2xl shadow-md bg-white"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex gap-5" role="radiogroup" aria-label="Policy length">
        {[
          { id: "single", label: "Single" },
          { id: "annual", label: "Annual" },
          { id: "biennial", label: "Biennial" },
        ].map((tripType) => (
          <label
            key={tripType.id}
            className="text-[14.5px] w-fit flex items-center mb-5 cursor-pointer font-light"
          >
            <input
              type="radio"
              name="journeyType"
              value={tripType.id}
              checked={journeyType === tripType.id}
              onChange={() => setJourneyType(tripType.id)}
              className="sr-only peer"
            />
            <FaCircle
              aria-hidden="true"
              className={`mr-2 p-0.75 text-lg rounded-full border border-black peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 ${
                journeyType === tripType.id ? "text-black" : "text-transparent"
              }`}
            />
            {tripType.label}
          </label>
        ))}
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className={`flex flex-col gap-1 mb-3 md:mb-3 ${isMultiYear ? "w-full" : "w-full md:w-1/2"}`}>
          <Label htmlFor="startDate">Start Date</Label>
          <DatePicker
            value={startDate}
            onChange={handleStartDate}
            minDate={todayDateOnly()}
            maxDate={maxStartDate || undefined}
            placeholder="Select start date"
            error={errors.startDate}
            inputRef={startDateRef}
          />
          {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
        </div>

        {!isMultiYear && (
          <div className="w-full md:w-1/2 flex flex-col gap-1 mb-3 md:mb-3">
            <Label htmlFor="endDate">End Date</Label>
            <DatePicker
              value={endDate}
              onChange={handleEndDate}
              minDate={startDate || todayDateOnly()}
              placeholder="Select end date"
              error={errors.endDate}
              inputRef={endDateRef}
            />
            {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
          </div>
        )}
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className="w-full flex flex-col gap-1 mb-3 md:mb-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="insurance-region">Destination</Label>
            <span
              data-tooltip-id="region-tooltip"
              data-tooltip-content="This is your travel destination region, not where you're from. Select the region you're travelling to."
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <FaInfo className="text-gray-500" style={{ fontSize: "8px" }} />
            </span>
            <Tooltip
              id="region-tooltip"
              place="top"
              style={{
                maxWidth: "220px",
                fontSize: "12px",
                lineHeight: "1.5",
                borderRadius: "8px",
              }}
            />
          </div>
          <SearchableSelect
            id="insurance-region"
            items={REGIONS}
            value={region}
            placeholder="Select a region…"
            onChange={handleRegion}
            minSearchLength={0}
            error={errors.region}
            buttonRef={regionRef}
          />
          {errors.region && <FieldError>{errors.region}</FieldError>}
        </div>
      </div>

      <div
        ref={travellersRef}
        tabIndex={-1}
        className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 mt-3 focus:outline-none"
      >
        {ageCategories.map(({ label, ageRange, field }, i) => (
          <Fragment key={field}>
            {i > 0 && <div className="border-t border-gray-100" />}
            <Counter
              ageGroup={label}
              age={ageRange}
              value={quantity[field]}
              onAdd={() => handleTravellers(field, 1)}
              onSubtract={() => handleTravellers(field, -1)}
            />
          </Fragment>
        ))}
      </div>
      {errors.travellers && <FieldError>{errors.travellers}</FieldError>}

      <div className="mt-4">
        <div className="flex gap-2 items-center text-gray-900/60 font-light">
          <FaInfo className="text-[12px]" />
          <span className="text-sm">
            By proceeding, you confirm that you are a resident/citizen of the
            UAE.
          </span>
        </div>
      </div>

      <div className="w-full flex mt-4">
        <PrimaryButton className="w-full" type="submit" size="small">
          Compare Policies
        </PrimaryButton>
      </div>
    </form>
  );
}
