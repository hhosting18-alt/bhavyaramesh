import html, os
from content import SITE, CHAPTERS, BASE, CONTACT, INSTAGRAM, FACEBOOK

REL = ""
def e(s): return html.escape(s, quote=True)

def split_lines(text, cls=""):
    """Wrap text for line-reveal animation (JS splits into lines)."""
    return f'<p class="{cls} js-lines"><span>{e(text)}</span></p>'

def split_chars(text, cls=""):
    return f'<p class="{cls} js-chars"><span>{e(text)}</span></p>'

def btn(text, cls, href=None, extra="", target=False):
    t = ' target="_blank" rel="noopener noreferrer"' if target else ""
    if href:
        return f'<a href="{e(href)}"{t} class="btn {cls}" {extra}><span class="btn__text">{e(text)}</span></a>'
    return f'<button type="button" class="btn {cls}" {extra}><span class="btn__text">{e(text)}</span></button>'

ICON_SOUND = '<span class="btn__icon"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="5" width="3" height="6"/><rect x="6.5" y="2" width="3" height="12"/><rect x="12" y="4" width="3" height="8"/></svg></span>'
ICON_PLAY = '<span class="btn__icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2l11 6-11 6z"/></svg></span>'
ICON_PAUSE = '<span class="btn__icon"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/></svg></span>'

