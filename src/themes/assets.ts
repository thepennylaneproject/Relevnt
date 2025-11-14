/**
 * ============================================================================
 * RELEVNT BRAND ASSETS CONFIGURATION
 * ============================================================================
 * 🎨 PURPOSE: Single source of truth for all brand assets
 * 
 * Organized by:
 * - Asset type (backgrounds, illustrations, icons, logos)
 * - Theme mode (light/dark)
 * - Version (v1, v2, v3, v4)
 * 
 * 📍 Location: Cloudinary CDN (sarah-sahl account)
 * Format: WebP (primary) + PNG (backup) for backgrounds
 *        SVG for illustrations and icons (vector, scalable)
 * 
 * 🎯 Usage: import { assets } from '@/config/assetConfig'
 *           then: assets.backgrounds.dark.v1, assets.illustrations.light.v2, etc.
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AssetUrl {
  webp?: string;
  png?: string;
  svg?: string;
  primary?: string; // Primary format to use
}

export interface ThemeAssets {
  v1?: AssetUrl;
  v2?: AssetUrl;
  v3?: AssetUrl;
  v4?: AssetUrl;
}

export interface ModeAssets {
  light: ThemeAssets;
  dark: ThemeAssets;
}

export interface BrandAssets {
  backgrounds: ModeAssets;
  illustrations: ModeAssets;
  icons: ModeAssets;
  logos: ModeAssets;
}

// ============================================================================
// BACKGROUND TEXTURES (Full-page backgrounds)
// ============================================================================
// 
// 📐 Size: 1750x3200px
// 🎨 Usage: Page backgrounds (pages/DashboardPage, pages/JobsPage, etc)
// 💡 Best Practice: Use as CSS background-image or img with fixed position
//
// Light Mode: Subtle, neutral, supports readability
// Dark Mode: Rich, sophisticated, reduces eye strain
//
const backgrounds: ModeAssets = {
  light: {
    v1: {
      webp: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661676/background_light_v1_fzem3u.webp',
      png: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661632/background_light_v1_rrgbyh.png',
      primary: 'webp',
    },
    v2: {
      webp: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661680/background_light_v2_i0vrge.webp',
      png: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661627/background_light_v2_r2kyo4.png',
      primary: 'webp',
    },
  },
  dark: {
    v1: {
      webp: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661679/background_dark_v1_m8ectk.webp',
      png: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661630/background_dark_v1_t4olc6.png',
      primary: 'webp',
    },
    v2: {
      webp: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661676/background_dark_v2_v8kosd.webp',
      png: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661631/background_dark_v2_o8zkwr.png',
      primary: 'webp',
    },
  },
};

// ============================================================================
// SPOT ILLUSTRATIONS (Page accents, 200x200px)
// ============================================================================
//
// 📐 Size: 200x200px each
// 🎨 Usage: Page headers, cards, empty states, feature highlights
// 💡 Best Practice: Use 1-2 illustrations per page for visual interest
//
// Light Mode: Bright, welcoming, energetic colors
// Dark Mode: Muted, sophisticated, better for dark backgrounds
//
// Recommendations by page:
//   HomePage: illustrations.light.v1 + v2
//   DashboardPage: illustrations[mode].v1 (primary intro)
//   ResumesPage: illustrations[mode].v2 (for empty state)
//   JobsPage: illustrations[mode].v3 (for search/discovery)
//   ApplicationsPage: illustrations[mode].v4 (for tracking)
//
const illustrations: ModeAssets = {
  light: {
    v1: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661522/illustration_light_v1_qmzj7e.svg',
      primary: 'svg',
    },
    v2: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661521/illustration_light_v2_fcqvgv.svg',
      primary: 'svg',
    },
    v3: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661521/illustration_light_v3_kyjv7g.svg',
      primary: 'svg',
    },
    v4: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661521/illustration_light_v4_o7ceqn.svg',
      primary: 'svg',
    },
  },
  dark: {
    v1: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661523/illustration_dark_v1_sbft3c.svg',
      primary: 'svg',
    },
    v2: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661523/illustration_dark_v2_zvq50m.svg',
      primary: 'svg',
    },
    v3: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661522/illustration_dark_v3_fdw9ho.svg',
      primary: 'svg',
    },
    v4: {
      svg: 'https://res.cloudinary.com/sarah-sahl/image/upload/v1762661522/illustration_dark_v4_ydcsnr.svg',
      primary: 'svg',
    },
  },
};

// ============================================================================
// ICONS (Placeholder - add as needed)
// ============================================================================
// 
// These will be added as SVG icon components in src/components/icons/
// Examples: check, cross, alert, info, help, settings, etc.
//
const icons: ModeAssets = {
  light: {},
  dark: {},
};

// ============================================================================
// LOGOS (Placeholder - add as needed)
// ============================================================================
// 
// Relevnt logo variants for header, footer, etc.
// Examples: full-logo, icon-only, text-only, etc.
//
const logos: ModeAssets = {
  light: {},
  dark: {},
};

// ============================================================================
// EXPORT
// ============================================================================

export const assets: BrandAssets = {
  backgrounds,
  illustrations,
  icons,
  logos,
};

/**
 * 🎯 USAGE PATTERNS
 * 
 * Pattern 1: Get asset for current mode
 * ─────────────────────────────────────
 * import { assets } from '@/config/assetConfig'
 * import { useTheme } from '@/contexts/useTheme'
 * 
 * export function MyComponent() {
 *   const { mode } = useTheme()  // 'light' or 'dark'
 *   
 *   const bgUrl = assets.backgrounds[mode].v1[assets.backgrounds[mode].v1.primary]
 *   const illusUrl = assets.illustrations[mode].v2[assets.illustrations[mode].v2.primary]
 *   
 *   return (
 *     <div style={{ backgroundImage: `url(${bgUrl})` }}>
 *       <img src={illusUrl} alt="decorative illustration" />
 *     </div>
 *   )
 * }
 * 
 * 
 * Pattern 2: Create a helper function (recommended)
 * ──────────────────────────────────────────────────
 * export function getAsset(
 *   assetType: 'backgrounds' | 'illustrations',
 *   version: 'v1' | 'v2' | 'v3' | 'v4',
 *   mode?: 'light' | 'dark'
 * ): string {
 *   const { mode: currentMode } = useTheme()
 *   const targetMode = mode || currentMode
 *   const asset = assets[assetType][targetMode][version]
 *   const format = asset.primary || 'webp'
 *   return asset[format] || ''
 * }
 * 
 * // Usage:
 * <img src={getAsset('illustrations', 'v2')} alt="illustration" />
 * <div style={{ backgroundImage: `url(${getAsset('backgrounds', 'v1')})` }} />
 * 
 * 
 * Pattern 3: Use with CSS (for backgrounds)
 * ──────────────────────────────────────────
 * const bgUrl = assets.backgrounds.light.v1.webp
 * 
 * return (
 *   <div style={{
 *     backgroundImage: `url(${bgUrl})`,
 *     backgroundSize: 'cover',
 *     backgroundPosition: 'center',
 *     backgroundAttachment: 'fixed', // parallax effect
 *     minHeight: '100vh',
 *   }}>
 *     
 *
 * 
 * //
 * 🎨 RECOMMENDED USAGE BY PAGE
  * ────────────────────────────
 * 
 * HomePage.tsx:
 * - Background: assets.backgrounds[mode].v1
  * - Illustrations: v1 + v2 for feature cards
    * 
 * DashboardPage.tsx:
 * - Background: assets.backgrounds[mode].v1(subtle)
  * - Illustrations: v1(primary dashboard hero)
    * 
 * ResumesPage.tsx:
 * - Background: assets.backgrounds[mode].v2
  * - Illustrations: v2(for empty state or upload prompt)
 * 
 * JobsPage.tsx:
 * - Background: assets.backgrounds[mode].v2
  * - Illustrations: v3(for search / discovery theme)
 * 
 * ApplicationsPage.tsx:
 * - Background: assets.backgrounds[mode].v1
  * - Illustrations: v4(for tracking / progress)
 * 
 * LoginPage.tsx:
 * - Background: assets.backgrounds[mode].v2(different from homepage)
  * - Illustrations: none(keep minimal / focused)
    * 
 * SignupPage.tsx:
 * - Background: assets.backgrounds[mode].v1
  * - Illustrations: v1(welcoming, friendly)
    */

