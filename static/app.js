/* ============================================
   Training Tracker — App Logic
   ============================================ */

// ─── Справочник упражнений ───
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
];

const MONTHS_RU = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря'
];

// ─── Telegram WebApp ───
const tg = window.Telegram?.WebApp;

// ─── Состояние приложения ───
let state = {
  currentTab: 'training',
  trainingDate: todayISO(),
  exercises: [],        // [ { baseExercise: id, sets: [ {weight, reps, rpe} ] } ]
  history: null,        // кэш истории тренировок
  saving: false,
};

// ─── Утилиты ───

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateRu(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

function getExerciseById(id) {
  return EXERCISES.find(e => e.id === id) || { id, name: `Упражнение #${id}`, emoji: '🏋️' };
}

function haptic(type = 'impact') {
  try {
    if (type === 'impact') tg?.HapticFeedback?.impactOccurred('light');
    else if (type === 'success') tg?.HapticFeedback?.notificationOccurred('success');
    else if (type === 'error') tg?.HapticFeedback?.notificationOccurred('error');
    else if (type === 'select') tg?.HapticFeedback?.selectionChanged();
  } catch (_) { /* не в Telegram */ }
}

// ─── Toast ───

function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  // Trigger reflow for animation restart
  void toast.offsetWidth;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ─── Навигация ───

function switchTab(tabName) {
  if (state.currentTab === tabName) return;
  state.currentTab = tabName;
  haptic('select');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${tabName}`).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'profile') {
    loadHistory();
  }
}

// ─── Дата ───

function updateDateDisplay() {
  const el = document.getElementById('date-display');
  if (el) el.textContent = formatDateRu(state.trainingDate);
}

// ─── Рендер упражнений (форма) ───

function renderExercises() {
  const container = document.getElementById('exercises-container');
  container.innerHTML = '';

  state.exercises.forEach((exercise, exIdx) => {
    const info = getExerciseById(exercise.baseExercise);
    const card = document.createElement('div');
    card.className = 'card exercise-card';
    card.innerHTML = `
      <div class="exercise-header">
        <div class="exercise-title">
          <div class="exercise-emoji">${info.emoji}</div>
          <span class="exercise-name">${info.name}</span>
        </div>
        <button class="btn-remove" data-ex="${exIdx}" title="Удалить">×</button>
      </div>
      <div class="sets-header">
        <span>#</span><span>Вес</span><span>Повт</span><span>RPE</span><span></span>
      </div>
      <div class="sets-container" id="sets-${exIdx}"></div>
      <button class="btn-add-set" data-ex="${exIdx}">+ подход</button>
    `;
    container.appendChild(card);

    // Рендерим подходы
    const setsContainer = card.querySelector(`#sets-${exIdx}`);
    exercise.sets.forEach((set, setIdx) => {
      setsContainer.appendChild(createSetRow(exIdx, setIdx, set));
    });

    // Удаление упражнения
    card.querySelector('.btn-remove').addEventListener('click', () => {
      haptic('impact');
      state.exercises.splice(exIdx, 1);
      renderExercises();
    });

    // Добавление подхода
    card.querySelector('.btn-add-set').addEventListener('click', () => {
      haptic('select');
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 0,
        rpe: lastSet?.rpe || 0,
      });
      renderExercises();
      // Фокус на новый инпут
      const newInputs = document.querySelectorAll(`#sets-${exIdx} .set-row:last-child .set-input`);
      if (newInputs.length) newInputs[0].focus();
    });
  });
}

function createSetRow(exIdx, setIdx, set) {
  const row = document.createElement('div');
  row.className = 'set-row';
  row.innerHTML = `
    <div class="set-number">${setIdx + 1}</div>
    <input class="set-input" type="number" inputmode="decimal" step="0.5" placeholder="0"
           value="${set.weight || ''}" data-field="weight" data-ex="${exIdx}" data-set="${setIdx}">
    <input class="set-input" type="number" inputmode="numeric" placeholder="0"
           value="${set.reps || ''}" data-field="reps" data-ex="${exIdx}" data-set="${setIdx}">
    <input class="set-input" type="number" inputmode="numeric" min="1" max="10" placeholder="—"
           value="${set.rpe || ''}" data-field="rpe" data-ex="${exIdx}" data-set="${setIdx}">
    <button class="set-remove" data-ex="${exIdx}" data-set="${setIdx}">×</button>
  `;

  // Обновление стейта при вводе
  row.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const field = e.target.dataset.field;
      const val = field === 'weight' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
      state.exercises[exIdx].sets[setIdx][field] = val;
    });
  });

  // Удаление подхода
  row.querySelector('.set-remove').addEventListener('click', () => {
    haptic('impact');
    state.exercises[exIdx].sets.splice(setIdx, 1);
    if (state.exercises[exIdx].sets.length === 0) {
      state.exercises.splice(exIdx, 1);
    }
    renderExercises();
  });

  return row;
}

// ─── Модальное окно выбора упражнения ───

function openExerciseModal() {
  haptic('impact');
  const modal = document.getElementById('exercise-modal');
  const search = modal.querySelector('.search-input');
  const list = modal.querySelector('#exercise-list');

  renderExerciseList(list, '');
  modal.classList.add('active');
  setTimeout(() => search.focus(), 350);

  search.value = '';
  search.oninput = () => renderExerciseList(list, search.value);
}

function closeExerciseModal() {
  const modal = document.getElementById('exercise-modal');
  modal.classList.remove('active');
}

