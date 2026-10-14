import Image from "next/image";
import { Link } from "@/i18n/navigation";

type FormT = (key: string) => string;

function TextField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag text-[11px]! text-ink md:text-xs! lg:text-sm!">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="border-b border-ink/30 bg-transparent pb-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function TextareaField({
  label,
  placeholder,
  rows = 2,
}: {
  label: string;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag text-[11px]! text-ink md:text-xs! lg:text-sm! ml-auto md:ml-0">
        {label}
      </span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="resize-none border-b border-ink/30 bg-transparent pb-3 text-xs leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none md:text-sm"
      />
    </label>
  );
}

export function CustomDesignForm({ t, heading }: { t: FormT; heading: string }) {
  return (
    <div className="relative mx-12 mb-20 bg-[#cfcecb] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
      <h2 className="absolute -top-7   left-0 text-[40px] md:text-[64px] md:-top-12 font-medium uppercase text-ink xl:-top-18 xl:text-[96px]">
        {heading}
      </h2>

      <form className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-14 md:[grid-template-areas:'A_B'_'C_C'_'E_D'] xl:grid-cols-3 xl:gap-x-14 xl:[grid-template-areas:'A_B_C'_'E_B_D']">
        <div className="flex flex-col gap-8 [grid-area:A]">
          <TextField label={t("fullName")} placeholder={t("fullNamePlaceholder")} />
          <TextField label={t("email")} placeholder={t("emailPlaceholder")} type="email" />
          <TextField label={t("phone")} placeholder={t("phonePlaceholder")} type="tel" />
          <TextField label={t("country")} placeholder={t("countryPlaceholder")} />
        </div>

        <div className="flex flex-col gap-8 md:gap-15 [grid-area:B]">
          <TextareaField label={t("garmentSelection")} placeholder={t("garmentSelectionPlaceholder")} rows={3} />
          <div>
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              <span className="label-tag text-[11px]! text-ink md:text-xs! lg:text-sm!">
                {t("sizeColour")}
              </span>
              <Link
                href="/size-guide"
                className="label-tag text-[11px]! text-ink-faint underline-offset-2 hover:text-ink hover:underline md:text-xs!"
              >
                {t("sizeGuide")}
              </Link>
            </div>
            <textarea
              rows={3}
              placeholder={t("sizeColourPlaceholder")}
              className="mt-3 w-full resize-none border-b border-ink/30 bg-transparent pb-3 text-xs leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none md:text-sm"
            />
          </div>
          <TextareaField label={t("quantity")} placeholder={t("quantityPlaceholder")} />

          <label className="flex flex-col gap-3">
            <span className="label-tag text-[11px]! text-ink md:text-xs! lg:text-sm!">
              {t("uploadDesign")}*
            </span>
            <span className="text-xs leading-relaxed text-ink-faint">{t("uploadDesignHelper")}</span>
            <span className="relative mt-1 flex flex-col items-center justify-center gap-2 border border-dashed border-ink/40 bg-white/40 px-4 py-8 text-center transition-colors hover:border-ink">
              <input type="file" accept="image/png,image/jpeg,application/pdf" className="absolute inset-0 cursor-pointer opacity-0" />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-ink-faint">
                <path
                  d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="label-tag text-[11px]! text-ink md:text-xs!">{t("uploadPrompt")}</span>
              <span className="text-xs text-ink-faint">{t("uploadFormats")}</span>
              <span className="text-xs text-ink-faint">{t("uploadFieldNote")}</span>
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-3 [grid-area:C]">
          <span className="label-tag text-[11px]! text-ink md:text-xs! lg:text-sm!">
            {t("additional")}
          </span>
          <textarea
            placeholder={t("additionalPlaceholder")}
            className="flex-1 resize-none border border-ink/30 bg-transparent p-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-4 [grid-area:D] lg:mt-8">
          <button
            type="submit"
            className="label-tag w-full bg-ink py-4 text-center text-[14px]! text-cream transition-colors hover:bg-ink-soft md:text-base!"
          >
            {t("submit")}
          </button>
          <p className="text-center text-xs text-ink-faint">{t("submitHelper")}</p>
        </div>

        <div className="flex items-end justify-center md:justify-start [grid-area:E]">
          <Image
            src="/logo.png"
            alt="Niche"
            width={160}
            height={118}
            className="h-10 w-auto opacity-60 md:h-12"
          />
        </div>
      </form>
    </div>
  );
}
