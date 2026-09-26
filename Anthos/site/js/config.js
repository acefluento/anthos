/* ============================================================
   ANTHOS ATELIER — site settings
   Prices, product names and specs live in index.html (data-price on each
   product). Everything an operator is likely to change live here.
   ============================================================ */
window.ANTHOS_CONFIG = {

  /* 21+ confirmation shown once per browser. Set false to remove. */
  ageGate: true,
  ageGateExitUrl: 'https://www.google.com',

  /* Where the email signup and the order request are POSTed.
       '/'                                  Netlify Forms (default — works on Netlify with no setup)
       'https://formspree.io/f/xxxxxxxx'    Formspree (works on any host; add the domain to the CSP
                                            in netlify.toml / vercel.json if you use headers)          */
  formEndpoint: '/',

  /* Shown in the footer and the order confirmation. Leave '' to hide. */
  contactEmail: '',

  /* Free-shipping threshold used by the cart nudge. Keep in step with the announcement bar. */
  freeShippingOver: 150,
  currency: 'USD',

  checkout: {
    /* 'reserve' — the cart sends an order request (name, email, ship-to). No payment is taken on
                   the site; you reply with a payment link. Works everywhere, no processor needed.
       'links'   — a cart with ONE line is sent straight to a hosted payment link below
                   (Stripe Payment Link, Shopify buy link, Square, etc). Carts with several
                   lines fall back to 'reserve'.                                                */
    mode: 'reserve',

    /* key = product, or product:colourway  →  hosted checkout URL
       e.g.  'tray:alabaster': 'https://buy.stripe.com/xxxx',   kit: 'https://buy.stripe.com/yyyy' */
    links: {}
  }
};
