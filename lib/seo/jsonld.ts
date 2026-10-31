import type { Product } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/site-url";

const absolute = (src: string) => (src.startsWith("http") ? src : `${siteUrl}${src}`);

/** Brand card for the home page: name, logo and the Instagram profile. */
export function organizationJsonLd(name: string, instagramUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    ...(instagramUrl ? { sameAs: [instagramUrl] } : {}),
  };
}

/** Product data search engines can show as a rich result (photo, price,
 * availability). The offer is left out while a product has no price. */
export function productJsonLd({
  product,
  name,
  description,
  url,
  brand,
}: {
  product: Product;
  name: string;
  description: string;
  url: string;
  brand: string;
}) {
  const price = product.discountPrice ?? product.price;
  const hasOffer = price !== null && /^[A-Z]{3}$/.test(product.currency);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.code,
    ...(description ? { description } : {}),
    image: product.images.map(absolute),
    brand: { "@type": "Brand", name: brand },
    ...(hasOffer
      ? {
          offers: {
            "@type": "Offer",
            url,
            price,
            priceCurrency: product.currency,
            availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
