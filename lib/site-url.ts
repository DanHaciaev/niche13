/** The public address of the site, without a trailing slash, so that
 * `${siteUrl}/path` never produces "//path" whichever way it was entered. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