function renderExerciseList(container, filter) {
  container.innerHTML = '';
  const term = filter.toLowerCase().trim();
  let currentGroup = '';

  EXERCISES.forEach(ex => {
    if (term && !ex.name.toLowerCase().includes(term)) return;

    if (ex.group !== currentGroup) {
      currentGroup = ex.group;
      const label = document.createElement('div');
      label.className = 'exercise-group-label';
      label.textContent = currentGroup;
      container.appendChild(label);
    }

    const item = document.createElement('div');
    item.className = 'exercise-list-item';
    item.innerHTML = `
      <div class="item-emoji">${ex.emoji}</div>
      <span class="item-name">${ex.name}</span>
    `;
    item.addEventListener('click', () => {
      haptic('select');
      state.exercises.push({
        baseExercise: ex.id,
        sets: [{ weight: 0, reps: 0, rpe: 0 }],
      });
      closeExerciseModal();
      renderExercises();
    });
    container.appendChild(item);
  });

  if (!container.children.length) {
    container.innerHTML = `<div class="empty-state"><p>Ничего не найдено</p></div>`;
  }
}

// ─── Сохранение тренировки ───

async function saveTraining() {
  if (state.saving) return;
  if (!state.exercises.length) {
    showToast('Добавьте хотя бы одно упражнение', 'error');
    haptic('error');
    return;
  }

  // Проверка что есть хотя бы один непустой подход
  const hasData = state.exercises.some(ex =>
    ex.sets.some(s => s.weight > 0 || s.reps > 0)
  );
  if (!hasData) {
    showToast('Заполните хотя бы один подход', 'error');
    haptic('error');
    return;
  }

  state.saving = true;
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Сохраняю...';

  const payload = {
    date: state.trainingDate,
    exercises: state.exercises.map(ex => ({
      baseExercise: ex.baseExercise,
      sets: ex.sets.map(s => ({
        weight: s.weight || 0,
        reps: s.reps || 0,
        rpe: s.rpe || 0,
        note: '',
      })),
    })),
  };

  const headers = { 'Content-Type': 'application/json' };
  // Если внутри Telegram — добавляем авторизацию
  if (tg?.initData) {
    headers['Authorization'] = `tma ${tg.initData}`;
  }

  try {
    const res = await fetch('/api/training', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast('✅ Тренировка сохранена!', 'success');
      haptic('success');
      // Сброс формы
      state.exercises = [];
      state.trainingDate = todayISO();
      state.history = null; // сбросить кэш
      updateDateDisplay();
      renderExercises();
    } else {
      const text = await res.text();
      showToast(`Ошибка: ${text}`, 'error');
      haptic('error');
    }
  } catch (err) {
    showToast(`Сеть: ${err.message}`, 'error');
    haptic('error');
  } finally {
    state.saving = false;
    btn.disabled = false;
    btn.innerHTML = '💾  Сохранить тренировку';
  }
}

// ─── Загрузка истории тренировок ───

async function loadHistory() {
  const container = document.getElementById('history-container');
  if (!container) return;

  // Показать лоадер
  container.innerHTML = `
    <div class="empty-state">
      <div class="spinner" style="margin: 0 auto"></div>
    </div>`;

  try {
    const headers = {};
    if (tg?.initData) {
      headers['Authorization'] = `tma ${tg.initData}`;
    }
    const res = await fetch('/me', { headers });
    const data = await res.json();

    state.history = data;
    renderHistory(container, data);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚡</div>
        <p>Не удалось загрузить историю</p>
      </div>`;
  }
}

function renderHistory(container, trainings) {
  container.innerHTML = '';

  // Обновляем статистику в профиле
  const totalTrainings = trainings ? trainings.length : 0;
  let totalExercises = 0;
  if (trainings) {
    trainings.forEach(t => {
      if (t.exercises) totalExercises += t.exercises.length;
    });
  }
  const statTrainings = document.getElementById('stat-trainings');
  const statExercises = document.getElementById('stat-exercises');
  if (statTrainings) statTrainings.textContent = totalTrainings || '—';
  if (statExercises) statExercises.textContent = totalExercises || '—';

  if (!trainings || !trainings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>Пока нет тренировок.<br>Время начинать!</p>
      </div>`;
    return;
  }

  trainings.forEach(training => {
    const card = document.createElement('div');
    card.className = 'card history-card';

    let exercisesHTML = '';
    if (training.exercises && training.exercises.length) {
      training.exercises.forEach(ex => {
        const info = getExerciseById(ex.baseExercise);
        const setsCount = ex.sets ? ex.sets.length : 0;
        exercisesHTML += `
          <div class="history-exercise-row">
            <div class="history-dot"></div>
            <span>${info.name}</span>
            <span class="history-sets-count">${setsCount} подх.</span>
          </div>`;
      });
    }

    card.innerHTML = `
      <div class="history-date">${formatDateRu(training.date)}</div>
      <div class="history-exercises">${exercisesHTML || '<span style="color:var(--text-secondary);font-size:0.8125rem">Пустая тренировка</span>'}</div>
    `;
    container.appendChild(card);
  });
}

// ─── Инициализация ───

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp ready
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // Навигация
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Дата
  const dateInput = document.getElementById('date-input');
  dateInput.value = state.trainingDate;
  updateDateDisplay();

  dateInput.addEventListener('change', (e) => {
    state.trainingDate = e.target.value;
    updateDateDisplay();
  });

  // Добавление упражнения
  document.getElementById('btn-add-exercise').addEventListener('click', openExerciseModal);

  // Закрытие модалки
  document.getElementById('exercise-modal').querySelector('.modal-backdrop')
    .addEventListener('click', closeExerciseModal);

  // Сохранение
  document.getElementById('btn-save').addEventListener('click', saveTraining);

  // Начальный рендер
  renderExercises();
});
