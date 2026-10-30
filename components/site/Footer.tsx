import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteContent } from "@/lib/data/content";
import { FooterShell } from "./FooterShell";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

/** Plain caps without the site's usual extra letter-spacing, as in Figma. */
function LinkItem({ link, className = "" }: { link: FooterLink; className?: string }) {
  const cls = `whitespace-nowrap uppercase font-normal text-[#2C2C29] transition-colors hover:text-ink ${className}`;
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

export default async function Footer() {
  const t = await getTranslations("footer");
  const content = await getSiteContent(await getLocale());

  const brand: FooterLink = { href: "/about", label: t("links.brand") };
  const customize: FooterLink = { href: "/custom", label: t("links.customize") };
  const collections: FooterLink = { href: "/collections", label: t("links.collections") };
  const instagram: FooterLink = { href: content.instagramUrl, label: t("links.instagram"), external: true };
  const email: FooterLink = { href: `mailto:${content.email}`, label: t("links.email"), external: true };
  const contact: FooterLink = { href: "/contacts", label: t("links.contactUs") };

  const photo = (sizes: string) => (
    <Image src="/bottom_1.jpg" alt="Niche" fill sizes={sizes} className="object-cover" />
  );
  const madeBy = "whitespace-nowrap font-normal text-[#A1A1A1]";

  return (
    <FooterShell>
      <div className="px-5 md:px-0">
        <span aria-hidden className="block h-px bg-line" />
      </div>

      <div className="px-5 pb-6 pt-13 text-center md:pb-1 lg:pb-9 lg:pt-13">
        <h2 className="text-[10px] font-semibold uppercase text-ink md:text-[11px] md:font-normal lg:text-[13px]">
          {t("heading")}
        </h2>
        <div aria-hidden className="mt-7 flex justify-center text-ink lg:mt-10">
          <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor">
            <path d="M0 0h7L3.5 5z" />
          </svg>
        </div>
      </div>

      {/* Phones (below md), Figma at 375px: text on top; below it the photo
          141×189 on the left and a right-aligned stack of links, with
          "Made by SIMP" level with the photo's bottom. The stack keeps at
          least 18px above "Made by SIMP": if it outgrows the photo the row
          gets taller instead of the text overlapping. */}
      <div className="px-[9vw] pb-10 md:hidden">
        <p className="pl-[2.4vw] text-[12px] leading-relaxed text-[#767676]">
          {t("paragraph1")}
          <br />
          {t("paragraph2")}
        </p>

        <div className="mt-8 flex items-stretch justify-between gap-4">
          <div className="relative aspect-141/189 w-[37.6vw] shrink-0 self-start overflow-hidden">{photo("38vw")}</div>

          <div className="flex flex-col items-end justify-between gap-[18px]">
            <nav aria-label={t("heading")} className="flex flex-col items-end gap-[18px]">
              {[customize, collections, brand, email, instagram, contact].map((link) => (
                <LinkItem key={link.href} link={link} className="text-right text-[7px]" />
              ))}
            </nav>
            <span className={`${madeBy} text-[12px]`}>Made by SIMP</span>
          </div>
        </div>
      </div>

      {/* Tablets (md–lg), Figma at 768px: photo 197×256 flush with the left
          edge; text column on the right with two rows of links on a grid. */}
      <div className="hidden items-stretch pb-[4.8vw] pr-[4.6vw] md:flex lg:hidden">
        <div className="relative aspect-197/256 w-[25.65vw] shrink-0 overflow-hidden">{photo("26vw")}</div>

        <div className="ml-[11vw] flex min-w-0 flex-1 flex-col justify-between pb-[5.3vw] pt-[6.1vw]">
          <p className="text-[11px] leading-relaxed text-[#767676]">
            {t("paragraph1")} {t("paragraph2")}
          </p>

          <nav aria-label={t("heading")} className="grid grid-cols-[27.8%_29.2%_1fr_auto] items-baseline gap-y-[54px]">
            <LinkItem link={brand} className="text-[10px]" />
            <LinkItem link={collections} className="col-span-2 text-[10px]" />
            <LinkItem link={customize} className="text-right text-[10px]" />

            <LinkItem link={instagram} className="text-[10px]" />
            <LinkItem link={email} className="text-[10px]" />
            <LinkItem link={contact} className="text-[10px]" />
            <span className={`${madeBy} text-right text-[10px]`}>Made by SIMP</span>
          </nav>
        </div>
      </div>

      {/* From lg, Figma at 1280px: 65px · photo 515×298 · 72px · text column
          538px · 90px. Links on a grid so EMAIL sits under CUSTOMIZE. */}
      <div className="hidden items-stretch gap-18 pb-12 pl-[5.1vw] pr-[7.03vw] lg:flex">
        <div className="relative aspect-515/298 w-[40.23vw] shrink-0 overflow-hidden">{photo("41vw")}</div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <p className="pt-1 text-[13px] leading-relaxed text-[#767676]">
            {t("paragraph1")} {t("paragraph2")}
          </p>

          <nav
            aria-label={t("heading")}
            className="grid grid-cols-[30.9%_27.3%_1fr_auto] items-baseline gap-y-[60px] pb-0.5"
          >
            <LinkItem link={brand} className="text-[11px]" />
            <LinkItem link={customize} className="text-[11px]" />
            <LinkItem link={collections} className="col-span-2 text-right text-[11px]" />

            <LinkItem link={instagram} className="text-[11px]" />
            <LinkItem link={email} className="text-[11px]" />
            <LinkItem link={contact} className="text-[11px]" />
            <span className={`${madeBy} text-right text-[11px]`}>Made by SIMP</span>
          </nav>
        </div>
      </div>
    </FooterShell>
  );
}
