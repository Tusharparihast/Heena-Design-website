import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Hero } from "@/components/home/Hero";
import { AboutSection, WhySection } from "@/components/home/AboutSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { DesignsSection } from "@/components/home/DesignsSection";
import { GalleryPreview, VideoSection } from "@/components/home/GalleryPreview";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { ContactSection } from "@/components/home/ContactSection";

const title = "Nagma Designs — Bridal Henna & Mehndi Classes in Kathmandu";
const description =
  "Traditional and modern mehndi in Maitidevi, Kathmandu. Bridal and festival henna appointments, plus in-person mehndi courses for beginners and professionals.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // A hard refresh of the landing page always starts at the top;
  // browser back-navigation keeps the router's restored scroll position.
  useEffect(() => {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (nav?.type === "reload") window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <h1 className="sr-only">{title}</h1>
      <Hero />
      <AboutSection />
      <WhySection />
      <CoursesSection />
      <DesignsSection />
      <GalleryPreview />
      <VideoSection />
      <TestimonialsSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}
