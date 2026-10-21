import * as XP from './core.js';
import { AuthSession } from './auth-session.js';
import { CloudSync } from './cloud-sync.js';
import { icon, CATEGORIES, categoryLabel, categoryMark } from './ui-icons.js';

(()=>{
'use strict';
const KEY='xp-next-web-v1',SB='https://ugoaqdsnizudjifghtoz.supabase.co',PUB='sb_publishable_kKvKmCNfNegimCjV9dz1JA_d5L6LKx9';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),date=()=>new Date().toISOString().slice(0,10);
let data=XP.load(localStorage,KEY);
const accountKey=id=>KEY+'-account-'+id;
let accountOwner=null;
let cloud=null,cloudStatus='Saved on this device',syncBlocked=false;
let page='today',selected='',modal='',token=null,user=null,sessionInfo=null,seconds=0,ticker=null,authBusy=false,authCooldownUntil=0,authMessage='',authMode='login',entryState='loading';
const auth=new AuthSession({baseUrl:SB,publicKey:PUB,storage:localStorage,redirectUrl:'https://anticalvin.github.io/XP/',onChange:s=>{sessionInfo=s;token=s?.access_token||null;user=s?.user||null},onExpired:()=>{entryState='welcome';authMode='login';authMessage='Session expired. Sign in again.';modal='';draw();}});
const save=()=>{
 if(user){
  if(syncBlocked){toast('Cloud sync is paused. Your changes were not saved.');return}
  XP.save(localStorage,data,accountKey(user.id));
  if(cloud)cloud.save(data).catch(e=>{syncBlocked=true;cloudStatus='Cloud sync paused: '+e.message;draw();toast(e.message)});
 }else XP.save(localStorage,data,KEY);
};
async function loadAccount(){
 if(!user)return;
 accountOwner=user.id;
 const guest=XP.load(localStorage,KEY);
 data=XP.freshState();
 cloud=new CloudSync({request:api,onStatus:s=>{cloudStatus=s;const el=document.querySelector('#syncstatus');if(el)el.textContent=s}});
 syncBlocked=true;cloudStatus='Loading your account…';
 try{
  const remote=await cloud.load();
  if(remote){data={...XP.freshState(),...remote};XP.save(localStorage,data,accountKey(user.id));syncBlocked=false;cloudStatus='Cloud synced';draw();return;}
  if(guest.tasks.length||guest.projects.length||guest.events.length||guest.xp){data=guest;cloudStatus='Choose where to start';modal='import';draw();return;}
  syncBlocked=false;await cloud.save(data);draw();
 }catch(e){cloudStatus='Cloud unavailable: '+e.message;syncBlocked=true;draw();toast(e.message)}
}
async function importGuest(yes){
 if(!cloud)return;
 if(yes){syncBlocked=false;await cloud.save(data);XP.save(localStorage,data,accountKey(user.id));localStorage.removeItem(KEY);toast('Progress imported.');}
 else{data=XP.freshState();syncBlocked=false;await cloud.save(data);XP.save(localStorage,data,accountKey(user.id));toast('Cloud profile created.');}
 modal='';draw();
}
const lvl=()=>XP.level(data.xp);
const reward=t=>XP.reward(t);
const toast=s=>{const n=$('#toast');n.textContent=s;n.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>n.style.display='none',2800)};
const go=p=>{page=p;selected='';modal='';draw();window.scrollTo(0,0)};