def chapter(c, i):
    d = f"assets/img/{c['dir']}"
    cover = f"{d}/cover.{c['cover_ext']}"
    n = c["name"]
    title_chars = "".join(f"<div>{e(ch)}</div>" for ch in n)
    gallery = ""
    for j, (gname, handle, price) in enumerate(c["gallery"], 1):
        gallery += f'''
        <li class="tale-product-gallery__item{" -is-active" if j == 3 else ""}" data-url="product/{handle}.html">
          <div class="tale-product-gallery__plane">
            <picture class="base-image -is-vertical"><img loading="lazy" decoding="async" alt="{e(gname)} by Bhavya Ramesh" src="{d}/g{j}.webp" width="600" height="800"></picture>
            <a href="product/{handle}.html" class="btn btn--secondary btn--small btn--contained btn--black tale-product-gallery__shop-btn"><span class="btn__text">View piece</span></a>
          </div>
          <h3>{e(gname)}<span class="tale-product-gallery__price">{e(price)}</span></h3>
        </li>'''
    tags = "".join(f'<li class="tale-product-overview__tag">{e(t)}</li>' for t in c["product"]["tags"])
    divs = "".join('<div class="song-player__divs"></div>' for _ in range(16)) + "".join('<div class="song-player__divs -is-desktop"></div>' for _ in range(9))
    return f'''
  <section id="{c['id']}" class="homepage__tale" data-chapter="{i}" data-name="{e(n)}">
    <section class="tale-cover">
      <p class="tale-cover__name -is-desktop">[{e(n)}]</p>
      <p class="tale-cover__name -is-desktop">[{e(n)}]</p>
      <picture class="responsive-image tale-cover__bg"><img loading="{'eager' if i == 0 else 'lazy'}" decoding="async" alt="{e(n)} collection cover, handcrafted 925 sterling silver jewellery by Bhavya Ramesh" src="{cover}"></picture>
    </section>

    <section class="tale-head" data-float="{d}/float.png">
      <div class="tale-head__inner">
        <div class="tale-head__pre">
          {split_chars('['+c['ordinal']+']')}
          {split_chars('[TALE]')}
        </div>
        <h2 class="tale-head__title" aria-label="{e(n)}">{title_chars}</h2>
        {split_lines(c['abstract'], 'tale-head__abstract')}
        <div class="tale-head__content">
          <div class="tale-head__mobile-trail"><img class="tale-head__mobile-trail-img" src="{d}/float.png" alt="" loading="lazy"></div>
          <span class="tale-head__type -left -is-desktop"><div>{e(c['type'][0])}</div><div>{e(c['type'][1])}</div></span>
          <span class="tale-head__type -right"><div>{e(c['type'][0])}</div><div>{e(c['type'][1])}</div></span>
          <div class="tale-head__side-col1"><picture class="base-image -is-vertical js-parallax" data-speed="-0.15"><img loading="lazy" decoding="async" alt="Editorial detail from the {e(n)} collection by Bhavya Ramesh" src="{d}/head-1.webp"></picture></div>
          <picture class="base-image -is-vertical tale-head__main-image js-parallax" data-speed="0.06"><img loading="lazy" decoding="async" alt="Model wearing the {e(n)} collection by Bhavya Ramesh" src="{d}/head-main.webp"></picture>
          <div class="tale-head__side-col2"><picture class="base-image -is-vertical js-parallax" data-speed="-0.25"><img loading="lazy" decoding="async" alt="Model wearing handcrafted silver jewellery from the {e(n)} collection" src="{d}/head-2.webp"></picture></div>
        </div>
      </div>
    </section>

    <section class="tale-lookbook" data-float="{d}/float.png">
      <div class="tale-lookbook__inner">
        <div class="tale-lookbook__side-col">
          <picture class="base-image -is-vertical tale-lookbook__secondary-image js-parallax" data-speed="-0.12"><img loading="lazy" decoding="async" alt="{e(n)} lookbook detail, Bhavya Ramesh" src="{d}/lookbook-secondary.webp"></picture>
          {split_lines(c['lookbook_quote'])}
        </div>
        <div class="tale-lookbook__main-col">
          <picture class="base-image -is-vertical tale-lookbook__main-image js-parallax" data-speed="0.08"><img loading="lazy" decoding="async" alt="{e(n)} lookbook, Bhavya Ramesh" src="{d}/lookbook-main.webp"></picture>
        </div>
      </div>
    </section>

    <section class="tale-product-overview">
      <div class="tale-product-overview__inner">
        <div class="tale-product-overview__title-wr"><h2 class="tale-product-overview__title">{e(c['product']['name'])}</h2></div>
        <div class="tale-product-overview__image-wr">
          <div class="tale-product-overview__bg" style="background-image:url('{d}/product.webp')"></div>
          <picture class="base-image tale-product-overview__main-image"><img data-liquid="0.006" crossorigin="anonymous" loading="lazy" decoding="async" alt="{e(c['product']['name'])}, handcrafted 925 sterling silver by Bhavya Ramesh" src="{d}/product.webp"></picture>
        </div>
        <ul class="tale-product-overview__tags">{tags}</ul>
        <a href="product/{e(c['product']['handle'])}.html" class="btn btn--secondary btn--big btn--contained btn--black tale-product-overview__request"><span class="btn__text">View piece</span></a>
      </div>
    </section>

    <section class="tale-product-story">
      <div class="tale-product-story__inner">
        <div class="tale-product-story__content">
          <div class="tale-product-story__story"><h2 class="js-chars"><span>[Story]</span></h2>{split_lines(c['product']['story'])}</div>
          <div class="tale-product-story__crafting"><h2 class="js-chars"><span>[Crafting]</span></h2>{split_lines(c['product']['crafting'])}</div>
        </div>
        <div class="tale-product-story__song-wr">
          <div class="tale-product-story__song" data-seed="{c['song']['seed']}">
            <h2 class="js-words"><span>{e(c['song']['title'])}</span></h2>
            {split_lines(c['song']['caption'])}
            <div class="song-player">
              <div class="song-player__progress" role="slider" tabindex="0" aria-label="Song progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="song-player__progress-bar"></div>{divs}</div>
              <div class="song-player__controls">
                <button type="button" class="btn btn--tertiary btn--big btn--contained btn--white song-player__btn">{ICON_PLAY}<span class="btn__text">Play</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tale-product-gallery">
      <div class="tale-product-gallery__inner">
        <h2 class="js-chars"><span>The collection</span></h2>
        <ul class="tale-product-gallery__list">{gallery}
        </ul>
        <div class="tale-product-gallery__open-cursor" aria-hidden="true"><span>Shop online</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13L13 3M6 3h7v7"/></svg></div>
      </div>
    </section>

    <section class="tale-outro">
      <div class="tale-outro__inner">
        <div class="tale-outro__head">
          {split_lines(c['outro_quote'])}
          {btn('THE MAKER', 'btn--secondary btn--small btn--contained btn--black js-open-maker')}
        </div>
        <div class="tale-outro__links">
          {btn('SHOP ONLINE', 'btn--secondary btn--big btn--contained btn--black', 'shop.html#' + c['id'])}
          {btn("LET'S TALK", 'btn--secondary btn--big btn--contained btn--black', CONTACT, target=True)}
        </div>
        <div class="tale-outro__image-wr">
          <picture class="base-image -is-vertical tale-outro__image"><img loading="lazy" decoding="async" alt="Closing the {e(n)} chapter, Bhavya Ramesh" src="{d}/outro.webp"></picture>
          <p>The maker (Bhavya)</p>
        </div>
      </div>
    </section>
  </section>'''


