import Image from "next/image";
import { FormMessage, RequestForm, SubmitButton } from "./RequestForm";

type FormT = (key: string) => string;

const ACCENT = "#981C1C";

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
      <span className="label-tag font-medium! text-[10px]! md:text-[12px]!" style={{ color: ACCENT }}>
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        maxLength={type === "email" ? 200 : 120}
        placeholder={placeholder}
        className="border-b border-ink/30 bg-transparent pb-2 font-medium! text-[10px]! md:text-[12px]! text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
    </label>
  );
}

export function OneOfOneForm({
  t,
  heading,
  collectionSlug,
}: {
  t: FormT;
  heading: string;
  collectionSlug: string;
}) {
  return (
    <div className="relative mx-5 mb-20 bg-[#cfcecb] px-5 pb-12 pt-12 md:mx-12 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-10 lg:pt-20">
      <h2 className="absolute -top-3.5 left-0 text-[20px] md:text-[44px] md:-top-8 font-medium uppercase text-ink xl:-top-14 xl:text-[76px]">
        {heading}
      </h2>

      <RequestForm
        kind="one_of_one"
        collectionSlug={collectionSlug}
        className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-x-14 md:gap-y-10 md:[grid-template-areas:'A_B'_'E_B']"
      >
        <div className="flex flex-col gap-8 [grid-area:A]">
          <TextField label={t("fullName")} placeholder={t("fullNamePlaceholder")} name="name" required autoComplete="name" />
          <TextField label={t("email")} placeholder={t("emailPlaceholder")} name="email" type="email" autoComplete="email" />
          <TextField label={t("phone")} placeholder={t("phonePlaceholder")} name="phone" type="tel" autoComplete="tel" />
          <TextField label={t("country")} placeholder={t("countryPlaceholder")} name="country" autoComplete="country-name" />
        </div>

        <div className="flex flex-col gap-8 md:gap-15 [grid-area:B]">
          <label className="flex flex-col gap-3">
            <span className="label-tag font-medium! text-[10px]! md:text-[12px]!" style={{ color: ACCENT }}>
              {t("nicheNumbers")}*
            </span>
            <textarea
              rows={2}
              name="niche_numbers"
              required
              maxLength={2000}
              placeholder={t("nicheNumbersPlaceholder")}
              className="resize-none border-b border-ink/30 bg-transparent pb-3 font-medium! text-[8px]! md:text-[11px]! leading-relaxed text-ink-faint placeholder:text-ink-faint focus:border-ink focus:outline-none md:text-sm"
            />
          </label>

          <label className="flex flex-col gap-3">
            <span className="label-tag font-medium! text-[10px]! md:text-[12px]!" style={{ color: ACCENT }}>
              {t("additional")}
            </span>
            <textarea
              rows={5}
              name="comment"
              maxLength={3000}
              placeholder={t("additionalPlaceholder")}
              className="resize-none border border-ink/30 bg-transparent p-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </label>

          <div className="flex flex-col items-center gap-4">
            <SubmitButton
              label={t("submit")}
              className="label-tag w-full bg-ink py-4 text-center text-[14px]! text-cream transition-colors hover:bg-ink-soft md:text-base!"
              style={{ backgroundColor: ACCENT }}
            />
            <p className="text-center text-[12px]! md:text-[13px]! text-ink-faint md:text-right">{t("submitHelper")}</p>
            <FormMessage />
          </div>
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