const tabs=[['today','today','Today'],['projects','projects','Projects'],['paths','paths','Paths'],['social','friends','Friends'],['you','profile','Profile']];
const nav=()=>tabs.map(([p,i,n])=>`<button class="nav ${page===p?'active':''}" data-go="${p}" ${page===p?'aria-current="page"':''}>${icon(i)}<span>${n}</span></button>`).join('');
const levels=()=>`<div class="progress" role="progressbar" aria-label="Level progress" aria-valuenow="${data.xp%140}" aria-valuemin="0" aria-valuemax="140"><div class="fill" style="width:${(data.xp%140)/140*100}%"></div></div>`;
const head=(title,kicker,action='')=>`<header class="head"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="row"><span class="badge">${icon('coin')} ${data.coins}</span><span class="badge">${icon('bolt')} LEVEL ${lvl()}</span>${action}</div></header>`;
const shell=content=>`<div class="layout"><aside class="sidebar"><div class="brand">XP<em>.</em> NEXT<small>01</small></div><nav aria-label="Primary navigation">${nav()}</nav><div class="sidebottom"><strong>XP NEXT / PERSONAL SYSTEM</strong>Progress on your terms.</div></aside><main id="main" class="main">${content}<div id="syncstatus" class="syncstatus" role="status" aria-live="polite" data-state="${syncBlocked?'error':'ok'}">${esc(cloudStatus)}</div></main></div><nav class="footnav" aria-label="Mobile navigation">${tabs.map(([p,i,n])=>`<button data-go="${p}" class="${page===p?'active':''}" ${page===p?'aria-current="page"':''}>${icon(i)}<span>${n}</span></button>`).join('')}</nav>`;
const quests=list=>list.length?list.map(t=>`<div class="task ${t.done?'done':''}"><button class="check ${t.done?'done':''}" data-complete="${esc(t.id)}" aria-label="${t.done?'Reopen':'Complete'} ${esc(t.title)}">${t.done?icon('check'):''}</button><div class="taskbody"><div class="taskname">${esc(t.title)}</div><div class="sub">${esc(categoryLabel(t.category))} · ${Number(t.minutes)||15} MIN${t.due?' · DUE '+esc(t.due):''}${Number(t.priority)===3?' · HIGH PRIORITY':''}</div></div><span class="badge">+${reward(t)} XP</span><button class="iconbtn" data-play="${esc(t.id)}" title="Focus on ${esc(t.title)}" aria-label="Focus on ${esc(t.title)}">${icon('play')}</button><button class="iconbtn" title="Delete ${esc(t.title)}" aria-label="Delete ${esc(t.title)}" data-del="${esc(t.id)}">${icon('trash')}</button></div>`).join(''):'<div class="empty">Nothing in your queue. Add a task to get started.</div>';
const projectTile=p=>{const tasks=data.tasks.filter(t=>t.projectId===p.id);const done=tasks.filter(t=>t.done).length;return `<button class="project" data-project="${esc(p.id)}"><span class="category-mark">${esc((p.title||'XP').slice(0,2).toUpperCase())}</span><h3>${esc(p.title)}</h3><p>${done} OF ${tasks.length} TASKS COMPLETED</p><div class="progress"><div class="fill" style="width:${tasks.length?done/tasks.length*100:0}%"></div></div></button>`};

const rec=()=>XP.recommend(data,date());

function today(){
 const open=data.tasks.filter(t=>!t.done),r=rec(),done=data.tasks.filter(t=>t.done).length;
 const due=open.filter(t=>t.due&&t.due<=date()).length;
 return head('Today','OVERVIEW / '+new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),`<button class="btn sm" data-modal="task">${icon('plus')} New task</button>`)+
 `<div class="grid"><div class="stack">
 <section class="hero"><div><div class="kicker">UP NEXT / ${open.length} OPEN TASKS</div><h2>${r?'Your next move.':'Make your next move.'}</h2><p>${r?'Focus on what matters. Your next task is ready.':'Create a task and start building momentum.'}</p><button class="btn" ${r?'data-play="'+esc(r.id)+'"':'data-modal="task"'}>${icon(r?'play':'plus')} ${r?'Start focus':'Create task'}</button></div><div class="emblem" aria-hidden="true">XP/</div></section>
 <section class="card" aria-label="Task queue"><div class="row between"><h2>Task queue</h2><span class="note">${open.length} OPEN</span></div>${quests(open)}${done?'<h3 class="space">Completed</h3>'+quests(data.tasks.filter(t=>t.done).slice(-3).reverse()):''}</section>
 <div class="row between"><h2>Projects</h2><button class="btn ghost sm" data-go="projects">View all ${icon('arrow')}</button></div><div class="projects">${data.projects.slice(0,2).map(projectTile).join('')||'<div class="empty">No projects yet. Group related tasks in one place.</div>'}</div>
 </div><div class="stack">
 <section class="card"><div class="row between"><h2>Progress</h2><span class="badge">LV ${lvl()}</span></div>${levels()}<div class="stats"><div><b>${done}</b><span>Completed</span></div><div><b>${due}</b><span>Due now</span></div><div><b>${data.xp}</b><span>Total XP</span></div></div></section>
 <section class="card"><div class="kicker">PRIORITY / RECOMMENDED</div><h2 style="margin-top:12px">${esc(r?.title||'Nothing in your queue.')}</h2><p class="muted">${r?esc(categoryLabel(r.category))+' · '+(r.minutes||15)+' minutes'+(r.due&&r.due<=date()?' · Due now':''):'Add a task to see a recommendation.'}</p><div class="section-rule"></div><div class="kicker">AVAILABLE TIME</div><div class="row" style="flex-wrap:wrap;margin:12px 0 20px">${[15,30,60].map(m=>`<button class="chip ${data.minutes===m?'on':''}" data-time="${m}" aria-pressed="${data.minutes===m}">${m} min</button>`).join('')}</div><div class="kicker">ENERGY</div><div class="row" style="flex-wrap:wrap;margin-top:12px">${['gentle','steady','bold'].map(e=>`<button class="chip ${data.energy===e?'on':''}" data-energy="${e}" aria-pressed="${data.energy===e}">${e[0].toUpperCase()+e.slice(1)}</button>`).join('')}</div></section>
 <section class="card"><div class="kicker">ACTIVITY</div><h2 style="margin-top:12px">Progress without penalties.</h2><p class="muted" style="margin-bottom:0">No streak resets. Your history reflects what you've completed.</p></section>
 </div></div>`;
}


