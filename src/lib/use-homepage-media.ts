import heroPoster from "@/assets/hero-hand.jpg";
import heroVideoAsset from "@/assets/hero-mehndi.mp4.asset.json";
const heroVideo = heroVideoAsset.url;
import demoPoster from "@/assets/hero-hand.jpg";
const demoVideo = heroVideoAsset.url;
import aboutDefault from "@/assets/about-henna.jpg";
import { useLanguage } from "@/i18n/language-context";
import { optionalMediaUrl, resolveMediaUrl } from "@/lib/media-url";

// NOTE: these three readers are deliberately independent.
//  - Hero          → homepage document, `hero.media`
//  - Homepage Watch→ homepage document, `video`
//  - Homepage About→ homepage document, `about`
// The About *page* "Behind the Scenes" video lives in its own `about`
// document (see src/lib/about-content.ts) and must never be read from here.

export function useHeroMedia() {
  const { locale, homeOverrides } = useLanguage();
  const media = homeOverrides[locale]?.hero?.media;
  return {
    videoUrl: resolveMediaUrl(media?.videoUrl, heroVideo),
    posterUrl: resolveMediaUrl(media?.posterUrl, heroPoster),
    imageUrl: resolveMediaUrl(media?.imageUrl, heroPoster),
    imageMode: media?.imageMode ?? false,
  };
}

export function useAboutMedia() {
  const { locale, homeOverrides } = useLanguage();
  const about = homeOverrides[locale]?.about;
  return {
    imageUrl: resolveMediaUrl(about?.imageUrl, aboutDefault),
    videoUrl: optionalMediaUrl(about?.videoUrl),
    posterUrl: optionalMediaUrl(about?.posterUrl),
  };
}

export function useVideoMedia() {
  const { locale, homeOverrides } = useLanguage();
  const video = homeOverrides[locale]?.video;
  return {
    videoUrl: resolveMediaUrl(video?.videoUrl, demoVideo),
    posterUrl: resolveMediaUrl(video?.posterUrl, demoPoster),
  };
}
