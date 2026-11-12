import type { ComponentProps } from "react";

const icons = {
  previous: "M11 4L6 9l5 5",
  next: "M7 4l5 5-5 5",
  close: "M4 4l10 10M14 4L4 14",
};

export function IconButton({ icon, label, ...props }: { icon: keyof typeof icons; label: string } & ComponentProps<"button">) {
  return (
    <button type="button" className="rd-replay-icon" aria-label={label} {...props}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d={icons[icon]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
