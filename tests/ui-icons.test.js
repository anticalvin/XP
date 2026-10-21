import test from 'node:test';
import assert from 'node:assert/strict';
import { icon, CATEGORIES, categoryLabel, categoryMark } from '../ui-icons.js';

test('persisted category identifiers remain unchanged',()=>{
 assert.deepEqual(CATEGORIES,['📚 Learning','💪 Fitness','🎨 Creativity','💻 Work','💖 Life','🌎 Adventure']);
 assert.equal(categoryLabel('💻 Work'),'Work');
 assert.equal(categoryMark('📚 Learning'),'LR');
});
test('icon helper renders consistent accessible SVG without external URLs',()=>{
 const markup=icon('tasks','Tasks');
 assert.match(markup,/class="ico"/);
 assert.match(markup,/aria-hidden="true"/);
 assert.match(markup,/Tasks/);
 assert.doesNotMatch(markup,/<script|https?:\/\//);
});
