import json, os, re, html
import gen
from gen import e, btn, head, header, footer, modals, scripts
from content import CHAPTERS, BASE, CONTACT

ROOT = os.path.join(os.path.dirname(__file__), "..")
DATA = json.load(open(os.path.join(os.path.dirname(__file__), "products.json")))
P = DATA["products"]; ORDER = DATA["order"]

COLLECTIONS = [("gilga", "GilGa"), ("jalebi", "Jalebi"), ("harmony", "Harmony"), ("nail-crown", "Nail Crown"), ("stare", "Stare"), ("glarekillers", "Glarekillers"), ("new-in", "New in")]
COL_ID = {name: cid for cid, name in COLLECTIONS}
COL_BLURB = {
    "GilGa": "Serpents, eyes and scales cast in sterling silver.",
    "Jalebi": "Sweetness turned to silver: laddoo, falooda and gulaab remade as ornaments.",
    "Harmony": "Chokers and chains in quiet balance.",
    "Nail Crown": "Armour for the fingertips: nail rings and palm cuffs.",
    "Stare": "The eye that watches back. The newest collection.",
    "Glarekillers": "Sunglasses handcrafted in sterling silver.",
    "New in": "Just landed from the Jaipur workshop.",
}
CHAPTER_BY_COL = {c["name"]: c for c in CHAPTERS}
TYPES = [("earrings", "Earrings"), ("nail-rings", "Nail rings"), ("neckpieces", "Neckpieces"), ("rings", "Rings"), ("wrist-wear", "Wrist wear"), ("palm-cuffs", "Palm cuffs"), ("sunglasses", "Sunglasses"), ("hair", "Hair"), ("anklets", "Anklets"), ("accessories", "Accessories")]
TYPE_OF = {"Earrings": "earrings", "Ear clips": "earrings", "Nail rings": "nail-rings", "Neck pieces": "neckpieces", "Rings": "rings", "Wrist wear": "wrist-wear", "Palm cuffs": "palm-cuffs", "Sunglasses": "sunglasses", "Hair": "hair", "Anklets": "anklets", "Accessories": "accessories"}
SORTS = [("featured", "Featured"), ("new", "New in first"), ("bestseller", "Bestsellers first"), ("price-asc", "Price, low to high"), ("price-desc", "Price, high to low")]

def kind(name):
    n = name.lower()
    for k, lab in [("sunglass", "Sunglasses"), ("earring", "Earrings"), ("ear clip", "Ear clips"), ("earclimber", "Earrings"), ("ear spread", "Earrings"), ("hoop", "Earrings"), ("eardrip", "Earrings"), ("choker", "Neck pieces"), ("neck", "Neck pieces"), ("necklace", "Neck pieces"), ("bracelet", "Wrist wear"), ("bangle", "Wrist wear"), ("palm cuff", "Palm cuffs"), ("nail", "Nail rings"), ("ring", "Rings"), ("hair", "Hair"), ("anklet", "Anklets"), ("socks", "Accessories"), ("bag", "Accessories")]:
        if k in n: return lab
    return "Nail rings"

def card(h, rel=""):
    p = P[h]; imgs = p["local"]
    badge = f'<span class="product-card__badge">{e(p["badge"])}</span>' if p.get("badge") else ""
    second = f'<img class="product-card__img -second" loading="lazy" decoding="async" alt="" src="{rel}{imgs[1]}">' if len(imgs) > 1 else ""
    cols = " ".join(COL_ID.get(c, "") for c in p["collections"])
    ty = TYPE_OF.get(kind(p['name']), "accessories")
    price = int(re.sub(r"[^0-9]", "", p["price"] or "0") or 0)
    order = ORDER.index(h) if h in ORDER else 999
    return f'''<li class="product-card" data-collections="{cols}" data-kind="{e(kind(p['name']))}" data-type="{ty}" data-price="{price}" data-badge="{e((p.get('badge') or '').lower())}" data-order="{order}">
      <a href="{rel}product/{h}.html" class="product-card__link">
        <div class="product-card__media"><img class="product-card__img" loading="lazy" decoding="async" alt="{e(p['alt'] or p['name'])}" src="{rel}{imgs[0]}" width="600" height="800">{second}{badge}</div>
        <h3 class="product-card__name">{e(p['name'])}</h3>
        <p class="product-card__price">{e(p['price'])}</p>
      </a>
    </li>'''

