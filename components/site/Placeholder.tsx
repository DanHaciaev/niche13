export function Placeholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(155deg,var(--color-cream-deep)_0%,var(--color-surface)_55%,var(--color-cream-deep)_100%)] ${className}`}
    >
      <span className="label-tag text-ink-faint">{label}</span>
    </div>
  );
}