def header(variant=None):
    if variant == 'shop':
        left = '<div class="the-header__maker"><button type="button" class="the-header__burger" aria-label="Open menu" aria-expanded="false" aria-controls="the-menu"><span></span><span></span><span></span></button></div>'
        right = '<div class="the-header__contacts"><button type="button" class="btn btn--primary btn--small btn--contained btn--white the-header__bag" data-bag-open><span class="btn__text">Bag (<span data-bag-count>0</span>)</span></button></div>'
    else:
        left = f"<div class=\"the-header__maker\">{btn('The maker', 'btn--primary btn--small btn--contained btn--white js-open-maker')}{btn('Shop', 'btn--primary btn--small btn--contained btn--white', REL + 'shop.html')}</div>"
        right = None
    out = f'''<header class="the-header">
  {left}
  <div class="the-header__center"><a href="{REL}index.html" class="the-header__home" aria-label="Bhavya Ramesh home"><img src="{REL}assets/img/home/logo.png" alt="Bhavya Ramesh"></a>
    <button type="button" class="btn btn--tertiary btn--contained btn--white the-header__sound-btn" aria-pressed="false" aria-label="Toggle sound"><span class="the-header__sound-bracket">[</span>{ICON_SOUND}<span class="btn__text">With sound</span><span class="the-header__sound-bracket">]</span></button>
  </div>
  {right or f"<div class=\"the-header__contacts\">{btn('Contact', 'btn--primary btn--small btn--contained btn--white js-open-contact')}<button type=\"button\" class=\"btn btn--primary btn--small btn--contained btn--white the-header__bag\" data-bag-open><span class=\"btn__text\">Bag (<span data-bag-count>0</span>)</span></button></div>"}
</header>'''
    return out + (menu_panel() if variant == 'shop' else '')

def menu_panel():
    stores = "".join(f'<li>{e(a)}</li>' for a, b in SITE["footer"]["stores"])
    return f'''
<div class="the-menu" id="the-menu" hidden>
  <div class="the-menu__backdrop" data-menu-close></div>
  <nav class="the-menu__panel" aria-label="Menu" data-lenis-prevent>
    <button type="button" class="the-menu__close" data-menu-close><span>[</span> × Close <span>]</span></button>
    <ul class="the-menu__links">
      <li><button type="button" class="the-menu__link js-open-maker" data-menu-handoff>The maker</button></li>
      <li><button type="button" class="the-menu__link js-open-contact" data-menu-handoff>Contact</button></li>
      <li><a class="the-menu__link -muted" href="{REL}index.html">5 tales <span aria-hidden="true">↗</span></a></li>
    </ul>
    <div class="the-menu__foot">
      <p class="the-menu__label">[Visit]</p>
      <ul class="the-menu__stores">{stores}</ul>
      <div class="the-menu__social"><a href="{e(INSTAGRAM)}" target="_blank" rel="noopener noreferrer">Instagram</a><a href="{e(FACEBOOK)}" target="_blank" rel="noopener noreferrer">Facebook</a></div>
    </div>
  </nav>
</div>'''

def footer():
    S = SITE
    stores = "".join(f'<li><strong>{e(a)}</strong><span>{e(b.split(" · ")[0])}</span><span>{e(b.split(" · ")[1]) if " · " in b else ""}</span></li>' for a, b in S["footer"]["stores"])
    L = lambda t, h: f"<li>{btn(t, 'btn--primary btn--small btn--contained btn--white', h, target=True)}</li>"
    return f'''<footer class="the-footer" id="contact">
  <div class="the-footer__main">
    <p class="js-chars"><span>[Outro]</span></p>
    <h2 class="js-title"><div><div>FROM JAIPUR,</div></div><div><div>EVERYTHING</div></div><div><div>BEGINS.</div></div></h2>
    <div class="the-footer__cta">{btn('Shop all pieces', 'btn--secondary btn--big btn--contained btn--white', REL + 'shop.html')}</div>
  </div>
  <div class="the-footer__bottom">
    <div class="the-footer__section">
      <div class="the-footer__label"><p>[Visit]</p>{btn('All stores ↗', 'btn--primary btn--small btn--contained btn--white', BASE + '/pages/retail-store', target=True)}</div>
      <ul class="the-footer__stores">{stores}</ul>
    </div>
    <nav class="the-footer__section the-footer__links" aria-label="Footer">
      <div class="the-footer__group"><p class="the-footer__group-title">[Follow]</p><ul>{L('Instagram', INSTAGRAM)}{L('Facebook', FACEBOOK)}</ul></div>
      <div class="the-footer__group"><p class="the-footer__group-title">[Help]</p><ul>{L('Contact us', CONTACT)}{L('Shipping', BASE + '/pages/shipping-info')}{L('Returns', BASE + '/pages/returns-exchange')}{L('Jewellery care', BASE + '/pages/jewellery-care')}</ul></div>
      <div class="the-footer__group"><p class="the-footer__group-title">[Legal]</p><ul>{L('Privacy policy', BASE + '/policies/privacy-policy')}{L('Terms of service', BASE + '/policies/terms-of-service')}</ul></div>
    </nav>
    <div class="the-footer__base">
      <p class="the-footer__copyright">{e(S['footer']['copyright'])}</p>
      {btn('Back to top ↑', 'btn--primary btn--small btn--contained btn--white js-back-top')}
    </div>
  </div>
</footer>'''

