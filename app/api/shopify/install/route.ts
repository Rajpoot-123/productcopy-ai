import { shopify } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return Response.json(
        { error: "Missing shop parameter." },
        { status: 400 },
      );
    }

    const sanitizedShop = shopify.utils.sanitizeShop(shop);

    if (!sanitizedShop) {
      return Response.json(
        { error: "Invalid Shopify shop domain." },
        { status: 400 },
      );
    }

    return await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: "/api/shopify/callback",
      isOnline: true,
      rawRequest: request,
    });
  } catch (error) {
    console.error("Shopify install error:", error);

    return Response.json(
      { error: "Unable to start Shopify installation." },
      { status: 500 },
    );
  }
}
