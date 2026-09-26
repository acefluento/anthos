# Anthos Atelier — landing page

Static site. No build step. Deploy the `site/` folder.

## Deploy
1. `./set-domain.sh https://yourdomain.com` swaps the placeholder domain in canonical, Open Graph, schema, sitemap and robots.
2. **Netlify:** drag the project folder in, or connect the repo. `netlify.toml` publishes `site/`, sets security headers and caching, and Netlify Forms picks up the signup and order forms on its own.
   **Vercel:** import the repo; `vercel.json` handles the rest. Forms need a Formspree endpoint.
   **Any other host:** upload the contents of `site/`. Forms need a Formspree endpoint.
3. In `site/js/config.js` set `contactEmail`, and `formEndpoint` if you are not on Netlify.

## Ordering / checkout
- `mode: 'reserve'` (default): cart, then an order-request form (name, email, ship-to, 21+ box). No card is taken; you reply with a payment link.
- `mode: 'links'`: a one-line cart goes straight to a hosted payment link listed in `config.js`; multi-line carts fall back to reserve.
- Check your payment processor's prohibited-business list before going live. Many mainstream processors restrict smoking accessories.

## Editing
- Prices, names, specs: the `data-price` / `data-name` attributes and card text in `site/index.html`. The tray price also appears in the JSON-LD block.
- Free-shipping threshold: `config.js` and the announcement bar text.
- Brand art (trays, jar, grinder, kit, lockups, OG card, favicons) is generated from `source/art.js`. `node source/render.js` (needs playwright and sharp) rewrites `site/assets/img/*`.

## Confirm before launch
Copy carried over from the mockup: ships in 5-7 days, 30-day returns, complimentary shipping over $150, "limited runs, numbered", and all prices.
Tray size: the landing mockup said 220 x 140 x 16 mm, brand sheet 04 says 220 x 100 mm. The page uses 220 x 140.
`privacy.html` is a plain-language starter; have it reviewed.

## Tested
With the production CSP applied: age gate, colourway swap, cart (persistence, steppers, shipping nudge), order request, signup (success and failure), FAQ deep links. Desktop and 390px mobile, zero console errors, no horizontal overflow.
