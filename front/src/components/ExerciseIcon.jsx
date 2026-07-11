import { Dumbbell, PersonStanding } from "lucide-react"

const VALID_MUSCLE_GROUPS = new Set(["chest", "back", "legs", "shoulders", "arms", "abs"])
const VALID_EQUIPMENT = new Set(["barbell", "dumbbell", "machine", "bodyweight"])

function BarbellIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8v8M6 6v12M18 6v12M21 8v8M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MachineIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 20V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15M6 8h12M9 12h6v5H9zM4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ExerciseIcon({ muscleGroup, equipment, size = 24, className = "" }) {
  const normalizedSize = Number.isFinite(size) && size > 0 ? size : 24
  const normalizedEquipment = VALID_EQUIPMENT.has(equipment) ? equipment : "dumbbell"
  const normalizedMuscleGroup = VALID_MUSCLE_GROUPS.has(muscleGroup) ? muscleGroup : "chest"
  const containerSize = Math.max(32, Math.round(normalizedSize * 1.75))

  let icon
  if (normalizedEquipment === "barbell") icon = <BarbellIcon size={normalizedSize} />
  else if (normalizedEquipment === "machine") icon = <MachineIcon size={normalizedSize} />
  else if (normalizedEquipment === "bodyweight") icon = <PersonStanding size={normalizedSize} strokeWidth={1.9} />
  else icon = <Dumbbell size={normalizedSize} strokeWidth={1.9} />

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ${className}`}
      style={{ width: containerSize, height: containerSize }}
      data-muscle-group={normalizedMuscleGroup}
      data-equipment={normalizedEquipment}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
