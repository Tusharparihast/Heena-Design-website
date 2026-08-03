# Mehndi Studio Website — Phase 1

Building step by step. This plan covers only Phase 1 so we can review the look and feel before adding backend, admin, and shop.

## Two notes on your brief

- **Framework**: this project runs on TanStack Start (React 19 + Vite + TypeScript), not Next.js. It gives the same benefits you asked for — server-side rendering for SEO, file-based routing, fast loads, image lazy-loading — so nothing in your plan is lost. Tailwind, Framer Motion, SVG/3D animation, and TanStack Query all work here.
- **Chinese translations**: you don't have to hand-write them in code. Phase 1 puts all copy in two JSON dictionaries (`en.json`, `zh.json`) with a language toggle. Later, once the admin dashboard exists, translations for gallery/course content become editable fields in the dashboard, so the owner edits Chinese text without a developer.

## Phase 1 scope — brand + landing page

**Brand identity**
- Light green mehndi palette: soft sage/pistachio backgrounds, deep henna-brown text, muted olive accents, warm cream. No dark or neon greens.
- Typography: an elegant serif for headings, a clean sans for body; both with Chinese-glyph fallbacks so 简体中文 renders properly.
- Placeholder wordmark until you decide the name. I'll propose 3 name options in chat with the build.

**Landing page (`/`)** — one long page with these sections:
Hero, About Mehndi, Why Learn Mehndi, Courses preview, Traditional Designs, Modern Designs, Gallery preview, Testimonials, FAQ, Contact.

- Hero: SVG mehndi-pattern draw-on animation (a cone tracing a floral pattern), lightweight, with reduced-motion fallback.
- Course cards use placeholder details, clearly marked as editable later.
- Contact block ordered WeChat → WhatsApp → Phone → Instagram/Facebook → Email, with location (Maitidevi, Kathmandu) and hours (9 AM–9 PM).
- Testimonials and gallery use placeholder images sized like the real ones.

**Shell**
- Navbar: Home, Gallery, Courses, Custom Design, About, Contact + EN/中文 toggle. Only Home is live in Phase 1; the rest are stubs so nav never breaks.
- Footer with contact, hours, map link, social icons.
- Scroll behaviour: `/` always opens at the top on refresh; scroll position restores on back-navigation.
- SEO: unique title/description/og tags per route, semantic headings, alt text, JSON-LD LocalBusiness.

## Later phases (not built yet)

1. Gallery page — categories, search, lazy loading + blur placeholders, fullscreen zoom, watermarking, download disabled.
2. Courses and Custom Design pages — inquiry form with reference upload.
3. Lovable Cloud backend + admin dashboard — owner manages gallery, courses, testimonials, appointment calendar, and both languages.
4. E-commerce module for cones and kits, plus Google Analytics.

The data model in phase 3 will be designed with products and orders in mind, so the shop drops in without a rebuild.

## Technical notes

- Routes: `src/routes/index.tsx` (landing), stub routes for `/gallery`, `/courses`, `/custom-design`, `/about`, `/contact`.
- Design tokens in `src/styles.css` (oklch); no hardcoded colours in components.
- i18n: lightweight context + JSON dictionaries, language persisted to localStorage, `<html lang>` updated on toggle.
- Animations: Framer Motion + inline SVG path animation; no 3D library in Phase 1 to keep the page fast on slow connections.
