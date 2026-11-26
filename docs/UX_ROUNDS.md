# UX rounds: critique → improve → prove

Screens are judged from CI captures (`ui-snapshots.yml`, 42 routes × 360x800 / 1280x800,
real recorded API data, studio product photos). Benchmarks in mind: Noon, Amazon app,
Apple Store app, Jumia: one clear price, calm surfaces, strong type contrast, no clutter.

## Round 1 critique (baseline run 45732446186, commit 2960b86)

### Global (applies to most screens)
1. **Desktop is stretched mobile.** Catalog, PDP, cart, checkout, orders, order detail are a
   480–640px column centred in 1280px with 300px+ of empty margin on each side.
2. **Mobile navy AppBar renders on desktop** as a full-width navy band under the real desktop
   header, with duplicate cart/heart buttons. Two headers stacked.
3. **Sticky action bars float mid-page on desktop** (cart "متابعة" over the summary, checkout
   "تأكيد الطلب" over the phone field, PDP buy bar between gallery and specs).
4. **Announcement banner is 4 lines (~140px) on every mobile screen**, above the header,
   with marketing copy; it pushes the actual screen below the fold.
5. **Inner-page navy AppBar is ~100px tall** with only a title and two redundant icons; on
   PDP it is an empty navy slab above the gallery.
6. **Tokens are not a system**: 410 literal font sizes over 22 values (10, 11, 11.5, 12.5,
   13.5…), 1108 hex colours in modules, 114 literal shadows, three overlapping token sets
   (`--wex-*`, `--space/--radius/--text`, `--color-slate-*`). 10–11px Arabic is too small.
7. **Every surface is a bordered + shadowed white card on ice blue**: no hierarchy between
   primary and secondary surfaces; sections do not breathe.

### Home
1. Hero repeats the logo on a white pill inside the navy hero (logo already in header).
2. Hero cart/heart buttons duplicate the tab bar / header.
3. "وصل حديثاً" on desktop is a 3-card horizontal scroller leaving 60% of the row empty.
4. Category tiles are tall (90px) for three items; icons in heavy blue squares.
5. Store-info card repeats the footer almost line for line on desktop.

### Catalog (+ filter sheet)
1. No desktop layout: no filter sidebar, 2-column grid.
2. Category chips row is clipped mid-word ("هوا…") with no edge fade.
3. Filter sheet: chip groups are right-aligned rag with uneven widths; price only one option.
4. Result count "14 نتيجة" floats with no sort control next to it.

### Product card (home, catalog, related, favorites)
1. Full-width solid blue "أضف" button on every card: the grid reads as a wall of blue bars.
2. Price is the same size/weight as the description; it should lead after the title.
3. Two-line grey description adds noise in a grid; titles wrap unevenly.
4. Condition badge overlaps the image's bottom corner and collides with the photo.
5. Image box has its own border inside the card border (double frame).

### Product detail
1. Desktop: single column; buy box not beside the gallery.
2. Compare / share / WhatsApp: three equal outline pills compete with the primary action.
3. Tabs (specs / delivery) on a grey track look disabled.
4. Sticky buy bar has a stepper + price + two buttons: dense on 360px.

### Cart / Checkout
1. Desktop: summary not in a side column; CTA bar floats.
2. Delete is a red filled square per row (alarming, heavy).
3. "إضافة منتجات أخرى" dashed box looks like a drop zone.
4. Checkout option cards: icon, title and check share one row; selected state only a border.
5. Summary discount chip in green pill is louder than the total.

### Orders list / Order detail (pending, review, rejected, confirmed, expired)
1. Orders: every card has "تفاصيل" link + full button; date line repeats "قبل 10 دقائق" and the
   absolute time in two tones; status chips use six unrelated colours.
2. Order detail header: navy slab 220px with order number as a 24px Latin title; status
   chip floats under it.
3. Pending: the push-permission warning card sits between bank accounts and upload, the
   most important step; upload CTA appears twice (card + sticky bar).
4. Review/confirmed: receipt preview is a tiny 90px thumbnail.
5. Timeline: hollow circles for future steps look like radio buttons.

### Account / Favorites / Compare / Notifications / FAQ
1. Account: stats tiles inside the navy card are low contrast; tab strip clipped.
2. Favorites: one product per row with a 180px image: very long scroll; not the catalog grid.
3. Compare: broken at 360px: product columns clipped ("De…"), sticky label column overlaps.
4. Notifications: every item has a 3px left border + dot + category + date: four signals for
   "unread"; long WEX numbers wrap.
5. FAQ: fine structure; hero card with big icon wastes the first screen.

### Login / Offline / 404
1. Login: two feature pills ("خصم التطبيق", "تثبيت السعر") look like buttons.
2. Offline/404: icon tiny and grey; no illustration; screens feel unfinished.

### Admin
1. Products (desktop): five filters stacked as full-width selects (~300px of chrome); name
   column ~60px so names wrap per word; every row showed a placeholder (API sent no image:
   fixed cefa86b).