function projects(){
 const p=data.projects.find(x=>x.id===selected);
 if(p){const ts=data.tasks.filter(t=>t.projectId===p.id);return head(esc(p.title),'PROJECT / DETAIL',`<button class="btn sm" data-modal="task">${icon('plus')} Add task</button>`)+`<button class="btn ghost sm" data-back="1">${icon('back')} All projects</button><section class="card space"><div class="row between"><h2>${esc(p.title)}</h2><span class="note">${ts.filter(t=>t.done).length}/${ts.length} COMPLETED</span></div><p class="muted">${esc(p.description||'Tasks and progress for this project.')}</p><div class="progress"><div class="fill" style="width:${ts.length?ts.filter(t=>t.done).length/ts.length*100:0}%"></div></div>${quests(ts)}</section>`;}
 return head('Projects','WORK / OVERVIEW',`<button class="btn sm" data-modal="project">${icon('plus')} New project</button>`)+`<section class="hero"><div><div class="kicker">STRUCTURE YOUR WORK</div><h2>Built to finish.</h2><p>Keep related tasks together. See the progress as you go.</p><button class="btn" data-modal="project">${icon('plus')} Create project</button></div><div class="emblem" aria-hidden="true">02/</div></section><div class="row between space"><h2>All projects</h2><span class="note">${data.projects.length} TOTAL</span></div><div class="projects">${data.projects.map(projectTile).join('')||'<div class="empty">No projects yet. Create one to organize your work.</div>'}</div>`;
}


function paths(){
 return head('Paths','PERSONAL DEVELOPMENT / OVERVIEW')+`<section class="card"><div class="kicker">AREAS OF FOCUS</div><h2 style="margin-top:12px">Where your effort goes.</h2><p class="muted">Completed tasks are grouped by their existing categories. Progress is based on actual task completion.</p><div class="projects path-grid">${CATEGORIES.map(c=>{const ts=data.tasks.filter(t=>t.category===c),done=ts.filter(t=>t.done).length;return `<div class="project"><span class="category-mark">${categoryMark(c)}</span><h3>${esc(categoryLabel(c))}</h3><p>${done} OF ${ts.length} COMPLETED</p><div class="progress"><div class="fill" style="width:${ts.length?done/ts.length*100:0}%"></div></div></div>`}).join('')}</div></section>`;
}


