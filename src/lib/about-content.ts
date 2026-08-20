// ============= Studio-managed About page content =============
// The whole About page (hero, story, values, art gallery, teaching steps,
// artist, studio, video, why-us, international students and the closing call
// to action) is one bilingual JSON document in `site_content` under the
// "about" key. Visitors read it anonymously; only admins can write it.

import { useMemo } from "react";

import aboutDefault from "@/assets/about-henna.jpg";
import heroPoster from "@/assets/hero-hand.jpg";
import heroVideoAsset from "@/assets/hero-mehndi.mp4.asset.json";
const heroVideo = heroVideoAsset.url;
import bridal from "@/assets/gallery/bridal-1.jpg";
import arabic from "@/assets/gallery/arabic-1.jpg";
import floral from "@/assets/gallery/floral-1.jpg";
import minimal from "@/assets/gallery/minimal-1.jpg";
import modern from "@/assets/gallery/modern-1.jpg";
import feet from "@/assets/gallery/feet-1.jpg";
import type { Locale } from "@/i18n/dictionaries";
import { saveSiteContent, useSiteContent } from "./site-content";

export const ABOUT_CONTENT_KEY = "about";

/** A short piece of text kept in both languages. */
export interface Bi {
  en: string;
  zh: string;
}

export interface AboutCard {
  titleEn: string;
  titleZh: string;
  bodyEn: string;
  bodyZh: string;
}

export interface AboutContent {
  heroTitleEn: string;
  heroTitleZh: string;
  heroBodyEn: string;
  heroBodyZh: string;
  heroImageUrl: string;

  storyTitleEn: string;
  storyTitleZh: string;
  storyBodyEn: string;
  storyBodyZh: string;
  storyImageUrl: string;

  valuesTitleEn: string;
  valuesTitleZh: string;
  values: AboutCard[];

  artTitleEn: string;
  artTitleZh: string;
  artBodyEn: string;
  artBodyZh: string;
  artImages: string[];

  teachingTitleEn: string;
  teachingTitleZh: string;
  teaching: AboutCard[];

  artistTitleEn: string;
  artistTitleZh: string;
  artistNameEn: string;
  artistNameZh: string;
  artistRoleEn: string;
  artistRoleZh: string;
  artistBodyEn: string;
  artistBodyZh: string;
  artistImageUrl: string;

  studioTitleEn: string;
  studioTitleZh: string;
  studioBodyEn: string;
  studioBodyZh: string;
  studioAddressEn: string;
  studioAddressZh: string;
  studioHoursEn: string;
  studioHoursZh: string;
  studioImageUrl: string;

  videoTitleEn: string;
  videoTitleZh: string;
  videoBodyEn: string;
  videoBodyZh: string;
  videoUrl: string;
  videoPosterUrl: string;

  whyTitleEn: string;
  whyTitleZh: string;
  why: AboutCard[];

  intlTitleEn: string;
  intlTitleZh: string;
  intlBodyEn: string;
  intlBodyZh: string;
  intlPointsEn: string[];
  intlPointsZh: string[];

  ctaTitleEn: string;
  ctaTitleZh: string;
  ctaBodyEn: string;
  ctaBodyZh: string;
}

