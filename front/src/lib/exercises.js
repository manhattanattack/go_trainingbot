// Static exercise dictionary. `id` maps to `baseExercise` in the API payloads.
export const EXERCISES = [
  { id: 1, name: "Barbell Bench Press", group: "Chest" },
  { id: 2, name: "Incline Dumbbell Press", group: "Chest" },
  { id: 3, name: "Cable Fly", group: "Chest" },
  { id: 4, name: "Push Up", group: "Chest" },
  { id: 5, name: "Back Squat", group: "Legs" },
  { id: 6, name: "Front Squat", group: "Legs" },
  { id: 7, name: "Romanian Deadlift", group: "Legs" },
  { id: 8, name: "Leg Press", group: "Legs" },
  { id: 9, name: "Leg Extension", group: "Legs" },
  { id: 10, name: "Lying Leg Curl", group: "Legs" },
  { id: 11, name: "Standing Calf Raise", group: "Legs" },
  { id: 12, name: "Conventional Deadlift", group: "Back" },
  { id: 13, name: "Pull Up", group: "Back" },
  { id: 14, name: "Lat Pulldown", group: "Back" },
  { id: 15, name: "Barbell Row", group: "Back" },
  { id: 16, name: "Seated Cable Row", group: "Back" },
  { id: 17, name: "Face Pull", group: "Back" },
  { id: 18, name: "Overhead Press", group: "Shoulders" },
  { id: 19, name: "Dumbbell Shoulder Press", group: "Shoulders" },
  { id: 20, name: "Lateral Raise", group: "Shoulders" },
  { id: 21, name: "Rear Delt Fly", group: "Shoulders" },
  { id: 22, name: "Barbell Curl", group: "Arms" },
  { id: 23, name: "Dumbbell Curl", group: "Arms" },
  { id: 24, name: "Hammer Curl", group: "Arms" },
  { id: 25, name: "Triceps Pushdown", group: "Arms" },
  { id: 26, name: "Overhead Triceps Extension", group: "Arms" },
  { id: 27, name: "Close Grip Bench Press", group: "Arms" },
  { id: 28, name: "Plank", group: "Core" },
  { id: 29, name: "Hanging Leg Raise", group: "Core" },
  { id: 30, name: "Cable Crunch", group: "Core" },
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id) {
  return BY_ID.get(id) || { id, name: `Exercise #${id}`, group: "Other" }
}

export function exerciseName(id) {
  return getExercise(id).name
}
