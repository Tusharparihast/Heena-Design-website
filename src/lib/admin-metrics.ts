// ============= Live admin dashboard metrics =============
// Every number on the dashboard is derived from the same sources the matching
// admin section reads, so the tiles always match their pages.

import { useEffect, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import { en } from "@/i18n/en";
import { useDbBookings } from "./bookings-db";
import { useDbOrders } from "./orders-db";
import { useAdminCatalog } from "./shop-catalog-db";
import { useEffectiveGalleryItems } from "./gallery-overrides";
import { adminTestimonials, useTestimonialOverrides } from "./testimonial-overrides";

export interface AdminMetrics {
  loading: boolean;
  pendingAppointments: number;
  totalAppointments: number;
  upcomingAppointments: number;
  galleryImages: number;
  galleryDesigns: number;
  galleryStudent: number;
  activeCourses: number;
  shopProducts: number;
  hiddenProducts: number;
  newOrders: number;
  totalOrders: number;
  testimonials: number;
  hiddenTestimonials: number;
}

/** Re-run a callback whenever the given tables change (Postgres realtime). */
export function useRealtimeTables(tables: string[], onChange: () => void) {
  const key = tables.join(",");
  useEffect(() => {
    const channel = supabase.channel(`admin-live-${key}`);
    for (const table of key.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChange());
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, onChange]);
}

export function useAdminMetrics(): AdminMetrics {
  const { bookings, loading: bookingsLoading, refresh: refreshBookings } = useDbBookings();
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useDbOrders();
  const { products, loading: productsLoading, refresh: refreshCatalog } = useAdminCatalog();
  const designs = useEffectiveGalleryItems("gallery");
  const student = useEffectiveGalleryItems("student");
  const testimonialOverrides = useTestimonialOverrides();

  useRealtimeTables(["bookings"], refreshBookings);
  useRealtimeTables(["order_requests"], refreshOrders);
  useRealtimeTables(["products", "product_categories"], refreshCatalog);

  return useMemo(() => {
    const liveBookings = bookings.filter((b) => !b.trashed);
    const liveOrders = orders.filter((o) => !o.trashed);
    const liveProducts = products.filter((p) => !p.deleted);
    const testimonials = adminTestimonials(testimonialOverrides);
    const today = new Date().toISOString().slice(0, 10);

    return {
      loading: bookingsLoading || ordersLoading || productsLoading,
      pendingAppointments: liveBookings.filter((b) => b.status === "pending").length,
      totalAppointments: liveBookings.length,
      upcomingAppointments: liveBookings.filter((b) => b.date >= today && b.status !== "cancelled").length,
      galleryImages: designs.length + student.length,
      galleryDesigns: designs.length,
      galleryStudent: student.length,
      activeCourses: en.coursesPage.items.length,
      shopProducts: liveProducts.filter((p) => p.visible).length,
      hiddenProducts: liveProducts.filter((p) => !p.visible).length,
      newOrders: liveOrders.filter((o) => o.status === "new").length,
      totalOrders: liveOrders.length,
      testimonials: testimonials.filter((t) => !t.hidden).length,
      hiddenTestimonials: testimonials.filter((t) => t.hidden).length,
    };
  }, [
    bookings,
    orders,
    products,
    designs,
    student,
    testimonialOverrides,
    bookingsLoading,
    ordersLoading,
    productsLoading,
  ]);
}
