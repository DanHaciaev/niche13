import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Footer() {
  const t = await getTranslations("footer");

  const links: {
    href: string;
    label: string;
    external?: boolean;
    pos: string;
  }[] = [
      { href: "/custom", label: t("links.customize"), pos: "lg:col-start-4 lg:row-start-1" },
      { href: "https://instagram.com", label: t("links.instagram"), external: true, pos: "lg:col-start-3 lg:row-start-2" },
      { href: "/catalog", label: t("links.collections"), pos: "lg:col-start-2 lg:row-start-3" },
      { href: "/about", label: t("links.brand"), pos: "lg:col-start-4 lg:row-start-3" },
      { href: "/checkout", label: t("links.orderRequest"), pos: "lg:col-start-1 lg:row-start-4" },
      { href: "/contacts", label: t("links.contactUs"), pos: "lg:col-start-2 lg:row-start-4" },
      { href: "mailto:hello@niche.com", label: t("links.email"), external: true, pos: "lg:col-start-3 lg:row-start-4" },
    ];

  function LinkItem({
    link,
    className = "",
  }: {
    link: (typeof links)[number];
    className?: string;
  }) {
    const cls = `label-tag whitespace-nowrap text-[11px]! text-right text-ink-soft transition-colors hover:text-ink sm:text-xs! lg:text-[15px]! ${className}`;
    return link.external ? (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {link.label}
      </a>
    ) : (
      <Link href={link.href} className={cls}>
        {link.label}
      </Link>
    );
  }

  return (
    <footer>
      <div className="px-5 sm:px-8 lg:px-12">
        <span aria-hidden className="block h-px bg-black/40" />
      </div>

      <div className="px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24 lg:pb-8 lg:px-12">
        <h2 className="label-tag text-ink text-base">{t("heading")}</h2>
        <div aria-hidden className="mt-6 flex justify-center text-ink-faint">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Mobile / tablet: photo left, clean right-aligned link stack */}
      <div className="px-5 pb-16 sm:px-8 lg:hidden">
        <p className="max-w-xs text-[18px] leading-relaxed text-ink-soft">
          {t("paragraph1")}
          <br />
          {t("paragraph2")}
        </p>

        <div className="mt-8 flex items-start justify-between gap-6">
          <div className="relative aspect-141/189 w-32 shrink-0 overflow-hidden sm:w-40">
            <Image
              src="/bottom_1.jpg"
              alt="Niche"
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>

          <nav aria-label={t("heading")} className="flex flex-col items-end gap-5 pt-1">
            {links.map((link) => (
              <LinkItem key={link.href} link={link} />
            ))}
            <span className="label-tag whitespace-nowrap text-right text-[11px]! text-ink-faint sm:text-xs!">
              Made by SIMP
            </span>
          </nav>
        </div>
      </div>

      {/* Desktop: photo pinned far left, paragraph + scattered links on the right */}
      <div className="flex flex-row pb-20 gap-12 lg:px-12">
        <div className="relative aspect-429/307 w-[27%] shrink-0 overflow-hidden">
          <Image
            src="/bottom_1.jpg"
            alt="Niche"
            fill
            sizes="27vw"
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <p className="max-w-sm text-[18px] leading-relaxed text-ink-soft">
            {t("paragraph1")}
            <br />
            {t("paragraph2")}
          </p>

          <nav
            aria-label={t("heading")}
            className="mt-14 grid grid-cols-4 gap-y-10 text-center"
            style={{ gridAutoRows: "1.5rem" }}
          >
            {links.map((link) => (
              <LinkItem key={link.href} link={link} className={link.pos} />
            ))}
            <span className="label-tag whitespace-nowrap text-[11px]! text-right text-ink-faint sm:text-xs! lg:col-start-4 lg:row-start-4 lg:text-[15px]!">
              Made by SIMP
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
