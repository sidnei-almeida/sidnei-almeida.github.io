import { HERO_PORTRAIT } from '../../data/criticalAssets';
import { profile } from '../../data/profile';

type HeroPortraitProps = {
  alt: string;
};

export function HeroPortrait({ alt }: HeroPortraitProps) {
  return (
    <picture className="relative z-[1] block h-full w-full">
      <source srcSet={profile.profileImage} type={HERO_PORTRAIT.mime} />
      <img
        src={profile.profileImageFallback}
        alt={alt}
        width={HERO_PORTRAIT.width}
        height={HERO_PORTRAIT.height}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        className="h-full w-full object-contain object-bottom"
      />
    </picture>
  );
}
