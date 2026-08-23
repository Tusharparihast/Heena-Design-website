# Fix content and admin loading flashes

## What will change
- Remove the logo swap on refresh by loading the saved branding document before the public layout renders, instead of first rendering the packaged logo and replacing it after a client effect.
- Move the admin access decision into the admin route lifecycle so protected dashboard UI never mounts before authentication and role checks finish; login and password-reset remain public.
- Confirm and complete database persistence for the About editor and all remaining admin-managed public content, including appointment page/settings that still use browser-only storage.
- Preserve existing bilingual defaults and migrate any legacy browser-saved settings once for signed-in admins.

## Verification
- Reload the public site with a changed logo and verify no default-logo frame appears.
- Open `/admin` signed out and verify the first rendered admin screen is the login flow, with no dashboard content flash.
- Save About and remaining page settings in admin, reload in a fresh browser context, and verify the public pages use the saved database content.
- Check desktop and phone layouts plus current build/runtime diagnostics.

## Technical details
- Use the existing public `site_content` store and its row-level access rules; no new table is required.
- Preload branding through the server-rendered route data and seed the content store before `BrandLogo` renders.
- Use a route-level client auth/role guard for `/admin/*` rather than an effect-driven redirect after mount.
- Convert appointment configuration from `localStorage` to the shared `site_content` document pattern used by Homepage, About, Courses, FAQ, Testimonials, Contact, Gallery, and Branding.