export const defaultAbout: AboutContent = {
  heroTitleEn: "About Nagma Designs",
  heroTitleZh: "关于 Nagma Designs",
  heroBodyEn:
    "A small home studio in Maitidevi, Kathmandu, where traditional henna is drawn by hand — and taught, cone in hand, to anyone willing to practise.",
  heroBodyZh: "位于加德满都 Maitidevi 的家庭工作室，手绘传统海娜，也一对一教你亲手画出属于自己的图案。",
  heroImageUrl: aboutDefault,

  storyTitleEn: "Our Story",
  storyTitleZh: "我们的故事",
  storyBodyEn:
    "Nagma Designs began at a kitchen table, with one cone and a family tradition passed down through festivals and weddings.\nWhat started as designs for neighbours grew into bridal bookings across Kathmandu — and then into classes, when students began asking to learn rather than just be painted.\nToday the studio does both: careful bridal and festival work, and patient teaching for students who want the craft in their own hands.",
  storyBodyZh:
    "Nagma Designs 起源于一张餐桌、一支海娜锥，以及在节日与婚礼中代代相传的家族手艺。\n最初只是为邻居画图案，后来成为加德满都各地新娘的预约，再到开设课程——因为越来越多人想亲手学会。\n如今工作室同时做两件事：细致的新娘与节日海娜，以及耐心的教学。",
  storyImageUrl: bridal,

  valuesTitleEn: "Our Values",
  valuesTitleZh: "我们的理念",
  values: [
    {
      titleEn: "Tradition",
      titleZh: "传统",
      bodyEn: "Motifs, symmetry and meaning kept the way they were taught — not copied from a screen.",
      bodyZh: "图案、对称与寓意，都按师承的方式保留，而不是照搬网络图片。",
    },
    {
      titleEn: "Creativity",
      titleZh: "创意",
      bodyEn: "Every hand is different, so every design is drawn for the person wearing it.",
      bodyZh: "每一只手都不同，因此每一个图案都为佩戴者量身绘制。",
    },
    {
      titleEn: "Practice",
      titleZh: "练习",
      bodyEn: "Steady lines come from repetition. Students draw in every single class.",
      bodyZh: "流畅的线条来自重复练习，学生每节课都要动手画。",
    },
    {
      titleEn: "Personal Expression",
      titleZh: "个人表达",
      bodyEn: "We teach the rules first so you can gently break them and find your own style.",
      bodyZh: "先教规则，再鼓励你打破规则，找到自己的风格。",
    },
  ],

  artTitleEn: "The Art Behind Our Designs",
  artTitleZh: "图案背后的艺术",
  artBodyEn: "Paisleys, lotus mandalas, vines and fine fillers — the vocabulary behind every piece we draw.",
  artBodyZh: "佩斯利、莲花曼陀罗、藤蔓与细密填充——这是我们每一幅作品的语言。",
  artImages: [bridal, arabic, floral, minimal, modern, feet],

  teachingTitleEn: "Our Teaching Approach",
  teachingTitleZh: "我们的教学方式",
  teaching: [
    {
      titleEn: "Learn",
      titleZh: "学习",
      bodyEn: "Cone control, paste consistency and the core motifs, step by step.",
      bodyZh: "从握锥、调浆到核心图案，一步步来。",
    },
    {
      titleEn: "Practice",
      titleZh: "练习",
      bodyEn: "Guided repetition on paper, then on skin, with corrections as you go.",
      bodyZh: "先在纸上引导练习，再画在皮肤上，边画边纠正。",
    },
    {
      titleEn: "Create",
      titleZh: "创作",
      bodyEn: "Build full hand layouts — bridal, Arabic, minimal — from your own sketches.",
      bodyZh: "从自己的草图出发，完成整手布局：新娘、阿拉伯风、极简。",
    },
    {
      titleEn: "Develop",
      titleZh: "提升",
      bodyEn: "Speed, finishing and client work: pricing, hygiene and aftercare.",
      bodyZh: "提升速度与完成度，并学习接单：定价、卫生与护理。",
    },
  ],

  artistTitleEn: "Meet the Artist",
  artistTitleZh: "认识我们的老师",
  artistNameEn: "Nagma",
  artistNameZh: "Nagma",
  artistRoleEn: "Founder & Lead Mehndi Artist",
  artistRoleZh: "创始人 · 主理海娜艺术家",
  artistBodyEn:
    "Nagma has been drawing henna since childhood and now works with brides, families and students across Kathmandu. She teaches in small groups so every student gets her hand on their line work — in English or with patient, simple Chinese-friendly instruction.",
  artistBodyZh:
    "Nagma 自幼学习海娜，如今为加德满都的新娘、家庭与学生服务。课程以小班进行，确保每位学生都能得到手把手指导，并提供中文友好的耐心讲解。",
  artistImageUrl: aboutDefault,

  studioTitleEn: "Our Studio",
  studioTitleZh: "我们的工作室",
  studioBodyEn:
    "A calm home studio — cushions, natural light and fresh cones rolled the same day. Appointments are one at a time, so the room is never rushed.",
  studioBodyZh: "安静的家庭工作室：坐垫、自然光，海娜锥当天现卷。每次只接待一位客人，从不匆忙。",
  studioAddressEn: "Maitidevi, Kathmandu, Nepal",
  studioAddressZh: "尼泊尔 加德满都 Maitidevi",
  studioHoursEn: "Open daily, 9:00 AM – 9:00 PM",
  studioHoursZh: "每日营业 9:00 – 21:00",
  studioImageUrl: minimal,

  videoTitleEn: "Behind the Scenes",
  videoTitleZh: "幕后",
  videoBodyEn: "A short, quiet look at a cone in motion.",
  videoBodyZh: "一段简短安静的绘制片段。",
  videoUrl: heroVideo,
  videoPosterUrl: heroPoster,

  whyTitleEn: "Why Learn With Us?",
  whyTitleZh: "为什么选择我们",
  why: [
    {
      titleEn: "Small groups",
      titleZh: "小班教学",
      bodyEn: "A few students per batch, so you are never left drawing alone.",
      bodyZh: "每期仅收少量学生，绝不放任自学。",
    },
    {
      titleEn: "Materials included",
      titleZh: "材料齐备",
      bodyEn: "Cones, practice sheets and paste recipes are part of every course.",
      bodyZh: "课程包含海娜锥、练习纸与配方。",
    },
    {
      titleEn: "Real client work",
      titleZh: "真实接单",
      bodyEn: "Learn pricing, hygiene and how to handle bridal bookings.",
      bodyZh: "学习定价、卫生规范与新娘预约流程。",
    },
    {
      titleEn: "Certificate",
      titleZh: "结业证书",
      bodyEn: "A studio certificate on completion, with photos of your finished work.",
      bodyZh: "结业颁发工作室证书，并附作品照片。",
    },
  ],

  intlTitleEn: "International Students",
  intlTitleZh: "国际学生",
  intlBodyEn:
    "Many of our students travel to Kathmandu for a short, intensive course. We keep it simple to arrange from abroad.",
  intlBodyZh: "许多学生专程来到加德满都参加短期密集课程，我们让整个安排变得简单。",
  intlPointsEn: [
    "Flexible short courses that fit a travel schedule",
    "Chinese-friendly teaching and WeChat support before you arrive",
    "Help with directions, timings and nearby stays",
    "All materials provided — bring only your hands",
  ],
  intlPointsZh: ["可配合行程的短期密集课程", "中文友好教学，出发前微信沟通", "协助交通、时间与附近住宿安排", "材料全备，空手即可上课"],

  ctaTitleEn: "Come draw with us",
  ctaTitleZh: "来一起画吧",
  ctaBodyEn: "Browse the courses, or look through the gallery to find the style you want on your hands.",
  ctaBodyZh: "浏览课程，或在作品集中找到你喜欢的风格。",
};

