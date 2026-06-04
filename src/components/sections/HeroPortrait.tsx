import { HERO_PORTRAIT } from '../../data/criticalAssets';
import { profile } from '../../data/profile';

type HeroPortraitProps = {
  alt: string;
};

export function HeroPortrait({ alt }: HeroPortraitProps) {
  return (
    <img
      src={profile.profileImage}
      alt={alt}
      width={HERO_PORTRAIT.width}
      height={HERO_PORTRAIT.height}
      loading="eager"
      fetchPriority="high"
      decoding="sync"
      className="relative z-[1] h-full w-full object-contain object-bottom"
    />
  );
}
