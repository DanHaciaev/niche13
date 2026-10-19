import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FormMessage, RequestForm, SubmitButton } from "./RequestForm";

type FormT = (key: string) => string;

function TextField({
  label,
  placeholder,
  name,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag font-medium! text-[10px]! md:text-[12px]! text-white">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        maxLength={type === "email" ? 200 : 120}
        placeholder={placeholder}
        className="border-b border-white/40 bg-transparent pb-2 font-medium! text-[8px]! md:text-[11px]! text-white placeholder:text-white/50 focus:border-white focus:outline-none"
      />
    </label>
  );
}

function TextareaField({
  label,
  placeholder,
  name,
  rows = 2,
}: {
  label: string;
  placeholder: string;
  name: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="label-tag text-white font-medium! text-[10px]! md:text-[12px]! ml-auto md:ml-0">
        {label}
      </span>
      <textarea
        rows={rows}
        name={name}
        maxLength={2000}
        placeholder={placeholder}
        className="resize-none border-b border-white/40 bg-transparent pb-3 font-medium! text-[8px]! md:text-[11px]! leading-relaxed text-white/70 placeholder:text-white/50 focus:border-white focus:outline-none md:text-sm"
      />
    </label>
  );
}

export function ChooseYourDesignForm({
  t,
  heading,
  collectionSlug,
}: {
  t: FormT;
  heading: string;
  collectionSlug: string;
}) {
  return (
    <div className="relative mx-5 mb-20 bg-[#981C1C] px-5 pb-12 pt-12 md:mx-12 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-10 lg:pt-20">
      <h2 className="absolute -top-3.5 left-0 text-[20px] md:text-[44px] md:-top-8 font-medium uppercase text-ink xl:-top-14 xl:text-[76px]">
        {heading}
      </h2>

      <RequestForm kind="illustrations" collectionSlug={collectionSlug} className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-14 md:[grid-template-areas:'A_B'_'C_C'_'E_D'] xl:grid-cols-3 xl:gap-x-14 xl:[grid-template-areas:'A_B_C'_'E_B_D']">
        <div className="flex flex-col gap-8 [grid-area:A]">
          <TextField label={t("fullName")} placeholder={t("fullNamePlaceholder")} name="name" required autoComplete="name" />
          <TextField label={t("email")} placeholder={t("emailPlaceholder")} name="email" type="email" autoComplete="email" />
          <TextField label={t("phone")} placeholder={t("phonePlaceholder")} name="phone" type="tel" autoComplete="tel" />
          <TextField label={t("country")} placeholder={t("countryPlaceholder")} name="country" autoComplete="country-name" />
        </div>

        <div className="flex flex-col gap-8 md:gap-15 [grid-area:B]">
          <TextareaField name="illustration_codes" label={t("illustrationCodes")} placeholder={t("illustrationCodesPlaceholder")} rows={2} />
          <TextareaField name="garment" label={t("garmentSelection")} placeholder={t("garmentSelectionPlaceholder")} rows={2} />
          <div>
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              <span className="label-tag font-medium! text-[10px]! md:text-[12px]! text-white">
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
              rows={2}
              name="size_colour"
              maxLength={2000}
              placeholder={t("sizeColourPlaceholder")}
              className="mt-3 w-full resize-none border-b border-white/40 bg-transparent pb-3 font-medium! text-[8px]! md:text-[11px]! leading-relaxed text-white/70 placeholder:text-white/50 focus:border-white focus:outline-none md:text-sm"
            />
          </div>
          <TextareaField name="quantity" label={t("quantity")} placeholder={t("quantityPlaceholder")} />
        </div>

        <label className="flex flex-col gap-3 [grid-area:C]">
          <span className="label-tag font-medium! text-[10px]! md:text-[12px]! text-white">
            {t("additional")}
          </span>
          <textarea
            name="comment"
            maxLength={3000}
            placeholder={t("additionalPlaceholder")}
            className="flex-1 resize-none border border-white/40 bg-transparent p-4 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-4 [grid-area:D] lg:mt-8">
          <SubmitButton
            label={t("submit")}
            className="label-tag w-full bg-ink py-4 text-center text-[14px]! text-cream transition-colors hover:bg-ink-soft md:text-base!"
          />
          <p className="text-center text-[12px]! md:text-[13px]! text-white/70">{t("submitHelper")}</p>
          <FormMessage onDark />
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
      </RequestForm>
    </div>
  );
}