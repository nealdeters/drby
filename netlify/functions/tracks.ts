import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log("🚀 Function started: tracks.ts");

  const clientKey = event.headers["x-api-key"];
  const systemKey = process.env.API_KEY;

  if (!clientKey || clientKey !== systemKey) {
    console.log("❌ Auth failed: Invalid or missing API key");
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized access" }) };
  }

  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteId || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const store = getStore('tracks', { siteID: siteId, token });

  const segments = event.path.split('/').filter(Boolean);
  const isListRequest = segments.length <= 3;
  const id = !isListRequest ? segments[segments.length - 1] : null;

  try {
    if (id) {
      const data = await store.get(id);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: String(data) };
    } else {
      const { blobs } = await store.list();
      const tracks = await Promise.all(
        blobs.map(async (b) => {
          const data = await store.get(b.key);
          return JSON.parse(String(data));
        })
      );
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(tracks) };
    }
  } catch (error: any) {
    console.error(`🚨 Tracks Error: ${error.message}`);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
