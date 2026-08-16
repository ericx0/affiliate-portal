import { supabase } from "@/lib/supabase";

export async function signOutOthers(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut({ scope: "others" });
  return { error: error?.message ?? null };
}

export async function deleteOwnAccount(): Promise<{ error: string | null }> {
  const { error: rpcError } = await supabase.rpc("request_account_deletion");
  if (rpcError) return { error: rpcError.message };
  await supabase.auth.signOut();
  return { error: null };
}