function you(){
 const days=Array.from({length:7},(_,i)=>{let d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10)});
 const vals=days.map(d=>data.events.filter(e=>e.date===d).length),max=Math.max(1,...vals);
 return head('Profile','ACCOUNT / ACTIVITY')+`<div class="grid"><div class="stack">
 <section class="hero"><div><div class="kicker">PLAYER PROFILE / LEVEL ${lvl()}</div><h2>${esc(data.name)}</h2><p>${data.xp} XP TOTAL · ${data.coins} COINS</p><button class="btn" data-modal="avatar">${icon('settings')} Edit profile</button></div><div class="profile-mark" aria-hidden="true">XP</div></section>
 <section class="card"><div class="row between"><h2>Activity log</h2><span class="note">${data.events.length} RECORDS</span></div>${data.events.length?data.events.slice(-10).reverse().map(e=>`<div class="socialitem"><span>${esc(e.title)}</span><span class="note">${esc(e.date)}</span></div>`).join(''):'<div class="empty">Completed tasks will appear here.</div>'}</section></div>
 <div class="stack"><section class="card"><h2>Last 7 days</h2><div class="bars" role="img" aria-label="Completed tasks per day: ${vals.map((v,i)=>days[i]+': '+v).join(', ')}">${vals.map((v,i)=>`<div class="barcol"><div class="bar" style="height:${Math.max(4,v/max*85)}px"></div><div class="barlabel">${days[i].slice(5)}</div></div>`).join('')}</div><p class="note">Tasks completed per day.</p></section>
 <section class="card"><h2>Account & data</h2><p class="muted">${user?'Signed in: '+esc(user.email||'Account connected')+'. Progress is saved to Supabase.':'Guest mode. Progress is saved on this device only.'}</p><p class="note">${esc(cloudStatus)}</p><div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-export="1">${icon('download')} Export data</button>${user?`<button class="btn ghost" data-logout="1">${icon('logout')} Sign out</button>`:`<button class="btn" data-modal="auth">Sign in</button>`}</div></section></div></div>`;
}

async function api(path,method='GET',body=null){
  if(!token)throw Error('Sign in first');
  const r=await auth.request(path,{method,headers:{Prefer:'return=representation'},body:body?JSON.stringify(body):null});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.error_description||j.error||'Network request failed')}
  const t=await r.text();return t?JSON.parse(t):null
}
async function signOut(){
  try{await auth.signOut()}catch{}
  cloud=null;syncBlocked=false;cloudStatus='Saved on this device';
  accountOwner=null;data=XP.load(localStorage,KEY);entryState='welcome';authMode='login';authMessage='';modal='';draw();toast('Signed out.')
}
async function authSubmit(f){
  if(authBusy)return;
  const remaining=authCooldownUntil-Date.now();
  if(remaining>0&&f.dataset.mode==='signup'){authMessage='Email sending is temporarily limited. Please wait before requesting another email.';draw();return}
  const fields=new FormData(f);
  const email=String(fields.get('email')||'').trim();
  const password=String(fields.get('password')||'');
  const mode=f.dataset.mode;
  authBusy=true;authMessage='';
  const submit=f.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Please wait…'}
  try{
    const value=await auth.signIn(email,password,mode);
    if(!value){authMessage='Check your email for the confirmation link, then return here to sign in.';draw();return}
    entryState='app';modal='';await loadAccount();toast('Signed in.');
  }catch(e){
    if(mode==='signup'&&/rate limit|too many requests|email.*limit|over_email_send_rate_limit/i.test(e.message)){
      authCooldownUntil=Date.now()+15*60*1000;
      authMessage='Supabase has temporarily reached its email sending limit. Your account may already exist. Please wait before trying again or sign in with an account you have confirmed.';
    }else{authMessage=e.message}
    draw();
  }finally{authBusy=false}
}

async function socialLoad(){
 if(!user)return;
 try{
 const fs=await api('/rest/v1/xp_friendships?select=*&or=(requester_id.eq.'+user.id+',addressee_id.eq.'+user.id+')');
 const ids=[...new Set(fs.flatMap(x=>[x.requester_id,x.addressee_id]).filter(x=>x!==user.id))];
 const ps=ids.length?await api('/rest/v1/xp_profiles?select=id,username,avatar&id=in.('+ids.join(',')+')'):[];
 const target=$('#socialdata');if(!target)return;
 target.innerHTML=fs.length?fs.map(x=>{const p=ps.find(z=>z.id===(x.requester_id===user.id?x.addressee_id:x.requester_id));return `<div class="socialitem"><span>${icon('profile')} ${esc(p?.username||'Player')} <small class="muted">/ ${esc(x.status)}</small></span>${x.status==='pending'&&x.addressee_id===user.id?'<button class="btn sm" data-accept="'+esc(x.id)+'">Accept</button>':''}</div>`}).join(''):'<div class="empty">No friends or requests yet.</div>';
 }catch(e){const target=$('#socialdata');if(target)target.innerHTML='<p class="muted" role="alert">'+esc(e.message)+'</p>';}
}
function social(){
 return head('Friends','SOCIAL / CONNECTIONS')+(user?`<div class="grid"><section class="card"><h2>Find players</h2><p class="muted">Search by username to send a friend request.</p><form id="findForm"><label>Username<input name="query" minlength="2" maxlength="24" placeholder="Search username" required></label><button class="btn" type="submit">${icon('search')} Search</button></form><div id="findresults" aria-live="polite"></div></section><section class="card"><h2>Friends & requests</h2><div id="socialdata"><p class="muted">Loading connections…</p></div></section></div>`:`<section class="card center"><div class="kicker">SOCIAL / SIGN IN REQUIRED</div><h2 style="margin-top:18px">Connect with people you know.</h2><p class="muted">Sign in to search players and send friend requests.</p><button class="btn" data-modal="auth">Sign in or create account</button></section>`);
}

