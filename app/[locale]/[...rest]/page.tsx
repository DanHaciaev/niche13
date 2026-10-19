import { notFound } from "next/navigation";

// Catches every URL that doesn't match a real route so it renders the
// localized not-found page inside the [locale] layout (header, footer, fonts).
export default function CatchAllPage() {
  notFound();
}
