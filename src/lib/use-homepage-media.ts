import heroPoster from "@/assets/hero-hand.jpg";
import heroVideoAsset from "@/assets/hero-mehndi.mp4.asset.json";
const heroVideo = heroVideoAsset.url;
import demoPoster from "@/assets/hero-hand.jpg";
const demoVideo = heroVideoAsset.url;
import aboutDefault from "@/assets/about-henna.jpg";
import { useLanguage } from "@/i18n/LanguageProvider";

export function useHeroMedia() {
  const { locale, homeOverrides } = useLanguage();
  const media = homeOverrides[locale]?.hero?.media;
  return {
    videoUrl: media?.videoUrl ?? heroVideo,
    posterUrl: media?.posterUrl ?? heroPoster,
    imageUrl: media?.imageUrl ?? heroPoster,
    imageMode: media?.imageMode ?? false,
  };
}

export function useAboutMedia() {
  const { locale, homeOverrides } = useLanguage();
  const about = homeOverrides[locale]?.about;
  return {
    imageUrl: about?.imageUrl ?? aboutDefault,
    videoUrl: about?.videoUrl,
    posterUrl: about?.posterUrl,
  };
}

export function useVideoMedia() {
  const { locale, homeOverrides } = useLanguage();
  const video = homeOverrides[locale]?.video;
  return {
    videoUrl: video?.videoUrl ?? demoVideo,
    posterUrl: video?.posterUrl ?? demoPoster,
  };
}
