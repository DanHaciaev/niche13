import { Fragment, type ReactNode } from "react";

/** Splits a translated string on any `<br/>`, `<br />`, or `<br>` marker and
 * renders it as a real line break. Use as `{renderBreaks(t("key"))}` anywhere
 * a translation string may contain a line-break marker.
 *
 * Write the marker as self-closing (`<br/>`) in messages/*.json. A paired
 * `<br></br>` is valid ICU rich-text syntax, so next-intl's plain `t()` tries
 * to resolve it as a tag and falls back to the raw key when no renderer is
 * given — self-closing form is treated as inert text and passes through. */
export function renderBreaks(text: string): ReactNode {
  const parts = text.split(/<br\s*\/?\s*>(?:<\/br>)?/gi);
  if (parts.length === 1) return text;

  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </Fragment>
  ));
}
