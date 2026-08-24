const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    const missingVariables: string[] = [];

    if (!supabaseUrl) {
      missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!supabasePublishableKey) {
      missingVariables.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }

    throw new Error(
      `Missing required Supabase environment variable${
        missingVariables.length === 1 ? "" : "s"
      }: ${missingVariables.join(", ")}. Configure the Supabase project values in .env.local or the deployment environment.`,
    );
  }

  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid URL from your Supabase project settings.",
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}
