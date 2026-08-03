import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/i18n/LanguageProvider";

export function ComingSoon({ heading, blurb }: { heading: string; blurb?: string }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
        {t.common.comingSoon}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{heading}</h1>
      <p className="mt-4 text-muted-foreground">{blurb ?? t.common.comingSoonBody}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.common.backHome}
        </Link>
        <Link
          to="/"
          hash="contact"
          className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t.common.talkToUs}
        </Link>
      </div>
    </main>
  );
}
