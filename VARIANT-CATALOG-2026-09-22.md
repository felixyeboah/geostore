# Variant catalog verification — 22 September 2026

The previous seed was incomplete: it offered mostly storage choices and product-family photos. The replacement has 24 products, 165 explicit configurations and 68 additional manufacturer photos scoped to their option values. All 156 existing seed-stock units are redistributed without increasing the aggregate. Prices and stock remain fixtures, not supplier-confirmed inventory.

## Scope and evidence

Configurations include color, storage, memory, connectivity, screen/case size, case material, band, charging case, layout, voltage, plug and capacity where applicable. Shared hardware properties remain in product specifications. Manufacturer pages, exact image URLs, checksums, constraints and offered combinations are recorded in `packages/commerce/catalogue-sources.json`.

This is a curated SKU assortment, not every possible manufacturer build-to-order configuration. iPads are explicitly 11-inch Wi-Fi; MacBook Air is 13-inch. Watch colors use the exact pictured case size/material/band. Unverified ceramic Watch sizes and unsupported combinations are omitted. The Hisense model is identified as discontinued. AirPods Pro included ear-tip sizes are accessories, not separate SKUs. Apple TV storage/connectivity pairs remain constrained.

Color-specific photos are never general fallback photos. Selecting an option updates the product gallery, bag and confirmation toast; the server snapshots the matching photo into the order. A missing required variant is rejected before stock or order mutation. Cards open on the lowest-priced in-stock variant. Admin saves accept matching active-option photos without requiring an unrelated generic photo.

## Checks completed

- 24 real browser product journeys: all option-media selections, gallery ownership, decoded images, prices, stock and representative bag/toast/variant-SKU checks passed.
- Real admin edit/save preserved the seeded phone's 16 SKUs and four tagged color photos.
- 45 real database regressions passed, including order-photo snapshots and rejection of omitted variants without stock writes.
- 90 commerce/auth/payment unit checks, 19 marketing unit checks and 30 SaaS unit checks passed.
- All 68 new public R2 downloads matched their reviewed source bytes.
- Actual reset CLI integration passed: commerce history blocks mutation; empty-history replacement preserves unrelated tables, writes a private backup and passes foreign-key checks.
- Both applications built successfully; affected typechecks and Biome passed (one existing unrelated suppression warning).

Production replacement uses `--require-empty-commerce-history` under the transaction write lock. The pre-update production dump is privately backed up at `~/.local/share/geostore-backups/geostore-prod-before-variant-catalog-20260922.sql`. It contains zero orders and inventory events. Release completion is tracked in PR #14; the separate admin hosting target is still unspecified.

## Offered configurations

| Product | SKUs | Colors | Attributes |
| --- | ---: | --- | --- |
| iPhone 18 Pro | 16 | Black, Silver, Glacier, Burgundy | colour, connectivity, display, storage |
| iPhone 17 | 10 | Lavender, Sage, Mist Blue, White, Black | colour, connectivity, display, storage |
| Samsung Galaxy S26 Ultra | 18 | Sky Blue, Pink Gold, Black, Silver Shadow, Cobalt Violet, White | colour, carrier, connectivity, memory, region, storage |
| iPad Air 11-inch Wi-Fi (M4) | 16 | Blue, Purple, Starlight, Space Gray | colour, connectivity, display, memory, storage |
| iPad Pro 11-inch Wi-Fi (M5) | 12 | Silver, Space Black | colour, connectivity, cpu, display, glass, memory, storage |
| Samsung Galaxy Tab S11 5G | 12 | Grey, Silver | colour, connectivity, memory, region, size, storage |
| MacBook Air 13-inch (M5) | 15 | Sky Blue, Silver, Starlight, Midnight | colour, cpu, display, gpu, memory, storage |
| Mac mini (M6) | 24 | Silver | colour, chip, cpu, ethernet, gpu, memory, storage |
| Logitech MX Keys S | 3 | Graphite, Pale Gray, Black | colour, connectivity, layout, region, size |
| AirPods 5 | 2 | White | colour, charging case |
| AirPods Pro 3 | 1 | White | colour, charging case |
| JBL Charge 6 | 10 | Black and Orange, Pink, White, Blue, Sand, Turquoise, Black, Red, Purple, Squad | colour, connectivity, region |
| Samsung Galaxy Buds4 | 2 | White, Black | colour, connectivity, region |
| HomePod mini | 5 | White, Yellow, Orange, Blue, Midnight | colour |
| Apple Watch Series 12 | 6 | Dark Bronze, Space Gray, Black, Light Gold, Natural, Radiant Gold | colour, band, band size, case material, case size, connectivity |
| Apple Watch Ultra 4 | 2 | Black, Natural | colour, band, case material, case size, connectivity |
| Apple Watch SE 3 | 2 | Midnight, Starlight | colour, band, case material, case size, connectivity |
| LG OLED evo C6 55-inch TV | 1 | Fixed model | region, resolution, size |
| Apple TV 4K | 2 | Black | colour, connectivity, storage |
| Samsung MS23K3513AK 23L Microwave | 1 | Black | colour, capacity, region |
| Hisense H670SIT-WD 508L Refrigerator | 1 | Titanium Inox | colour, capacity, region, voltage |
| Anker 715 Charger (Nano II 65W) | 1 | Black | colour, input voltage, plug, power, region |
| Anker Laptop Power Bank (25K, 165W) | 2 | Space Black, Silver | colour, capacity, maximum total output, package, region |
| UGREEN Revodok 6-in-1 USB-C Hub | 1 | Fixed model | hdmi, ports, power delivery, region |
