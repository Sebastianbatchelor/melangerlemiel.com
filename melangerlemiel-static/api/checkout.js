// Vercel serverless function — deployed automatically because it's in /api.
// Called by js/main.js's buyProduct() when someone clicks "Buy".
// Needs STRIPE_SECRET_KEY and SITE_URL set in Vercel → Settings → Environment Variables.

const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { stripePriceId, quantity = 1 } = req.body || {};

    if (!stripePriceId) {
      res.status(400).json({ error: "Missing stripePriceId" });
      return;
    }

    const siteUrl = process.env.SITE_URL || "https://melangerlemiel.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity }],
      success_url: `${siteUrl}/shop.html?success=1`,
      cancel_url: `${siteUrl}/shop.html?canceled=1`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
};
