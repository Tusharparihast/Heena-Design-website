import { createFileRoute, notFound } from "@tanstack/react-router";

import { adminNavItems } from "@/components/admin/admin-nav";
import { SectionPlaceholder } from "@/components/admin/SectionPlaceholder";

export const Route = createFileRoute("/admin/$section")({
  component: AdminSectionPage,
});

function AdminSectionPage() {
  const { section } = Route.useParams();
  const item = adminNavItems.find((nav) => nav.to === `/admin/${section}`);

  if (!item) {
    throw notFound();
  }

  return <SectionPlaceholder label={item.label} icon={item.icon} />;
}
