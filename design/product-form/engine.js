/* Shared interactive engine for the three add-product mockups.
   One state object, delegated events, region re-rendering. Each page mounts
   the regions it has (#r-photos, #r-options, #r-media, #r-combos, #r-specs,
   #r-ready …) and may set Engine.page.render(state) for its own extras. */
(function () {
  const DEPARTMENTS = ["Watches & wearables", "Phones & tablets", "Laptops", "Audio", "Home & TV", "Accessories"];
  const QUICK = {
    colour: ["Black", "White", "Silver", "Graphite", "Midnight", "Starlight", "Blue", "Navy", "Red", "Green", "Purple"],
    color: ["Black", "White", "Silver", "Graphite", "Midnight", "Starlight", "Blue"],
    size: ["XS", "S", "M", "L", "XL", "XXL"],
    storage: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
    ram: ["8 GB", "16 GB", "32 GB"],
    "case size": ["40 mm", "42 mm", "44 mm", "46 mm", "49 mm"],
    material: ["Aluminium", "Stainless steel", "Titanium", "Leather", "Silicone"],
  };
  const HEX = { black: "#1c1c1e", "jet black": "#1c1c1e", white: "#f4f4f2", silver: "#c9c9cf", graphite: "#4a4a4f", midnight: "#1f2633", starlight: "#e8e2d6", blue: "#2f5fd8", navy: "#1f2a55", red: "#c2262e", green: "#2f7d4f", purple: "#6b28d9", "rose gold": "#d9a6a0", gold: "#d4b26a" };
  const GRADIENTS = ["linear-gradient(140deg,#1c1c1e,#3a3a3f)", "linear-gradient(140deg,#c9c9cf,#8f8f97)", "linear-gradient(140deg,#d9a6a0,#b8776f)", "linear-gradient(140deg,#2b3a55,#5b6b8c)", "linear-gradient(140deg,#6b28d9,#a172ee)"];
  let uid = 1;
  const id = () => uid++;

  /* ---------- sample + empty states ---------- */
  function sample() {
    const colour = id(), size = id();
    const S = {
      name: "Apple Watch Series 11", customSlug: "", brand: "Apple", department: "Watches & wearables", condition: "New",
      summary: "Always-on display, blood-oxygen sensing and two-day battery in the thinnest Watch yet.",
      description: "Series 11 brings the brightest Apple Watch display ever, a redesigned Digital Crown and 5G cellular on every model. Track sleep, heart rate and blood oxygen around the clock, and pay with Apple Pay at every till in Accra.",
      photos: [{ id: id(), url: "img/black-front.jpg" }, { id: id(), url: "img/black-side.jpg" }, { id: id(), url: "img/black-back.jpg" }],
      mode: "options", price: 6499, was: 0, sku: "GST-APL-AWS11", stock: 12, lowStock: 5,
      options: [{ id: colour, name: "Colour", values: ["Jet Black", "Silver", "Rose Gold"] }, { id: size, name: "Case size", values: ["42 mm", "46 mm"] }],
      media: {
        "colour|jet black": { hex: "#1c1c1e", photos: [{ id: id(), url: "img/black-front.jpg" }, { id: id(), url: "img/black-side.jpg" }] },
        "colour|silver": { hex: "#c9c9cf", photos: [{ id: id(), url: "img/silver-front.jpg" }] },
        "colour|rose gold": { hex: "", photos: [{ id: id(), url: "img/rosegold-front.jpg" }] },
      },
      variants: [], specs: [{ id: id(), label: "Display", value: "Always-on Retina, up to 2000 nits" }, { id: id(), label: "Battery", value: "Up to 36 hours" }, { id: id(), label: "Warranty", value: "12 months, GeoStore Ghana" }],
      status: "draft", featured: false, selected: null, savedAt: Date.now(), touched: false, editingSlug: false, previewPick: {},
    };
    regenerate(S);
    const stock = [12, 8, 5, 6, 4, 0];
    S.variants.forEach((v, i) => { v.stock = stock[i] ?? 0; v.price = v.attrs["Case size"] === "46 mm" ? 6999 : 6499; if (i === 5) v.active = false; });
    return S;
  }
  function empty() {
    return { name: "", customSlug: "", brand: "", department: "", condition: "New", summary: "", description: "", photos: [], mode: "single", price: 0, was: 0, sku: "", stock: 0, lowStock: 5, options: [], media: {}, variants: [], specs: [], status: "draft", featured: false, selected: null, savedAt: null, touched: false, editingSlug: false, previewPick: {} };
  }

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const money = (n) => (Number(n) || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseMoney = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;
  const mkey = (axis, value) => `${axis.trim().toLowerCase()}|${value.trim().toLowerCase()}`;
  const isColourAxis = (name) => /colou?r|finish/i.test(name);
  const isHex = (h) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(h || "");
  function code(value) {
    const v = value.trim();
    if (/\d/.test(v)) return v.toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const words = v.split(/\s+/);
    if (words.length > 1) return words.map((w) => w[0]).join("").toUpperCase();
    return v.slice(0, 3).toUpperCase();
  }
  function ago(ts) {
    if (!ts) return "not saved yet";
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return "saved just now";
    if (s < 60) return `saved ${s} s ago`;
    return `saved ${Math.round(s / 60)} min ago`;
  }

  /* ---------- derived ---------- */
  function usableOptions(S) {
    const seen = new Set();
    return S.options.filter((o) => {
      const k = o.name.trim().toLowerCase();
      if (!k || !o.values.length || seen.has(k)) return false;
      seen.add(k); return true;
    });
  }
  function combos(S) {
    const axes = usableOptions(S);
    if (!axes.length) return [];
    let out = [{}];
    for (const a of axes) { const next = []; for (const c of out) for (const v of a.values) next.push({ ...c, [a.name.trim()]: v }); out = next; }
    return out;
  }
  const ckey = (attrs) => Object.entries(attrs).map(([k, v]) => mkey(k, v)).join("||");
  function regenerate(S) {
    const current = S.variants;
    const claimed = new Set();
    const rows = combos(S).map((attrs) => {
      const key = ckey(attrs);
      const exact = current.findIndex((v, i) => !claimed.has(i) && ckey(v.attrs) === key);
      if (exact >= 0) { claimed.add(exact); return { ...current[exact], attrs, key }; }
      // nearest donor: most shared attrs, no conflicts
      let donor = null, best = 0;
      const norm = Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]));
      for (const v of current) {
        const dn = Object.fromEntries(Object.entries(v.attrs).map(([k, x]) => [k.toLowerCase(), x.toLowerCase()]));
        const shared = Object.keys(dn).filter((k) => k in norm);
        if (!shared.length || shared.some((k) => dn[k] !== norm[k])) continue;
        if (shared.length > best) { best = shared.length; donor = v; }
      }
      return { key, attrs, sku: [S.sku.trim(), ...Object.values(attrs).map(code)].filter(Boolean).join("-"), price: donor ? donor.price : S.price, stock: donor ? donor.stock : 0, active: donor ? donor.active : true };
    });
    S.variants = rows;
  }
  function slug(S) { return S.customSlug || slugify(S.name); }
  function colourAxis(S) { return usableOptions(S).find((o) => isColourAxis(o.name)); }
  function mediaFor(S, axis, value) { return S.media[mkey(axis, value)] || { hex: "", photos: [] }; }

  function rules(S) {
    const active = S.variants.filter((v) => v.active);
    const hasOptions = S.mode === "options";
    const list = [
      { id: "basics", label: "Name, brand and department", anchor: "#basics", ok: S.name.trim().length >= 2 && S.brand.trim().length >= 2 && !!S.department },
      { id: "copy", label: "Summary and description", anchor: "#basics", ok: S.summary.trim().length >= 10 && S.summary.length <= 180 && S.description.trim().length >= 30 },
      { id: "photo", label: "At least one photo", anchor: "#photos", ok: S.photos.length > 0, n: S.photos.length || "" },
      { id: "price", label: hasOptions ? "Starting price and product code" : "Price and product code", anchor: "#selling", ok: S.price > 0 && S.sku.trim().length >= 3 },
    ];
    if (hasOptions) {
      list.push({ id: "options", label: "At least one option with choices", anchor: "#selling", ok: usableOptions(S).length > 0 });
      list.push({ id: "combos", label: "Every combination on sale has a price and stock", anchor: "#selling", ok: active.length > 0 && active.every((v) => v.price > 0 && v.stock > 0 && v.sku.trim().length >= 3), n: S.variants.length ? `${active.filter((v) => v.price > 0 && v.stock > 0).length}/${S.variants.length}` : "" });
      const ca = colourAxis(S);
      if (ca) list.push({ id: "swatch", label: `Every ${ca.name.toLowerCase()} has a swatch`, anchor: "#selling", ok: ca.values.every((v) => isHex(mediaFor(S, ca.name, v).hex)) });
    } else {
      list.push({ id: "stock", label: "Stock count entered", anchor: "#selling", ok: S.stock > 0, n: S.stock || "" });
    }
    return list;
  }
  const ready = (S) => rules(S).every((r) => r.ok);

  /* ---------- templates ---------- */
  const svgImg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m21 15-5-5L5 21M9 9h.01"/></svg>';
  const svgTrash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>';
  const svgTick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7"/></svg>';
  const svgPlus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';

  function tile(p, opts) {
    const inner = p.url ? `<img src="${esc(p.url)}" alt="" style="width:100%;height:100%;object-fit:cover" />` : esc(p.label || "");
    const style = p.url ? "" : `style="background:${p.bg}"`;
    return `<div class="tile" ${style} data-photo="${p.id}">
      ${inner}
      ${opts.cover ? '<span class="cover">Cover</span>' : ""}
      <div class="tile-actions">
        ${opts.coverable && !opts.cover ? `<button type="button" title="Make cover" data-action="${opts.scope}:cover:${p.id}">★</button>` : ""}
        <button type="button" title="Remove" data-action="${opts.scope}:remove:${p.id}">×</button>
      </div>
    </div>`;
  }
  function photosTpl(S) {
    return S.photos.map((p, i) => tile(p, { cover: i === 0, coverable: true, scope: "photo" })).join("") +
      `<button type="button" class="tile drop" data-action="photo:add">${svgImg}${S.photos.length ? "Add more" : "Add photos"}</button>`;
  }
  /* "Photos for each colour": one row per colour value — swatch, its own
     gallery, Add photos. Always visible once a colour option has choices, so
     nobody has to discover a hidden click. */
  function colourMediaTpl(S) {
    if (S.mode !== "options") return "";
    const axis = colourAxis(S);
    if (!axis) return "";
    const rows = axis.values.map((v) => {
      const m = mediaFor(S, axis.name, v);
      const hex = isHex(m.hex) ? m.hex : "";
      const on = S.selected && S.selected.optionId === axis.id && S.selected.value === v;
      return `<div class="cmedia-row ${on ? "on" : ""}" data-cvalue="${esc(v)}">
        <div class="cmedia-swatch">
          <label class="swatchwrap" title="Pick the swatch colour"><input type="color" value="${hex || "#000000"}" data-media-hex="${esc(v)}" aria-label="Swatch colour for ${esc(v)}" /><span class="sw big" style="background:${hex || "transparent"};${hex ? "" : "border-style:dashed"}"></span></label>
          <input class="input sm num" style="width:96px" placeholder="#1c1c1e" value="${esc(m.hex)}" data-media-hextext="${esc(v)}" aria-label="Swatch hex for ${esc(v)}" />
        </div>
        <div class="cmedia-name"><b>${esc(v)}</b><span class="hint">${m.photos.length ? `${m.photos.length} photo${m.photos.length === 1 ? "" : "s"} of its own` : "No photos of its own yet — shoppers see the main photos"}${m.hex && !hex ? ' · <span style="color:var(--danger)">not a valid hex</span>' : (!m.hex ? ' · <span style="color:var(--danger)">needs a swatch</span>' : "")}</span></div>
        <div class="photos cmedia-photos">
          ${m.photos.map((p) => tile(p, { scope: "cmedia:" + esc(v) })).join("")}
          <button type="button" class="tile drop" data-action="cmedia:add:${esc(v)}">${svgPlus}Add photos</button>
        </div>
      </div>`;
    }).join("");
    return `<div class="cmedia">
      <div class="cmedia-head">
        <div><h3>Photos for each ${esc(axis.name.toLowerCase())}</h3>
        <p class="hint">Optional. When a shopper picks a ${esc(axis.name.toLowerCase())}, these replace the main photos. Give each one a swatch so shoppers can tell them apart.</p></div>
      </div>
      ${rows}
    </div>`;
  }
  function optionsTpl(S) {
    const used = S.options.map((o) => o.name.trim().toLowerCase());
    const rows = S.options.map((o, i) => {
      const key = o.name.trim().toLowerCase();
      const dup = key && used.filter((k) => k === key).length > 1;
      const quick = (QUICK[key] || []).filter((q) => !o.values.some((v) => v.toLowerCase() === q.toLowerCase())).slice(0, 6);
      const sel = S.selected && S.selected.optionId === o.id ? S.selected.value : null;
      const chips = o.values.map((v) => {
        const m = mediaFor(S, o.name, v);
        const hex = isHex(m.hex) ? m.hex : "";
        return `<span class="chip ${sel === v ? "on" : ""}">
          ${isColourAxis(o.name) ? `<button type="button" class="chipmain" data-action="value:select:${o.id}:${esc(v)}" title="Go to this colour's photos">` : `<span class="chipmain">`}
            ${isColourAxis(o.name) ? `<span class="sw" style="background:${hex || "transparent"};${hex ? "" : "border-style:dashed"}"></span>` : ""}${esc(v)}
            ${m.photos.length ? `<span class="ph">${svgImg}${m.photos.length}</span>` : ""}
          ${isColourAxis(o.name) ? "</button>" : "</span>"}
          <button type="button" class="x" data-action="value:remove:${o.id}:${esc(v)}" aria-label="Remove ${esc(v)}">×</button>
        </span>`;
      }).join("");
      return `<div class="optionrow" data-option="${o.id}">
        <div class="field">
          <span class="lbl">Option ${i + 1}</span>
          <div class="ctl"><input class="input ${dup ? "err" : ""}" list="axes" placeholder="Colour, Size, Storage…" value="${esc(o.name)}" data-optname="${o.id}" aria-label="Option name" /></div>
          ${dup ? '<p class="err">Another option already has this name.</p>' : ""}
        </div>
        <div class="values">
          <span class="lbl" style="font-size:13px;font-weight:500">Choices <span class="opt">${o.values.length ? (isColourAxis(o.name) ? o.values.length + " · swatches and photos are set below" : o.values.length) : "type one, press Enter"}</span></span>
          <div class="chips chipbox">
            ${chips}
            <input class="valueinput" data-valueinput="${o.id}" placeholder="${o.values.length ? "Add another…" : "e.g. " + (QUICK[key] ? QUICK[key].slice(0, 2).join(", ") : "Jet Black")}" aria-label="Add a choice" />
          </div>
          ${quick.length ? `<div class="quick">Quick add: ${quick.map((q) => `<button type="button" data-action="value:add:${o.id}:${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
        </div>
        <button type="button" class="rm" data-action="option:remove:${o.id}" aria-label="Remove option">${svgTrash}</button>
      </div>`;
    }).join("");
    return `<div class="optionrows">${rows}</div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <button type="button" class="btn sm" data-action="option:add">${svgPlus} ${S.options.length ? "Add another option" : "Add an option"}</button>
        <span class="hint">${S.options.length ? "Storage, material, strap…" : "Colour, size, storage — the things a shopper picks between."}</span>
      </div>
      <datalist id="axes">${["Colour", "Size", "Storage", "Material", "Capacity", "Finish", "RAM", "Case size", "Strap"].map((a) => `<option value="${a}">`).join("")}</datalist>`;
  }
  function combosTpl(S) {
    if (!S.variants.length) {
      return `<p class="hint" style="border:1px dashed var(--line);padding:16px;border-radius:2px">${S.options.length ? "Give each option at least one choice and every sellable combination appears here." : "Add an option above — every combination of its choices appears here with its own SKU, price and stock."}</p>`;
    }
    const active = S.variants.filter((v) => v.active);
    const bad = active.filter((v) => v.stock <= 0 || v.price <= 0);
    const rows = S.variants.map((v) => `<tr class="${v.active ? "" : "off"}" data-vkey="${esc(v.key)}">
      <td><span class="combo">${Object.entries(v.attrs).map(([axis, val], i) => {
        const m = mediaFor(S, axis, val); const hex = isHex(m.hex) ? m.hex : "";
        return `${i ? '<span class="dot">·</span>' : ""}${isColourAxis(axis) && hex ? `<span class="sw" style="background:${hex}"></span>` : ""}${esc(val)}`;
      }).join("")}</span></td>
      <td><input class="input sm num ${v.sku.trim().length < 3 && S.touched ? "err" : ""}" value="${esc(v.sku)}" data-vfield="sku" aria-label="SKU" /></td>
      <td><input class="input sm num ${v.active && v.price <= 0 ? "err" : ""}" value="${money(v.price)}" data-vfield="price" inputmode="decimal" aria-label="Price" /></td>
      <td><input class="input sm num ${v.active && v.stock <= 0 ? "err" : ""}" value="${v.stock}" data-vfield="stock" inputmode="numeric" aria-label="Stock" /></td>
      <td><button type="button" class="switch ${v.active ? "on" : ""}" role="switch" aria-checked="${v.active}" data-action="variant:toggle:${esc(v.key)}" aria-label="On sale"></button></td>
    </tr>`).join("");
    return `<div class="bulk">
        <span class="l"><b style="color:var(--ink)">${S.variants.length} combination${S.variants.length === 1 ? "" : "s"}</b> · ${active.length} on sale${S.variants.length - active.length ? ` · ${S.variants.length - active.length} switched off` : ""}. Edit any cell.</span>
        <span class="r"><button type="button" class="btn sm" data-action="variant:allprice">Set all prices</button><button type="button" class="btn sm" data-action="variant:allstock">Set all stock</button></span>
      </div>
      <table class="tbl"><thead><tr><th>Combination</th><th style="width:170px">SKU</th><th style="width:120px">Price (GH₵)</th><th style="width:84px">Stock</th><th style="width:76px">On sale</th></tr></thead><tbody>${rows}</tbody></table>
      ${bad.length ? `<p class="hint" style="color:var(--danger);margin-top:8px">${bad.map((v) => Object.values(v.attrs).join(" · ")).join(", ")} ${bad.length === 1 ? "is" : "are"} on sale with no ${bad.some((v) => v.price <= 0) ? "price" : "stock"}. Fill it in or switch it off.</p>` : '<p class="hint" style="margin-top:8px">Switched-off combinations are kept but never shown on the shop.</p>'}`;
  }
  function specsTpl(S) {
    const rows = S.specs.map((s) => `<tr data-spec="${s.id}"><td style="width:200px"><input class="input sm" placeholder="Label" value="${esc(s.label)}" data-sfield="label" aria-label="Label" /></td><td><input class="input sm" placeholder="Value" value="${esc(s.value)}" data-sfield="value" aria-label="Value" /></td><td style="width:32px"><button type="button" class="x-btn" data-action="spec:remove:${s.id}" aria-label="Remove row">×</button></td></tr>`).join("");
    return `${S.specs.length ? `<table class="tbl"><thead><tr><th>Label</th><th>Value</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="hint">Nothing yet. Add what a buyer would compare — display, battery, warranty.</p>'}
      <div style="margin-top:12px"><button type="button" class="btn sm" data-action="spec:add">${svgPlus} Add a row</button></div>`;
  }
  function readyTpl(S) {
    return `<ul class="readylist">${rules(S).map((r) => `<li class="${r.ok ? "done" : "todo"}"><a href="${r.anchor}" data-action="jump:${r.anchor}"><span class="tick">${r.ok ? svgTick : ""}</span>${esc(r.label)}</a>${r.n !== undefined && r.n !== "" ? `<span class="n">${esc(r.n)}</span>` : (r.ok ? "" : '<span class="n fix">fix</span>')}</li>`).join("")}</ul>`;
  }

  /* ---------- engine ---------- */
  const E = {
    S: sample(), page: { render() {} },
    rules, ready, slug, combos, usableOptions, colourAxis, mediaFor, money, isHex, esc, ago, GRADIENTS,
    reset(toSample) { E.S = toSample ? sample() : empty(); regenerate(E.S); E.render(); },
    toast(msg, kind) {
      let t = document.getElementById("toast");
      if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
      t.textContent = msg; t.className = "show " + (kind || "");
      clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 2600);
    },
    /* soft = keep the region holding the focused element untouched */
    render(soft) {
      const S = E.S;
      const ae = document.activeElement;
      const activeRegion = soft && ae ? ae.closest("[data-region]") : null;
      // remember how to find the focused control again after its region is rebuilt
      const d = ae ? ae.dataset || {} : {};
      const sel = !ae ? null
        : d.valueinput ? `[data-valueinput="${d.valueinput}"]`
        : d.optname ? `[data-optname="${d.optname}"]`
        : d.vfield ? `tr[data-vkey="${ae.closest("tr")?.dataset.vkey}"] [data-vfield="${d.vfield}"]`
        : d.sfield ? `tr[data-spec="${ae.closest("tr")?.dataset.spec}"] [data-sfield="${d.sfield}"]`
        : d.mediaHextext ? `[data-media-hextext="${d.mediaHextext}"]`
        : null;
      const pos = ae && typeof ae.selectionStart === "number" ? ae.selectionStart : null;
      const put = (idName, html) => {
        const el = document.getElementById(idName);
        if (!el) return;
        if (activeRegion && (el === activeRegion || el.contains(activeRegion))) return;
        el.innerHTML = html;
      };
      put("r-photos", photosTpl(S));
      put("r-options", optionsTpl(S));
      put("r-cmedia", colourMediaTpl(S));
      put("r-combos", combosTpl(S));
      put("r-specs", specsTpl(S));
      put("r-ready", readyTpl(S));

      // bound fields
      document.querySelectorAll("[data-bind]").forEach((el) => {
        if (el === document.activeElement) return;
        const k = el.dataset.bind; const t = el.dataset.type;
        if (el.type === "checkbox") el.checked = !!S[k];
        else if (t === "money") el.value = S[k] ? money(S[k]) : "";
        else el.value = S[k] ?? "";
      });
      // mode
      document.querySelectorAll("[data-mode]").forEach((el) => el.classList.toggle("on", el.dataset.mode === S.mode));
      const ms = document.getElementById("modeSingle"), mo = document.getElementById("modeOptions");
      if (ms) ms.style.display = S.mode === "single" ? "" : "none";
      if (mo) mo.style.display = S.mode === "options" ? "" : "none";
      // slug, counts, errors
      const so = document.getElementById("slugOut"); if (so) so.textContent = slug(S) || "…";
      const se = document.getElementById("slugEdit"); if (se) { se.style.display = S.editingSlug ? "" : "none"; if (document.activeElement !== se.querySelector("input")) se.querySelector("input").value = S.customSlug || slugify(S.name); }
      const sc = document.getElementById("sumCount"); if (sc) { sc.textContent = `${S.summary.length} / 180`; sc.style.color = S.summary.length > 180 ? "var(--danger)" : ""; }
      document.querySelectorAll("[data-err]").forEach((el) => {
        const r = rules(S).find((x) => x.id === el.dataset.err);
        el.style.display = S.touched && r && !r.ok ? "" : "none";
      });
      // publish gating + state line
      const ok = ready(S); const left = rules(S).filter((r) => !r.ok).length;
      document.querySelectorAll('[data-action="publish"]').forEach((b) => { b.disabled = !ok; b.title = ok ? "" : `${left} thing${left === 1 ? "" : "s"} left`; });
      document.querySelectorAll("[data-state]").forEach((el) => {
        el.innerHTML = S.status === "active" ? '<i style="background:var(--ok)"></i> Live on the shop' : `<i></i> Draft · ${ago(S.savedAt)}`;
      });
      E.page.render(S);
      const want = E._pendingFocus; E._pendingFocus = null;
      E._restoring = true;
      try {
        if (want) { const n = document.querySelector(want); if (n) n.focus(); }
        else if (sel && !document.body.contains(ae)) {
          const n = document.querySelector(sel.replace(/"undefined"/g, '""'));
          if (n) { n.focus(); if (pos !== null) { try { n.setSelectionRange(pos, pos); } catch (_) {} } }
        }
      } finally { E._restoring = false; }
    },
  };

  /* ---------- actions ---------- */
  function selectValue(optionId, value) {
    const S = E.S; const o = S.options.find((x) => x.id === optionId);
    if (!o) return;
    if (!isColourAxis(o.name)) return "rendered";
    S.selected = { optionId, value };
    E.render();
    const row = document.querySelector(".cmedia-row.on");
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
    return "rendered";
  }
  function mediaRow(value) {
    const S = E.S; const axis = colourAxis(S); if (!axis) return null;
    const k = mkey(axis.name, value); S.media[k] = S.media[k] || { hex: "", photos: [] }; return S.media[k];
  }
  function addValue(optionId, raw) {
    const S = E.S; const o = S.options.find((x) => x.id === optionId); const v = raw.trim();
    if (!o || !v) return false;
    if (o.values.some((x) => x.toLowerCase() === v.toLowerCase())) { E.toast(`${v} is already a choice.`); return false; }
    o.values.push(v);
    if (isColourAxis(o.name)) { const k = mkey(o.name, v); if (!S.media[k]) S.media[k] = { hex: HEX[v.toLowerCase()] || "", photos: [] }; }
    regenerate(S); return true;
  }
  function pickFiles(cb) {
    const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = "image/*";
    inp.onchange = () => { const files = Array.from(inp.files || []); if (files.length) cb(files.map((f) => ({ id: id(), url: URL.createObjectURL(f), label: "" }))); };
    inp.click();
  }
  function samplePhoto(label) { return { id: id(), bg: GRADIENTS[(uid) % GRADIENTS.length], label }; }

  const actions = {
    "mode": (m) => { E.S.mode = m; if (m === "options" && !E.S.options.length) E.S.options.push({ id: id(), name: "", values: [] }); regenerate(E.S); },
    "option:add": () => { E.S.options.push({ id: id(), name: "", values: [] }); E.render(); const last = document.querySelector(`[data-optname="${E.S.options[E.S.options.length - 1].id}"]`); last && last.focus(); return "rendered"; },
    "option:remove": (oid) => { const S = E.S; const o = S.options.find((x) => x.id === +oid); if (o && o.values.length && !confirm(`Remove "${o.name || "this option"}" and its ${o.values.length} choice${o.values.length === 1 ? "" : "s"}? Combinations that used it are merged.`)) return; S.options = S.options.filter((x) => x.id !== +oid); if (S.selected && S.selected.optionId === +oid) S.selected = null; regenerate(S); },
    "value:add": (oid, v) => { addValue(+oid, v); },
    "value:remove": (oid, v) => { const o = E.S.options.find((x) => x.id === +oid); if (!o) return; o.values = o.values.filter((x) => x !== v); if (E.S.selected && E.S.selected.value === v) E.S.selected = null; regenerate(E.S); },
    "value:select": (oid, v) => selectValue(+oid, v),
    "cmedia:add": (v) => { const m = mediaRow(v); if (!m) return; pickFiles((ps) => { m.photos.push(...ps); E.render(); E.toast(`${ps.length} photo${ps.length === 1 ? "" : "s"} added to ${v}`); }); return "rendered"; },
    "cmedia:remove": (v, pid) => { const m = mediaRow(v); if (m) m.photos = m.photos.filter((p) => p.id !== +pid); },
    "photo:add": () => { pickFiles((ps) => { E.S.photos.push(...ps); E.render(); E.toast(`${ps.length} photo${ps.length === 1 ? "" : "s"} added`); }); return "rendered"; },
    "photo:sample": () => { E.S.photos.push(samplePhoto(code(E.S.name || "Photo"))); },
    "photo:remove": (pid) => { E.S.photos = E.S.photos.filter((p) => p.id !== +pid); },
    "photo:cover": (pid) => { const i = E.S.photos.findIndex((p) => p.id === +pid); if (i > 0) { const [p] = E.S.photos.splice(i, 1); E.S.photos.unshift(p); E.toast(`${E.S.name || "Product"}: cover changed`); } },
    "variant:toggle": (key) => { const v = E.S.variants.find((x) => x.key === key); if (v) v.active = !v.active; },
    "variant:allprice": () => { const s = prompt("Price for every combination (GH₵)", money(E.S.price)); if (s === null) return; const p = parseMoney(s); E.S.variants.forEach((v) => (v.price = p)); E.toast("Price applied to all combinations"); },
    "variant:allstock": () => { const s = prompt("Stock for every combination", "10"); if (s === null) return; const n = Math.max(0, parseInt(s, 10) || 0); E.S.variants.forEach((v) => (v.stock = n)); E.toast("Stock applied to all combinations"); },
    "spec:add": () => { E.S.specs.push({ id: id(), label: "", value: "" }); E.render(); const rows = document.querySelectorAll("[data-spec] input"); rows.length && rows[rows.length - 2].focus(); return "rendered"; },
    "spec:remove": (sid) => { E.S.specs = E.S.specs.filter((s) => s.id !== +sid); },
    "slug:edit": () => { E.S.editingSlug = true; E.render(); const i = document.querySelector("#slugEdit input"); i && i.focus(); return "rendered"; },
    "slug:done": () => { E.S.editingSlug = false; },
    "slug:reset": () => { E.S.customSlug = ""; E.S.editingSlug = false; },
    "save": () => { E.S.savedAt = Date.now(); E.toast("Draft saved"); },
    "publish": () => { E.S.touched = true; if (!ready(E.S)) { E.toast(`${rules(E.S).filter((r) => !r.ok).length} things to fix before publishing`, "warn"); return; } E.S.status = "active"; E.S.savedAt = Date.now(); E.toast(`Published — ${E.S.name} is live on the shop`, "ok"); },
    "unpublish": () => { E.S.status = "draft"; E.toast("Taken off the shop — saved as draft"); },
    "discard": () => { if (confirm("Discard this product? Everything typed here is lost.")) { E.reset(false); E.toast("Discarded — starting a blank product"); return "rendered"; } return "rendered"; },
    "sample": () => { E.reset(true); E.toast("Sample product loaded"); return "rendered"; },
    "jump": (anchor) => { const el = document.querySelector(anchor); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); return "rendered"; },
    "preview:pick": (axis, value) => { E.S.previewPick[axis] = value; },
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action]"); if (!t) return;
    let [name, ...args] = t.dataset.action.split(":");
    if (name === "cmedia" && args[1] === "remove") { args = ["remove", args[0], args[2]]; }
    const key = name === "mode" ? "mode" : [name, args.shift()].filter(Boolean).join(":");
    const fn = actions[key] || actions[name];
    if (!fn) return;
    if (t.tagName === "A") e.preventDefault();
    const r = name === "mode" ? fn(args[0] || t.dataset.action.split(":")[1]) : fn(...args);
    if (r !== "rendered") E.render();
  });

  document.addEventListener("input", (e) => {
    const el = e.target; const S = E.S;
    if (el.dataset.bind) {
      const k = el.dataset.bind; const t = el.dataset.type;
      if (el.type === "checkbox") S[k] = el.checked;
      else if (t === "money") S[k] = parseMoney(el.value);
      else if (t === "int") S[k] = Math.max(0, parseInt(el.value, 10) || 0);
      else S[k] = el.value;
      if (k === "sku" || k === "price") regenerate(S);
      E.render(true); return;
    }
    if (el.dataset.optname) {
      const o = S.options.find((x) => x.id === +el.dataset.optname); if (!o) return;
      const from = o.name.trim().toLowerCase(), to = el.value.trim().toLowerCase();
      if (from && to && from !== to) { // carry media across a rename
        for (const k of Object.keys(S.media)) if (k.startsWith(from + "|")) { S.media[to + "|" + k.split("|")[1]] = S.media[k]; delete S.media[k]; }
        S.variants.forEach((v) => { v.attrs = Object.fromEntries(Object.entries(v.attrs).map(([a, val]) => [a.trim().toLowerCase() === from ? el.value.trim() : a, val])); });
      }
      o.name = el.value; regenerate(S); E.render(true); return;
    }
    if (el.dataset.vfield) {
      const v = S.variants.find((x) => x.key === el.closest("tr").dataset.vkey); if (!v) return;
      const f = el.dataset.vfield;
      v[f] = f === "price" ? parseMoney(el.value) : f === "stock" ? Math.max(0, parseInt(el.value, 10) || 0) : el.value;
      E.render(true); return;
    }
    if (el.dataset.sfield) {
      const s = S.specs.find((x) => x.id === +el.closest("tr").dataset.spec); if (s) s[el.dataset.sfield] = el.value; E.render(true); return;
    }
    if (el.dataset.mediaHex !== undefined || el.dataset.mediaHextext !== undefined) {
      const v = el.dataset.mediaHex ?? el.dataset.mediaHextext; const m = mediaRow(v); if (!m) return;
      m.hex = el.value; E.render(); return;
    }
    if (el.closest("#slugEdit")) { S.customSlug = slugify(el.value); E.render(true); }
  });
  // A control inside a rebuilt region must not be re-rendered while focus is
  // moving through it — so `change` only refreshes the rest, and the full
  // refresh happens when focus settles somewhere else.
  document.addEventListener("change", (e) => { const el = e.target; if (!(el.dataset.bind || el.dataset.vfield || el.dataset.sfield || el.dataset.optname)) return; el.closest("[data-region]") ? E.render(true) : E.render(); });
  document.addEventListener("focusin", (e) => { if (E._restoring) return; if (!e.target.closest || !e.target.closest("[data-region]")) return; E.render(); });
  document.addEventListener("focusout", () => { setTimeout(() => { if (E._restoring) return; if (!document.activeElement || document.activeElement === document.body) E.render(); }, 0); });

  document.addEventListener("keydown", (e) => {
    const el = e.target;
    if (el.dataset.valueinput) {
      const oid = +el.dataset.valueinput;
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (addValue(oid, el.value)) { E.render(); const n = document.querySelector(`[data-valueinput="${oid}"]`); n && n.focus(); } else el.value = ""; }
      else if (e.key === "Backspace" && !el.value) { const o = E.S.options.find((x) => x.id === oid); if (o && o.values.length) { actions["value:remove"](oid, o.values[o.values.length - 1]); E.render(); const n = document.querySelector(`[data-valueinput="${oid}"]`); n && n.focus(); } }
      else if (e.key === "Escape") { el.value = ""; }
    }
    if (el.dataset.optname && e.key === "Enter") { e.preventDefault(); E._pendingFocus = `[data-valueinput="${el.dataset.optname}"]`; E.render(); }
    if (el.closest("#slugEdit") && e.key === "Enter") { e.preventDefault(); E.S.editingSlug = false; E.render(); }
  });
  document.addEventListener("focusout", (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.valueinput && el.value.trim()) { addValue(+el.dataset.valueinput, el.value); E.render(); }
  });

  // "saved x ago" ticks
  setInterval(() => { document.querySelectorAll("[data-state]").forEach(() => {}); if (E.S.status !== "active") E.render(true); }, 15000);

  window.Engine = E;
  document.addEventListener("DOMContentLoaded", () => { regenerate(E.S); E.render(); });
})();
