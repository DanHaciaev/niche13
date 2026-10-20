import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { HeaderShell } from "./HeaderShell";

export default async function Header() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("menuLinks.brand") },
    { href: "/collections", label: t("menuLinks.collections") },
    { href: "/contacts", label: t("menuLinks.contacts") },
  ] as const;

  return (
    <HeaderShell>
      <nav className="flex h-14 items-center justify-center gap-[26px] px-5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[9px] font-medium uppercase leading-none text-ink transition-colors hover:text-ink-soft"
          >
            {link.label}
          </Link>
        ))}
        <LanguageSwitcher />
      </nav>
    </HeaderShell>
  );
}
