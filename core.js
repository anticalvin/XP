export const STORAGE_KEY = 'xp-next-web-v1';

export function freshState() {
  return { name: 'Player', avatar: '🦊', xp: 0, coins: 0, tasks: [], projects: [], events: [], minutes: 30, energy: 'steady' };
}

export function load(storage, key = STORAGE_KEY) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.projects) || !Array.isArray(value.events)) return freshState();
    return { ...freshState(), ...value };
  } catch {
    return freshState();
  }
}

export function save(storage, data, key = STORAGE_KEY) {
  storage.setItem(key, JSON.stringify(data));
}

export function level(xp) {
  return Math.floor(Math.sqrt(Math.max(0, Number(xp) || 0) / 70)) + 1;
}

export function reward(task) {
  return Math.min(75, 10 + Math.ceil((Number(task?.minutes) || 15) / 10) * 5 + (Number(task?.priority) === 3 ? 10 : 0));
}

export function recommend(data, today = new Date().toISOString().slice(0, 10)) {
  return data.tasks.filter(task => !task.done).sort((a, b) => score(b, data.minutes, today) - score(a, data.minutes, today))[0];
}

function score(task, minutes, today) {
  return (task.due && task.due <= today ? 100 : 0) + (Number(task.priority) || 1) * 25 + (Number(task.minutes) <= minutes ? 20 : -10);
}

export function complete(data, id, makeId, getDate) {
  const task = data.tasks.find(item => item.id === id);
  if (!task || task.done) return null;
  task.done = true;
  task.completedAt = Date.now();
  if (task.rewardedAt) return { points: 0, firstCompletion: false };
  const amount = reward(task);
  task.rewardedAt = task.completedAt;
  data.xp += amount;
  data.coins += Math.ceil(amount / 6);
  data.events.push({ id: makeId(), taskId: task.id, title: task.title, date: getDate(), xp: amount });
  return { points: amount, firstCompletion: true };
}

export function toggleComplete(data, id) {
  const task = data.tasks.find(item => item.id === id);
  if (!task) return false;
  task.done = !task.done;
  if (task.done) task.completedAt = Date.now();
  else delete task.completedAt;
  return true;
}

export function removeTask(data, id) {
  const before = data.tasks.length;
  data.tasks = data.tasks.filter(task => task.id !== id);
  return data.tasks.length !== before;
}

export function createProject(data, project) {
  const value = { ...project };
  data.projects.push(value);
  return value;
}
