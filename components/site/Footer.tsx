import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FooterShell } from "./FooterShell";

export default async function Footer() {
  const t = await getTranslations("footer");

  const links: {
    href: string;
    label: string;
    external?: boolean;
    pos: string;
  }[] = [
      { href: "/custom", label: t("links.customize"), pos: "md:col-start-4 md:row-start-1" },
      { href: "/collections", label: t("links.collections"), pos: "md:col-start-2 md:row-start-3" },
      { href: "/about", label: t("links.brand"), pos: "md:col-start-4 md:row-start-3" },
      { href: "mailto:hello@niche.com", label: t("links.email"), external: true, pos: "md:col-start-3 md:row-start-2" },
      { href: "https://instagram.com", label: t("links.instagram"), external: true, pos: "md:col-start-1 md:row-start-4" },
      { href: "/contacts", label: t("links.contactUs"), pos: "md:col-start-2 md:row-start-4" },
    ];

  function LinkItem({
    link,
    className = "",
  }: {
    link: (typeof links)[number];
    className?: string;
  }) {
    const cls = `label-tag whitespace-nowrap text-[11px]! text-right text-ink-soft transition-colors hover:text-ink md:text-[12px]! lg:text-[15px]! ${className}`;
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
    <FooterShell>
      <div className="px-5 md:px-8 md:px-12">
        <span aria-hidden className="block h-px bg-line" />
      </div>

      <div className="px-5 pb-10 pt-16 text-center md:px-8 md:pt-24 md:pb-8 md:px-12">
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
      <div className="px-5 pb-16 md:px-8 md:hidden">
        <p className="max-w-full text-[18px] leading-relaxed text-[#767676]! text-ink-soft">
          {t("paragraph1")}
          <br />
          {t("paragraph2")}
        </p>

        <div className="mt-8 flex items-stretch justify-between gap-6">
          <div className="relative w-[50%] shrink-0 overflow-hidden">
            <Image
              src="/bottom_1.jpg"
              alt="Niche"
              fill
              sizes="50vw"
              className="object-cover"
            />
          </div>

          <nav aria-label={t("heading")} className="flex flex-col items-end gap-3 pt-1">
            {links.map((link) => (
              <LinkItem key={link.href} link={link} />
            ))}
            <span className="label-tag whitespace-nowrap text-right pt-5 text-[11px]! md:text-[12px]! lg:text-[15px]! text-ink-faint md:text-xs!">
              Made by SIMP
            </span>
          </nav>
        </div>
      </div>

      {/* Desktop: photo pinned far left, paragraph + scattered links on the right */}
      <div className="hidden md:flex md:flex-row pb-20 gap-12 md:pr-12 lg:pl-12">
        <div className="relative h-96 w-[27%] -translate-y-5 shrink-0 overflow-hidden">
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

          <nav aria-label={t("heading")} className="flex flex-col gap-10">
            <div
              className="grid gap-x-2 gap-y-10 text-center"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, auto))", gridAutoRows: "minmax(1.5rem, auto)" }}
            >
              {links
                .filter((link) => !link.pos.includes("row-start-4"))
                .map((link) => (
                  <LinkItem key={link.href} link={link} className={link.pos} />
                ))}
            </div>

            <div className="flex items-center justify-between">
              {links
                .filter((link) => link.pos.includes("row-start-4"))
                .map((link) => (
                  <LinkItem key={link.href} link={link} />
                ))}
              <span className="label-tag whitespace-nowrap text-[11px]! text-right text-ink-faint md:text-[12px]! lg:text-[15px]!">
                Made by SIMP
              </span>
            </div>
          </nav>
        </div>
      </div>
    </FooterShell>
  );
}
