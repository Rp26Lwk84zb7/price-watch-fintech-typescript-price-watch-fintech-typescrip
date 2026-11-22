export type PaymentEvent = {
  paymentId: string;
  customerId: string;
  catalogAmount: number;
};

export type CompetitorObservation = {
  url: string;
  amount: number;
};

export type PriceWatchResult = {
  action: "review" | "keep";
  reason: "competitor-undercut" | "price-aligned";
  audit: { paymentId: string; event: string; observedAmount: number; at: string };
};

export function decidePriceAction(payment: PaymentEvent, observation: CompetitorObservation): PriceWatchResult {
  const undercut = observation.amount <= payment.catalogAmount * 0.9;
  return {
    action: undercut ? "review" : "keep",
    reason: undercut ? "competitor-undercut" : "price-aligned",
    audit: {
      paymentId: payment.paymentId,
      event: undercut ? "checkout-review-requested" : "checkout-kept",
      observedAmount: observation.amount,
      at: new Date().toISOString()
    }
  };
}