def shop_page():
    gen.REL = ""
    def opts(group, items):
        return "".join(f'<li><button type="button" class="sf__opt" data-group="{group}" data-value="{v}" aria-pressed="false"><span class="sf__opt-name">{e(n)}</span><span class="sf__opt-n" data-n></span></button></li>' for v, n in items)
    sorts = "".join(f'<li><button type="button" class="sf__sort-opt{" -is-active" if v == "featured" else ""}" data-sort="{v}" role="option" aria-selected="{"true" if v == "featured" else "false"}">{e(n)}</button></li>' for v, n in SORTS)
    cards = "".join(card(h) for h in ORDER)
    body = f'''{head("Shop — Bhavya Ramesh", "All handcrafted 925 sterling silver pieces by Bhavya Ramesh: GilGa, Jalebi, Harmony, Nail Crown, Stare and Glarekillers.")}
<body class="page-shop" data-rel="">
{header("shop")}
<main id="main-content" class="main-content">
  <section class="page-head">
    <div class="page-head__inner">
      <p class="page-head__pre js-chars"><span>[Shop]</span></p>
      <h1 class="page-head__title js-title"><div><div>ALL</div></div><div><div>PIECES</div></div></h1>
      <p class="page-head__abstract js-lines"><span>{len(ORDER)} pieces, each made by hand in our Jaipur workshop in 925 sterling silver. Most come in silver or gold plated.</span></p>
    </div>
  </section>
  <section class="shop">
    <div class="sf" data-sf>
      <div class="sf__bar">
        <button type="button" class="sf__toggle" aria-expanded="false" aria-controls="sf-panel"><span class="sf__br">[</span> Filter<span class="sf__badge" data-sf-active hidden></span> <span class="sf__sign" aria-hidden="true"></span> <span class="sf__br">]</span></button>
        <ul class="sf__chips" data-sf-chips aria-label="Active filters"></ul>
        <div class="sf__sort">
          <button type="button" class="sf__sort-btn" aria-haspopup="listbox" aria-expanded="false"><span class="sf__sort-label">Sort:</span> <span data-sf-sort-name>Featured</span> <span class="sf__caret" aria-hidden="true">⌄</span></button>
          <ul class="sf__sort-list" role="listbox" aria-label="Sort by">{sorts}</ul>
        </div>
      </div>
      <div class="sf__panel" id="sf-panel" aria-label="Filters" data-lenis-prevent inert>
        <div class="sf__panel-inner">
          <div class="sf__panel-head"><p>[Filter]</p><button type="button" class="sf__close" data-sf-close>Close ×</button></div>
          <div class="sf__cols">
            <div class="sf__col"><p class="sf__col-title">[Type]</p><ul>{opts("type", TYPES)}</ul></div>
            <div class="sf__col"><p class="sf__col-title">[Collection]</p><ul>{opts("col", COLLECTIONS)}</ul></div>
            <a class="sf__feature" href="#col=stare" data-sf-feature="stare">
              <span class="sf__feature-img"><img loading="lazy" decoding="async" alt="Stare collection, Bhavya Ramesh" src="assets/img/05_stare/cover.webp"></span>
              <span class="sf__feature-name">Stare</span><span class="sf__feature-sub">New collection</span>
            </a>
          </div>
          <div class="sf__panel-foot"><button type="button" class="sf__clear" data-sf-clear>Clear all</button><button type="button" class="sf__apply" data-sf-close>Show <span data-sf-count>{len(ORDER)}</span> pieces</button></div>
        </div>
      </div>
    </div>
    <div class="sf__scrim" data-sf-close aria-hidden="true"></div>
    <div class="shop__inner">
      <p class="shop__blurb" data-blurb></p>
      <ul class="shop__grid" data-grid>{cards}</ul>
      <div class="shop__empty" data-empty hidden><p>No pieces match that mix yet.</p><button type="button" data-sf-clear>Clear filters</button></div>
      <p class="shop__count"><span data-count>{len(ORDER)}</span> pieces</p>
    </div>
  </section>
</main>
{footer()}
{modals()}
<div class="cursor-trail" aria-hidden="true"></div>
{scripts()}
<script>window.SHOP_BLURBS = {json.dumps({cid: COL_BLURB[name] for cid, name in COLLECTIONS})};</script>
<script src="assets/js/shop.js"></script>
</body>
</html>'''
    open(os.path.join(ROOT, "shop.html"), "w").write(body)

