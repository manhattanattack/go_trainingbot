import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X, Plus } from "lucide-react"
import { EXERCISES } from "../lib/exercises.js"

export default function ExercisePicker({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      const t = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [open])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? EXERCISES.filter((e) => e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q))
      : EXERCISES
    const map = new Map()
    for (const e of filtered) {
      if (!map.has(e.group)) map.set(e.group, [])
      map.get(e.group).push(e)
    }
    return [...map.entries()]
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Add exercise">
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="animate-sheet relative mx-auto flex h-[82vh] w-full max-w-md flex-col rounded-t-[1.75rem] border-t border-hairline-strong bg-surface-2">
        <div className="flex flex-col items-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-hairline-strong" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <h2 className="font-display text-lg font-700 text-ink">Add Exercise</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink-muted active:bg-card-2"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-card px-3 py-2.5">
            <Search size={18} className="text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-faint">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
          {groups.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink-faint">No exercises found.</p>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="mb-4">
              <h3 className="mb-2 px-3 text-[12px] font-500 uppercase tracking-wide text-ink-faint">{group}</h3>
              <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                <div className="divide-y divide-hairline">
                  {items.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-card-2"
                    >
                      <span className="text-[15px] font-500 text-ink">{ex.name}</span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <Plus size={16} strokeWidth={2.5} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
