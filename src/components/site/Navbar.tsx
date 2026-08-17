import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/hooks/use-theme";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, locale, toggleLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/gallery", label: t.nav.gallery },
    { to: "/courses", label: t.nav.courses },
    { to: "/custom-design", label: t.nav.custom },
    { to: "/shop", label: t.nav.shop },
    { to: "/about", label: t.nav.about },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MehndiMark />
          </span>
          <span className="font-display text-xl leading-none font-semibold tracking-tight">{site.shortName}</span>
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="group inline-flex flex-col items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {({ isActive }) => (
                  <>
                    <span>{l.label}</span>
                    <span
                      className={cn(
                        "h-0.5 w-4 rounded-full bg-primary transition-all duration-300",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                      )}
                      aria-hidden
                    />
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={locale === "zh"}
            aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
            onClick={toggleLocale}
            className="relative -top-px inline-flex h-8 w-[5.25rem] items-center rounded-full border border-border bg-background p-0.5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-7 w-[calc(50%-2px)] rounded-full bg-primary transition-transform duration-200 ease-out",
                locale === "zh" ? "translate-x-full" : "translate-x-0",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-200",
                locale === "en" ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              EN
            </span>
            <span
              className={cn(
                "relative z-10 flex-1 text-center text-xs font-semibold transition-colors duration-200",
                locale === "zh" ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              中文
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <div className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
        <ul className="mx-auto max-w-6xl px-4 py-3">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="group inline-flex flex-col gap-1 py-2 text-sm text-muted-foreground"
              >
                {({ isActive }) => (
                  <>
                    <span>{l.label}</span>
                    <span
                      className={cn(
                        "h-0.5 w-4 rounded-full bg-primary transition-all duration-300",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                      )}
                      aria-hidden
                    />
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function MehndiMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="2.2" strokeWidth="1.4" />
      <path
        d="M12 3.5c2 2.5 2 4.3 0 6.3M12 20.5c-2-2.5-2-4.3 0-6.3M3.5 12c2.5-2 4.3-2 6.3 0M20.5 12c-2.5 2-4.3 2-6.3 0"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