/* ------------------------------------------------------------------ */
/* Sanitizing                                                          */
/* ------------------------------------------------------------------ */

function text(value: unknown, fallback: string, max = 2000): string {
  return typeof value === "string" && value.trim() ? value.slice(0, max) : fallback;
}

function url(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.slice(0, 4000) : fallback;
}

function urlList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())).slice(0, 12);
  return list;
}

function textList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())).slice(0, 12);
}

function cards(value: unknown, fallback: AboutCard[]): AboutCard[] {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .slice(0, 8)
    .map((o) => ({
      titleEn: text(o["titleEn"], "", 120),
      titleZh: text(o["titleZh"], "", 120),
      bodyEn: text(o["bodyEn"], "", 600),
      bodyZh: text(o["bodyZh"], "", 600),
    }))
    .filter((c) => c.titleEn || c.titleZh || c.bodyEn || c.bodyZh);
  return list.length ? list : fallback;
}

export function sanitizeAbout(raw: unknown): AboutContent {
  if (!raw || typeof raw !== "object") return defaultAbout;
  const o = raw as Record<string, unknown>;
  const d = defaultAbout;
  return {
    heroTitleEn: text(o["heroTitleEn"], d.heroTitleEn, 120),
    heroTitleZh: text(o["heroTitleZh"], d.heroTitleZh, 120),
    heroBodyEn: text(o["heroBodyEn"], d.heroBodyEn),
    heroBodyZh: text(o["heroBodyZh"], d.heroBodyZh),
    heroImageUrl: url(o["heroImageUrl"], d.heroImageUrl),

    storyTitleEn: text(o["storyTitleEn"], d.storyTitleEn, 120),
    storyTitleZh: text(o["storyTitleZh"], d.storyTitleZh, 120),
    storyBodyEn: text(o["storyBodyEn"], d.storyBodyEn, 4000),
    storyBodyZh: text(o["storyBodyZh"], d.storyBodyZh, 4000),
    storyImageUrl: url(o["storyImageUrl"], d.storyImageUrl),

    valuesTitleEn: text(o["valuesTitleEn"], d.valuesTitleEn, 120),
    valuesTitleZh: text(o["valuesTitleZh"], d.valuesTitleZh, 120),
    values: cards(o["values"], d.values),

    artTitleEn: text(o["artTitleEn"], d.artTitleEn, 120),
    artTitleZh: text(o["artTitleZh"], d.artTitleZh, 120),
    artBodyEn: text(o["artBodyEn"], d.artBodyEn),
    artBodyZh: text(o["artBodyZh"], d.artBodyZh),
    artImages: urlList(o["artImages"], d.artImages),

    teachingTitleEn: text(o["teachingTitleEn"], d.teachingTitleEn, 120),
    teachingTitleZh: text(o["teachingTitleZh"], d.teachingTitleZh, 120),
    teaching: cards(o["teaching"], d.teaching),

    artistTitleEn: text(o["artistTitleEn"], d.artistTitleEn, 120),
    artistTitleZh: text(o["artistTitleZh"], d.artistTitleZh, 120),
    artistNameEn: text(o["artistNameEn"], d.artistNameEn, 120),
    artistNameZh: text(o["artistNameZh"], d.artistNameZh, 120),
    artistRoleEn: text(o["artistRoleEn"], d.artistRoleEn, 120),
    artistRoleZh: text(o["artistRoleZh"], d.artistRoleZh, 120),
    artistBodyEn: text(o["artistBodyEn"], d.artistBodyEn, 3000),
    artistBodyZh: text(o["artistBodyZh"], d.artistBodyZh, 3000),
    artistImageUrl: url(o["artistImageUrl"], d.artistImageUrl),

    studioTitleEn: text(o["studioTitleEn"], d.studioTitleEn, 120),
    studioTitleZh: text(o["studioTitleZh"], d.studioTitleZh, 120),
    studioBodyEn: text(o["studioBodyEn"], d.studioBodyEn, 3000),
    studioBodyZh: text(o["studioBodyZh"], d.studioBodyZh, 3000),
    studioAddressEn: text(o["studioAddressEn"], d.studioAddressEn, 200),
    studioAddressZh: text(o["studioAddressZh"], d.studioAddressZh, 200),
    studioHoursEn: text(o["studioHoursEn"], d.studioHoursEn, 200),
    studioHoursZh: text(o["studioHoursZh"], d.studioHoursZh, 200),
    studioImageUrl: url(o["studioImageUrl"], d.studioImageUrl),

    videoTitleEn: text(o["videoTitleEn"], d.videoTitleEn, 120),
    videoTitleZh: text(o["videoTitleZh"], d.videoTitleZh, 120),
    videoBodyEn: text(o["videoBodyEn"], d.videoBodyEn),
    videoBodyZh: text(o["videoBodyZh"], d.videoBodyZh),
    videoUrl: url(o["videoUrl"], d.videoUrl),
    videoPosterUrl: url(o["videoPosterUrl"], d.videoPosterUrl),

    whyTitleEn: text(o["whyTitleEn"], d.whyTitleEn, 120),
    whyTitleZh: text(o["whyTitleZh"], d.whyTitleZh, 120),
    why: cards(o["why"], d.why),

    intlTitleEn: text(o["intlTitleEn"], d.intlTitleEn, 120),
    intlTitleZh: text(o["intlTitleZh"], d.intlTitleZh, 120),
    intlBodyEn: text(o["intlBodyEn"], d.intlBodyEn),
    intlBodyZh: text(o["intlBodyZh"], d.intlBodyZh),
    intlPointsEn: textList(o["intlPointsEn"], d.intlPointsEn),
    intlPointsZh: textList(o["intlPointsZh"], d.intlPointsZh),

    ctaTitleEn: text(o["ctaTitleEn"], d.ctaTitleEn, 120),
    ctaTitleZh: text(o["ctaTitleZh"], d.ctaTitleZh, 120),
    ctaBodyEn: text(o["ctaBodyEn"], d.ctaBodyEn),
    ctaBodyZh: text(o["ctaBodyZh"], d.ctaBodyZh),
  };
}

/** Saves the About document (admins only). */
export function writeAboutContent(next: AboutContent) {
  void saveSiteContent(ABOUT_CONTENT_KEY, sanitizeAbout(next));
}

/** Live About content, kept in sync across tabs by the shared content store. */
export function useAboutContent(): { about: AboutContent; loaded: boolean } {
  const { doc, loaded } = useSiteContent(ABOUT_CONTENT_KEY);
  const about = useMemo(() => sanitizeAbout(doc), [doc]);
  return { about, loaded };
}

/** Picks one language, falling back to English when the 中文 value is blank. */
export function pickLang(en: string, zh: string, locale: Locale): string {
  return locale === "zh" && zh.trim() ? zh : en;
}

export function pickList(en: string[], zh: string[], locale: Locale): string[] {
  return locale === "zh" && zh.length > 0 ? zh : en;
}
