import { supabase } from "@/integrations/supabase/client";
import type { CreateSubscriptionData, Subscription } from "./types";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_CARD_COLOR = "#E50914";

function normalizeSubscription(row: any): Subscription {
  return {
    ...(row as Subscription),
    currency: (row?.currency ?? DEFAULT_CURRENCY) as string,
    card_color: (row?.card_color ?? DEFAULT_CARD_COLOR) as string,
  };
}

export async function fetchSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeSubscription);
}

export async function insertSubscription(userId: string, payload: CreateSubscriptionData): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert([
      {
        ...payload,
        user_id: userId,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return normalizeSubscription(data);
}

export async function patchSubscription(id: number, payload: Partial<CreateSubscriptionData>): Promise<void> {
  const { error } = await supabase.from("subscriptions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function removeSubscription(id: number): Promise<void> {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}