def bag_drawer():
    return f'''<aside class="the-bag" role="dialog" aria-modal="true" aria-label="Your bag" hidden>
  <div class="the-bag__backdrop" data-bag-close></div>
  <div class="the-bag__panel">
    <div class="the-bag__head"><p class="the-bag__pre">[Your bag]</p><button type="button" class="btn btn--secondary btn--small btn--contained btn--black" data-bag-close><span class="btn__text">Close</span></button></div>
    <ul class="the-bag__list"></ul>
    <div class="the-bag__foot">
      <div class="the-bag__row"><span>Subtotal</span><span data-bag-subtotal>Rs. 0</span></div>
      <div class="the-bag__row"><span>Shipping</span><span data-bag-shipping>—</span></div>
      <div class="the-bag__row -total"><span>Total</span><span data-bag-total>Rs. 0</span></div>
      <p class="the-bag__note">Free shipping in India above Rs. 5,000. Ships worldwide from Jaipur.</p>
      <a href="{REL}checkout.html" class="btn btn--secondary btn--big btn--contained btn--black the-bag__checkout" data-bag-checkout><span class="btn__text">Checkout</span></a>
      <a href="{REL}shop.html" class="btn btn--secondary btn--small btn--contained btn--black" data-bag-close><span class="btn__text">Continue shopping</span></a>
    </div>
  </div>
</aside>'''

def modals():
    return bag_drawer() + f'''<div class="the-modal" id="maker-modal" role="dialog" aria-modal="true" aria-label="The maker" hidden>
  <div class="the-modal__backdrop"></div>
  <div class="the-modal__panel">
    <button type="button" class="btn btn--primary btn--small btn--contained btn--white the-modal__close"><span class="btn__text">Close</span></button>
    <div class="the-modal__grid">
      <picture class="base-image -is-vertical the-modal__image"><img loading="lazy" alt="Bhavya Ramesh, the maker" src="{REL}assets/img/04_nailcrown/outro.webp"></picture>
      <div class="the-modal__content">
        <p class="the-modal__pre">[The maker]</p>
        <h2>BHAVYA RAMESH</h2>
        <p>Established in 2018, Bhavya Ramesh is dedicated to the artistry of traditional jewellery making. Led by founder Bhavya Ramesh, we prioritise the human touch, supporting local artisans who craft each piece with meticulous attention to detail, ensuring that our jewellery is not only desirable but also meant to be cherished and passed down through generations.</p>
        <p>Rooted in the values of Indian culture, we foster a sense of community and craftsmanship while continuously pushing the boundaries of fashion. Operating from our workshop in Jaipur, we proudly employ a team of 40 skilled artisans and 10 dedicated workers, supported by a team of 30 in Mumbai. Renowned for excellence and experimentation in silver jewellery, our designs resonate with discerning customers worldwide.</p>
        <div class="the-modal__links">{btn('About us', 'btn--secondary btn--small btn--contained btn--black', BASE + '/pages/about-us', target=True)}{btn('Journal', 'btn--secondary btn--small btn--contained btn--black', BASE + '/blogs/journal', target=True)}</div>
      </div>
    </div>
  </div>
</div>

<div class="the-modal" id="contact-modal" role="dialog" aria-modal="true" aria-label="Contact" hidden>
  <div class="the-modal__backdrop"></div>
  <div class="the-modal__panel">
    <button type="button" class="btn btn--primary btn--small btn--contained btn--white the-modal__close"><span class="btn__text">Close</span></button>
    <div class="the-modal__content -contact">
      <p class="the-modal__pre">[Contact]</p>
      <h2>LET'S TALK</h2>
      <p>Every piece is made by hand in our Jaipur workshop, and there is a difference between seeing that on a screen and holding it. Three stores, two cities. Come and try things on, or write to us.</p>
      <ul class="the-modal__stores">
        <li><strong>Kala Ghoda, Mumbai</strong><span>Ground Floor, Shop No 3, 43 Forbes Street, Kala Ghoda, Fort, Mumbai 400023</span><span>Open daily · 11:00 am – 9:30 pm</span></li>
        <li><strong>Bandra West, Mumbai</strong><span>Shop No 5, Sunbeam CHS, Perry Cross Road, Bandra West, Mumbai 400050</span><span>Open daily · 11:00 am – 8:30 pm</span></li>
        <li><strong>Khan Market, New Delhi</strong><span>Shop No 40A, Ground Floor, Khan Market, Rabindra Nagar, New Delhi 110003</span><span>Open daily · 11:00 am – 9:00 pm</span></li>
      </ul>
      <div class="the-modal__links">{btn('Contact us', 'btn--secondary btn--small btn--contained btn--black', CONTACT, target=True)}{btn('Instagram', 'btn--secondary btn--small btn--contained btn--black', INSTAGRAM, target=True)}{btn('Stockists', 'btn--secondary btn--small btn--contained btn--black', BASE + '/pages/stockists', target=True)}</div>
    </div>
  </div>
</div>

'''

