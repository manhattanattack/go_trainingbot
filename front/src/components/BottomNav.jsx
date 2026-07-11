import { ChartNoAxesCombined, LayoutGrid, Dumbbell, User } from "lucide-react"
import { cn } from "../lib/format.js"

const TABS = [
  { id: "overview", label: "Обзор", icon: LayoutGrid },
  { id: "log", label: "Дневник", icon: Dumbbell },
  { id: "progress", label: "Прогресс", icon: ChartNoAxesCombined },
  { id: "profile", label: "Профиль", icon: User },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/70 backdrop-blur-xl">
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                className={cn("transition-colors", isActive ? "text-accent" : "text-ink-faint")}
              />
              <span
                className={cn(
                  "text-[11px] font-500 transition-colors",
                  isActive ? "text-accent" : "text-ink-faint",
                )}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
