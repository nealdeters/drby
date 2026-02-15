import { Handler, HandlerEvent } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const handler: Handler = async (event: HandlerEvent) => {
  console.log("🚀 Function started: racers.ts");

  if (event.headers["x-api-key"] !== process.env.API_KEY) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteId || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const store = getStore('racers', { siteID: siteId, token });

  try {
    const { blobs } = await store.list();
    const racers = await Promise.all(
      blobs.map(async (b) => {
        const data = await store.get(b.key);
        return JSON.parse(String(data));
      })
    );
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(racers) };
  } catch (error: any) {
    console.error(`🚨 Racers Error: ${error.message}`);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
