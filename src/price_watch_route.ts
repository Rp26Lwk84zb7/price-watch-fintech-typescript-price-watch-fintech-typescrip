import { createServer } from "node:http";
import { z } from "zod";
import { decidePriceAction } from "./price_watch.ts";
import { InfraiClient } from "./infrai_client.ts";

const bodySchema = z.object({ catalogAmount: z.number().positive(), competitorUrl: z.string().url(), paymentId: z.string().min(1), customerId: z.string().min(1) });
const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const infrai = new InfraiClient(key);

function extractAmount(content: string): number {
  const match = content.match(/(?:[$€£]\s*)?([0-9]+(?:[,.][0-9]{1,2})?)/);
  if (!match) throw new Error("Scraped page did not contain a price");
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Scraped page contained an invalid price");
  return amount;
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/price-watch") {
    response.writeHead(404).end();
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = bodySchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const scraped = await infrai.scrape(input.competitorUrl);
    const result = decidePriceAction({ paymentId: input.paymentId, customerId: input.customerId, catalogAmount: input.catalogAmount }, { url: input.competitorUrl, amount: extractAmount(scraped.content) });
    await infrai.schedule("/price-watch");
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 502;
    response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request rejected" }));
  }
});

server.listen(3000, () => console.log("price watch listening on http://localhost:3000"));
