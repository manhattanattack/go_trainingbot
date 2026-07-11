// Static exercise dictionary. `id` maps to `baseExercise` in the API payloads.
export const EXERCISES = [
  { id: 1, name: "Жим штанги лёжа", group: "Грудь" },
  { id: 2, name: "Жим гантелей на наклонной скамье", group: "Грудь" },
  { id: 3, name: "Сведение рук в кроссовере", group: "Грудь" },
  { id: 4, name: "Отжимания", group: "Грудь" },
  { id: 5, name: "Приседания со штангой", group: "Ноги" },
  { id: 6, name: "Фронтальные приседания", group: "Ноги" },
  { id: 7, name: "Румынская тяга", group: "Ноги" },
  { id: 8, name: "Жим ногами", group: "Ноги" },
  { id: 9, name: "Разгибание ног", group: "Ноги" },
  { id: 10, name: "Сгибание ног лёжа", group: "Ноги" },
  { id: 11, name: "Подъём на носки стоя", group: "Ноги" },
  { id: 12, name: "Становая тяга", group: "Спина" },
  { id: 13, name: "Подтягивания", group: "Спина" },
  { id: 14, name: "Тяга верхнего блока", group: "Спина" },
  { id: 15, name: "Тяга штанги в наклоне", group: "Спина" },
  { id: 16, name: "Тяга нижнего блока", group: "Спина" },
  { id: 17, name: "Тяга каната к лицу", group: "Спина" },
  { id: 18, name: "Жим штанги над головой", group: "Плечи" },
  { id: 19, name: "Жим гантелей сидя", group: "Плечи" },
  { id: 20, name: "Разведение гантелей в стороны", group: "Плечи" },
  { id: 21, name: "Разведение на заднюю дельту", group: "Плечи" },
  { id: 22, name: "Сгибание рук со штангой", group: "Руки" },
  { id: 23, name: "Сгибание рук с гантелями", group: "Руки" },
  { id: 24, name: "Молотковые сгибания", group: "Руки" },
  { id: 25, name: "Разгибание рук на блоке", group: "Руки" },
  { id: 26, name: "Разгибание рук над головой", group: "Руки" },
  { id: 27, name: "Жим лёжа узким хватом", group: "Руки" },
  { id: 28, name: "Планка", group: "Кор" },
  { id: 29, name: "Подъём ног в висе", group: "Кор" },
  { id: 30, name: "Скручивания на блоке", group: "Кор" },
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id) {
  return BY_ID.get(id) || { id, name: `Упражнение №${id}`, group: "Другое" }
}

export function exerciseName(id) {
  return getExercise(id).name
}
