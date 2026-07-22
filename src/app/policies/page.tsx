import { CustomerPolicies } from "@/components/customer-policies";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function PoliciesPage() {
  const session = await getCustomerSession();
  return <CustomerPolicies user={session.user} />;
}
