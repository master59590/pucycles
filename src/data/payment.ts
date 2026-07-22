import type { PaymentInstructions } from "@/types/shop";

export const westernUnionPaymentDetails: Required<
  Pick<PaymentInstructions, "bank_name" | "account_number" | "receiver_name" | "receiver_address" | "country">
> = {
  bank_name: "Krungsri Bank",
  account_number: "0801960697",
  receiver_name: "Miss Jutharat Innarong",
  receiver_address: "14/6 Moo 5, Berk Phrai Subdistrict, Ban Pong District, Ratchaburi Province.",
  country: "Thailand",
};
