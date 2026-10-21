// Account-scoped cloud snapshots with optimistic concurrency. Guest data stays local.
export class CloudSync {
 constructor({request,onStatus=()=>{}}){this.request=request;this.onStatus=onStatus;this.revision=null;this.busy=false;this.pending=null;this.inFlight=null;}
 async load(){const rows=await this.request('/rest/v1/xp_personal_state?select=state,revision&limit=1');const row=rows?.[0];this.revision=row?.revision??null;return row?.state??null;}
 async save(state){this.pending=structuredClone(state);if(this.inFlight)return this.inFlight;this.busy=true;
  this.inFlight=this.flush();return this.inFlight;
 }
 async flush(){
  try{while(this.pending){const snapshot=this.pending;this.pending=null;this.onStatus('Saving…');
   const rows=await this.request('/rest/v1/rpc/xp_save_personal_state','POST',{expected_revision:this.revision,next_state:snapshot});
   const row=rows?.[0];if(!row)throw Error('Cloud save returned no result');
   if(!row.saved){this.pending=null;this.onStatus('Sync conflict: reload to review newer cloud data');throw Error('Another device changed your progress. Refresh before editing again.');}
   this.revision=row.current_revision;this.onStatus('Saved to cloud');
  }}catch(e){this.onStatus('Sync failed: '+e.message);throw e}finally{this.busy=false;this.inFlight=null;}
 }
}
