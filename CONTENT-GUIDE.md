# Where to edit things (content map)

Every file of the website already lives in this project — nothing is hidden.
Use the file explorer (or download the project as a ZIP / open it in VS Code)
and edit these files directly.

## 1. All text, English + Chinese

**`src/i18n/dictionaries.ts`** — this is the single source of every word on the site.

It exports two big objects:

```ts
export const en = { nav: {...}, hero: {...}, courses: {...}, ... }
export const zh: Dict = { nav: {...}, hero: {...}, ... }        // 简体中文
export const dictionaries = { en, zh }
```

- `en` = English copy, `zh` = Chinese copy. They have identical shapes, so if you
  add a key to `en` you must add the same key to `zh`.
- Sections inside: `nav`, `common`, `hero`, `about`, `why`, `courses`,
  `traditional`, `modern`, `gallery`, `studentWorkPage`, `galleryPage`, `video`,
  `testimonials`, `faq`, `contact`, `coursesPage`, `booking`, `footer`.
- Components read it with `const { t } = useLanguage()` and then `t.hero.title1`.

**`src/i18n/LanguageProvider.tsx`** — the EN / 中文 toggle logic, saves the choice
in `localStorage` under `mehndi.locale`.

## 2. Business details (phone, WeChat, WhatsApp, address, hours)

**`src/lib/site.ts`** — name, short name, city, hours, and every contact handle/link.
Change once, updates the navbar, footer, contact page and booking hand-off links.

## 3. Gallery images and categories

**`src/lib/gallery.ts`**
- `galleryCategories` — the 10 filter chips (id + English + Chinese label).
- `galleryItems` — the main gallery (image import, EN/ZH caption, categories).
- `studentWorkItems` — the `/student-work` page dataset.
- `GALLERY_PAGE_SIZE` — how many images load before "Load more".

Image files themselves: **`src/assets/gallery/*.jpg`**. Drop new photos in that
folder, `import` them at the top of `gallery.ts`, and add an entry to the array.

Hero media: **`src/assets/hero-hand.jpg`** (poster) and
**`src/assets/hero-mehndi.mp4`** (video), used by `src/components/home/Hero.tsx`.

## 4. Colors, fonts, animations

**`src/styles.css`** — all design tokens (`--primary`, `--henna`, `--cream`,
`--gradient-sage`, `--shadow-soft`), plus the `fade-up`, drift and cursor
keyframes. Components never hardcode colors, so editing this file re-themes the
whole site.

## 5. Pages (routes)

`src/routes/` — file-based routing, the filename *is* the URL:

| File | URL |
| --- | --- |
| `index.tsx` | `/` (long landing page) |
| `gallery.tsx` | `/gallery` |
| `courses.tsx` | `/courses` |
| `student-work.tsx` | `/student-work` |
| `custom-design.tsx` | `/custom-design` |
| `about.tsx` | `/about` |
| `contact.tsx` | `/contact` |
| `__root.tsx` | shared shell: navbar, footer, backdrop, cursor, SEO/JSON-LD |

`src/routeTree.gen.ts` is auto-generated — never edit it. Adding a new file in
`src/routes/` regenerates it automatically.

Each route file has a `head()` block — that's where the page `<title>` and meta
description live for SEO.

## 6. Landing page sections

`src/components/home/` — one file per section, in the order they appear on `/`:
`Hero`, `AboutSection`, `DesignsSection`, `CoursesSection`, `GalleryPreview`,
`TestimonialsSection`, `FaqSection`, `ContactSection`.
Reorder or remove them in `src/routes/index.tsx`.

## 7. Shared UI

- `src/components/site/` — `Navbar`, `Footer`, `Section`, `MehndiPattern`
  (the hand-drawn SVG animation), `MehndiBackdrop` (ambient drifting motifs),
  `CursorMehndi` (dot trail), `ComingSoon`.
- `src/components/gallery/` — `GalleryBrowser` (search + filter + load more),
  `GalleryCard`, `Lightbox` (zoom / fullscreen / arrows).
- `src/components/ui/` — shadcn primitives. You rarely need to touch these.

## 8. Config / infra (usually leave alone)

`package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`,
`components.json`, `src/router.tsx`, `src/server.ts`, `src/start.ts`,
`src/lib/error-*.ts`, `public/robots.txt`.

## Running it locally in VS Code

```bash
bun install     # or: npm install
bun run dev     # or: npm run dev
```

Then open http://localhost:8080
