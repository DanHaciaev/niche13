// Single place that knows which env vars Supabase needs. Everything that talks
// to Supabase checks `supabaseConfigured` first, so the site keeps working on
// its built-in content until the keys are added to .env.local.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
