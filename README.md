# 🎨 Mehndi Mastery Studio

A full-stack, bilingual booking + e-commerce platform for a home-based mehndi (henna) studio in Kathmandu, Nepal — built to let a non-technical business owner run her entire online presence without ever touching code.

**Live site:** [n-designs.lovable.app](https://n-designs.lovable.app)

---

## 💡 What this project does

Most small local businesses either have no website, or a static one that goes stale the moment it's launched. This project solves that by pairing a polished, bilingual public website with a **real admin dashboard** — the studio owner can log in and update literally everything (homepage copy, gallery photos, course listings, prices, availability, branding) from her phone, with changes appearing live for every visitor. No redeploys, no developer needed.

On top of content management, it's a working business tool: customers can browse designs, book appointments, request custom designs with reference photos, shop for products, and reach the studio via WeChat/WhatsApp/phone/email — all while the owner gets a live admin view of every booking, order, and inquiry.

### Why it's more than a template site
- **Real database, not a mockup** — every admin edit is backed by PostgreSQL (via Supabase), with row-level security so only authenticated admins can write, and realtime sync so changes appear instantly across devices.
- **True bilingual support** — English and Simplified Chinese are first-class throughout, not a bolt-on translation plugin.
- **Business logic, not just a form** — booking dates respect the studio's actual weekly schedule and blocked-out dates, group sizes are capped by admin-set limits, and reference-photo uploads go through real cloud storage.
- **Production-grade auth & permissions** — Supabase Auth with a `user_roles` table, so only verified admins reach the dashboard.

---

## ✨ Key Features

**Public website**
- Responsive, mehndi-themed design with light/dark mode
- Homepage, About, Traditional/Modern design galleries, Student work, Testimonials, FAQ
- Course listings with bilingual content
- Searchable/filterable gallery with lightbox, zoom, and fullscreen viewing
- Small e-commerce shop with cart, product galleries, discounts, and stock status
- Appointment booking with live availability rules (open days, blocked dates, group size limits)
- Custom design request flow with reference image uploads
- Floating WeChat contact widget with QR code
- English / 中文 language switcher

**Admin dashboard**
- Manage homepage, about page, gallery, courses, testimonials, FAQ, and contact info — no code required
- Orders, appointments, and custom-design request management with status tracking and trash/recovery
- Product catalogue and category management
- Branding controls (logo, favicon)
- SEO metadata per page
- Role-based user/admin access
- Live notifications for new bookings and orders

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, TanStack Start + Router |
| Styling | Tailwind CSS 4, shadcn/ui (Radix UI primitives) |
| State/Data | TanStack Query, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Row-Level Security) |
| Build tooling | Vite |
| Extras | Lucide icons, Sonner (toasts), Recharts, date-fns, Embla Carousel |

---

## 🚀 Getting Started

```bash
git clone <repository-url>
cd mehndi-mastery-studio
npm install

# Add your Supabase project URL and anon key to a .env.local file

npm run dev
```

The app will be available at `http://localhost:3000` (or whichever port Vite reports).

### Project structure at a glance
```
src/
├── routes/         # Pages & routing (public + /admin)
├── components/     # Reusable UI components
├── lib/            # Business logic & Supabase data access
├── i18n/           # English / Chinese localization
└── integrations/   # Supabase client & generated types

supabase/
└── migrations/     # Database schema history
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built by **Tushar**, final-year B.E. Artificial Intelligence undergraduate at Kathmandu University 🇳🇵
