import type { Metadata } from "next";
import { CustomerPolicies } from "@/components/customer-policies";
import { getCustomerSession } from "@/lib/auth/customer";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shop Policies & Terms",
  description: "Terms of service, privacy policy, shipping information, and return policy for PUCYCLES orders.",
  alternates: {
    canonical: `${getSiteUrl()}/policies`,
  },
};

export default async function PoliciesPage() {
  const session = await getCustomerSession();
  return <CustomerPolicies user={session.user} />;
}
