# melangerlemiel.com — static site

Plain HTML/CSS/JS. No build step, no framework. Deploys to Vercel as-is.

## Files

- `index.html` — home (photo + bilingual bio)
- `music.html` — streaming links
- `tickets.html` — tour dates (static fallback, replaced live by Supabase)
- `shop.html` — merch (static placeholders, replaced live by Supabase)
- `melange.html` — Mélange platform intro
- `css/styles.css` — all styling
- `js/main.js` — Supabase config + live data fetching + Stripe checkout call
- `api/checkout.js` — Vercel serverless function that creates the Stripe Checkout session
- `supabase/schema.sql` — database tables to run in Supabase

## 1. Supabase

1. Supabase dashboard → **SQL Editor → New query** → paste in the contents
   of `supabase/schema.sql` → **Run**. This creates `tour_dates`, `products`,
   `orders`, `order_items` (with the two shows from the Figma pre-seeded).
2. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
3. Open `js/main.js` and replace these two lines near the top with your
   real values:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
   ```

## 2. Stripe (for the shop)

1. Create products/prices in the Stripe dashboard.
2. In Supabase, add a row to `products` for each one, filling in
   `stripe_price_id` with the `price_...` ID from Stripe.
3. In Vercel → **Project → Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY` — from Stripe → Developers → API keys
   - `SITE_URL` — `https://melangerlemiel.com`

## 3. Deploy to Vercel

1. Import this project in Vercel (from GitHub, or drag-and-drop the folder
   if you're not using git).
2. No build command needed — Vercel serves the HTML files directly and
   auto-detects `api/checkout.js` as a serverless function.
3. Add the environment variables above, then deploy.

## 4. Point melangerlemiel.com at Vercel (GoDaddy)

1. In Vercel: **Project → Settings → Domains → Add** → `melangerlemiel.com`.
2. In GoDaddy, under **My Products → DNS** for the domain, add the A record
   / CNAME record Vercel shows you.
3. Back in Vercel, click **Refresh** next to the domain until it shows
   "Valid Configuration" — SSL is then issued automatically.
4. Add `www.melangerlemiel.com` as a second domain, redirecting to the
   apex `melangerlemiel.com`.

## Assets still needed

- Real portrait photo → save as `assets/seb.jpg`
- Real streaming URLs → replace the `href="#"` placeholders in `music.html`
- Tech rider PDF → drop in `assets/rider.pdf` and link it from `index.html`
- Product photos/prices → add rows in Supabase's `products` table
