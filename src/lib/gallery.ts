import bridal from "@/assets/gallery/bridal-1.jpg";
import arabic from "@/assets/gallery/arabic-1.jpg";
import minimal from "@/assets/gallery/minimal-1.jpg";
import modern from "@/assets/gallery/modern-1.jpg";
import festival from "@/assets/gallery/festival-1.jpg";
import floral from "@/assets/gallery/floral-1.jpg";
import finger from "@/assets/gallery/finger-1.jpg";
import feet from "@/assets/gallery/feet-1.jpg";

export type CategoryId =
  | "bridal"
  | "arabic"
  | "minimal"
  | "modern"
  | "festival"
  | "floral"
  | "finger"
  | "backhand"
  | "fronthand"
  | "feet";

export type GalleryCategory = { id: CategoryId; en: string; zh: string };

export const galleryCategories: GalleryCategory[] = [
  { id: "bridal", en: "Traditional Bridal", zh: "传统新娘" },
  { id: "arabic", en: "Arabic", zh: "阿拉伯风" },
  { id: "minimal", en: "Minimal", zh: "极简" },
  { id: "modern", en: "Modern", zh: "现代" },
  { id: "festival", en: "Festival", zh: "节日" },
  { id: "floral", en: "Floral", zh: "花卉" },
  { id: "finger", en: "Finger Designs", zh: "手指图案" },
  { id: "backhand", en: "Back Hand", zh: "手背" },
  { id: "fronthand", en: "Front Hand", zh: "手心" },
  { id: "feet", en: "Feet Mehndi", zh: "足部海娜" },
];

/** Which public gallery a photo belongs to: the main Designs gallery or Student work. */
export type GalleryCollection = "gallery" | "student";

export type GalleryItem = {
  id: string;
  src: string;
  /** Intrinsic size — reserved in the grid so the page never shifts while loading. */
  width: number;
  height: number;
  /** Built-in CategoryId values or studio-created custom category ids. */
  categories: string[];
  en: string;
  zh: string;
};

/** Base placeholder photographs — real studio photos replace these later. */
const bases: {
  src: string;
  categories: CategoryId[];
  en: string;
  zh: string;
}[] = [
  { src: bridal, categories: ["bridal", "backhand", "fronthand"], en: "Bridal full-hand panel", zh: "新娘满手图案" },
  { src: arabic, categories: ["arabic", "backhand", "floral"], en: "Arabic flowing vine", zh: "阿拉伯流线花藤" },
  { src: minimal, categories: ["minimal", "modern", "backhand"], en: "Minimal dotted line", zh: "极简点线设计" },
  { src: modern, categories: ["modern", "backhand"], en: "Modern mandala", zh: "现代曼陀罗" },
  { src: festival, categories: ["festival", "bridal", "backhand"], en: "Festival hands", zh: "节日双手" },
  { src: floral, categories: ["floral", "modern"], en: "Floral forearm trail", zh: "小臂花卉纹" },
  { src: finger, categories: ["finger", "minimal"], en: "Finger tip design", zh: "指尖图案" },
  { src: feet, categories: ["feet", "bridal", "floral"], en: "Bridal feet design", zh: "新娘足部图案" },
];

/** 40 placeholder entries built from the base photographs. */
export const galleryItems: GalleryItem[] = Array.from({ length: 40 }, (_, index) => {
  const base = bases[index % bases.length]!;
  const set = Math.floor(index / bases.length) + 1;
  return {
    id: `design-${index + 1}`,
    src: base.src,
    width: 900,
    height: 1125,
    categories: base.categories,
    en: `${base.en} ${set}`,
    zh: `${base.zh} ${set}`,
  };
});

/** Student work — practice pieces and assessment designs by course students. */
const studentWorkBases: {
  src: string;
  categories: CategoryId[];
  en: string;
  zh: string;
}[] = [
  { src: bridal, categories: ["bridal", "backhand"], en: "Student bridal panel", zh: "学员新娘满手作品" },
  { src: arabic, categories: ["arabic", "fronthand"], en: "Student Arabic vine", zh: "学员阿拉伯流线" },
  { src: minimal, categories: ["minimal", "finger"], en: "Student minimal band", zh: "学员极简手环" },
  { src: modern, categories: ["modern", "backhand"], en: "Student modern mandala", zh: "学员现代曼陀罗" },
  { src: floral, categories: ["floral", "fronthand"], en: "Student floral trail", zh: "学员花藤作品" },
  { src: feet, categories: ["feet", "bridal"], en: "Student feet design", zh: "学员足部作品" },
];

export const studentWorkItems: GalleryItem[] = Array.from({ length: 24 }, (_, index) => {
  const base = studentWorkBases[index % studentWorkBases.length]!;
  const set = Math.floor(index / studentWorkBases.length) + 1;
  return {
    id: `student-${index + 1}`,
    src: base.src,
    width: 900,
    height: 1125,
    categories: base.categories,
    en: `${base.en} ${set}`,
    zh: `${base.zh} ${set}`,
  };
});

export const GALLERY_PAGE_SIZE = 20;
