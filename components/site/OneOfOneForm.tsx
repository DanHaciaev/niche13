import { FormMessage, RequestForm, SubmitButton } from "./RequestForm";

type FormT = (key: string) => string;

const ACCENT = "#981C1C";

const labelClass = "label-tag font-medium! text-[8px]! md:text-[10px]! lg:text-[11px]! lg:text-[12px]! text-ink";
const lineInputClass =
  "border-b border-ink/40 bg-transparent pb-2 font-medium! text-[8px]! md:text-[10px]! lg:text-[11px]! text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none";

function TextField({
  label,
  placeholder,
  name,
  type = "text",
  required = false,
  autoComplete,
  labelAlign = "",
}: {
  label: string;
  placeholder: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  /** Extra classes for the label, e.g. right-aligned on phones. */
  labelAlign?: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className={`${labelClass} ${labelAlign}`}>{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        maxLength={type === "email" ? 200 : 120}
        placeholder={placeholder}
        className={lineInputClass}
      />
    </label>
  );
}

/** "Find your one" form for one-of-one pieces (Figma):
 * - tablet and desktop: two columns — contacts on the left; NICHE numbers,
 *   Instagram, the requests box and the button (right-aligned) on the right;
 * - phone: one column; NICHE numbers and Instagram labels on the right, the
 *   requests label and the button centred.
 * Labels are black; only "Additional requests" and the button use the accent. */
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
    <div className="relative mx-5 mb-20 bg-[#ECECEC] px-5 pb-12 pt-12 md:mx-12 md:px-8 md:pb-16 md:pt-24 lg:px-12 lg:pb-14 lg:pt-20">
      <h2 className="absolute -top-3.5 left-0 text-[20px] md:text-[44px] md:-top-8 font-medium uppercase text-ink xl:-top-14 xl:text-[76px]">
        {heading}
      </h2>

      <RequestForm
        kind="one_of_one"
        collectionSlug={collectionSlug}
        className="flex flex-col gap-10 md:grid md:grid-cols-[1fr_2.4fr] md:items-start md:gap-x-[7%]"
      >
        <div className="flex flex-col gap-8">
          <TextField label={t("fullName")} placeholder={t("fullNamePlaceholder")} name="name" required autoComplete="name" />
          <TextField label={t("email")} placeholder={t("emailPlaceholder")} name="email" type="email" autoComplete="email" />
          <TextField label={t("phone")} placeholder={t("phonePlaceholder")} name="phone" type="tel" autoComplete="tel" />
          <TextField label={t("country")} placeholder={t("countryPlaceholder")} name="country" autoComplete="country-name" />
        </div>

        <div className="flex flex-col gap-10 md:gap-8">
          <label className="flex flex-col gap-3">
            <span className={`${labelClass} self-end md:self-start`}>{t("nicheNumbers")}*</span>
            <textarea
              rows={2}
              name="niche_numbers"
              required
              maxLength={2000}
              placeholder={t("nicheNumbersPlaceholder")}
              className={`resize-none leading-relaxed ${lineInputClass}`}
            />
          </label>

          <TextField
            label={t("instagram")}
            placeholder={t("instagramPlaceholder")}
            name="instagram"
            autoComplete="off"
            labelAlign="self-end md:self-start"
          />

          <label className="flex flex-col gap-3">
            <span className="label-tag text-center font-medium! md:text-left text-[8px]! md:text-[10px]! lg:text-[11px]! lg:text-[12px]!" style={{ color: ACCENT }}>
              {t("additional")}
            </span>
            <textarea
              rows={4}
              name="comment"
              maxLength={3000}
              placeholder={t("additionalPlaceholder")}
              className="h-32 resize-none border border-ink/60 bg-transparent p-3 text-[8px]! md:text-[10px]! lg:text-[11px]! text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none md:h-28"
            />
          </label>

          <div className="mx-auto mt-4 flex w-[78%] flex-col gap-3 md:mx-0 md:ml-auto md:w-60">
            <SubmitButton
              label={t("submit")}
              className="label-tag w-full py-3.5 text-center text-[11px]! text-cream transition-opacity hover:opacity-90 md:text-[12px]!"
              style={{ backgroundColor: ACCENT }}
            />
            <p className="text-center text-[11px]! leading-relaxed text-ink-faint">{t("submitHelper")}</p>
            <FormMessage />
          </div>
        </div>
      </RequestForm>
    </div>
  );
}
