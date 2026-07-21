import { redirect } from "next/navigation";
import { CustomerShell } from "@/components/customer-shell";
import { SetupForm } from "@/components/setup-form";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function SetupPage() {
  const session = await getCustomerSession();
  if (!session.user) redirect("/login?next=/setup");
  return <CustomerShell {...session}><main className="setup-page"><SetupForm /></main></CustomerShell>;
}
