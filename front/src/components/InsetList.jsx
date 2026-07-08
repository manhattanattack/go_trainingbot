import { cn } from "../lib/format.js"

// iOS-style "inset grouped" list container.
export function InsetGroup({ header, footer, children, className }) {
  return (
    <section className={cn("px-4", className)}>
      {header && (
        <h2 className="mb-2 px-3 text-[13px] font-500 uppercase tracking-wide text-ink-faint">{header}</h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
        <div className="divide-y divide-hairline">{children}</div>
      </div>
      {footer && <p className="mt-2 px-3 text-[12px] leading-relaxed text-ink-faint">{footer}</p>}
    </section>
  )
}

export function InsetRow({ children, onClick, className }) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        onClick && "transition-colors active:bg-card-2",
        className,
      )}
    >
      {children}
    </Tag>
  )
}
