import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { MehndiBackdrop } from "@/components/site/MehndiBackdrop";
import { CursorMehndi } from "@/components/site/CursorMehndi";
import { FloatingWeChat } from "@/components/site/FloatingWeChat";
import { site } from "@/lib/site";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${site.name} — Mehndi Studio & Classes, Kathmandu` },
      {
        name: "description",
        content: "Traditional and modern mehndi artistry and in-person henna classes in Maitidevi, Kathmandu.",
      },
      { name: "author", content: site.name },
      { name: "theme-color", content: "#f2f6ea" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      {
        property: "og:description",
        content: "Traditional and modern mehndi artistry and in-person henna classes in Maitidevi, Kathmandu.",
      },
      {
        name: "twitter:description",
        content: "Traditional and modern mehndi artistry and in-person henna classes in Maitidevi, Kathmandu.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fadf4904-775a-472b-a08f-410bb2c9c974/id-preview-e29a8a4b--6ded26a2-2d26-4ef2-af1e-9c4fbc8acc48.lovable.app-1785919949690.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fadf4904-775a-472b-a08f-410bb2c9c974/id-preview-e29a8a4b--6ded26a2-2d26-4ef2-af1e-9c4fbc8acc48.lovable.app-1785919949690.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Karla:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: site.name,
          description: "Traditional and modern mehndi artistry and in-person henna classes in Kathmandu.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Maitidevi",
            addressLocality: "Kathmandu",
            addressCountry: "NP",
          },
          telephone: site.phone,
          email: site.email,
          openingHours: "Mo-Su 09:00-21:00",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Admin routes render their own sidebar/topbar chrome — hide public site chrome there.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (nav?.type !== "reload") return;
    const id = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {!isAdmin && <MehndiBackdrop />}
        {!isAdmin && <CursorMehndi />}
        <div className="flex min-h-screen flex-col">
          {!isAdmin && <Navbar />}
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <div className="flex-1">
            <Outlet />
          </div>
          {!isAdmin && <Footer />}
        </div>
        {!isAdmin && <FloatingWeChat />}
        <Toaster position="top-center" richColors />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
