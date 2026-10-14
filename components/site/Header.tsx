import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import NavDrawer from "./NavDrawer";
import { HeaderShell } from "./HeaderShell";

export default async function Header() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/about", label: t("menuLinks.brand") },
    { href: "/collections", label: t("menuLinks.collections") },
    { href: "/custom", label: t("menuLinks.customize") },
    { href: "/contacts", label: t("menuLinks.contacts") },
  ] as const;

  return (
    <HeaderShell>
      <div className="mx-auto flex h-20 max-w-full items-center justify-between px-5">
        <div className="relative z-50 flex items-center gap-8">
          <Link
            href="/"
            className="label-tag relative z-50 text-[12px]! text-ink font-medium! transition-colors hover:text-ink-soft"
          >
            {t("home")}
          </Link>
          <NavDrawer links={links} menuLabel={t("menu")} closeLabel={t("close")} />
        </div>

        <div className="relative z-50">
          <LanguageSwitcher />
        </div>
      </div>
    </HeaderShell>
  );
}
