import test from 'node:test';
import assert from 'node:assert/strict';
import {CloudSync} from '../cloud-sync.js';
test('cloud snapshot starts and increments revision',async()=>{
 let revision=null,state=null;
 const sync=new CloudSync({request:async(path,method,body)=>{
  if(path.includes('xp_personal_state?'))return state?[{revision,state}]:[];
  assert.equal(method,'POST');
  if(body.expected_revision!==revision)return [{saved:false,current_revision:revision,current_state:state}];
  revision=(revision??0)+1;state=body.next_state;
  return [{saved:true,current_revision:revision,current_state:state}];
 }});
 assert.equal(await sync.load(),null);
 await sync.save({tasks:[{id:'1'}]});
 assert.equal(revision,1);
 await sync.save({tasks:[{id:'2'}]});
 assert.equal(revision,2);
 assert.deepEqual(await sync.load(),{tasks:[{id:'2'}]});
});
test('conflicting edits are refused instead of overwriting',async()=>{
 const sync=new CloudSync({request:async(path)=>path.includes('xp_personal_state?')?[{revision:5,state:{name:'newer'}}]:[{saved:false,current_revision:6,current_state:{name:'other device'}}]});
 await sync.load();
 await assert.rejects(sync.save({name:'stale'}),/Another device changed/);
});
