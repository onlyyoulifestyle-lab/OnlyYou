"use server";
import { createClient } from '@supabase/supabase-js';

// Use the Service Role Key from your .env.local
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function deleteAuthUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}