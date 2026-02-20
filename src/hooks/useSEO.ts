import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE = 'https://bravosbrasil.com.br/og-image.jpg';
const SITE_NAME = 'GEEKERIA';
const BASE_URL = 'https://bravosbrasil.com.br';

export function useSEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper para setar/criar meta tags
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrValue] = attr.split('=');
        el.setAttribute(attrName.replace('[', '').replace(']', ''), attrValue.replace(/"/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Helper para setar/criar link tags
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Robots
    setMeta('meta[name="robots"]', 'name="robots"', noindex ? 'noindex, nofollow' : 'index, follow');

    // Description
    setMeta('meta[name="description"]', 'name="description"', description);

    // Canonical
    if (canonical) {
      setLink('canonical', `${BASE_URL}${canonical}`);
    }

    // Open Graph
    setMeta('meta[property="og:title"]', 'property="og:title"', title);
    setMeta('meta[property="og:description"]', 'property="og:description"', description);
    setMeta('meta[property="og:image"]', 'property="og:image"', ogImage);
    setMeta('meta[property="og:url"]', 'property="og:url"', canonical ? `${BASE_URL}${canonical}` : BASE_URL);
    setMeta('meta[property="og:type"]', 'property="og:type"', ogType);
    setMeta('meta[property="og:site_name"]', 'property="og:site_name"', SITE_NAME);

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'name="twitter:card"', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name="twitter:title"', title);
    setMeta('meta[name="twitter:description"]', 'name="twitter:description"', description);
    setMeta('meta[name="twitter:image"]', 'name="twitter:image"', ogImage);
  }, [title, description, canonical, ogImage, ogType, noindex]);
}
