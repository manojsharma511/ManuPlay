import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  slug?: string;
  image?: string;
  category?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  slug,
  image = 'https://manuplay.app/og-image.png',
  category
}) => {
  useEffect(() => {
    // Set Document Title
    const fullTitle = `${title} | ManuPlay — Play Instant Mobile Web Games`;
    document.title = fullTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update OpenGraph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);
  }, [title, description, slug, image, category]);

  return null;
};
