export default function TopBar({ title, leading, trailing }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/70 backdrop-blur-xl">
      <div
        className="mx-auto flex h-14 max-w-md items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex w-16 items-center justify-start">{leading}</div>
        <div className="flex flex-1 items-center justify-center">
          {title ? (
            <span className="font-display text-base font-700 tracking-tight text-ink">{title}</span>
          ) : (
            <img src="/logo.svg" alt="Kore" className="h-9 w-auto" />
          )}
        </div>
        <div className="flex w-16 items-center justify-end">{trailing}</div>
      </div>
    </header>
  )
}
