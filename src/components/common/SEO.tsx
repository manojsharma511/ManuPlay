import React, { useEffect } from 'react';
import { SITE_CONFIG, getCanonicalUrl } from '../../config/site';

export interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'game';
  noindex?: boolean;
  breadcrumbs?: Array<{ label: string; url?: string }>;
  gameData?: {
    name: string;
    description: string;
    category: string;
    rating?: number;
    operatingSystem?: string;
    author?: string;
    plays?: number;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path = '',
  image = SITE_CONFIG.defaultOgImage,
  type = 'website',
  noindex = false,
  breadcrumbs,
  gameData
}) => {
  const canonicalUrl = getCanonicalUrl(path);
  const fullTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;

  useEffect(() => {
    // 1. Document Title
    document.title = fullTitle;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function to update link tags
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Primary Meta Tags
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Canonical URL
    updateLinkTag('canonical', canonicalUrl);

    // 4. Open Graph / Facebook
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', type === 'game' ? 'website' : type);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_CONFIG.name);

    // 5. Twitter / X Cards
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    if (SITE_CONFIG.twitterHandle) {
      updateMetaTag('meta[name="twitter:site"]', 'name', 'twitter:site', SITE_CONFIG.twitterHandle);
    }

    // 6. JSON-LD Structured Data Injection
    const jsonLdObjects: object[] = [];

    // WebSite & Organization
    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': SITE_CONFIG.name,
      'url': SITE_CONFIG.domain,
      'description': SITE_CONFIG.description,
      'publisher': {
        '@type': 'Organization',
        'name': SITE_CONFIG.legalName,
        'url': SITE_CONFIG.domain,
        'logo': `${SITE_CONFIG.domain}/favicon.svg`
      }
    });

    // BreadcrumbList Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      const itemListElement = [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': SITE_CONFIG.domain
        },
        ...breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          'position': idx + 2,
          'name': b.label,
          ...(b.url ? { 'item': getCanonicalUrl(b.url) } : {})
        }))
      ];

      jsonLdObjects.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': itemListElement
      });
    }

    // SoftwareApplication / VideoGame Schema (matching real visible content without fake reviews)
    if (gameData) {
      jsonLdObjects.push({
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        'name': gameData.name,
        'description': gameData.description,
        'url': canonicalUrl,
        'image': image,
        'genre': gameData.category,
        'gamePlatform': ['Web Browser', 'Mobile Browser', 'Desktop Browser'],
        'applicationCategory': 'Game',
        'operatingSystem': gameData.operatingSystem || 'Any',
        'author': {
          '@type': 'Organization',
          'name': gameData.author || SITE_CONFIG.name,
          'url': SITE_CONFIG.domain
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        }
      });
    }

    // Inject JSON-LD Script
    let scriptTag = document.querySelector('script[id="json-ld-schema"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('id', 'json-ld-schema');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLdObjects, null, 2);

  }, [fullTitle, description, canonicalUrl, image, type, noindex, breadcrumbs, gameData]);

  return null;
};
