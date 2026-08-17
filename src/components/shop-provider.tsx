"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/data/catalog";
import { FirstVisitLanguage } from "@/components/first-visit-language";
import { createClient } from "@/lib/supabase/client";
import { customerErrorMessage } from "@/lib/customer-error";
import type { CartLine, CheckoutAddress, CountryCode, CurrencyCode, CustomerOrder, Locale, OrderStatus, PaymentInstructions, ShopPreferences } from "@/types/shop";

type ShopState = {
  preferences: ShopPreferences;
  setupComplete: boolean;
  cart: CartLine[];
  orders: CustomerOrder[];
};

type ShopContextValue = ShopState & {
  hydrated: boolean;
  shopError: string;
  cartCount: number;
  products: Product[];
  setPreferences: (preferences: ShopPreferences) => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (address: CheckoutAddress, termsVersion?: string) => Promise<string>;
  submitPayment: (orderNumber: string, file: File) => Promise<void>;
  acceptShippingQuote: (orderNumber: string) => Promise<void>;
  cancelOrder: (orderNumber: string) => Promise<void>;
  updateOrderAddress: (orderNumber: string, address: CheckoutAddress) => Promise<void>;
};

type DbOrder = {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  shipping_country: CountryCode;
  shipping_address: string;
  shipping_city: string;
  postal_code: string;
  currency: CurrencyCode;
  exchange_rate_from_thb: number | string;
  subtotal_thb: number | string;
  shipping_fee_thb: number | string | null;
  payment_method: "bank_transfer" | "western_union";
  payment_instructions?: PaymentInstructions | null;
  shipping_company: string | null;
  tracking_number: string | null;
  reservation_expires_at?: string;
  shipping_quote_accepted_at?: string | null;
  order_items: Array<{
    id: string;
    product_id: string | null;
    product_name_snapshot: string;
    sku_snapshot: string;
    quantity: number;
    unit_price_thb: number | string;
  }> | null;
  payment_proofs: {
    storage_path: string;
    status: "pending" | "approved" | "rejected";
    rejection_reason: string | null;
  } | Array<{
    storage_path: string;
    status: "pending" | "approved" | "rejected";
    rejection_reason: string | null;
  }> | null;
};

const PREFERENCES_KEY = "pucycles-preferences-v1";
const GUEST_CART_KEY = "pucycles-guest-cart-v1";
const initialState: ShopState = {
  preferences: { locale: "en", countryCode: "TH" },
  setupComplete: false,
  cart: [],
  orders: [],
};

const ShopContext = createContext<ShopContextValue | null>(null);

function parsePreferences(value: string | null): Pick<ShopState, "preferences" | "setupComplete"> {
  if (!value) return { preferences: initialState.preferences, setupComplete: false };
  try {
    const parsed = JSON.parse(value) as { locale?: Locale; countryCode?: CountryCode };
    const locale = parsed.locale === "th" ? "th" : "en";
    const countryCode = ["TH", "AT", "AU", "PH", "AE", "IN"].includes(parsed.countryCode ?? "") ? parsed.countryCode as CountryCode : "TH";
    return { preferences: { locale, countryCode }, setupComplete: true };
  } catch {
    return { preferences: initialState.preferences, setupComplete: false };
  }
}

function parseGuestCart(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as CartLine[];
    return parsed.filter((line) => typeof line.productId === "string" && Number.isInteger(line.quantity) && line.quantity > 0);
  } catch {
    return [];
  }
}

function mapOrder(order: DbOrder): CustomerOrder {
  const orderItems = order.order_items ?? [];
  const paymentProof = Array.isArray(order.payment_proofs)
    ? order.payment_proofs[0] ?? null
    : order.payment_proofs;

  return {
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    status: order.status,
    address: {
      name: order.customer_name,
      phone: order.customer_phone,
      address: order.shipping_address,
      city: order.shipping_city,
      countryCode: order.shipping_country,
      postalCode: order.postal_code,
    },
    currency: order.currency,
    exchangeRate: Number(order.exchange_rate_from_thb),
    lines: orderItems.map((line) => ({
      productId: line.product_id ?? line.id,
      name: line.product_name_snapshot,
      sku: line.sku_snapshot,
      quantity: line.quantity,
      unitPriceThb: Number(line.unit_price_thb),
    })),
    subtotalThb: Number(order.subtotal_thb),
    shippingFeeThb: order.shipping_fee_thb === null ? null : Number(order.shipping_fee_thb),
    paymentMethod: order.payment_method,
    paymentInstructions: order.payment_instructions ?? {},
    paymentProofName: paymentProof && paymentProof.status !== "rejected" ? "Receipt uploaded" : undefined,
    paymentProofStatus: paymentProof?.status,
    paymentRejectionReason: paymentProof?.rejection_reason ?? undefined,
    shippingCompany: order.shipping_company ?? undefined,
    trackingNumber: order.tracking_number ?? undefined,
    reservationExpiresAt: order.reservation_expires_at,
    shippingQuoteAcceptedAt: order.shipping_quote_accepted_at,
  };
}

