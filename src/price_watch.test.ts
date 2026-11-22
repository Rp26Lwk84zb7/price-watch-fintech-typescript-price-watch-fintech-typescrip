import assert from "node:assert/strict";
import { decidePriceAction } from "./price_watch.ts";

const result = decidePriceAction(
  { paymentId: "pay_123", customerId: "cust_456", catalogAmount: 100 },
  { url: "https://competitor.example/item", amount: 85 }
);
assert.equal(result.action, "review");
assert.equal(result.reason, "competitor-undercut");
assert.equal(result.audit.paymentId, "pay_123");
console.log("price decision test passed");
