# Mehndi Mastery Studio

This is a good use case for a premium business website, not just a portfolio. Since your target audience is mainly Chinese students and customers, the website should focus on three things:

Trust (show expertise and authentic work)

Performance (fast even on slow internet)

Easy communication (convert visitors into students or clients)

From what you've described, I wouldn't build it as a simple scrolling landing page. I'd use a hybrid architecture.

Recommended Tech Stack

Since you mentioned production ready, I'd recommend:

Next.js 16 (App Router) → SEO + performance

TypeScript

Tailwind CSS

Framer Motion → animations

Three.js (React Three Fiber) → lightweight 3D

Cloudinary → image optimization

Supabase → database if needed

Vercel → hosting

next-intl → multilingual support

React Query/TanStack Query (if API calls increase)

This gives excellent loading performance.

Separate Pages vs One Page

I recommend a hybrid website.

Landing Page (Single Long Page)

This page sells the business.

/


Sections

Hero

↓

About Mehndi

↓

Why Learn Mehndi

↓

Courses

↓

Traditional Designs

↓

Modern Designs

↓

Gallery Preview

↓

Testimonials

↓

FAQ

↓

Contact

This allows users to quickly understand the business.

Separate Pages

Pages that deserve their own URL.

/

/gallery

/courses

/custom-design

/about

/contact

/blog (optional)

/privacy



Why?

Gallery can become huge.

Courses need detailed explanation.

Custom Design needs forms.

Blog improves SEO.

Navigation Structure

Home

Gallery

Courses

Custom Design

About

Contact


Simple.

No dropdown unless necessary.

Gallery

This is probably the most important page.

Instead of

100 images


Organize them.

Example

Traditional Bridal

Arabic

Minimal

Modern

Festival

Floral

Finger Designs

Back Hand

Front Hand

Feet Mehndi



Each category opens instantly.

Each image should support

✔ Zoom

✔ Fullscreen

✔ Download disabled

✔ Lazy loading

✔ Blur placeholder

Gallery Performance

Do NOT load every image.

Instead

20 images

↓

Load More

↓

20 images

↓

Load More


or infinite scroll.

Images should be

AVIF

WebP

Responsive

Lazy Loaded

Compressed

Hero Section

Instead of a normal hero...

Imagine

A hand appears.

A mehndi cone starts drawing automatically.

The design slowly completes.

The camera slightly rotates.

Then

Traditional Art

Modern Creativity

Learn Authentic Mehndi


appears.

This would immediately make the website memorable.

3D Ideas

Keep them subtle.

Don't overdo it.

Ideas

1. Mehndi Cone Animation ⭐⭐⭐⭐⭐

A cone draws a pattern.

Probably SVG path animation.

Very lightweight.

2. Floating Mehndi Elements

Small floral patterns moving slowly.

Almost no performance impact.

3. Hand Model

Simple rotating hand.

Design fades in.

Don't use a high-poly model.

4. Cursor Effect

Cursor leaves tiny mehndi dots.

Very lightweight.

5. Scroll Animation

As user scrolls,

the pattern grows.

Looks premium.

Videos

Avoid autoplay 4K videos.

Instead

Thumbnail

↓

Click

↓

Optimized MP4


Use

720p

H264

WebM

Compressed

Chinese internet appreciates lightweight pages.

Student Section

Explain

What students learn

Duration

Tools provided

Certificate?

Practice

Traditional techniques

Modern techniques

Business opportunities

Customer Section

Separate from students.

Customers want

Custom Designs

Wedding Mehndi

Festival Mehndi

Private Events

Booking

Design Customization

A page

Custom Design


Flow

Choose

Traditional

↓

Modern

↓

Upload reference

↓

Describe

↓

WhatsApp / WeChat / Email

Contact Methods

Since customers are Chinese,

consider

WeChat

WhatsApp

Instagram

Facebook

Email

Phone

QR Code

Languages

Very important.

Support

English

简体中文

Possibly Nepali (optional)

Never rely on browser translation.

Use proper localization.

SEO

Separate pages help.

Example

Learn Mehndi in Nepal

Traditional Bridal Mehndi

Modern Mehndi Course

Henna Workshop

Henna Design Gallery


Performance Goals

Aim for

Lighthouse

Performance

95+

Accessibility

100

SEO

100

Best Practices

100

Back Button Behavior

You specifically asked for this.

If someone is here

/

↓

scrolls

↓

Gallery section

↓

opens image

↓

Back


They should return to

Gallery section


not the top.

The best approach is to:

Save the current scroll position or active section before navigation.

Restore that position when the user navigates back using the browser history.

Let the browser's history restoration handle this where possible, with a custom fallback for dynamic content.

Refresh Behavior

You wanted

Gallery Section

↓

Refresh

↓

