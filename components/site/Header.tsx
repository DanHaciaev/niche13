import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu } from "./MobileMenu";

export default async function Header() {
  const t = await getTranslations("nav");

  const sections = [
    { href: "/about", label: t("menuLinks.brand") },
    { href: "/collections", label: t("menuLinks.collections") },
    { href: "/contacts", label: t("menuLinks.contacts") },
  ];

  return (
    <HeaderShell>
      {/* Below 768px: MENU · HOME with a full-screen menu */}
      <div className="md:hidden">
        <MobileMenu links={sections} menuLabel={t("menu")} homeLabel={t("home")} />
      </div>

      {/* From 768px: every link in one centred row */}
      <nav className="hidden h-14 items-center justify-center gap-[28px] px-5 md:flex">
        {[{ href: "/", label: t("home") }, ...sections].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[11px] font-medium uppercase leading-none text-ink transition-colors hover:text-ink-soft"
          >
            {link.label}
          </Link>
        ))}
        <LanguageSwitcher />
      </nav>
    </HeaderShell>
  );
}
