import type { CookieOptionsWithName } from "@supabase/ssr";

/** Admin session cookies. The admin never talks to Supabase from the
 * browser, so the tokens can be httpOnly: unreadable by any script on the
 * page, which takes session theft via XSS off the table. */
export const sessionCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