Top of Home


Yes.

That is possible.

When refreshing

/


Always scroll to

0


But

/gallery

↓

Refresh

↓

Stay on /gallery


Exactly.

Each separate page should refresh normally.

Only the scroll position on the landing page resets.

Suggested Folder Structure

app/
│
├── page.tsx
├── gallery/
├── courses/
├── custom-design/
├── about/
├── contact/
├── blog/
│
components/
│
├── Hero
├── Navbar
├── Footer
├── Gallery
├── CourseCard
├── Testimonial
├── FAQ
├── LanguageSwitcher
├── ContactForm
├── VideoPlayer
├── AnimatedCone
├── LoadingScreen
│
lib/
hooks/
utils/


Questions Before Building (Production-Ready Planning)

1. Branding

What is the business name?

Do you already have a logo?

Do you have brand colors, or should I create a brand identity?

2. Business Information

Where is the business located?

Do you teach only in person, only online, or both?

What are your business hours?

3. Courses

How many different courses are offered?

Are courses beginner, intermediate, and advanced?

Do students receive a certificate?

What is the average course duration?

4. Customers

Can customers book appointments directly, or do they first contact the owner?

Should there be an online booking calendar?

Are there fixed prices, or does every design require a quotation?

5. Gallery

Approximately how many images will be available at launch?

Should images be searchable by category, style, or occasion?

Do you want image watermarking to discourage copying?

6. Communication

Which platforms should be primary? (WeChat, WhatsApp, Instagram, Facebook, Email, Phone)

Should the website include a live chat feature?

7. Testimonials

Do you already have reviews from students or customers?

Can we include before-and-after photos or event photos?

8. Languages

Should every page be available in both English and Simplified Chinese from day one?

Will you provide the Chinese translations, or should we build the translation workflow?

9. Content Management

Will the owner update the gallery and courses regularly?

Would you prefer a simple admin dashboard to upload photos and edit content without touching code?

10. Media

Do you already have professional photos and videos, or do we need placeholders initially?

Are you comfortable using short, compressed demonstration videos on the homepage?

11. Future Features

Will you eventually sell mehndi cones, kits, or online courses?

Should we design the architecture so an e-commerce module can be added later without rebuilding the site?

12. Analytics and Marketing

Do you want Google Analytics (or another privacy-friendly analytics tool)?

Should the site support newsletter sign-ups or promotional announcements?

Overall Recommendation

I would build this as a high-performance hybrid website:

Home: A rich, story-driven landing page with subtle animations and a lightweight SVG-based "mehndi cone drawing" effect.

Gallery: A dedicated page with categorized, lazy-loaded, optimized images and full-screen viewing.

Courses: Separate page with detailed curriculum, learning outcomes, and FAQs.

Custom Design: Dedicated inquiry page with reference uploads and contact options.

About and Contact: Separate pages for credibility and discoverability.

Shared features: Multilingual support, image optimization, history-aware navigation, and smooth but restrained animations.

This approach gives you the marketing impact of a modern landing page while keeping content scalable, SEO-friendly, and easy to expand as the business grows.

the answers for the questions are:

i haven't decided the name for the brand

no logo

i don't have any brand color but it should be like matching with mehndi and should be light green with minimal green color effect not too dark.

2. business info.

- the business is located in maitidevi, kathmandu

- for now we teach only in person in our home based office

- business hours are 9 AM - 9 PM

3.courses

i need to ask the owner for the course details so for now just leave the section with a random detail that can be changed

4. customer

- they can book appointment only after contacting the owner for now.

- we can add the calendar there that will show the details for the booked appointments that is updated by the owner manually for now.

- the prices should be discussed with the owner for now.

5. gallery

- for now there might be only few 30-50 images may be but not sure.

- it should be organized by categories which can be searched.

- yes the images should have watermarks

6. communication

- primary according to descending order WeChat, WhatsApp and phone, instagram and facebook, email

- for now no live chat feature

7. testimonials

- yes we have reviews and can include before and after images

8. languages

- for now the page should be both in english as well as in chinese (there should be a toggle button for changing languages)

-  will provide the chinese translation manually in the code or is there any other efficient way to deal with this? you can suggest me if there are any other option?

9. content ,management

- yes the owner will manage the gallery and courses regularly without touching the code so a admin dashboard for updating these would be best.

10. media

- we will need a place holder for the images or videos

- yeah we can add short demo videos on the homepage.

11. future features

- yeah we'll sell mehndi cones and other products as well for now.

- yes we should add the e-commerce module for now.

12. analytics and marketing

- yeah i want google analytics

- no promotions or ads for now. just make sure the seo works well.

lets start from the beginning step by step one at a time.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://n-designs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ded26a2-2d26-4ef2-af1e-9c4fbc8acc48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
