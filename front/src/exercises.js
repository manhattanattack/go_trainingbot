/*
 * exercises.js — Справочник упражнений
 *
 * id — это base_exercise, который уходит в бекенд.
 * Потом можно будет подтягивать список из API, а пока хардкод.
 */

const EXERCISES = [
  { id: 1,  name: 'Жим штанги лёжа',         emoji: '🏋️', group: 'Грудь' },
  { id: 2,  name: 'Жим гантелей лёжа',       emoji: '🏋️', group: 'Грудь' },
  { id: 3,  name: 'Разводка гантелей',        emoji: '🦋', group: 'Грудь' },
  { id: 4,  name: 'Сведение в кроссовере',    emoji: '🦋', group: 'Грудь' },
  { id: 5,  name: 'Приседания со штангой',     emoji: '🦵', group: 'Ноги' },
  { id: 6,  name: 'Жим ногами',               emoji: '🦵', group: 'Ноги' },
  { id: 7,  name: 'Разгибание ног',           emoji: '🦵', group: 'Ноги' },
  { id: 8,  name: 'Сгибание ног',             emoji: '🦵', group: 'Ноги' },
  { id: 9,  name: 'Выпады',                   emoji: '🦵', group: 'Ноги' },
  { id: 10, name: 'Становая тяга',            emoji: '🔥', group: 'Спина' },
  { id: 11, name: 'Тяга штанги в наклоне',    emoji: '💪', group: 'Спина' },
  { id: 12, name: 'Тяга верхнего блока',      emoji: '💪', group: 'Спина' },
  { id: 13, name: 'Тяга нижнего блока',       emoji: '💪', group: 'Спина' },
  { id: 14, name: 'Подтягивания',             emoji: '💪', group: 'Спина' },
  { id: 15, name: 'Жим стоя (OHP)',           emoji: '🤸', group: 'Плечи' },
  { id: 16, name: 'Махи гантелями в стороны', emoji: '🤸', group: 'Плечи' },
  { id: 17, name: 'Тяга к подбородку',        emoji: '🤸', group: 'Плечи' },
  { id: 18, name: 'Сгибание на бицепс',       emoji: '💪', group: 'Руки' },
  { id: 19, name: 'Молотки',                  emoji: '🔨', group: 'Руки' },
  { id: 20, name: 'Французский жим',          emoji: '💪', group: 'Руки' },
  { id: 21, name: 'Разгибание на трицепс',    emoji: '💪', group: 'Руки' },
  { id: 22, name: 'Отжимания на брусьях',     emoji: '🤸', group: 'Руки' },
]

// Найти упражнение по id. Если нет в списке — вернёт заглушку.
export function getExerciseById(id) {
  return EXERCISES.find(e => e.id === id) || { id, name: `Упражнение #${id}`, emoji: '🏋️', group: '?' }
}

export default EXERCISES
