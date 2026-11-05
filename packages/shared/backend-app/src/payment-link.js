export function createPaymentLinkSuccessHandler({ paymentService, notifications, logger }) {
  return async function handlePaymentLinkSuccess(session) {
    const updated = await paymentService.markPaymentLinkPaid({ session });
    if (!updated) {
      logger.warn('[payment-link] No matching record for session', {
        sessionId: session.id,
        paymentLink: session.payment_link,
      });
      return;
    }
    await notifications.sendPaymentLinkPaidToAdmin({
      amount: updated.amount,
      currency: updated.currency,
      payerName: updated.paidByName || session.customer_details?.name,
      payerEmail: updated.paidByEmail || session.customer_details?.email,
      description: updated.description,
      createdByName: updated.createdBy?.name,
      paymentLinkId: updated.stripePaymentLinkId,
      sessionId: updated.sessionId,
      paidAt: updated.paidAt,
    });
  };
}