export function ShopProvider({ children, catalogProducts }: { children: React.ReactNode; catalogProducts: Product[] }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<ShopState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [shopError, setShopError] = useState("");
  const userIdRef = useRef<string | null>(null);
  const cartIdRef = useRef<string | null>(null);

  const loadOrders = useCallback(async () => {
    const currentResult = await supabase
      .from("orders")
      .select("id, order_number, created_at, status, customer_name, customer_phone, shipping_country, shipping_address, shipping_city, postal_code, currency, exchange_rate_from_thb, subtotal_thb, shipping_fee_thb, payment_method, payment_instructions, shipping_company, tracking_number, reservation_expires_at, shipping_quote_accepted_at, order_items(id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_thb), payment_proofs(storage_path, status, rejection_reason)")
      .order("created_at", { ascending: false });
    let orderData: unknown = currentResult.data;
    let loadError: { message: string } | null = currentResult.error;
    if (loadError?.message.includes("rejection_reason") || loadError?.message.includes("payment_instructions") || loadError?.message.includes("shipping_quote_accepted_at")) {
      const legacyResult = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, customer_name, customer_phone, shipping_country, shipping_address, shipping_city, postal_code, currency, exchange_rate_from_thb, subtotal_thb, shipping_fee_thb, payment_method, shipping_company, tracking_number, reservation_expires_at, order_items(id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_thb), payment_proofs(storage_path, status)")
        .order("created_at", { ascending: false });
      orderData = legacyResult.data;
      loadError = legacyResult.error;
    }
    if (loadError) throw loadError;
    setState((current) => ({ ...current, orders: (orderData as DbOrder[]).map(mapOrder) }));
  }, [supabase]);

  const ensureCart = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("carts")
      .upsert({ user_id: userId }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (error) throw error;
    cartIdRef.current = data.id;
    return data.id as string;
  }, [supabase]);

  const loadCart = useCallback(async (cartId: string) => {
    const { data, error } = await supabase.from("cart_items").select("product_id, quantity").eq("cart_id", cartId);
    if (error) throw error;
    const cart = data.map((line) => ({ productId: line.product_id as string, quantity: line.quantity }));
    setState((current) => ({ ...current, cart }));
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const preferenceState = parsePreferences(window.localStorage.getItem(PREFERENCES_KEY));
      const guestCart = parseGuestCart(window.localStorage.getItem(GUEST_CART_KEY));
      setState((current) => ({ ...current, ...preferenceState, cart: guestCart }));
      if (active) setHydrated(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active || !user) return;
        userIdRef.current = user.id;
        const cartId = await ensureCart(user.id);

        if (guestCart.length) {
          for (const line of guestCart) {
            await supabase.from("cart_items").upsert(
              { cart_id: cartId, product_id: line.productId, quantity: line.quantity },
              { onConflict: "cart_id,product_id" },
            );
          }
          window.localStorage.removeItem(GUEST_CART_KEY);
        }

        await Promise.all([loadCart(cartId), loadOrders()]);
      } catch (error) {
        if (active) setShopError(customerErrorMessage(error, preferenceState.preferences.locale));
      }
    };
    void hydrate();
    return () => { active = false; };
  }, [ensureCart, loadCart, loadOrders, supabase]);

  useEffect(() => {
    if (!hydrated || userIdRef.current) return;
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(state.cart));
  }, [hydrated, state.cart]);

  const showLanguageGate = !pathname.startsWith("/admin") && hydrated && !state.setupComplete;

  useEffect(() => {
    document.documentElement.lang = state.preferences.locale;
  }, [state.preferences.locale]);

  useEffect(() => {
    if (!showLanguageGate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showLanguageGate]);

  const persistCartItem = useCallback(async (productId: string, quantity: number) => {
    if (!userIdRef.current || !cartIdRef.current) return;
    const query = quantity <= 0
      ? supabase.from("cart_items").delete().eq("cart_id", cartIdRef.current).eq("product_id", productId)
      : supabase.from("cart_items").upsert(
          { cart_id: cartIdRef.current, product_id: productId, quantity },
          { onConflict: "cart_id,product_id" },
        );
    const { error } = await query;
    if (error) throw error;
  }, [supabase]);

  const value = useMemo<ShopContextValue>(() => ({
    ...state,
    hydrated,
    shopError,
    products: catalogProducts,
    cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0),
    setPreferences: (preferences) => {
      setState((current) => ({ ...current, preferences, setupComplete: true }));
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      if (userIdRef.current) {
        void supabase.from("profiles").update({ preferred_language: preferences.locale, country_code: preferences.countryCode, updated_at: new Date().toISOString() }).eq("id", userIdRef.current);
      }
    },
    addToCart: async (productId, quantity = 1) => {
      setShopError("");
      const product = catalogProducts.find((item) => item.id === productId);
      if (!product || product.stock <= 0) return;
      const existing = state.cart.find((line) => line.productId === productId);
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stock);
      const previousCart = state.cart;
      setState((current) => ({ ...current, cart: existing ? current.cart.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line) : [...current.cart, { productId, quantity: nextQuantity }] }));
      try { await persistCartItem(productId, nextQuantity); } catch (error) { setState((current) => ({ ...current, cart: previousCart })); setShopError(customerErrorMessage(error, state.preferences.locale)); }
    },
    updateCart: async (productId, quantity) => {
      setShopError("");
      const product = catalogProducts.find((item) => item.id === productId);
      const nextQuantity = Math.max(0, Math.min(quantity, product?.stock ?? quantity));
      const previousCart = state.cart;
      setState((current) => ({ ...current, cart: nextQuantity <= 0 ? current.cart.filter((line) => line.productId !== productId) : current.cart.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line) }));
      try { await persistCartItem(productId, nextQuantity); } catch (error) { setState((current) => ({ ...current, cart: previousCart })); setShopError(customerErrorMessage(error, state.preferences.locale)); }
    },
    removeFromCart: async (productId) => {
      setShopError("");
      const previousCart = state.cart;
      setState((current) => ({ ...current, cart: current.cart.filter((line) => line.productId !== productId) }));
      try { await persistCartItem(productId, 0); } catch (error) { setState((current) => ({ ...current, cart: previousCart })); setShopError(customerErrorMessage(error, state.preferences.locale)); }
    },
    clearCart: async () => {
      setState((current) => ({ ...current, cart: [] }));
      if (cartIdRef.current) {
        const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartIdRef.current);
        if (error) throw error;
      }
    },
    placeOrder: async (address, termsVersion = "2026-07-22") => {
      setShopError("");
      if (!userIdRef.current) throw new Error("Please sign in before checkout.");
      if (!state.cart.length) throw new Error("Your cart is empty.");
      const { data, error } = await supabase.rpc("create_customer_order", {
        p_customer_name: address.name,
        p_customer_phone: address.phone,
        p_shipping_country: address.countryCode,
        p_shipping_address: address.address,
        p_shipping_city: address.city,
        p_postal_code: address.postalCode,
        p_items: state.cart.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      });
      if (error) throw error;
      const created = (data as Array<{ order_id: string; order_number: string }> | null)?.[0];
      if (!created) throw new Error("Order was not created.");
      await supabase.rpc("record_customer_terms_acceptance", { p_order_id: created.order_id, p_terms_version: termsVersion });
      setState((current) => ({ ...current, cart: [] }));
      if (cartIdRef.current) {
        const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", cartIdRef.current);
        if (clearError) throw clearError;
      }
      await loadOrders();
      return created.order_number;
    },
    acceptShippingQuote: async (orderNumber) => {
      setShopError("");
      const order = state.orders.find((item) => item.orderNumber === orderNumber);
      if (!order) throw new Error("Order not found.");
      const { error } = await supabase.rpc("accept_customer_shipping_quote", { p_order_id: order.id });
      if (error) throw error;
      await loadOrders();
    },
    submitPayment: async (orderNumber, file) => {
      setShopError("");
      const order = state.orders.find((item) => item.orderNumber === orderNumber);
      if (!order || !userIdRef.current) throw new Error("Order not found.");
      const path = `${userIdRef.current}/${order.id}/receipt`;
      await supabase.storage.from("payment-proofs").remove([path]);
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error } = await supabase.rpc("submit_payment_proof", { p_order_id: order.id, p_storage_path: path });
      if (error) throw error;
      await loadOrders();
    },
    cancelOrder: async (orderNumber) => {
      setShopError("");
      const order = state.orders.find((item) => item.orderNumber === orderNumber);
      if (!order) throw new Error("Order not found.");
      const { error } = await supabase.rpc("cancel_customer_order", { p_order_id: order.id });
      if (error) throw error;
      await loadOrders();
    },
    updateOrderAddress: async (orderNumber, address) => {
      setShopError("");
      const order = state.orders.find((item) => item.orderNumber === orderNumber);
      if (!order) throw new Error("Order not found.");
      const { error } = await supabase.rpc("update_customer_order_address", {
        p_order_id: order.id,
        p_customer_name: address.name,
        p_customer_phone: address.phone,
        p_shipping_address: address.address,
        p_shipping_city: address.city,
        p_postal_code: address.postalCode,
      });
      if (error) throw error;
      await loadOrders();
    },
  }), [catalogProducts, hydrated, loadOrders, persistCartItem, shopError, state, supabase]);

  return <ShopContext.Provider value={value}>
    {children}
    {showLanguageGate && <FirstVisitLanguage ready={hydrated} onSelect={(locale, countryCode) => value.setPreferences({ locale, countryCode })} />}
  </ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within ShopProvider");
  return context;
}
