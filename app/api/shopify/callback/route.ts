import { NextResponse } from "next/server";

import { shopify } from "@/lib/shopify";
import { storeShopifySession } from "@/lib/shopify-session-storage";

export async function GET(request: Request) {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: new Response(),
    });

    const { session } = callback;

    if (!session) {
      return NextResponse.json(
        { error: "Shopify authentication failed." },
        { status: 401 },
      );
    }

    await storeShopifySession(session);

    const redirectUrl = new URL("/", request.url);

    redirectUrl.searchParams.set("shopify", "connected");
    redirectUrl.searchParams.set("shop", session.shop);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Shopify callback error:", error);

    return NextResponse.json(
      { error: "Shopify OAuth callback failed." },
      { status: 500 },
    );
  }
}
