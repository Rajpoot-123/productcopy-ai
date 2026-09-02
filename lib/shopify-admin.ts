import { shopify } from "@/lib/shopify";
import { loadShopifySession } from "@/lib/shopify-session-storage";

export async function getShopifyAdminClient(shop: string) {
  const sessionId = shopify.session.getOfflineId(shop);
  const session = await loadShopifySession(sessionId);

  if (!session) {
    throw new Error("Shopify store is not connected.");
  }

  return new shopify.clients.Graphql({ session });
}