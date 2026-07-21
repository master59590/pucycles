# PUCYCLES MVP Plan

## Goal

Build a real-use MVP ecommerce website for PUCYCLES, focused on motorcycle custom parts for Triumph models. The first version should be simple, responsive, easy for one owner/admin to manage, and usable for Thai and international customers.

## Brand Direction

- Store name: PUCYCLES
- Style: minimal, clean, motorcycle custom garage feel
- Main colors: white, deep red, black, light gray
- Logo direction: use existing PUCYCLES custom bike logo as the main brand mark
- UX priority: easy product discovery, mobile-first, fast checkout, clear order status

## Core Assumptions

- Initial product count: around 100 products
- Daily visitors: not over 25 people
- Admin: one owner only
- Login: Google only
- Product images: maximum 5 images per product
- No coupon or promotion system in V1
- Payment proof: image upload only
- Thai and international customers are both important, with international expected to be a large share
- International shipping quote is handled manually by admin in V1

## Supported Countries In V1

- Thailand
- Austria
- Australia
- Philippines
- United Arab Emirates / Dubai
- India

## Languages And Currency

After Google login, the customer selects:

- Language
- Country

The website sets currency based on country:

- Thailand: THB
- Austria: EUR
- Australia: AUD
- Philippines: PHP
- United Arab Emirates / Dubai: AED
- India: INR

Admin stores product price in THB. The storefront displays converted prices using exchange rates managed by admin. Each order should save the exchange rate used at checkout.

## Product Structure

Products should not be locked into only one menu category. Each product can connect to:

- Vehicle model
- Vehicle year range
- Part category
- Aftermarket brand

This allows customers to browse by motorcycle model first, then filter by part type or brand.

## Vehicle Models

- Triumph T100-T120
- Triumph Bobber 1200
- Triumph Thruxton R1200

## Part Categories

- Brake & Clutch Lines / สายเบรค + สายครัช
- Handlebars / แฮนด์
- Fenders / บังโคลน
- Wheels / ชุดล้อ
- Lighting & Electrical / ระบบไฟและอุปกรณ์ไฟแต่ง
- Engine Guards / การ์ดเครื่อง
- Seats / เบาะ
- Exhausts / ท่อไอเสีย
- Carbon Parts / พาร์ตคาร์บอน

## Aftermarket Brands

- Motogadget
- ZARD Exhaust
- Hercules Exhaust
- Beringer Brake
- PIAA
- Baja

## Customer Features

- Login with Google
- Select language and country after login
- Browse products
- Search products
- Filter by vehicle model, year, part category, brand, and stock status
- View product details, price, stock status, compatible model/year, weight, and images
- Add products to cart
- Checkout with name, phone, address, country, and postal code
- Stock is reserved immediately after checkout
- Upload payment proof image
- View order history
- View order status
- View shipping company and tracking number after admin ships the order
- Edit or cancel order only before payment is submitted
- If payment has been submitted or confirmed, customer must contact admin to change/cancel

## Thai Customer Flow

1. Customer logs in with Google.
2. Customer selects language and Thailand as country.
3. Customer browses and adds products to cart.
4. Customer checks out.
5. System reserves stock immediately.
6. System shows Thai shipping cost.
7. Customer transfers payment.
8. Customer uploads payment slip image.
9. Admin reviews proof.
10. Admin marks order as paid.
11. Admin prepares and ships order.
12. Admin enters shipping company and tracking number.
13. Customer sees tracking number.

## International Customer Flow

1. Customer logs in with Google.
2. Customer selects language and country.
3. Customer browses and adds products to cart.
4. Customer checks out.
5. System reserves stock immediately.
6. Order status becomes Waiting Shipping Quote.
7. Admin checks shipping cost manually, likely using Thailand Post based on weight and country.
8. Admin enters shipping cost.
9. Customer sees final total in selected currency.
10. Customer pays via Western Union.
11. Customer uploads receipt image.
12. Admin reviews proof.
13. Admin marks order as paid.
14. Admin prepares and ships order.
15. Admin enters shipping company and tracking number.
16. Customer sees tracking number.

## Admin Features

- Login with the owner's Google account
- View all orders
- Filter orders by status
- View orders waiting for shipping quote
- View orders waiting for payment review
- Add product
- Edit product
- Delete or hide product
- Manage product stock
- Upload 1-5 product images
- Set product name in Thai and English
- Set product description in Thai and English
- Set product price in THB
- Set product weight in grams
- Set compatible vehicle models and years
- Set part category
- Set aftermarket brand
- Set product status
- Enter international shipping cost
- Review payment proof image
- Confirm payment
- Change order status
- Add shipping company and tracking number
- Manage exchange rates
- Manage Thai shipping cost
- Manage bank transfer and Western Union payment instructions

