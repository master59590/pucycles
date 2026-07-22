export function customerErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  const normalized = message.toLowerCase();
  if (normalized.includes("insufficient stock") || normalized.includes("product unavailable")) return "One or more items are no longer available in the requested quantity. Please review your cart.";
  if (normalized.includes("too many active orders")) return "You already have several active orders. Please complete or cancel an existing order first.";
  if (normalized.includes("cart is empty")) return "Your cart is empty.";
  if (normalized.includes("delivery fields") || normalized.includes("shipping details")) return "Please check your name, phone number, address, city, and postal code.";
  if (normalized.includes("not ready for payment")) return "This order is not ready for payment yet.";
  if (normalized.includes("can no longer be cancelled")) return "This order can no longer be cancelled online. Please contact the store.";
  if (normalized.includes("can no longer be edited")) return "This delivery address can no longer be edited online. Please contact the store.";
  if (normalized.includes("shipping quote") && normalized.includes("expired")) return "This shipping quote has expired. Please contact the store for a new quote.";
  if (normalized.includes("fetch") || normalized.includes("network")) return "The connection was interrupted. Please check your internet connection and try again.";
  return "We could not complete that action. Please try again or contact the store.";
}