function overlay(){
 if(!modal)return'';
 let body='';
 if(modal==='import')body=`<h2>Restore local progress?</h2><p class="muted">This account has no cloud data. You can import the tasks and progress stored on this device or start with a new profile.</p><div class="actions"><button class="btn ghost" data-import="no">Start fresh</button><button class="btn" data-import="yes">Import progress</button></div>`;
 if(modal==='task')body=`<div class="kicker">TASK / NEW</div><h2 style="margin-top:12px">Create task</h2><form id="questForm"><label>Task name<input name="title" maxlength="160" placeholder="Finish presentation" required autofocus></label><label>Category<select name="category">${CATEGORIES.map(c=>'<option value="'+esc(c)+'">'+esc(categoryLabel(c))+'</option>').join('')}</select></label><label>Estimated time (minutes)<input name="minutes" type="number" min="5" max="600" value="25"></label><label>Due date (optional)<input type="date" name="due"></label><label>Priority<select name="priority"><option value="1">Normal</option><option value="2">High</option><option value="3">Urgent</option></select></label><label>Project<select name="project"><option value="">No project</option>${data.projects.map(p=>'<option value="'+esc(p.id)+'" '+(selected===p.id?'selected':'')+'>'+esc(p.title)+'</option>').join('')}</select></label><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn" type="submit">Create task</button></div></form>`;
 if(modal==='project')body=`<div class="kicker">PROJECT / NEW</div><h2 style="margin-top:12px">Create project</h2><form id="projectForm"><label>Project name<input name="title" maxlength="120" required placeholder="Build a portfolio"></label><label>Description<input name="description" maxlength="350" placeholder="What are you working toward?"></label><label>Project icon (optional)<select name="icon"><option value="🚀">Default</option><option value="🧩">Focus</option><option value="🎨">Creative</option><option value="📚">Learning</option><option value="🌱">Personal</option><option value="💻">Technical</option></select></label><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn" type="submit">Create project</button></div></form>`;
 if(modal==='avatar')body=`<div class="kicker">PROFILE / EDIT</div><h2 style="margin-top:12px">Edit profile</h2><form id="avatarForm"><label>Display name<input name="name" maxlength="30" value="${esc(data.name)}" required></label><label>Avatar (optional)<select name="avatar">${['🦊','🐻','🐱','🐼','🐸','🦄','🐉','👩‍🚀','🧙','🦖'].map(a=>'<option '+(a===data.avatar?'selected':'')+'>'+a+'</option>').join('')}</select></label><p class="note">Existing avatar selections remain available. A custom character system is not yet implemented.</p><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn" type="submit">Save profile</button></div></form>`;
 if(modal==='auth')body=authPanel(false);
 if(modal==='mission'){const t=data.tasks.find(t=>t.id===selected);body=`<div class="focus-stage"><div class="kicker">FOCUS / SESSION</div><h2 style="font-size:clamp(1.5rem,4vw,2.7rem);margin:17px auto;max-width:520px">${esc(t?.title||'Focus session')}</h2><p>One task. No distractions.</p><div id="timer" class="clock" role="timer" aria-live="off">${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}</div><div class="row"><button class="btn ghost" data-timer="1">${icon(ticker?'pause':'play')}${ticker?'Pause':'Start timer'}</button><button class="btn" data-finish="${esc(selected)}">${icon('check')} Complete task</button></div><p style="margin-top:22px">+${reward(t||{})} XP on first completion. Progress is self-reported.</p><button class="btn ghost" data-close="1">Back to tasks</button></div>`;}
 return `<div class="modalback" data-backdrop="1"><section role="dialog" aria-modal="true" aria-label="${modal==='mission'?'Focus session':'XP NEXT dialog'}" class="dialog">${body}</section></div>`;
}
function authPanel(standalone=false){
 const signup=authMode==='signup';
 return `<div class="account-panel"><div class="kicker">ACCOUNT / ${signup?'CREATE':'ACCESS'}</div><h2 class="account-title">${signup?'Create your account':'Welcome back'}</h2><p class="muted">${signup?'Save progress across devices and connect with friends. You may need to confirm your email.':'Sign in to restore your progress, projects, and connections.'}</p><div class="auth-switch" role="group" aria-label="Account action"><button type="button" class="${!signup?'active':''}" data-mode="login" aria-pressed="${!signup}">Sign in</button><button type="button" class="${signup?'active':''}" data-mode="signup" aria-pressed="${signup}">Create account</button></div><form id="authForm" data-mode="${authMode}">${authMessage?'<p role="alert" class="auth-message">'+esc(authMessage)+'</p>':''}<label>Email address<input type="email" name="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input type="password" minlength="6" name="password" autocomplete="${signup?'new-password':'current-password'}" placeholder="${signup?'At least 6 characters':'Your password'}" required></label><button class="btn auth-submit" type="submit">${signup?'Create account':'Sign in'}</button></form>${standalone?'<button class="btn ghost auth-guest" type="button" data-guest="1">Continue as guest</button><p class="note account-note">Guest progress stays on this device until you choose to import it into an account.</p>':'<button class="btn ghost auth-guest" type="button" data-close="1">Not now</button>'}</div>`;
}
function welcome(){
 return `<div class="entry-screen"><div class="entry-brand">XP<span>.</span> NEXT <small>01</small></div><div class="entry-grid"><section class="entry-intro"><div class="kicker">YOUR SPACE / YOUR PROGRESS</div><h1>Make your<br><em>next move.</em></h1><p>Tasks, projects and progress in one place. Keep moving, at your own pace.</p><div class="entry-stats"><span>FOCUS</span><span>PROGRESS</span><span>CONNECTION</span></div></section><section class="entry-auth" aria-label="Account access">${authPanel(true)}</section></div><div class="entry-footer">XP NEXT / PERSONAL SYSTEM <span>BUILT FOR REAL LIFE</span></div></div>`;
}
function profileGuest(){
 return head('Profile','ACCOUNT / SIGN IN')+`<section class="card profile-guest"><div class="kicker">ACCOUNT / CLOUD SAVE</div><h2>Your progress, on every device.</h2><p class="muted">Sign in or create an account to access your profile, sync your progress and connect with friends.</p><div class="row" style="flex-wrap:wrap"><button class="btn" data-auth="signup">Create account</button><button class="btn ghost" data-auth="login">Sign in</button></div><p class="note">You can still work in guest mode. Your tasks are stored locally until you import them.</p></section>`;
}
function draw(){
 const app=$('#app');
 if(entryState==='loading'){app.innerHTML='<div class="entry-loading" role="status">Loading XP NEXT…</div>';return}
 if(!user&&entryState==='welcome'){app.innerHTML=welcome();return}
 let content=page==='today'?today():page==='projects'?projects():page==='paths'?paths():page==='social'?social():user?you():profileGuest();
 app.innerHTML=shell(content)+overlay();
 if(page==='social'&&user)queueMicrotask(socialLoad);
}
function finish(id){if(ticker){clearInterval(ticker);ticker=null}const result=XP.complete(data,id,uid,date);if(!result)return;save();modal='';draw();toast(result.points?'Task completed. +'+result.points+' XP.':'Task completed. XP was already awarded.')}
document.addEventListener('click',async e=>{if(e.target.matches('.modalback')){modal='';if(ticker){clearInterval(ticker);ticker=null}draw();return}const b=e.target.closest('button');if(!b)return;const d=b.dataset;try{
if(d.import){await importGuest(d.import==='yes');return}
if(d.go)return go(d.go);
if(d.guest){entryState='app';authMessage='';draw();return}
if(d.auth){authMode=d.auth;authMessage='';modal='auth';draw();queueMicrotask(()=>document.querySelector('#authForm input')?.focus());return}
if(d.modal){if(d.modal==='auth'){authMode='login';authMessage=''}modal=d.modal;draw();queueMicrotask(()=>document.querySelector('.dialog input, .dialog button')?.focus());return}
if(d.close){modal='';if(ticker){clearInterval(ticker);ticker=null}draw();return}
if(d.back){selected='';draw();return}
if(d.project){selected=d.project;draw();return}
if(d.time){data.minutes=+d.time;save();draw();return}
if(d.energy){data.energy=d.energy;save();draw();return}
if(d.play){selected=d.play;seconds=(+data.tasks.find(t=>t.id===selected)?.minutes||15)*60;modal='mission';draw();return}
if(d.timer){if(ticker){clearInterval(ticker);ticker=null;draw()}else{ticker=setInterval(()=>{seconds=Math.max(0,seconds-1);const n=$('#timer');if(n)n.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(!seconds){clearInterval(ticker);ticker=null;toast('Focus time finished.')}},1000);draw()}return}
if(d.finish)return finish(d.finish);
if(d.complete){const t=data.tasks.find(t=>t.id===d.complete);if(t?.done){XP.toggleComplete(data,t.id);save();draw()}else finish(d.complete);return}
if(d.del){if(confirm('Delete this task? This cannot be undone.')){XP.removeTask(data,d.del);save();draw()}return}
if(d.logout){await signOut();return}
if(d.export){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='xp-next-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);return}
if(d.mode){if(authBusy)return;const form=$('#authForm');const email=form?.querySelector('input[name="email"]')?.value||'';authMode=d.mode;authMessage='';draw();const input=$('#authForm input[name="email"]');if(input){input.value=email;input.focus()}return}
if(d.accept){await api('/rest/v1/xp_friendships?id=eq.'+encodeURIComponent(d.accept),'PATCH',{status:'accepted'});toast('Friend added.');socialLoad();return}
if(d.friend){await api('/rest/v1/xp_friendships','POST',{requester_id:user.id,addressee_id:d.friend,status:'pending'});toast('Friend request sent.');socialLoad();return}
}catch(x){toast(x.message)}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const fd=new FormData(f);try{
if(f.id==='questForm'){data.tasks.unshift({id:uid(),title:String(fd.get('title')).trim().slice(0,160),category:fd.get('category'),minutes:Math.max(5,Math.min(600,+fd.get('minutes')||25)),priority:+fd.get('priority')||1,due:fd.get('due')||'',projectId:fd.get('project')||'',done:false});modal='';save();draw();toast('Task created.')}
if(f.id==='projectForm'){XP.createProject(data,{id:uid(),title:String(fd.get('title')).trim().slice(0,120),description:String(fd.get('description')||''),icon:fd.get('icon')});modal='';save();go('projects');toast('Project created.')}
if(f.id==='avatarForm'){data.name=String(fd.get('name')).trim().slice(0,30);data.avatar=fd.get('avatar');modal='';save();draw();toast('Profile updated.')}
if(f.id==='authForm')await authSubmit(f);
if(f.id==='findForm'){let q=String(fd.get('query')).replace(/[^a-zA-Z0-9_]/g,'').slice(0,24);if(q.length<2)throw Error('Search at least two characters');const p=await api('/rest/v1/xp_profiles?select=id,username,avatar&username=ilike.*'+encodeURIComponent(q)+'*&limit=12');$('#findresults').innerHTML=p.filter(x=>x.id!==user.id).map(x=>`<div class="socialitem">${esc(x.avatar)} ${esc(x.username)} <button class="btn sm" data-friend="${x.id}">Add friend</button></div>`).join('')||'<p class="muted">Nobody found yet.</p>'}
}catch(x){toast(x.message)}});
async function resume(){
 const callback=location.hash.includes('access_token=')||location.hash.includes('error=');
 if(callback){
  try{
   const verified=await auth.completeEmailConfirmation(location.hash);
   history.replaceState(null,'',location.pathname+location.search);
   if(verified){entryState='app';await loadAccount();toast('Email confirmed. Signed in.');return;}
  }catch(e){history.replaceState(null,'',location.pathname+location.search);authMessage=e.message;}
 }
 const active=await auth.restore();
 if(active){entryState='app';await loadAccount();}
 else{entryState='welcome';draw();}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){modal='';if(ticker){clearInterval(ticker);ticker=null}draw()}});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&auth.session?.expires_at<Date.now()+60000)auth.refresh().catch(()=>auth.expire());
});
draw();resume();
})();
