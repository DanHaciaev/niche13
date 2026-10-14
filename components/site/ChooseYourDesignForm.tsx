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
      <span className="label-tag text-[11px]! text-white md:text-xs! lg:text-sm!">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="border-b border-white/40 bg-transparent pb-2 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none"
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
      <span className="label-tag text-[11px]! text-white md:text-xs! lg:text-sm! ml-auto md:ml-0">
        {label}
      </span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="resize-none border-b border-white/40 bg-transparent pb-3 text-xs leading-relaxed text-white/70 placeholder:text-white/50 focus:border-white focus:outline-none md:text-sm"
      />
    </label>
  );
}

export function ChooseYourDesignForm({ t, heading }: { t: FormT; heading: string }) {
  return (
    <div className="relative mx-12 mb-20 bg-[#981C1C] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
      <h2 className="absolute -top-7 lg:-top-18 md:-top-14 left-0 text-[40px] md:text-[75px] font-medium uppercase text-ink lg:text-[96px]">
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
          <TextareaField label={t("illustrationCodes")} placeholder={t("illustrationCodesPlaceholder")} rows={3} />
          <TextareaField label={t("garmentSelection")} placeholder={t("garmentSelectionPlaceholder")} rows={3} />
          <div>
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              <span className="label-tag text-[11px]! text-white md:text-xs! lg:text-sm!">
                {t("sizeColour")}
              </span>
              <Link
                href="/size-guide"
                className="label-tag text-[11px]! text-white/60 underline-offset-2 hover:text-white hover:underline md:text-xs!"
              >
                {t("sizeGuide")}
              </Link>
            </div>
            <textarea
              rows={3}
              placeholder={t("sizeColourPlaceholder")}
              className="mt-3 w-full resize-none border-b border-white/40 bg-transparent pb-3 text-xs leading-relaxed text-white/70 placeholder:text-white/50 focus:border-white focus:outline-none md:text-sm"
            />
          </div>
          <TextareaField label={t("quantity")} placeholder={t("quantityPlaceholder")} />
        </div>

        <label className="flex flex-col gap-3 [grid-area:C]">
          <span className="label-tag text-[11px]! text-white md:text-xs! lg:text-sm!">
            {t("additional")}
          </span>
          <textarea
            placeholder={t("additionalPlaceholder")}
            className="flex-1 resize-none border border-white/40 bg-transparent p-4 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-4 [grid-area:D] lg:mt-8">
          <button
            type="submit"
            className="label-tag w-full bg-ink py-4 text-center text-[14px]! text-cream transition-colors hover:bg-ink-soft md:text-base!"
          >
            {t("submit")}
          </button>
          <p className="text-center text-xs text-white/70">{t("submitHelper")}</p>
        </div>

        <div className="flex items-end justify-center md:justify-start [grid-area:E]">
          <Image
            src="/logo.png"
            alt="Niche"
            width={160}
            height={118}
            className="h-10 w-auto opacity-60 invert md:h-12"
          />
        </div>
      </form>
    </div>
  );
}
