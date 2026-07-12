// Stable order shared by analytics and exercise metadata.
export const MUSCLE_GROUPS = [
  { id: "chest", label: "Грудь", shortLabel: "Грудь" },
  { id: "back", label: "Спина", shortLabel: "Спина" },
  { id: "legs", label: "Ноги", shortLabel: "Ноги" },
  { id: "shoulders", label: "Плечи", shortLabel: "Плечи" },
  { id: "arms", label: "Руки", shortLabel: "Руки" },
  { id: "abs", label: "Пресс", shortLabel: "Пресс" },
]

// Static exercise dictionary. `id` maps to `baseExercise` in the API payloads.
export const EXERCISES = [
  { id: 1, name: "Жим штанги лёжа", group: "Грудь", muscleGroup: "chest", equipment: "barbell" },
  { id: 2, name: "Жим гантелей на наклонной скамье", group: "Грудь", muscleGroup: "chest", equipment: "dumbbell" },
  { id: 3, name: "Сведение рук в кроссовере", group: "Грудь", muscleGroup: "chest", equipment: "machine" },
  { id: 4, name: "Отжимания", group: "Грудь", muscleGroup: "chest", equipment: "bodyweight" },
  { id: 5, name: "Приседания со штангой", group: "Ноги", muscleGroup: "legs", equipment: "barbell" },
  { id: 6, name: "Фронтальные приседания", group: "Ноги", muscleGroup: "legs", equipment: "barbell" },
  { id: 7, name: "Румынская тяга", group: "Ноги", muscleGroup: "legs", equipment: "barbell" },
  { id: 8, name: "Жим ногами", group: "Ноги", muscleGroup: "legs", equipment: "machine" },
  { id: 9, name: "Разгибание ног", group: "Ноги", muscleGroup: "legs", equipment: "machine" },
  { id: 10, name: "Сгибание ног лёжа", group: "Ноги", muscleGroup: "legs", equipment: "machine" },
  { id: 11, name: "Подъём на носки стоя", group: "Ноги", muscleGroup: "legs", equipment: "bodyweight" },
  { id: 12, name: "Становая тяга", group: "Спина", muscleGroup: "back", equipment: "barbell" },
  { id: 13, name: "Подтягивания", group: "Спина", muscleGroup: "back", equipment: "bodyweight" },
  { id: 14, name: "Тяга верхнего блока", group: "Спина", muscleGroup: "back", equipment: "machine" },
  { id: 15, name: "Тяга штанги в наклоне", group: "Спина", muscleGroup: "back", equipment: "barbell" },
  { id: 16, name: "Тяга нижнего блока", group: "Спина", muscleGroup: "back", equipment: "machine" },
  { id: 17, name: "Тяга каната к лицу", group: "Спина", muscleGroup: "back", equipment: "machine" },
  { id: 18, name: "Жим штанги над головой", group: "Плечи", muscleGroup: "shoulders", equipment: "barbell" },
  { id: 19, name: "Жим гантелей сидя", group: "Плечи", muscleGroup: "shoulders", equipment: "dumbbell" },
  { id: 20, name: "Разведение гантелей в стороны", group: "Плечи", muscleGroup: "shoulders", equipment: "dumbbell" },
  { id: 21, name: "Разведение на заднюю дельту", group: "Плечи", muscleGroup: "shoulders", equipment: "machine" },
  { id: 22, name: "Сгибание рук со штангой", group: "Руки", muscleGroup: "arms", equipment: "barbell" },
  { id: 23, name: "Сгибание рук с гантелями", group: "Руки", muscleGroup: "arms", equipment: "dumbbell" },
  { id: 24, name: "Молотковые сгибания", group: "Руки", muscleGroup: "arms", equipment: "dumbbell" },
  { id: 25, name: "Разгибание рук на блоке", group: "Руки", muscleGroup: "arms", equipment: "machine" },
  { id: 26, name: "Разгибание рук над головой", group: "Руки", muscleGroup: "arms", equipment: "dumbbell" },
  { id: 27, name: "Жим лёжа узким хватом", group: "Руки", muscleGroup: "arms", equipment: "barbell" },
  { id: 28, name: "Планка", group: "Кор", muscleGroup: "abs", equipment: "bodyweight", measurementType: "time" },
  { id: 29, name: "Подъём ног в висе", group: "Кор", muscleGroup: "abs", equipment: "bodyweight" },
  { id: 30, name: "Скручивания на блоке", group: "Кор", muscleGroup: "abs", equipment: "machine" },
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id) {
  const exercise = BY_ID.get(id)
  if (exercise) return { measurementType: "reps", ...exercise }
  return {
    id,
    name: `Упражнение №${id}`,
    group: "Другое",
    muscleGroup: "chest",
    equipment: "dumbbell",
    measurementType: "reps",
  }
}

export function exerciseName(id) {
  return getExercise(id).name
}
