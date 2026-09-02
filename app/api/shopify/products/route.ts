import { NextResponse } from "next/server";

import { getShopifyAdminClient } from "@/lib/shopify-admin";

const PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        status
        descriptionHtml
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter." },
        { status: 400 },
      );
    }

    const admin = await getShopifyAdminClient(shop);

    const response = await admin.request(PRODUCTS_QUERY, {
      variables: {
        first: 50,
      },
    });

    return NextResponse.json({
      success: true,
      products: response.data.products.nodes,
    });
  } catch (error) {
    console.error("Shopify products error:", error);

    return NextResponse.json(
      { error: "Unable to fetch Shopify products." },
      { status: 500 },
    );
  }
}
