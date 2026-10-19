import { serviceClient } from "@/lib/supabase/service";
import { hashValue } from "@/lib/security/ip";

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i;
const PATH_PATTERN = /^\/[A-Za-z0-9/_-]{0,200}$/;

/** Records one page view. Always answers 204 — even on bad input — so the
 * endpoint reveals nothing to someone probing it. Visitors are counted with
 * a hash that changes daily and cannot be traced back to an IP address. */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_PATTERN.test(ua)) return done;

  // sendBeacon posts from the same origin; anything else is not our page.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return done;

  let body: { path?: unknown; locale?: unknown };
  try {
    body = JSON.parse((await request.text()).slice(0, 1000));
  } catch {
    return done;
  }

  const path = typeof body.path === "string" ? body.path : "";
  if (!PATH_PATTERN.test(path) || path.startsWith("/admin")) return done;
  const locale = body.locale === "en" ? "en" : "ru";

  const supabase = serviceClient();
  if (!supabase) return done;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const visitor = hashValue(`${day}:${ip}:${ua}`).slice(0, 32);

  const { error } = await supabase.from("page_views").insert({ path, locale, visitor });
  if (error) console.error("[track] insert failed", error);

  return done;
}
