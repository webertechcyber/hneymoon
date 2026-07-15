// HONEYMOON — Dynamic SEO hook
// Sets page-specific meta tags for all search engines
import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  noIndex?: boolean;
}

const BASE_TITLE = "HONEYMOON";
const BASE_URL = "https://honeymoon.kuomoka.co.ke";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

export function useSEO({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  noIndex = false,
}: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — The World's Relationship & Opportunity Platform`;
    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    // Document title
    document.title = fullTitle;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Basic
    if (description) setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    setMeta("og:title", fullTitle, true);
    if (description) setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:url", fullUrl, true);

    // Twitter
    setMeta("twitter:title", fullTitle);
    if (description) setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setMeta("twitter:url", fullUrl);

    // Canonical
    setLink("canonical", fullUrl);
  }, [title, description, keywords, image, url, noIndex]);
}

export default useSEO;