2. Order cards (mobile): order number clipped at its start (fixed: DataList basis).
3. Dashboard: two warning banners stacked above KPIs; KPI tiles equal weight.
4. Settings: one 3000px page of forms; save buttons per card, no section nav.
5. Product form: section tabs scroll off-screen; sticky save bar overlaps fields.
6. Payments: receipt viewer on black is heavy; approve/reject sit far from the receipt.

## Round 1 plan (in order)
1. Desktop shell for inner pages: AppBar → desktop page header with breadcrumbs; wide
   containers; sticky bars become an inline/aside block on desktop.
2. Catalog desktop: filter sidebar + 4-column grid; mobile chip row edge fade.
3. Product card redesign (price-led, quiet add button, no double frame, badge inside).
4. PDP, cart, checkout, order detail: two-column desktop.
5. Compact announcement banner and inner AppBar on mobile.
6. Compare at 360px; favorites as grid.
7. Admin products filters as one row; name column width.
8. Type scale + colour/shadow tokens codemod.

## Round 1 results (proof run 45766303413, commit 72b7580; 67/67 captures opened)

| Screen | Before | After |
|---|---|---|
| Catalog desktop | 2 columns in a 480px column, no filters | Sticky filter sidebar + 4-column grid, breadcrumbs |
| PDP desktop | single column, buy bar floating mid-page | Gallery beside title/price/buy box/actions/specs; related 5-up |
| Cart / checkout desktop | 480px column, CTA bar over the summary / phone field | Content + sticky summary column, action under the summary |
| Order detail / orders desktop | 600px column | Payment flow + sticky progress column; orders 2-up |
| Product card | full-width blue bar per card, price as small as the description | Full-bleed photo, price leads, quiet 44px cart control |
| Mobile chrome | 4-line banner (~140px) + 100px navy band on every page | One-line banner, shorter band; PDP slab 28px shorter |
| Compare 360 | second product clipped mid-word | Two products beside the labels |
| Admin products | 5 stacked filters, names wrapped per word, no thumbnails | Filters in two rows, names on one line, real thumbnails |
| Data truth | accessories labelled "مستعمل استيراد" | real condition; unknown shows no badge |

Regression caught in review and fixed: the wider admin name column pushed delete/preview
off the table (b4afbc1 → fixed next commit).

## Round 2 critique (from the round 1 result)

1. **Notifications**: still four "unread" signals (side bar, dot, category, date); dense.
2. **Admin order cards (mobile)**: ~380px each: every field label stacked over its value.
3. **Order timeline**: future steps are hollow circles that read as radio buttons.
4. **Cart rows**: delete is a red filled square on every row: alarming for a routine action.
5. **PDP secondary actions**: compare/share/WhatsApp are three equal bordered pills that
   compete with the buy box.
6. **Login sheet**: close control is a 52px outlined square, heavier than the actions.
7. **Offline / 404**: small grey icon, screens feel unfinished.
8. **Specs**: unknown English keys (e.g. `dpi`) shown raw as labels.
9. **Order header**: "طلب" and number wrapped onto two lines (fixed at the start of r2).
10. **Home desktop**: new-arrivals row 3 cards in a scroller, store card repeats footer
    (fixed at the start of r2).
11. **Favorites mobile**: badges stack in two rows; "نقل إلى السلة" wraps to two lines.

## Round 2 results (proof runs 45767937838 / 45769371482; 67/67 + 67/67 opened)

| Screen | Before (r1) | After (r2) |
|---|---|---|
| Notifications | 4 unread signals, tinted cards with side bars | One signal (white + dot + bold); read items flat |
| Cart | red square delete per row, dashed "add more" box, loud discount pill | quiet delete (red on press), text link, plain discount |
| Order timeline | hollow circles (radio look) | done check / current ring+dot / later small dot |
| PDP actions | three bordered pills | one segmented strip |
| Offline / 404 | small grey icon | illustrated state, 404 as a label |
| Home desktop | 3-card scroller, duplicate hero logo/actions, store card = footer | 5-up row, 4-up picks, compact category row, no duplicates |
| Admin cards (mobile) | ~380px, one field per line | two fields per row |
| Admin dashboard | permission notice above the work queue | payment review first |
| Login | perks as button-like pills | plain icon + text |

Caught in review: order header title still wrapped: first a specificity loss to
`.navy h1`, then an empty AppBar side reserving 44px. Both fixed.

## Round 3 critique

1. **Skeletons** still have the old card anatomy (inner framed image, full-width button bar):
   layout shifts when products arrive.
2. **Admin settings**: a ~3000px single page of five cards with no way to jump between them.
3. **FAQ**: hero card with a 56px icon takes the first screen before any question.
4. **Admin payments**: receipt viewer on solid black dominates; heavy for a review tool.
5. **Checkout (mobile)**: selected option shown only by border colour + a small check.
6. **Order header (360px)**: verify one line after the AppBar fix.
