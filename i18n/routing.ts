import { defineRouting } from "next-intl/routing";

// Russian keeps the plain addresses (/collections), English gets its own
// (/en/collections): search engines index each language separately, and the
// middleware adds hreflang links between the two versions.
export const routing = defineRouting({
  locales: ["ru", "en"],
  defaultLocale: "ru",
  localePrefix: "as-needed",
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
