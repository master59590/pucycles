import { createClient } from "@/lib/supabase/server";

export type CustomerUser = {
  id: string;
  email: string;
  name: string;
};

export async function getCustomerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Customer",
    },
    isAdmin: false,
  };
}
