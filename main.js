// Mélanger Le Miel — shared site JS
// Loaded on every page via <script src="/js/main.js" defer></script>
// Requires the Supabase JS CDN script to be loaded first (see each HTML file's <head>).

// ---------------------------------------------------------------------------
// 1. Supabase config
// ---------------------------------------------------------------------------
// These two values come from Supabase → Project Settings → API.
// The anon key is safe to expose in client-side JS — it's the public key,
// and your Row Level Security policies (see supabase/schema.sql) are what
// actually control what it's allowed to read/write.
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";

let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
  return supabaseClient;
}

// ---------------------------------------------------------------------------
// 2. Tickets page — live tour dates
// ---------------------------------------------------------------------------
async function loadTourDates() {
  const list = document.getElementById("tickets-list");
  if (!list) return; // not on the tickets page

  const client = getSupabase();
  if (!client) return; // Supabase not configured yet, static fallback stays

  const { data, error } = await client
    .from("tour_dates")
    .select("id, venue, city, date, ticket_url")
    .order("date", { ascending: true });

  if (error || !data || data.length === 0) return; // keep static fallback markup

  list.innerHTML = data
    .map((d) => {
      const label = `${escapeHtml(d.venue)} - ${escapeHtml(d.city)}`;
      return d.ticket_url
        ? `<li><a href="${escapeAttr(d.ticket_url)}" target="_blank" rel="noreferrer">${label}</a></li>`
        : `<li>${label}</li>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// 3. Merch page — live products
// ---------------------------------------------------------------------------
async function loadProducts() {
  const grid = document.getElementById("merch-grid");
  if (!grid) return; // not on the shop page

  const client = getSupabase();
  if (!client) return; // Supabase not configured yet, placeholder boxes stay

  const { data, error } = await client
    .from("products")
    .select("id, name, price_cents, currency, image_url, stripe_price_id")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return; // keep placeholder boxes

  grid.innerHTML = data
    .map((p) => {
      const price = formatPrice(p.price_cents, p.currency);
      const image = p.image_url
        ? `<img src="${escapeAttr(p.image_url)}" alt="${escapeAttr(p.name)}" />`
        : "";
      const buyButton = p.stripe_price_id
        ? `<button class="buy-button" data-price-id="${escapeAttr(p.stripe_price_id)}">Buy</button>`
        : "";
      return `
        <li>
          <div class="merch-item-image">${image}</div>
          <div class="merch-item-info">
            <p>${escapeHtml(p.name)}</p>
            <p>${price}</p>
            ${buyButton}
          </div>
        </li>
      `;
    })
    .join("");

  grid.querySelectorAll(".buy-button").forEach((btn) => {
    btn.addEventListener("click", () => buyProduct(btn.dataset.priceId, btn));
  });
}

function formatPrice(cents, currency) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: (currency || "gbp").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// 4. Stripe checkout
// ---------------------------------------------------------------------------
// Calls a serverless function at /api/checkout (create this on Vercel — it
// needs your Stripe secret key, so it can't live in this client-side file).
async function buyProduct(stripePriceId, buttonEl) {
  if (!stripePriceId) return;
  const originalText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = "Loading…";

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripePriceId, quantity: 1 }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "No checkout URL returned");
    }
  } catch (err) {
    console.error(err);
    buttonEl.disabled = false;
    buttonEl.textContent = originalText;
    alert("Sorry, checkout couldn't be started. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// 5. Small escaping helpers (data comes from your own Supabase, but this
//    keeps things safe if content is ever edited by more than one person)
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// ---------------------------------------------------------------------------
// 6. Run whatever applies to the current page
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadTourDates();
  loadProducts();
});
