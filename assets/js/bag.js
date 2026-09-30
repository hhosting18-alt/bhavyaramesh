/* Bhavya Ramesh — shopping bag (client-side, localStorage). */
(function () {
  'use strict';
  const KEY = 'br_bag_v1', ORDERS = 'br_orders_v1';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const REL = document.body.dataset.rel || '';
  const money = (n) => 'Rs. ' + Math.round(n).toLocaleString('en-IN');
  const parsePrice = (s) => parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;

  const Bag = {
    items: [],
    load() { try { this.items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { this.items = []; } return this; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch (e) {} this.render(); },
    add(item) {
      const k = item.handle + '|' + item.finish;
      const ex = this.items.find((i) => i.handle + '|' + i.finish === k);
      if (ex) ex.qty += item.qty || 1; else this.items.push({ ...item, qty: item.qty || 1 });
      this.save(); this.open(); this.flash();
    },
    setQty(i, q) { if (q <= 0) this.items.splice(i, 1); else this.items[i].qty = q; this.save(); },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    subtotal() { return this.items.reduce((a, i) => a + i.price * i.qty, 0); },
    shipping() { return this.subtotal() === 0 ? 0 : (this.subtotal() >= 5000 ? 0 : 250); },
    open() { const d = $('.the-bag'); if (!d) return; d.hidden = false; requestAnimationFrame(() => d.classList.add('-open')); document.body.classList.add('scroll-lock'); if (window.__lenis) window.__lenis.stop(); },
    close() { const d = $('.the-bag'); if (!d) return; d.classList.remove('-open'); setTimeout(() => { d.hidden = true; }, 600); document.body.classList.remove('scroll-lock'); if (window.__lenis) window.__lenis.start(); },
    flash() { const b = $('.the-header__bag'); if (!b) return; b.classList.add('-flash'); setTimeout(() => b.classList.remove('-flash'), 900); },
    render() {
      $$('[data-bag-count]').forEach((el) => { el.textContent = this.count(); el.parentElement.classList.toggle('-has-items', this.count() > 0); });
      const list = $('.the-bag__list'); if (list) {
        list.innerHTML = this.items.length ? this.items.map((i, idx) => `
          <li class="the-bag__item">
            <a href="${REL}product/${i.handle}.html" class="the-bag__thumb"><img src="${REL}${i.image}" alt=""></a>
            <div class="the-bag__meta">
              <a href="${REL}product/${i.handle}.html" class="the-bag__name">${i.name}</a>
              <p class="the-bag__finish">${i.finish}</p>
              <div class="the-bag__qty" role="group" aria-label="Quantity"><button type="button" data-qty="${idx}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button type="button" data-qty="${idx}" data-d="1" aria-label="Increase">+</button></div>
            </div>
            <p class="the-bag__price">${money(i.price * i.qty)}</p>
          </li>`).join('') : '<li class="the-bag__empty">Your bag is empty. Every piece is made by hand in Jaipur — start with the collection that speaks to you.</li>';
        $$('[data-qty]', list).forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.qty; this.setQty(i, this.items[i].qty + (+b.dataset.d)); }));
      }
      $$('[data-bag-subtotal]').forEach((el) => { el.textContent = money(this.subtotal()); });
      $$('[data-bag-shipping]').forEach((el) => { el.textContent = this.shipping() === 0 ? (this.subtotal() ? 'Free' : '—') : money(this.shipping()); });
      $$('[data-bag-total]').forEach((el) => { el.textContent = money(this.subtotal() + this.shipping()); });
      $$('[data-bag-checkout]').forEach((el) => { el.classList.toggle('-disabled', this.items.length === 0); });
    }
  };
  window.Bag = Bag;
  Bag.load().render();

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-bag-open]'); if (open) { e.preventDefault(); Bag.open(); return; }
    const close = e.target.closest('[data-bag-close]'); if (close) { e.preventDefault(); Bag.close(); return; }
    const add = e.target.closest('[data-add-to-bag]');
    if (add) {
      e.preventDefault();
      const root = add.closest('[data-product]') || document;
      const finishEl = $('.product__variant.-is-active', root);
      const item = { handle: root.dataset.handle, name: root.dataset.name, price: parsePrice(root.dataset.price), image: root.dataset.image, finish: finishEl ? finishEl.textContent.trim() : 'Silver', qty: 1 };
      Bag.add(item);
      if (add.dataset.addToBag === 'buy') setTimeout(() => { window.location.href = REL + 'checkout.html'; }, 250);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Bag.close(); });

  /* ---------------- Checkout page ---------------- */
  const form = $('.checkout__form');
  if (form) {
    const summary = $('.checkout__items');
    const renderSummary = () => {
      summary.innerHTML = Bag.items.length ? Bag.items.map((i) => `<li><img src="${REL}${i.image}" alt=""><div><strong>${i.name}</strong><span>${i.finish} × ${i.qty}</span></div><em>${money(i.price * i.qty)}</em></li>`).join('') : '<li class="checkout__empty">Your bag is empty.</li>';
      Bag.render();
    };
    renderSummary();
    $$('.checkout__pay input').forEach((r) => r.addEventListener('change', () => { $$('.checkout__pay label').forEach((l) => l.classList.toggle('-is-active', l.querySelector('input').checked)); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!Bag.items.length) { alert('Your bag is empty.'); return; }
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const order = { id: 'BR' + Date.now().toString(36).toUpperCase(), when: new Date().toISOString(), items: Bag.items, customer: data, subtotal: Bag.subtotal(), shipping: Bag.shipping(), total: Bag.subtotal() + Bag.shipping() };
      try { const all = JSON.parse(localStorage.getItem(ORDERS) || '[]'); all.push(order); localStorage.setItem(ORDERS, JSON.stringify(all)); } catch (err) {}
      Bag.clear();
      $('.checkout').classList.add('-done');
      $('[data-order-id]').textContent = order.id;
      $('[data-order-email]').textContent = data.email || '';
      $('[data-order-total]').textContent = money(order.total);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