def scripts():
    return f'<script src="{REL}assets/js/vendor/gsap.min.js"></script>\n<script src="{REL}assets/js/vendor/ScrollTrigger.min.js"></script>\n<script src="{REL}assets/js/vendor/lenis.min.js"></script>\n<script src="{REL}assets/js/main.js"></script>\n<script src="{REL}assets/js/liquid.js"></script>\n<script src="{REL}assets/js/bag.js"></script>'

def head(title, desc, extra=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<link rel="icon" href="{REL}assets/img/home/logo.png" type="image/png">
<link rel="preload" href="{REL}assets/fonts/hanken-grotesk-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{REL}assets/css/style.css">{extra}
</head>'''

def page():
    S = SITE
    chapters_html = "".join(chapter(c, i) for i, c in enumerate(CHAPTERS))
    index_links = "".join(f'<li><a href="#{c["id"]}" data-chapter="{i}" class="btn btn--primary btn--big btn--contained btn--white"><span class="btn__text">{e(c["name"])}</span></a></li>' for i, c in enumerate(CHAPTERS))
    hero_featured = "".join(f'<picture class="hero__bg-featured-chapter" data-chapter="{i}"><img loading="lazy" alt="" src="assets/img/{c["dir"]}/cover.{c["cover_ext"]}"></picture>' for i, c in enumerate(CHAPTERS))
    progress = "".join(f'<button type="button" class="chapters-progress__bar" data-target="#{c["id"]}"><span class="chapters-progress__label"><span class="chapters-progress__name">{e(c["name"])}</span></span></button>' for c in CHAPTERS)
    floats_splash = "".join(f'<picture class="base-image -is-square{" -active" if i == 0 else ""}"><img alt="" src="assets/img/{c["dir"]}/float-80.png" width="80" height="80"></picture>' for i, c in enumerate(CHAPTERS))
    stores = "".join(f'<li><strong>{e(a)}</strong><span>{e(b.split(" · ")[0])}</span><span>{e(b.split(" · ")[1]) if " · " in b else ""}</span></li>' for a, b in S["footer"]["stores"])
    L = lambda t, h: f"<li>{btn(t, 'btn--primary btn--small btn--contained btn--white', h, target=True)}</li>"
    intro = S["intro"]
    intro_title = "".join(f"<div><div>{e(w)}</div></div>" for w in intro["title"])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(S['title'])}</title>
<meta name="description" content="{e(S['description'])}">
<meta property="og:title" content="{e(S['title'])}">
<meta property="og:description" content="{e(S['description'])}">
<meta property="og:image" content="assets/img/home/hero.jpg">
<link rel="icon" href="assets/img/home/logo.png" type="image/png">
<link rel="preload" href="assets/fonts/hanken-grotesk-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/palette-mosaic-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="scroll-lock" data-rel="">

<div class="the-splash" aria-live="polite">
  <div class="the-splash__inner">
    <div class="the-splash__bg -bg-black"></div>
    <div class="the-splash__bg -bg-pink"></div>
    <div class="the-splash__logo"><img src="assets/img/home/logo.png" alt="Bhavya Ramesh"></div>
    <div class="the-splash__ring-cursor"><div class="the-splash__ring-spinner">{floats_splash}</div></div>
  </div>
  <div class="the-splash__sound-choice">
    <div class="the-splash__sound-choice-content">
      <button type="button" class="btn btn--tertiary btn--big btn--contained btn--white the-splash__sound-btn" tabindex="-1">{ICON_SOUND}</button>
      <p class="the-splash__abstract">{e(S['splash'])}</p>
      <button type="button" class="btn btn--secondary btn--big btn--contained btn--white the-splash__sound-enable-btn"><span class="btn__text">Enter the experience</span></button>
    </div>
    <button type="button" class="btn btn--primary btn--small btn--contained btn--white the-splash__sound-disable-btn"><span class="btn__text">Continue without sound</span></button>
  </div>
</div>

{header()}


<main id="main-content" class="main-content">
<div class="homepage">

  <section class="hero">
    <div class="hero__bg">
      <picture class="responsive-image hero__poster"><img src="assets/img/home/hero-stare.jpg" alt="Bhavya Ramesh campaign, handcrafted 925 sterling silver jewellery" fetchpriority="high"></picture>
      <div class="responsive-video hero__video-wr">
        <video class="responsive-video__item hero__video" loop muted autoplay playsinline preload="auto" poster="assets/img/home/hero-stare.jpg"><source src="assets/video/hero.mp4" type="video/mp4"></video>
      </div>
      {hero_featured}
    </div>
    <button type="button" class="btn btn--tertiary btn--big btn--contained btn--white hero__video-btn" aria-label="Pause video">{ICON_PAUSE}</button>
    <div class="base-scroll-indicator hero__scroll-indicator"><div class="base-scroll-indicator__fill"></div></div>
    <ul class="hero__index">
      <li class="hero__index-pretitle"><p>{e(S['hero_pretitle'])}</p></li>
      {index_links}
    </ul>
  </section>

  <section class="intro">
    <div class="intro__inner">
      {split_chars(intro['pre'], 'intro__pretitle')}
      <h1 class="js-title">{intro_title}</h1>
      <div class="intro__side-images -is-mobile">
        <picture class="base-image -is-vertical intro__side-image1"><img loading="lazy" alt="Bhavya Ramesh Glarekillers sunglasses in sterling silver" src="{intro['img1']}"></picture>
        <picture class="base-image -is-vertical intro__side-image2"><img loading="lazy" alt="Bhavya Ramesh handcrafted silver rings and chains" src="{intro['img2']}"></picture>
      </div>
      {split_lines(intro['abstract'], 'intro__abstract')}
      {split_lines(intro['caption'], 'intro__caption')}
    </div>
    <div class="intro__side-images -is-desktop">
      <picture class="base-image -is-vertical intro__side-image1 js-parallax" data-speed="-0.1"><img loading="lazy" alt="Bhavya Ramesh Glarekillers sunglasses in sterling silver" src="{intro['img1']}"></picture>
      <picture class="base-image -is-vertical intro__side-image2 js-parallax" data-speed="0.12"><img loading="lazy" alt="Bhavya Ramesh handcrafted silver rings and chains" src="{intro['img2']}"></picture>
    </div>
  </section>

  <div class="chapters-progress -is-desktop">
    <div class="chapters-progress__content" role="progressbar" aria-label="Chapters">
      <div class="chapters-progress__fill"></div>
      {progress}
    </div>
  </div>

  <div class="chapters-menu -is-mobile">
    <div class="chapters-menu__bar"><div class="chapters-menu__progress"></div><p class="chapters-menu__label">{e(CHAPTERS[0]['name'])}</p></div>
    <div class="chapters-menu__overlay"></div>
    <div class="chapters-menu__drawer">
      <button type="button" class="chapters-menu__trigger" aria-label="Open chapters menu" aria-expanded="false"><span class="chapters-menu__icon-line"></span><span class="chapters-menu__icon-line"></span></button>
      <div id="chapters-menu-panel" class="chapters-menu__panel" role="dialog" aria-label="Chapters">
        <ul class="chapters-menu__list">
          <li class="chapters-menu__pretitle"><p>{e(S['hero_pretitle'])}</p></li>
          {index_links}
        </ul>
      </div>
    </div>
  </div>
{chapters_html}

</div>
</main>

{footer()}

{modals()}<div class="cursor-trail" aria-hidden="true"></div>

{scripts()}
</body>
</html>
'''

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "index.html")
    open(out, "w").write(page())
    print("wrote", out, len(page()))
