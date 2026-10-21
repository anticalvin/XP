import test from 'node:test';
import assert from 'node:assert/strict';
import { complete, createProject, freshState, load, recommend, removeTask, reward, save, toggleComplete } from '../core.js';

const task = (id, extra = {}) => ({ id, title: id, minutes: 30, priority: 1, done: false, ...extra });

test('task completion awards XP once, including after toggling it open and complete again', () => {
  const data = freshState();
  data.tasks.push(task('one'));
  const award = complete(data, 'one', () => 'event-1', () => '2026-10-21');
  assert.equal(award.points, reward(data.tasks[0]));
  assert.equal(data.xp, award.points);
  assert.equal(data.events.length, 1);
  assert.equal(complete(data, 'one', () => 'event-2', () => '2026-10-21'), null);
  toggleComplete(data, 'one');
  const second = complete(data, 'one', () => 'event-3', () => '2026-10-21');
  assert.deepEqual(second, { points: 0, firstCompletion: false });
  assert.equal(data.xp, award.points);
  assert.equal(data.events.length, 1);
});

test('deleting a task removes the task but preserves the earned XP history', () => {
  const data = freshState();
  data.tasks.push(task('remove-me'));
  complete(data, 'remove-me', () => 'event-1', () => '2026-10-21');
  const earned = data.xp;
  assert.equal(removeTask(data, 'remove-me'), true);
  assert.equal(removeTask(data, 'missing'), false);
  assert.equal(data.tasks.length, 0);
  assert.equal(data.xp, earned);
  assert.equal(data.events.length, 1);
});

test('project creation stores a new project', () => {
  const data = freshState();
  const project = createProject(data, { id: 'p1', title: 'Learn guitar', icon: '🎸' });
  assert.equal(project.id, 'p1');
  assert.deepEqual(data.projects, [project]);
});

test('recommendation favors due and higher priority work while respecting available time', () => {
  const data = freshState();
  data.minutes = 30;
  data.tasks.push(
    task('later', { priority: 3, due: '2026-11-01', minutes: 15 }),
    task('due', { priority: 2, due: '2026-10-21', minutes: 20 }),
    task('done', { priority: 3, due: '2026-10-20', minutes: 10, done: true })
  );
  assert.equal(recommend(data, '2026-10-21').id, 'due');
});

test('state persists and malformed storage safely returns a new state', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const data = freshState();
  data.name = 'CK';
  data.tasks.push(task('persisted'));
  save(storage, data);
  assert.deepEqual(load(storage), data);
  values.set('xp-next-web-v1', '{bad json');
  assert.deepEqual(load(storage), freshState());
});