def product_page(h):
    gen.REL = "../"
    p = P[h]; imgs = p["local"]; rel = "../"
    col = p["collections"][0] if p["collections"] else "Stare"
    chap = CHAPTER_BY_COL.get(col)
    cid = COL_ID.get(col, "stare")
    thumbs = "".join(f'<button type="button" class="product__thumb{" -is-active" if i == 0 else ""}" data-src="{rel}{u}" aria-label="View image {i + 1}"><img loading="lazy" decoding="async" alt="" src="{rel}{u}" width="160" height="213"></button>' for i, u in enumerate(imgs))
    k = kind(p["name"])
    tags = ["Sterling silver 925", "Handcrafted in Jaipur", k] + (["Bestseller"] if p.get("badge") == "Bestseller" else (["New in"] if p.get("badge") == "New" else []))
    tags_html = "".join(f'<li>{e(t)}</li>' for t in tags)
    rel_h = [x for x in ORDER if x != h and col in P[x]["collections"]][:5]
    related = "".join(card(x, rel) for x in rel_h)
    desc = f"{p['name']} is handcrafted in 925 sterling silver in our Jaipur workshop, part of the {col} collection. {COL_BLURB.get(col, '')} Every piece is shaped and finished by hand, so small variations are part of its character."
    body = f'''{head(f"{p['name']} — Bhavya Ramesh", desc)}
<body class="page-product" data-rel="../">
{header()}
<main id="main-content" class="main-content">
  <article class="product" data-product data-handle="{h}" data-name="{e(p['name'])}" data-price="{e(p['price'])}" data-image="{imgs[0]}">
    <div class="product__inner">
      <div class="product__gallery">
        <div class="product__thumbs">{thumbs}</div>
        <figure class="product__main"><img data-liquid="0.004" class="product__main-img" decoding="async" alt="{e(p['alt'] or p['name'])}" src="{rel}{imgs[0]}" width="1000" height="1333"></figure>
      </div>
      <div class="product__info">
        <div class="product__sticky">
          <p class="product__pre"><a href="{rel}shop.html#{cid}">[{e(col)}]</a> <span>[{e(k)}]</span></p>
          <h1 class="product__title js-title"><div><div>{e(p['name'].upper())}</div></div></h1>
          <p class="product__price">{e(p['price'])}</p>
          <div class="product__variants" role="radiogroup" aria-label="Finish">
            <button type="button" class="product__variant -is-active" aria-checked="true" role="radio">Silver</button>
            <button type="button" class="product__variant" aria-checked="false" role="radio">Gold plated</button>
          </div>
          <ul class="product__tags">{tags_html}</ul>
          <p class="product__desc js-lines"><span>{e(desc)}</span></p>
          <div class="product__actions">
            <button type="button" class="btn btn--secondary btn--big btn--contained btn--black" data-add-to-bag="add"><span class="btn__text">Add to bag</span></button>
            <button type="button" class="btn btn--secondary btn--small btn--contained btn--black" data-add-to-bag="buy"><span class="btn__text">Buy now</span></button>
            <button type="button" class="btn btn--tertiary btn--black js-open-contact"><span class="btn__text">Request info</span></button>
          </div>
          <details class="product__details"><summary>Care and materials</summary><p>Wipe with a soft dry cloth after wear and store in the pouch provided. Keep away from perfume, water and household chemicals; sterling silver may darken naturally and can be polished back to shine.</p></details>
          <details class="product__details"><summary>Shipping and returns</summary><p>Ships worldwide from Jaipur. See the shipping and returns pages on bhavyaramesh.com for timelines and the exchange policy.</p></details>
        </div>
      </div>
    </div>
  </article>
  <section class="product-related">
    <div class="product-related__inner">
      <h2 class="js-chars"><span>More from {e(col)}</span></h2>
      <ul class="shop__grid -related">{related}</ul>
      <div class="product-related__cta">{btn('See the ' + col + ' story', 'btn--secondary btn--big btn--contained btn--black', f'{rel}index.html#{cid}' if chap else f'{rel}shop.html#{cid}')}</div>
    </div>
  </section>
</main>
{footer()}
{modals()}
<div class="cursor-trail" aria-hidden="true"></div>
{scripts()}
<script>
document.querySelectorAll('.product__thumb').forEach(t=>t.addEventListener('click',()=>{{document.querySelectorAll('.product__thumb').forEach(x=>x.classList.remove('-is-active'));t.classList.add('-is-active');const im=document.querySelector('.product__main-img');im.src=t.dataset.src;im.addEventListener('load',()=>im.dispatchEvent(new Event('liquid:swap')),{{once:true}});}}));
document.querySelectorAll('.product__variant').forEach(b=>b.addEventListener('click',()=>{{document.querySelectorAll('.product__variant').forEach(x=>{{x.classList.remove('-is-active');x.setAttribute('aria-checked','false')}});b.classList.add('-is-active');b.setAttribute('aria-checked','true');}}));</script>
</body>
</html>'''
    os.makedirs(os.path.join(ROOT, "product"), exist_ok=True)
    open(os.path.join(ROOT, "product", f"{h}.html"), "w").write(body)

