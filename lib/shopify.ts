import "@shopify/shopify-api/adapters/web-api";

import {
  ApiVersion,
  Session,
  shopifyApi,
} from "@shopify/shopify-api";

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ["read_products", "write_products"],
  hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ""),
  hostScheme: "http",
  apiVersion: ApiVersion.July26,
  isEmbeddedApp: true,
});

export { shopify, Session };
