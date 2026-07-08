// Sample workout history for local preview when the Go backend is offline.
// Matches the exact shape of GET /me. Dates are generated relative to today.
import { toISODate } from "./format.js"

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISODate(d)
}

let setId = 100
const s = (weight, reps, rpe) => ({ setId: setId++, weight, reps, rpe, note: "" })

export const SAMPLE_HISTORY = [
  {
    trainingId: 21,
    date: daysAgo(0),
    exercises: [
      { exerciseId: 61, baseExercise: 1, sets: [s(80, 8, 8), s(80, 8, 8.5), s(80, 7, 9)] },
      { exerciseId: 62, baseExercise: 2, sets: [s(30, 10, 8), s(30, 9, 9)] },
      { exerciseId: 63, baseExercise: 20, sets: [s(12, 15, 8), s(12, 13, 9)] },
    ],
  },
  {
    trainingId: 20,
    date: daysAgo(2),
    exercises: [
      { exerciseId: 58, baseExercise: 5, sets: [s(120, 5, 8), s(120, 5, 8.5), s(120, 4, 9.5)] },
      { exerciseId: 59, baseExercise: 8, sets: [s(200, 10, 7), s(200, 10, 8)] },
      { exerciseId: 60, baseExercise: 10, sets: [s(45, 12, 8), s(45, 11, 8.5)] },
    ],
  },
  {
    trainingId: 19,
    date: daysAgo(4),
    exercises: [
      { exerciseId: 55, baseExercise: 12, sets: [s(140, 5, 8), s(140, 5, 9)] },
      { exerciseId: 56, baseExercise: 13, sets: [s(0, 10, 8), s(0, 8, 9), s(0, 6, 9.5)] },
      { exerciseId: 57, baseExercise: 15, sets: [s(70, 10, 8), s(70, 9, 8.5)] },
    ],
  },
  {
    trainingId: 18,
    date: daysAgo(6),
    exercises: [
      { exerciseId: 52, baseExercise: 18, sets: [s(55, 6, 8), s(55, 6, 9)] },
      { exerciseId: 53, baseExercise: 22, sets: [s(35, 10, 8), s(35, 9, 9)] },
      { exerciseId: 54, baseExercise: 25, sets: [s(40, 12, 8), s(40, 12, 8.5)] },
    ],
  },
  {
    trainingId: 17,
    date: daysAgo(9),
    exercises: [
      { exerciseId: 50, baseExercise: 1, sets: [s(77.5, 8, 8), s(77.5, 8, 9)] },
      { exerciseId: 51, baseExercise: 3, sets: [s(20, 15, 8), s(20, 14, 8.5)] },
    ],
  },
  {
    trainingId: 16,
    date: daysAgo(12),
    exercises: [
      { exerciseId: 48, baseExercise: 5, sets: [s(115, 5, 8), s(115, 5, 8.5)] },
      { exerciseId: 49, baseExercise: 7, sets: [s(100, 8, 8), s(100, 8, 8.5)] },
    ],
  },
]
