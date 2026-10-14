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
      <span className="label-tag text-[13px]! text-black md:text-base!">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="border-b border-black bg-transparent pb-2  text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
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
      <span className="label-tag text-[13px]! text-black md:text-base! ml-auto md:ml-0">
        {label}
      </span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="resize-none border-b border-black bg-transparent pb-3 text-xs leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none md:text-sm"
      />
    </label>
  );
}

export function OrderRequestForm({ t, heading }: { t: FormT; heading: string }) {
  return (
    <div className="relative mx-12 mb-20 bg-[#E5DED7] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
      <h2 className="absolute -top-7 md:-top-18 left-0 text-[40px] font-medium uppercase text-ink md:text-[96px]">
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
          <TextareaField label={t("codes")} placeholder={t("codesPlaceholder")} rows={3} />
          <div>
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              <span className="label-tag text-[13px]! text-black md:text-base!">
                {t("sizeQty")}
              </span>
              <Link
                href="/size-guide"
                className="label-tag text-[13px]! text-black underline-offset-2 hover:text-ink hover:underline"
              >
                {t("sizeGuide")}
              </Link>
            </div>
            <textarea
              rows={3}
              placeholder={t("sizeQtyPlaceholder")}
              className="mt-3 w-full resize-none border-b border-black bg-transparent pb-3 text-xs leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none md:text-sm"
            />
          </div>
          <TextareaField label={t("colour")} placeholder={t("colourPlaceholder")} />
        </div>

        <label className="flex flex-col gap-3 [grid-area:C]">
          <span className="label-tag text-[13px]! text-black md:text-base!">
            {t("additional")}
          </span>
          <textarea
            placeholder={t("additionalPlaceholder")}
            className="flex-1 resize-none border border-black bg-transparent p-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
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
            className="h-12 w-auto opacity-30 grayscale md:h-20 xl:h-25"
          />
        </div>
      </form>
    </div>
  );
}
