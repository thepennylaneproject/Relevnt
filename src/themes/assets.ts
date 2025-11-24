/**
 * ============================================================================
 * RELEVNT BRAND ASSETS CONFIGURATION
 * ============================================================================
 * 🎨 PURPOSE: Complete visual asset library for Relevnt
 *
 * Asset Types:
 * - Hero: Large header images (16:9 aspect ratio, ~1200x675px)
 * - FeatureCard: Medium showcase images (4:5 aspect ratio, ~400x500px)
 * - Illustration: Spot illustrations (1:1 aspect ratio, ~200x200px)
 * - Background: Full-page backgrounds (9:16 aspect ratio, ~540x960px)
 *
 * Each asset has light and dark mode variants
 *
 * 📍 Location: Cloudinary CDN (sarah-sahl account)
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AssetType = 'Hero' | 'FeatureCard' | 'Illustration' | 'Background';

/**
 * Single Asset URL entry for a specific mode
 */
interface ModeAsset {
  light: string;  // Cloudinary URL optimized for light mode
  dark: string;   // Cloudinary URL optimized for dark mode
}

/**
 * Asset library structure
 */
interface AssetLibrary {
  hero: ModeAsset;
  featureCard: ModeAsset;
  illustration: ModeAsset;
  background: ModeAsset;
}

// ============================================================================
// CLOUDINARY ASSETS
// ============================================================================

const ASSETS: AssetLibrary = {
  // =========================================================================
  // HERO: Large header images (16:9 aspect ratio, ~1200x675px)
  // =========================================================================
  // Used for: Page headers, hero sections with overlaid text
  hero: {
    light: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661670/hero_light_v1_dkqtvi.webp',
    dark: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661673/hero_dark_v1_qnuggu.webp',
  },

  // =========================================================================
  // FEATURE CARD: Medium showcase images (4:5 aspect ratio, ~400x500px)
  // =========================================================================
  // Used for: Feature cards, product showcase, grid layouts
  featureCard: {
    light: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661669/feature_light_v1_nca7mc.webp',
    dark: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661680/feature_dark_v1_xeskqz.webp',
  },

  // =========================================================================
  // ILLUSTRATION: Spot illustrations (1:1 aspect ratio, ~200x200px)
  // =========================================================================
  // Used for: Decorative icons, inline graphics, accent elements
  illustration: {
    light: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661521/illustration_light_v3_kyjv7g.svg',
    dark: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661522/illustration_dark_v3_fdw9ho.svg',
  },

  // =========================================================================
  // BACKGROUND: Full-page backgrounds (9:16 aspect ratio, ~540x960px)
  // =========================================================================
  // Used for: Page background textures, full-height backgrounds
  background: {
    light: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661680/background_light_v2_i0vrge.webp',
    dark: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661676/background_dark_v2_v8kosd.webp',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get asset URL for given type and mode
 *
 * @param assetType - Which asset category to fetch
 * @param mode - 'light' or 'dark'
 * @returns Cloudinary URL for the requested asset
 */
export function getAsset(assetType: AssetType, mode: 'light' | 'dark'): string {
  const lowerType = assetType.toLowerCase() as keyof AssetLibrary;
  const asset = ASSETS[lowerType];

  if (!asset) {
    console.warn(
      `⚠️ Asset not found: "${assetType}". ` +
      `Available assets: ${Object.keys(ASSETS).join(', ')}`
    );
    return '';
  }

  const url = asset[mode];

  if (!url) {
    console.warn(
      `⚠️ Asset mode not found: "${assetType}" in "${mode}" mode.`
    );
    return '';
  }

  return url;
}

/**
 * Get all assets for a specific mode (useful for preloading)
 */
export function getAllAssets(mode: 'light' | 'dark'): Record<string, string> {
  return {
    hero: ASSETS.hero[mode],
    featureCard: ASSETS.featureCard[mode],
    illustration: ASSETS.illustration[mode],
    background: ASSETS.background[mode],
  };
}

/**
 * Get both light and dark variants of an asset type
 */
export function getAssetVariants(assetType: AssetType): ModeAsset {
  const lowerType = assetType.toLowerCase() as keyof AssetLibrary;
  const asset = ASSETS[lowerType];

  if (!asset) {
    console.error(`Asset type not found: ${assetType}`);
    return {
      light: '',
      dark: '',
    };
  }

  return asset;
}

// ============================================================================
// EXPORT
// ============================================================================

export const assets = ASSETS;
export type { AssetLibrary, ModeAsset };

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * 1. Direct asset retrieval:
 * ```tsx
 * import { getAsset } from '@/themes/assets';
 *
 * const heroUrl = getAsset('Hero', 'light');
 * return <img src={heroUrl} alt="Hero" />;
 * ```
 *
 * 2. With theme hook:
 * ```tsx
 * import { useRelevntColors } from '@/hooks/useRelevntColors';
 * import { getAsset } from '@/themes/assets';
 *
 * function Component() {
 *   const colors = useRelevntColors();
 *   const mode = colors.background === '#1A1A1A' ? 'dark' : 'light';
 *   const heroUrl = getAsset('Hero', mode);
 *
 *   return <img src={heroUrl} alt="Hero" />;
 * }
 * ```
 *
 * 3. Get both variants:
 * ```tsx
 * import { getAssetVariants } from '@/themes/assets';
 *
 * const hero = getAssetVariants('Hero');
 * // hero.light and hero.dark
 * ```
 *
 * ============================================================================
 * RECOMMENDED USAGE BY PAGE
 * ============================================================================
 *
 * HomePage:
 * - Hero: Main header
 * - FeatureCard: Feature showcase sections
 * - Background: Page background
 *
 * DashboardPage:
 * - Hero: Welcome header
 * - Background: Page background
 *
 * JobsPage / ResumesPage / ApplicationsPage:
 * - Hero: Page header
 * - Background: Page background
 * - Illustration: Empty states, inline accents
 *
 * LoginPage / SignupPage:
 * - Hero: Form header
 * - Background: Page background
 */
