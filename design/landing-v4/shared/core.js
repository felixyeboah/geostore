/* Geostoresgh landing mockups — shared runtime.
   Cart (localStorage), cart drawer, quick view, search suggestions,
   wishlist, toasts, rails, accordions, tabs, newsletter.

   Markup hooks (all optional, delegated):
     [data-add="<productId>"]          add to bag (button)
     [data-quickview="<productId>"]    open quick view
     [data-wishlist="<productId>"]     toggle wishlist
     [data-cart-open] / [data-cart-close]
     [data-cart-count]                 auto-updated badge (hidden when 0 if data-hide-empty)
     [data-rail] + [data-rail-prev]/[data-rail-next] inside a [data-rail-wrap]
     [data-accordion] > button + [data-panel]
     [data-tabs] > [data-tab="x"] buttons, [data-tabpanel="x"] panels
     form[data-newsletter] with input[type=email]
     [data-menu-toggle="<id>"]         toggles .is-open on #id and aria-expanded
     GEO.bindSearch(input, {onSelect}) attaches suggestions to a search input
*/
(function () {
	const GEO = window.GEO;
	if (!GEO) throw new Error("data.js must load before core.js");

	/* ---------- utils ---------- */
	const esc = (s) =>
		String(s ?? "").replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
		);
	const $ = (sel, root) => (root || document).querySelector(sel);
	const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
	const load = (k, d) => {
		try {
			const v = JSON.parse(localStorage.getItem(k));
			return v == null ? d : v;
		} catch {
			return d;
		}
	};
	const save = (k, v) => {
		try {
			localStorage.setItem(k, JSON.stringify(v));
		} catch {}
	};

	const ICONS = {
		bag: '<svg class="geo-ic" viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
		close: '<svg class="geo-ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
		minus: '<svg class="geo-ic sm" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
		plus: '<svg class="geo-ic sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
		arrow: '<svg class="geo-ic sm" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
		search: '<svg class="geo-ic sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
		tag: '<svg class="geo-ic sm" viewBox="0 0 24 24"><path d="M20 12 12 20l-9-9V3h8l9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
		check: '<svg class="geo-ic sm" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
		heart: '<svg class="geo-ic" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-8.5C1.5 8 3.5 4.5 7 4.5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 5.5 3.5 4 7-2 4.1-9 8.5-9 8.5z"/></svg>',
	};

	function stars(rating) {
		let out = '<span class="geo-stars" aria-hidden="true">';
		for (let i = 1; i <= 5; i++) {
			out += `<svg viewBox="0 0 24 24" class="${i <= Math.round(rating) ? "" : "off"}"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z"/></svg>`;
		}
		return out + "</span>";
	}

	/* ---------- cart store ---------- */
	const KEY_CART = "geo-landing-cart";
	const listeners = new Set();
	const cart = {
		items: load(KEY_CART, []).filter((i) => GEO.byId[i.id]),
		subscribe(fn) {
			listeners.add(fn);
			fn(cart);
			return () => listeners.delete(fn);
		},
		emit() {
			save(KEY_CART, cart.items);
			listeners.forEach((fn) => fn(cart));
		},
		count() {
			return cart.items.reduce((n, i) => n + i.qty, 0);
		},
		subtotal() {
			return cart.items.reduce(
				(n, i) => n + GEO.byId[i.id].priceInPesewas * i.qty,
				0,
			);
		},
		savings() {
			return cart.items.reduce((n, i) => {
				const p = GEO.byId[i.id];
				return n + (p.compareAtInPesewas ? (p.compareAtInPesewas - p.priceInPesewas) * i.qty : 0);
			}, 0);
		},
		qtyOf(id) {
			const l = cart.items.find((i) => i.id === id);
			return l ? l.qty : 0;
		},
		has(id) {
			return cart.qtyOf(id) > 0;
		},
		add(id, qty, opts) {
			qty = qty || 1;
			opts = opts || {};
			const p = GEO.byId[id];
			if (!p) return { ok: false, reason: "missing" };
			const line = cart.items.find((i) => i.id === id);
			const current = line ? line.qty : 0;
			if (current >= p.stockQuantity) {
				toast({ title: `Only ${p.stockQuantity} in stock`, sub: p.name, error: true });
				return { ok: false, reason: "stock" };
			}
			const next = Math.min(p.stockQuantity, current + qty);
			if (line) line.qty = next;
			else cart.items.push({ id, qty: next });
			cart.emit();
			if (!opts.silent) {
				toast({
					img: p.imageUrl,
					title: "Added to bag",
					sub: p.name,
					action: { label: "View bag", onClick: openCart },
				});
			}
			return { ok: true };
		},
		setQty(id, qty) {
			const p = GEO.byId[id];
			if (!p) return;
			if (qty <= 0) return cart.remove(id);
			const line = cart.items.find((i) => i.id === id);
			if (!line) return;
			if (qty > p.stockQuantity) {
				qty = p.stockQuantity;
				toast({ title: `Only ${p.stockQuantity} in stock`, sub: p.name, error: true });
			}
			line.qty = qty;
			cart.emit();
		},
		remove(id) {
			cart.items = cart.items.filter((i) => i.id !== id);
			cart.emit();
		},
		clear() {
			cart.items = [];
			cart.emit();
		},
	};

	/* ---------- wishlist ---------- */
	const KEY_WISH = "geo-landing-wishlist";
	const wishlist = {
		ids: new Set(load(KEY_WISH, [])),
		has(id) {
			return wishlist.ids.has(id);
		},
		toggle(id) {
			const p = GEO.byId[id];
			if (!p) return;
			if (wishlist.ids.has(id)) {
				wishlist.ids.delete(id);
				toast({ title: "Removed from saved items", sub: p.name });
			} else {
				wishlist.ids.add(id);
				toast({ img: p.imageUrl, title: "Saved for later", sub: p.name });
			}
			save(KEY_WISH, [...wishlist.ids]);
			paintWishlist();
		},
	};
	function paintWishlist() {
		$$("[data-wishlist]").forEach((b) => {
			const on = wishlist.has(b.dataset.wishlist);
			b.classList.toggle("is-on", on);
			b.setAttribute("aria-pressed", on ? "true" : "false");
		});
		$$("[data-wishlist-count]").forEach((el) => {
			el.textContent = wishlist.ids.size;
			if (el.hasAttribute("data-hide-empty")) el.hidden = wishlist.ids.size === 0;
		});
	}

	/* ---------- toasts ---------- */
	let toastRoot;
	function toast(opts) {
		if (!toastRoot) {
			toastRoot = document.createElement("div");
			toastRoot.className = "geo-toasts";
			toastRoot.setAttribute("aria-live", "polite");
			document.body.appendChild(toastRoot);
		}
		const el = document.createElement("div");
		el.className = "geo-toast" + (opts.error ? " is-error" : "");
		el.innerHTML =
			(opts.img ? `<img src="${esc(opts.img)}" alt="">` : "") +
			`<div class="t"><b>${esc(opts.title)}</b>${opts.sub ? `<span>${esc(opts.sub)}</span>` : ""}</div>` +
			(opts.action ? `<button type="button">${esc(opts.action.label)}</button>` : "");
		if (opts.action) {
			$("button", el).addEventListener("click", () => {
				opts.action.onClick();
				dismiss();
			});
		}
		while (toastRoot.children.length >= 3) toastRoot.firstChild.remove();
		toastRoot.appendChild(el);
		let t = setTimeout(dismiss, opts.duration || 3200);
		function dismiss() {
			clearTimeout(t);
			el.classList.add("is-leaving");
			setTimeout(() => el.remove(), 220);
		}
	}

	/* ---------- body lock + focus ---------- */
	let lockCount = 0;
	function lock(on) {
		lockCount = Math.max(0, lockCount + (on ? 1 : -1));
		document.body.classList.toggle("geo-locked", lockCount > 0);
	}
	function focusFirst(root) {
		const f = root.querySelector(
			'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		if (f) f.focus({ preventScroll: true });
	}

	/* ---------- shell (drawer + modal) ---------- */
	function mountShell() {
		const shell = document.createElement("div");
		shell.id = "geo-shell";
		shell.innerHTML = `
<div class="geo-backdrop" id="geo-cart-backdrop" data-cart-close></div>
<aside class="geo-drawer" id="geo-cart" role="dialog" aria-modal="true" aria-labelledby="geo-cart-title" aria-hidden="true" tabindex="-1">
  <div class="geo-drawer__head">
    <h2 id="geo-cart-title">Your bag <span data-cart-count-label></span></h2>
    <button type="button" class="geo-iconbtn" data-cart-close aria-label="Close bag">${ICONS.close}</button>
  </div>
  <div class="geo-drawer__ship" id="geo-cart-ship"></div>
  <div class="geo-drawer__body" id="geo-cart-body"></div>
  <div class="geo-drawer__foot" id="geo-cart-foot"></div>
</aside>
<div class="geo-backdrop" id="geo-qv-backdrop" data-qv-close></div>
<div class="geo-modal" id="geo-qv" role="dialog" aria-modal="true" aria-labelledby="geo-qv-name" aria-hidden="true">
  <div class="geo-modal__card" id="geo-qv-card" tabindex="-1"></div>
</div>`;
		document.body.appendChild(shell);
	}

	/* ---------- cart drawer ---------- */
	let lastFocus = null;
	function openCart() {
		lastFocus = document.activeElement;
		$("#geo-cart").classList.add("is-open");
		$("#geo-cart").setAttribute("aria-hidden", "false");
		$("#geo-cart-backdrop").classList.add("is-open");
		lock(true);
		setTimeout(() => $("#geo-cart").focus({ preventScroll: true }), 50);
	}
	function closeCart() {
		const d = $("#geo-cart");
		if (!d.classList.contains("is-open")) return;
		d.classList.remove("is-open");
		d.setAttribute("aria-hidden", "true");
		$("#geo-cart-backdrop").classList.remove("is-open");
		lock(false);
		if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
	}

	function renderCart() {
		const body = $("#geo-cart-body");
		const foot = $("#geo-cart-foot");
		const ship = $("#geo-cart-ship");
		if (!body) return;
		const count = cart.count();
		const sub = cart.subtotal();
		$("[data-cart-count-label]").textContent = count ? `(${count})` : "";

		$$("[data-cart-count]").forEach((el) => {
			el.textContent = count;
			if (el.hasAttribute("data-hide-empty")) el.hidden = count === 0;
		});
		$$("[data-cart-total]").forEach((el) => (el.textContent = GEO.formatMoney(sub)));

		// free delivery progress
		const remaining = GEO.FREE_DELIVERY_PESEWAS - sub;
		if (count === 0) {
			ship.innerHTML = "";
		} else if (remaining > 0) {
			ship.innerHTML = `Add <b>${GEO.formatMoney(remaining)}</b> more for free delivery in Accra.
        <div class="geo-progress"><i style="width:${Math.min(100, (sub / GEO.FREE_DELIVERY_PESEWAS) * 100).toFixed(1)}%"></i></div>`;
		} else {
			ship.innerHTML = `<b>You’ve unlocked free delivery in Accra.</b>
        <div class="geo-progress"><i class="done" style="width:100%"></i></div>`;
		}

		if (count === 0) {
			const picks = GEO.products.filter((p) => p.isFeatured).slice(0, 3);
			body.innerHTML = `
        <div class="geo-drawer__empty">
          ${ICONS.bag}
          <h3>Your bag is empty</h3>
          <p>Add something you like — it stays here while you browse.</p>
          <div class="geo-drawer__suggest">
            <h4>Popular right now</h4>
            ${picks
							.map(
								(p) => `
              <div class="geo-suggest-row">
                <img src="${esc(p.imageUrl)}" alt="">
                <div class="t"><b>${esc(p.name)}</b><span class="tnum">${GEO.formatMoney(p.priceInPesewas)}</span></div>
                <button type="button" class="geo-btn geo-btn--ghost geo-btn--sm" data-add="${p.id}" data-silent>Add</button>
              </div>`,
							)
							.join("")}
          </div>
        </div>`;
			foot.innerHTML = `<button type="button" class="geo-btn geo-btn--ink" data-cart-close>Continue shopping</button>`;
			return;
		}

		body.innerHTML = cart.items
			.map((line) => {
				const p = GEO.byId[line.id];
				return `
        <div class="geo-line" data-line="${p.id}">
          <a class="geo-line__img" href="${GEO.urls.product(p.slug)}"><img src="${esc(p.imageUrl)}" alt=""></a>
          <div>
            <div class="geo-line__top">
              <div>
                <div class="geo-line__name">${esc(p.name)}</div>
                <div class="geo-line__brand">${esc(p.brand)}${p.stockQuantity <= 3 ? ` · <span style="color:#d97706">Only ${p.stockQuantity} left</span>` : ""}</div>
              </div>
              <div class="geo-line__price tnum">${GEO.formatMoney(p.priceInPesewas * line.qty)}</div>
            </div>
            <div class="geo-line__bottom">
              <div class="geo-qty" aria-label="Quantity for ${esc(p.name)}">
                <button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Decrease">${ICONS.minus}</button>
                <output class="tnum">${line.qty}</output>
                <button type="button" data-qty="${p.id}" data-delta="1" aria-label="Increase" ${line.qty >= p.stockQuantity ? "disabled" : ""}>${ICONS.plus}</button>
              </div>
              <button type="button" class="geo-line__remove" data-remove="${p.id}">Remove</button>
            </div>
          </div>
        </div>`;
			})
			.join("");

		const savings = cart.savings();
		foot.innerHTML = `
      <div class="geo-drawer__row"><span>Subtotal (${count} item${count > 1 ? "s" : ""})</span><span class="tnum">${GEO.formatMoney(sub)}</span></div>
      ${savings ? `<div class="geo-drawer__row"><span>You save</span><span class="tnum" style="color:var(--geo-success);font-weight:600">${GEO.formatMoney(savings)}</span></div>` : ""}
      <div class="geo-drawer__row"><span>Delivery</span><span>${sub >= GEO.FREE_DELIVERY_PESEWAS ? "Free in Accra" : "Calculated at checkout"}</span></div>
      <div class="geo-drawer__row total"><span>Total</span><span class="tnum">${GEO.formatMoney(sub)}</span></div>
      <a class="geo-btn geo-btn--accent" style="margin-top:12px" href="${GEO.urls.cart}">Checkout ${ICONS.arrow}</a>
      <div class="geo-drawer__note">MoMo, Telecel Cash, card or cash on delivery · Secured by Reevit</div>`;
	}

	/* ---------- quick view ---------- */
	let qvLastFocus = null;
	let qvQty = 1;
	function openQuickView(id) {
		const p = GEO.byId[id];
		if (!p) return;
		qvQty = 1;
		qvLastFocus = document.activeElement;
		const card = $("#geo-qv-card");
		const cat = GEO.categoryBySlug[p.categorySlug];
		const save = p.compareAtInPesewas ? p.compareAtInPesewas - p.priceInPesewas : 0;
		card.innerHTML = `
      <button type="button" class="geo-iconbtn geo-modal__close" data-qv-close aria-label="Close">${ICONS.close}</button>
      <div class="geo-modal__media">
        <img src="${esc(GEO.img(p.imageUrl.split("/").pop().split("?")[0], 1200))}" alt="${esc(p.name)}">
        ${p.isNew ? `<span class="geo-modal__tag">New</span>` : p.compareAtInPesewas ? `<span class="geo-modal__tag">Price drop</span>` : ""}
      </div>
      <div class="geo-modal__body">
        <div class="geo-modal__brand">${esc(p.brand)} · ${esc(cat.name)}</div>
        <h3 class="geo-modal__name" id="geo-qv-name">${esc(p.name)}</h3>
        <div class="geo-modal__rating">${stars(p.rating)}<span class="tnum">${p.rating} · ${p.reviewCount} verified reviews</span></div>
        <div class="geo-modal__price">
          <b class="tnum">${GEO.formatMoney(p.priceInPesewas)}</b>
          ${p.compareAtInPesewas ? `<s class="tnum">${GEO.formatMoney(p.compareAtInPesewas)}</s><span class="save">Save ${GEO.formatMoney(save)}</span>` : ""}
        </div>
        <p class="geo-modal__desc">${esc(p.description)}</p>
        <ul class="geo-specs">
          ${Object.entries(p.specifications)
						.map(([k, v]) => `<li><span>${esc(k)}</span>${esc(v)}</li>`)
						.join("")}
        </ul>
        <div class="geo-modal__stock ${p.stockQuantity <= 3 ? "low" : ""}">${p.stockQuantity <= 3 ? `Only ${p.stockQuantity} left` : `In stock · ${p.stockQuantity} available`} · Ships from Accra</div>
        <div class="geo-modal__actions">
          <div class="geo-qty" aria-label="Quantity">
            <button type="button" data-qv-delta="-1" aria-label="Decrease">${ICONS.minus}</button>
            <output class="tnum" id="geo-qv-qty">1</output>
            <button type="button" data-qv-delta="1" aria-label="Increase">${ICONS.plus}</button>
          </div>
          <button type="button" class="geo-btn geo-btn--accent" data-qv-add="${p.id}">${ICONS.bag} Add to bag</button>
        </div>
        <a class="geo-modal__link" href="${GEO.urls.product(p.slug)}">View full details ${ICONS.arrow}</a>
      </div>`;
		$("#geo-qv").classList.add("is-open");
		$("#geo-qv").setAttribute("aria-hidden", "false");
		$("#geo-qv-backdrop").classList.add("is-open");
		lock(true);
		setTimeout(() => card.focus({ preventScroll: true }), 60);
	}
	function closeQuickView() {
		const m = $("#geo-qv");
		if (!m.classList.contains("is-open")) return;
		m.classList.remove("is-open");
		m.setAttribute("aria-hidden", "true");
		$("#geo-qv-backdrop").classList.remove("is-open");
		lock(false);
		if (qvLastFocus && qvLastFocus.focus) qvLastFocus.focus({ preventScroll: true });
	}

	/* ---------- search suggestions ---------- */
	function bindSearch(input, opts) {
		opts = opts || {};
		if (!input) return;
		const wrap = input.closest(".geo-search") || input.parentElement;
		wrap.classList.add("geo-search");
		const box = document.createElement("div");
		box.className = "geo-suggest";
		box.setAttribute("role", "listbox");
		wrap.appendChild(box);
		input.setAttribute("autocomplete", "off");
		input.setAttribute("aria-autocomplete", "list");
		let active = -1;
		let items = [];

		function hl(text, q) {
			if (!q) return esc(text);
			const i = text.toLowerCase().indexOf(q.toLowerCase());
			if (i < 0) return esc(text);
			return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
		}
		function render() {
			const q = input.value.trim();
			const cats = q
				? GEO.categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
				: [];
			const prods = q ? GEO.filterProducts({ query: q }).slice(0, 5) : GEO.products.filter((p) => p.isFeatured).slice(0, 4);
			items = [
				...cats.map((c) => ({ type: "cat", c })),
				...prods.map((p) => ({ type: "prod", p })),
			];
			active = -1;
			if (!q && !opts.showDefault) {
				box.classList.remove("is-open");
				return;
			}
			let html = "";
			if (cats.length) {
				html += `<div class="geo-suggest__label">Categories</div>`;
				html += cats
					.map(
						(c, i) => `<a class="geo-suggest__item" role="option" data-i="${i}" href="${GEO.urls.category(c.slug)}">
              <span class="ico">${ICONS.tag}</span>
              <div class="t"><b>${hl(c.name, q)}</b><span>${esc(c.description)}</span></div></a>`,
					)
					.join("");
			}
			html += `<div class="geo-suggest__label">${q ? "Products" : "Popular"}</div>`;
			if (!prods.length) {
				html += `<div class="geo-suggest__empty">No matches for “${esc(q)}”. Try a brand like Apple or Samsung.</div>`;
			} else {
				html += prods
					.map(
						(p, i) => `<button type="button" class="geo-suggest__item" role="option" data-i="${cats.length + i}" data-pick="${p.id}">
              <img src="${esc(p.imageUrl)}" alt="">
              <div class="t"><b>${hl(p.name, q)}</b><span>${esc(p.brand)} · ${esc(GEO.categoryBySlug[p.categorySlug].name)}</span></div>
              <span class="p tnum">${GEO.formatMoney(p.priceInPesewas)}</span></button>`,
					)
					.join("");
			}
			if (q) {
				html += `<a class="geo-suggest__all" href="${GEO.urls.search(q)}"><span>See all results for “${esc(q)}”</span>${ICONS.arrow}</a>`;
			}
			box.innerHTML = html;
			box.classList.add("is-open");
		}
		function close() {
			box.classList.remove("is-open");
			active = -1;
		}
		function setActive(n) {
			const els = $$("[data-i]", box);
			if (!els.length) return;
			active = (n + els.length) % els.length;
			els.forEach((el, i) => el.classList.toggle("is-active", i === active));
			els[active].scrollIntoView({ block: "nearest" });
		}
		input.addEventListener("input", render);
		input.addEventListener("focus", () => {
			if (input.value.trim() || opts.showDefault) render();
		});
		input.addEventListener("keydown", (e) => {
			if (!box.classList.contains("is-open")) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActive(active + 1);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setActive(active - 1);
			} else if (e.key === "Enter" && active >= 0) {
				e.preventDefault();
				$$("[data-i]", box)[active].click();
			} else if (e.key === "Escape") {
				close();
			}
		});
		box.addEventListener("click", (e) => {
			const pick = e.target.closest("[data-pick]");
			if (pick) {
				e.preventDefault();
				close();
				if (opts.onSelect) opts.onSelect(GEO.byId[pick.dataset.pick]);
				else openQuickView(pick.dataset.pick);
			}
		});
		document.addEventListener("click", (e) => {
			if (!wrap.contains(e.target)) close();
		});
		const form = input.closest("form");
		if (form && !form.dataset.searchBound) {
			form.dataset.searchBound = "1";
			form.addEventListener("submit", (e) => {
				const q = input.value.trim();
				if (!q) {
					e.preventDefault();
					input.focus();
					return;
				}
				if (opts.onSubmit) {
					e.preventDefault();
					close();
					opts.onSubmit(q);
					return;
				}
				// default: go to the real store search
				form.action = GEO.urls.store;
				form.method = "get";
				input.name = "q";
			});
		}
		return { render, close };
	}

	/* ---------- rails ---------- */
	function bindRails() {
		$$("[data-rail-wrap]").forEach((wrap) => {
			const rail = $("[data-rail]", wrap);
			if (!rail) return;
			if (wrap.dataset.railBound) {
				rail.dispatchEvent(new Event("scroll"));
				return;
			}
			wrap.dataset.railBound = "1";
			const prev = $("[data-rail-prev]", wrap);
			const next = $("[data-rail-next]", wrap);
			function update() {
				const max = rail.scrollWidth - rail.clientWidth - 2;
				if (prev) prev.disabled = rail.scrollLeft <= 2;
				if (next) next.disabled = rail.scrollLeft >= max;
				wrap.classList.toggle("at-start", rail.scrollLeft <= 2);
				wrap.classList.toggle("at-end", rail.scrollLeft >= max);
			}
			const step = () => Math.max(240, rail.clientWidth * 0.8);
			prev && prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
			next && next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
			rail.addEventListener("scroll", update, { passive: true });
			window.addEventListener("resize", update);
			update();
			setTimeout(update, 300);
		});
	}

	/* ---------- accordions ---------- */
	function bindAccordions() {
		$$("[data-accordion]").forEach((acc) => {
			const btn = acc.querySelector(":scope > button");
			const panel = acc.querySelector(":scope > [data-panel]");
			if (!btn || !panel || acc.dataset.accBound) return;
			acc.dataset.accBound = "1";
			if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
			btn.addEventListener("click", () => {
				const open = btn.getAttribute("aria-expanded") === "true";
				const group = acc.closest("[data-accordion-group]");
				if (group && !open) {
					$$("[data-accordion] > button", group).forEach((b) => b.setAttribute("aria-expanded", "false"));
				}
				btn.setAttribute("aria-expanded", open ? "false" : "true");
			});
		});
	}

	/* ---------- tabs ---------- */
	function bindTabs() {
		$$("[data-tabs]").forEach((root) => {
			const tabs = $$("[data-tab]", root);
			const panels = $$("[data-tabpanel]", root);
			function activate(name) {
				tabs.forEach((t) => {
					const on = t.dataset.tab === name;
					t.classList.toggle("is-active", on);
					t.setAttribute("aria-selected", on ? "true" : "false");
				});
				panels.forEach((p) => (p.hidden = p.dataset.tabpanel !== name));
				root.dispatchEvent(new CustomEvent("tabchange", { detail: name }));
			}
			tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.tab)));
			const initial = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
			if (initial) activate(initial.dataset.tab);
		});
	}

	/* ---------- newsletter ---------- */
	function bindNewsletter() {
		$$("form[data-newsletter]").forEach((form) => {
			const input = form.querySelector('input[type="email"]');
			form.setAttribute("novalidate", "");
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				const v = (input.value || "").trim();
				const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
				form.classList.toggle("is-error", !ok);
				if (!ok) {
					input.focus();
					return;
				}
				save("geo-landing-newsletter", { email: v, at: Date.now() });
				form.classList.remove("is-error");
				form.classList.add("is-done");
				toast({ title: "You’re on the list", sub: `Deals and drops will go to ${v}` });
			});
		});
	}

	/* ---------- image fade ---------- */
	function bindImages() {
		$$("img[data-fade]").forEach((img) => {
			const done = () => img.classList.add("is-loaded");
			if (img.complete && img.naturalWidth) done();
			else {
				img.addEventListener("load", done, { once: true });
				img.addEventListener("error", done, { once: true });
			}
		});
	}

	/* ---------- delegated clicks ---------- */
	function bindDelegation() {
		document.addEventListener("click", (e) => {
			const t = e.target;
			const add = t.closest("[data-add]");
			if (add) {
				e.preventDefault();
				const r = cart.add(add.dataset.add, 1, { silent: add.hasAttribute("data-silent") });
				if (r.ok) flash(add);
				return;
			}
			const qv = t.closest("[data-quickview]");
			if (qv) {
				e.preventDefault();
				openQuickView(qv.dataset.quickview);
				return;
			}
			const w = t.closest("[data-wishlist]");
			if (w) {
				e.preventDefault();
				wishlist.toggle(w.dataset.wishlist);
				return;
			}
			if (t.closest("[data-cart-open]")) {
				e.preventDefault();
				openCart();
				return;
			}
			if (t.closest("[data-cart-close]")) {
				e.preventDefault();
				closeCart();
				return;
			}
			if (t.closest("[data-qv-close]")) {
				e.preventDefault();
				closeQuickView();
				return;
			}
			const qty = t.closest("[data-qty]");
			if (qty) {
				const id = qty.dataset.qty;
				cart.setQty(id, cart.qtyOf(id) + Number(qty.dataset.delta));
				return;
			}
			const rm = t.closest("[data-remove]");
			if (rm) {
				cart.remove(rm.dataset.remove);
				return;
			}
			const qd = t.closest("[data-qv-delta]");
			if (qd) {
				qvQty = Math.max(1, qvQty + Number(qd.dataset.qvDelta));
				$("#geo-qv-qty").textContent = qvQty;
				return;
			}
			const qa = t.closest("[data-qv-add]");
			if (qa) {
				const r = cart.add(qa.dataset.qvAdd, qvQty);
				if (r.ok) {
					closeQuickView();
				}
				return;
			}
			const mt = t.closest("[data-menu-toggle]");
			if (mt) {
				const target = document.getElementById(mt.dataset.menuToggle);
				if (!target) return;
				const open = target.classList.toggle("is-open");
				mt.setAttribute("aria-expanded", open ? "true" : "false");
				document.body.classList.toggle("geo-menu-open", open);
				return;
			}
			if (t.closest("[data-menu-close]")) {
				$$(".is-open[id]").forEach((el) => {
					if ($(`[data-menu-toggle="${el.id}"]`)) {
						el.classList.remove("is-open");
						$(`[data-menu-toggle="${el.id}"]`).setAttribute("aria-expanded", "false");
					}
				});
				document.body.classList.remove("geo-menu-open");
			}
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				closeQuickView();
				closeCart();
			}
		});
	}
	function flash(btn) {
		if (btn.dataset.flashing) return;
		btn.dataset.flashing = "1";
		const original = btn.innerHTML;
		btn.classList.add("is-added");
		btn.innerHTML = `${ICONS.check} Added`;
		setTimeout(() => {
			btn.classList.remove("is-added");
			btn.innerHTML = original;
			delete btn.dataset.flashing;
		}, 1400);
	}

	/* ---------- header scroll state ---------- */
	function bindScroll() {
		const onScroll = () => document.body.classList.toggle("is-scrolled", window.scrollY > 8);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
	}

	/* ---------- init ---------- */
	function init() {
		mountShell();
		bindDelegation();
		bindAccordions();
		bindTabs();
		bindNewsletter();
		bindRails();
		bindImages();
		bindScroll();
		cart.subscribe(renderCart);
		paintWishlist();
		$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
		document.dispatchEvent(new CustomEvent("geo:ready"));
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();

	Object.assign(GEO, {
		esc,
		stars,
		ICONS,
		cart,
		wishlist,
		toast,
		openCart,
		closeCart,
		openQuickView,
		closeQuickView,
		bindSearch,
		bindRails,
		bindAccordions,
		bindTabs,
		bindImages,
		paintWishlist,
	});
})();
