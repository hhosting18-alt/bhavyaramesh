# Bhavya Ramesh — 5 tales of silver

Static site: the indigo-laboratory.it experience rebuilt with Bhavya Ramesh content.

## Run / deploy
- Everything is static. Upload the folder to any host (Netlify, Vercel, GitHub Pages, S3, cPanel) or run locally:
  `python3 -m http.server 8000` then open http://localhost:8000
- Fonts, GSAP and Lenis are self-hosted in `assets/` — no external requests.

## Structure
- `index.html` — generated page (do not edit by hand; edit `build/content.py` and run `python3 build/gen.py`)
- `build/content.py` — all copy, product names, prices, links and chapter mapping
- `assets/css/style.css` — design system (tokens copied from indigo-laboratory.it)
- `assets/js/main.js` — splash, smooth scroll, text reveals, parallax, chapter progress, cursor trail, audio player, modals
- `assets/img/<chapter>/` — cover, head-main, head-1, head-2, lookbook-main, lookbook-secondary, product, outro, g1–g5 (gallery), float (cursor trail)

## Swapping images
Replace files in `assets/img/<chapter>/` keeping the same names. Portrait 3:4 or 2:3 images work best; `product.*` is shown on a dark blurred backdrop.

## Pages
- `checkout.html` — bag summary, address form, payment method choice, order confirmation (orders are stored in the browser's localStorage under `br_orders_v1`; connect Razorpay/Stripe in `assets/js/bag.js` → form submit handler to take real payments)
- `index.html` — the five-chapter experience
- `shop.html` — all 110 pieces with the filter drawer (`assets/js/shop.js`): type + collection (multi-select), sort, live counts. Links: `shop.html#jalebi` (legacy) or `shop.html#col=stare&type=earrings&sort=price-asc`. Types are mapped from product names in `build/gen_shop.py` (`TYPES`, `TYPE_OF`). The shop page uses the burger header (`header("shop")` in `build/gen.py`).
- `product/<handle>.html` — one page per piece (gallery, price, finish, tags, Buy now → bhavyaramesh.com checkout, related pieces)
- Regenerate all: `python3 build/gen.py && python3 build/gen_shop.py`. Product data lives in `build/products.json`.

## Bag
`assets/js/bag.js` — client-side bag (localStorage), header count, slide-in drawer, add to bag / buy now on every product page.

## Liquid effect
`assets/js/liquid.js` — WebGL wobble + pointer ripple + drifting specks on any `<img data-liquid>` (chapter product heroes and product-page main image). Intensity is the attribute value (default 0.006).

## Hero video
`assets/video/hero.mp4` is the Stare film (muted, H.264, fast-start), shown full-bleed. See `assets/video/README.txt` to swap it.

## Scrollbar
The native scrollbar is hidden site-wide; `initScrollbar()` in `main.js` draws a thin brand-pink thumb (draggable on desktop).

## Notes
- "The Sound Within" plays a generated ambient drone (WebAudio) per chapter. To use real tracks, replace `Audio.makeDrone` in `main.js` with an `<audio>` element per chapter.
- Story/Crafting copy was drafted from Bhavya Ramesh's About page and product listings; product pages were not in the capture, so edit `build/content.py` if you want the official descriptions.
