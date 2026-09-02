import { shopify } from "@/lib/shopify";
import { createClient } from "@/lib/server";
import type { Session } from "@shopify/shopify-api";

export async function storeShopifySession(session: Session) {
  const supabase = await createClient();

  const { error } = await supabase.from("shopify_sessions").upsert(
    {
      id: session.id,
      shop: session.shop,
      state: session.state,
      is_online: session.isOnline,
      scope: session.scope ?? null,
      expires_at: session.expires
        ? new Date(session.expires).toISOString()
        : null,
      access_token: session.accessToken,
      online_access_info: session.onlineAccessInfo ?? null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(`Failed to store Shopify session: ${error.message}`);
  }

  return true;
}

export async function loadShopifySession(
  sessionId: string,
): Promise<Session | undefined> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shopify_sessions")
    .select(
      "id, shop, state, is_online, scope, expires_at, access_token, online_access_info",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }

  return shopify.session.customAppSession(data.shop);
}

export async function deleteShopifySession(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shopify_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to delete Shopify session: ${error.message}`);
  }

  return true;
}