// ============================================================================
// HELPER FUNCTION (Optional but recommended)
// ============================================================================

/**
 * Get the URL for a specific asset based on mode
 * 
 * @example
 * const bgUrl = getAssetUrl('backgrounds', 'v1', 'light')
 * const illusUrl = getAssetUrl('illustrations', 'v2')  // uses theme context
 */
export function getAssetUrl(
  assetType: 'backgrounds' | 'illustrations' | 'icons' | 'logos',
  version: 'v1' | 'v2' | 'v3' | 'v4' = 'v1',
  mode?: 'light' | 'dark'
): string {
  const asset = assets[assetType][mode || 'light']?.[version];
  if (!asset) {
    console.warn(`Asset not found: ${assetType}.${version}.${mode || 'light'}`);
    return '';
  }

  const format = asset.primary || 'webp';
  const url = asset[format as keyof AssetUrl];

  if (!url) {
    console.warn(`Format ${format} not available for ${assetType}.${version}`);
    return '';
  }

  return url as string;
}

// ============================================================================
// CLOUDINARY OPTIMIZATION TIPS
// ============================================================================
//
// You can modify Cloudinary URLs for optimization:
//
// 1. Resize: /w_400/ (width 400px)
//    https://res.cloudinary.com/sarah-sahl/image/upload/w_400/v1762661676/background_light_v1_fzem3u.webp
//
// 2. Quality: /q_70/ (70% quality, smaller file)
//    https://res.cloudinary.com/sarah-sahl/image/upload/q_70/v1762661676/background_light_v1_fzem3u.webp
//
// 3. Auto format: /f_auto/ (serve best format for browser)
//    https://res.cloudinary.com/sarah-sahl/image/upload/f_auto/v1762661676/background_light_v1_fzem3u.webp
//
// 4. Combine: /f_auto,q_70,w_800/
//    https://res.cloudinary.com/sarah-sahl/image/upload/f_auto,q_70,w_800/v1762661676/background_light_v1_fzem3u.webp
//
// For best performance on backgrounds:
// - Use: /f_auto,q_80,w_1920/
// 
// For illustrations (don't resize SVG):
// - Use: /f_auto/ only