## Product Status

- In Stock / มีสินค้า
- Low Stock / เหลือน้อย
- Out of Stock / สินค้าหมด
- Coming Soon / สินค้ากำลังเข้า

## Order Status

- Waiting Shipping Quote / รอค่าส่ง
- Waiting Payment / รอชำระเงิน
- Payment Submitted / รอตรวจสอบหลักฐาน
- Paid / ชำระเงินแล้ว
- Preparing / กำลังจัดเตรียม
- Shipped / จัดส่งแล้ว
- Cancelled / ยกเลิก

## Stock Rules

- Stock is reserved immediately after checkout.
- If the order is cancelled before payment, reserved stock is returned.
- If admin cancels an order, reserved stock is returned unless admin manually chooses otherwise.
- Once payment proof is submitted, customer cannot edit or cancel directly.
- Admin can adjust stock manually if needed.

## Suggested Pages

### Customer

- Login page
- Language and country selection
- Product listing page
- Product detail page
- Cart page
- Checkout page
- Payment proof upload page
- Order history page
- Order detail page

### Admin

- Admin order dashboard
- Order detail page
- Product list page
- Add/edit product page
- Settings page

## Suggested Data Model

### users

- id
- google_uid
- email
- name
- role
- preferred_language
- country
- currency
- created_at
- updated_at

### products

- id
- sku
- name_th
- name_en
- description_th
- description_en
- price_thb
- weight_grams
- stock_quantity
- reserved_quantity
- status
- category_id
- brand_id
- is_active
- created_at
- updated_at

### product_images

- id
- product_id
- image_url
- sort_order

### vehicle_models

- id
- name
- slug

### product_vehicle_fitments

- id
- product_id
- vehicle_model_id
- year_from
- year_to

### categories

- id
- name_th
- name_en
- slug

### brands

- id
- name
- slug

### orders

- id
- order_number
- user_id
- customer_name
- customer_phone
- shipping_country
- shipping_address
- postal_code
- currency
- exchange_rate_from_thb
- subtotal_thb
- shipping_fee_thb
- total_thb
- total_display_currency
- status
- payment_method
- shipping_company
- tracking_number
- created_at
- updated_at

### order_items

- id
- order_id
- product_id
- product_name_snapshot
- sku_snapshot
- quantity
- unit_price_thb
- total_price_thb

### payment_proofs

- id
- order_id
- image_url
- uploaded_at
- reviewed_at
- reviewed_by
- status

### exchange_rates

- id
- currency
- rate_from_thb
- updated_at

### settings

- id
- key
- value

## Recommended Tech Stack

- Frontend and backend: Next.js
- Styling: Tailwind CSS or equivalent utility CSS
- Auth: Firebase Auth with Google login
- Database: Firestore or Supabase Postgres
- Image storage: Firebase Storage, Cloudinary, or Supabase Storage
- Hosting: Vercel free tier for MVP

For the current traffic level, free hosting should be enough. The main yearly cost should be the domain, around 400-700 THB/year depending on provider.

## V1 Scope To Exclude

- Payment gateway
- Automatic slip verification
- Automatic international shipping calculation
- Coupon system
- Promotion system
- Multiple admin roles
- Advanced sales dashboard
- Guest checkout
- Automatic tax invoice

## Two Week Delivery Plan

### Week 1

- Finalize design direction and page structure
- Build responsive layout
- Build Google login
- Build language and country selection
- Build product list and product detail pages
- Build filters by model, year, category, brand, and stock status
- Build cart
- Build checkout
- Build stock reservation logic

### Week 2

- Build admin product management
- Build admin order management
- Build international shipping quote flow
- Build payment proof upload and review
- Build tracking number management
- Build settings for exchange rates and payment instructions
- Test customer flows on mobile and desktop
- Test admin flows
- Deploy MVP

## Main Risks

- International shipping can become complex if automated too early.
- Currency conversion must be locked per order to avoid customer/admin confusion.
- Stock reservation needs clear cancellation behavior.
- Payment proof review is manual, so order status must be very clear.
- Product fitment data must be entered carefully by admin, because customers depend on model/year filtering.

## Recommended Next Step

Create wireframes for the customer storefront and admin dashboard, then decide the exact tech stack before implementation.
