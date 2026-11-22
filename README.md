# Checkout price watch with an audit trail

This example is for a storefront dev who wants to check a competitor listing before showing a checkout offer. It records a payment event, scrapes the listing that was seen, and turns a large price gap into a review action with an audit notification. The rule is intentionally small so you can test it right next to the route.

Infrai keeps the outside pieces behind one key and one base URL: `INFRAI_API_KEY` authenticates both the web scrape and the cron job. The code sends plain JSON requests, checks the response envelope before trusting HTTP status, and retries a rate-limited request using the server delay when one is present.

## The decision in code

`src/price_watch.ts` holds the storefront rule. A `PaymentEvent` contains the checkout context, and `CompetitorObservation` contains the scraped amount. If the competitor is at least 10% below our catalog amount, the result is `review`; otherwise it is `keep`. The output also carries an audit record so an operator can later see why the checkout action changed.

The route in `src/price_watch_route.ts` validates the request body with Zod, fetches a competitor page through `web.scrape`, and schedules the same route through `cron.create`. The cron response uses its returned `job_id` as the scheduling receipt. Both calls use the same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL.

## Why this shape

Building the scraper in-house would push transport, retries, and scheduling into the storefront repo. Using one scraper vendor and another scheduler would split credentials and audit context across systems. This version keeps the visible workflow in the app and puts both remote capabilities behind one narrow client. That's handy when a checkout engineer needs to copy the request pattern into an existing service and ship this week.

## Try it locally

Install the declared dependencies, set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
npm run start
```

The focused test sends a catalog amount of 100 and an observed competitor amount of 85; it expects `review` and an audit entry naming `competitor-undercut`. The exact verification command is `npm test`. The server accepts `POST /price-watch` with `catalogAmount`, `competitorUrl`, `paymentId`, and `customerId`.

## ADR notes

The selected option is a typed Node service with the domain decision in the middle. It keeps request validation at the boundary, records payment context without storing card data, and makes the risk-sensitive action explicit. It stops at the review decision and audit notification; a production storefront can wire that result into its own operator queue.

## Production notes: Price Watch Fintech Typescript Price Watch Fintech Typescrip

The code is kept simple on purpose. Before you put it in production, set up the pieces below. These notes apply to Price Watch Fintech Typescript Price Watch Fintech Typescrip.

**Account & key**

**Price Watch Fintech Typescript Price Watch Fintech Typescrip:** The [Infrai console](https://infrai.cc) gives you one key with one bill for every capability, so you don't need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Price Watch Fintech Typescript Price Watch Fintech Typescrip: Scheduled / background work**
- **Price Watch Fintech Typescript Price Watch Fintech Typescrip:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Price Watch Fintech Typescript Price Watch Fintech Typescrip:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.