def checkout_page():
    gen.REL = ""
    body = f'''{head("Checkout — Bhavya Ramesh", "Secure checkout for handcrafted 925 sterling silver jewellery by Bhavya Ramesh.")}
<body class="page-shop page-checkout" data-rel="">
{header()}
<main id="main-content" class="main-content">
  <section class="checkout">
    <div class="checkout__inner">
      <div class="checkout__done">
        <p class="page-head__pre">[Order placed]</p>
        <h1 class="page-head__title">THANK YOU.</h1>
        <p class="checkout__done-text">Your order <strong data-order-id></strong> for <strong data-order-total></strong> is with our Jaipur workshop. A confirmation will go to <strong data-order-email></strong>. Every piece is made by hand, so please allow 7–10 working days before dispatch.</p>
        <div class="checkout__done-links">{btn('Back to the shop', 'btn--secondary btn--big btn--contained btn--black', 'shop.html')}{btn('Home', 'btn--secondary btn--small btn--contained btn--black', 'index.html')}</div>
      </div>
      <div class="checkout__grid">
        <form class="checkout__form" novalidate>
          <p class="page-head__pre">[Checkout]</p>
          <h1 class="checkout__title">YOUR DETAILS</h1>
          <fieldset><legend>Contact</legend>
            <label>Email <input type="email" name="email" required autocomplete="email"></label>
            <label>Phone <input type="tel" name="phone" required autocomplete="tel"></label>
          </fieldset>
          <fieldset><legend>Delivery address</legend>
            <div class="checkout__two"><label>First name <input name="first" required autocomplete="given-name"></label><label>Last name <input name="last" required autocomplete="family-name"></label></div>
            <label>Address <input name="address1" required autocomplete="address-line1"></label>
            <label>Apartment, landmark (optional) <input name="address2" autocomplete="address-line2"></label>
            <div class="checkout__two"><label>City <input name="city" required autocomplete="address-level2"></label><label>PIN / postal code <input name="zip" required autocomplete="postal-code"></label></div>
            <div class="checkout__two"><label>State <input name="state" required autocomplete="address-level1"></label><label>Country <select name="country" required><option>India</option><option>United States</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Singapore</option><option>Australia</option><option>Canada</option><option>Other</option></select></label></div>
          </fieldset>
          <fieldset class="checkout__pay"><legend>Payment</legend>
            <label class="-is-active"><input type="radio" name="payment" value="upi" checked> UPI / Cards / Net banking <small>Secure payment on the next step</small></label>
            <label><input type="radio" name="payment" value="cod"> Cash on delivery <small>India only</small></label>
          </fieldset>
          <label class="checkout__notes">Order notes (optional) <textarea name="notes" rows="3"></textarea></label>
          <button type="submit" class="btn btn--secondary btn--big btn--contained btn--black checkout__submit"><span class="btn__text">Place order</span></button>
          <p class="checkout__legal">By placing an order you agree to our terms of service. Handmade pieces are dispatched within 7–10 working days.</p>
        </form>
        <aside class="checkout__summary">
          <p class="page-head__pre">[Your bag]</p>
          <ul class="checkout__items"></ul>
          <div class="the-bag__row"><span>Subtotal</span><span data-bag-subtotal>Rs. 0</span></div>
          <div class="the-bag__row"><span>Shipping</span><span data-bag-shipping>—</span></div>
          <div class="the-bag__row -total"><span>Total</span><span data-bag-total>Rs. 0</span></div>
          <a href="shop.html" class="checkout__edit">Edit bag</a>
        </aside>
      </div>
    </div>
  </section>
</main>
{footer()}
{modals()}
<div class="cursor-trail" aria-hidden="true"></div>
{scripts()}
</body>
</html>'''
    open(os.path.join(ROOT, "checkout.html"), "w").write(body)

if __name__ == "__main__":
    checkout_page()
    shop_page()
    for h in ORDER: product_page(h)
    gen.REL = ""
    print("shop + products:", len(ORDER))
