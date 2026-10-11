import Image from "next/image";

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
      <span className="label-tag text-[11px]! text-black sm:text-xs! lg:text-sm!">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="border-b border-line bg-transparent pb-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function TextareaField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag text-[11px]! text-black sm:text-xs! lg:text-sm!">
        {label}
      </span>
      <textarea
        rows={2}
        placeholder={placeholder}
        className="resize-none border-b border-line bg-transparent pb-3 text-xs leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none sm:text-sm"
      />
    </label>
  );
}

export function OrderRequestForm({ t, heading }: { t: FormT; heading: string }) {
  return (
    <div className="relative mx-16 bg-cream-deep px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
      <h2 className="absolute -top-13 left-0 text-4xl font-medium uppercase text-ink  sm:text-5xl lg:text-[96px]">
        {heading}
      </h2>

      <form className="flex flex-col gap-12 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 sm:[grid-template-areas:'A_B'_'C_C'_'E_D'] lg:grid-cols-3 lg:gap-x-14 lg:[grid-template-areas:'A_B_C'_'E_B_D']">
        <div className="flex flex-col gap-8 [grid-area:A]">
          <TextField label={t("fullName")} placeholder={t("fullNamePlaceholder")} />
          <TextField label={t("email")} placeholder={t("emailPlaceholder")} type="email" />
          <TextField label={t("phone")} placeholder={t("phonePlaceholder")} type="tel" />
          <TextField label={t("country")} placeholder={t("countryPlaceholder")} />
        </div>

        <div className="flex flex-col gap-8 [grid-area:B]">
          <TextareaField label={t("codes")} placeholder={t("codesPlaceholder")} />
          <TextareaField label={t("sizeQty")} placeholder={t("sizeQtyPlaceholder")} />
          <TextareaField label={t("colour")} placeholder={t("colourPlaceholder")} />
        </div>

        <label className="flex flex-col gap-3 [grid-area:C]">
          <span className="label-tag text-[11px]! text-ink-faint sm:text-xs! lg:text-sm!">
            {t("additional")}
          </span>
          <textarea
            rows={6}
            placeholder={t("additionalPlaceholder")}
            className="resize-none border border-line bg-transparent p-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-4 [grid-area:D] lg:mt-8">
          <button
            type="submit"
            className="label-tag w-full bg-ink py-4 text-center text-[11px]! text-cream transition-colors hover:bg-ink-soft sm:text-xs! lg:text-sm!"
          >
            {t("submit")}
          </button>
          <p className="text-center text-xs text-ink-faint">{t("submitHelper")}</p>
        </div>

        <div className="flex items-end [grid-area:E]">
          <Image
            src="/logo.png"
            alt="Niche"
            width={160}
            height={118}
            className="h-10 w-auto opacity-30 grayscale sm:h-12"
          />
        </div>
      </form>
    </div>
  );
}
