export const SITE_CONFIG = {
  domain: 'https://manuplay.vercel.app',
  name: 'ManuPlay',
  legalName: 'ManuPlay Games Inc.',
  tagline: 'Play Free Instant Mobile & Browser Games',
  description: 'Discover and play 100+ free online browser games instantly on ManuPlay. No downloads, no installs, instant action on mobile and desktop.',
  defaultOgImage: 'https://manuplay.vercel.app/og-image.png',
  twitterHandle: '@manuplaygames',
  themeColor: '#0a0c14',
  locale: 'en_US',
  publisher: 'ManuPlay',
};

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Ensure trailing slash for root, no trailing slash for subpaths
  const trimmedPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '');
  return `${SITE_CONFIG.domain}${trimmedPath}`;
}
