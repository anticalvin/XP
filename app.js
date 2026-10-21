import * as XP from './core.js';
import { AuthSession } from './auth-session.js';
import { CloudSync } from './cloud-sync.js';

(()=>{
'use strict';
const KEY='xp-next-web-v1',SB='https://ugoaqdsnizudjifghtoz.supabase.co',PUB='sb_publishable_kKvKmCNfNegimCjV9dz1JA_d5L6LKx9';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),date=()=>new Date().toISOString().slice(0,10);
let data=XP.load(localStorage,KEY);
const accountKey=id=>KEY+'-account-'+id;
let accountOwner=null;
let cloud=null,cloudStatus='Guest mode · saved locally',syncBlocked=false;
let page='today',selected='',modal='',token=null,user=null,sessionInfo=null,seconds=0,ticker=null,authBusy=false,authCooldownUntil=0,authMessage='';
const auth=new AuthSession({baseUrl:SB,publicKey:PUB,storage:localStorage,redirectUrl:'https://anticalvin.github.io/XP/',onChange:s=>{sessionInfo=s;token=s?.access_token||null;user=s?.user||null},onExpired:()=>{draw();toast('Your session expired. Please sign in again.')}});
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
 syncBlocked=true;cloudStatus='Loading account…';
 try{
  const remote=await cloud.load();
  if(remote){data={...XP.freshState(),...remote};XP.save(localStorage,data,accountKey(user.id));syncBlocked=false;cloudStatus='Synced with Supabase';draw();return;}
  if(guest.tasks.length||guest.projects.length||guest.events.length||guest.xp){data=guest;cloudStatus='Import decision required';modal='import';draw();return;}
  syncBlocked=false;await cloud.save(data);draw();
 }catch(e){cloudStatus='Cloud unavailable: '+e.message;syncBlocked=true;draw();toast(e.message)}
}
async function importGuest(yes){
 if(!cloud)return;
 if(yes){syncBlocked=false;await cloud.save(data);XP.save(localStorage,data,accountKey(user.id));localStorage.removeItem(KEY);toast('Your adventure is backed up! ☁️');}
 else{data=XP.freshState();syncBlocked=false;await cloud.save(data);XP.save(localStorage,data,accountKey(user.id));toast('Started a fresh cloud adventure.');}
 modal='';draw();
}
const lvl=()=>XP.level(data.xp);
const reward=t=>XP.reward(t);
const toast=s=>{const n=$('#toast');n.textContent=s;n.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>n.style.display='none',2800)};
const go=p=>{page=p;selected='';modal='';draw();window.scrollTo(0,0)};
const tabs=[['today','☀️','Today'],['projects','🧩','Projects'],['paths','🪐','Paths'],['social','🤝','Friends'],['you','🦊','You']];
const nav=()=>tabs.map(([p,i,n])=>`<button class="nav ${page===p?'active':''}" data-go="${p}">${i} &nbsp; ${n}</button>`).join('');
const levels=()=>`<div class="progress"><div class="fill" style="width:${(data.xp%140)/140*100}%"></div></div>`;
const head=(title,kicker,action='')=>`<header class="head"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="row"><span class="badge">🪙 ${data.coins}</span><span class="badge">⚡ Lv ${lvl()}</span>${action}</div></header>`;
const shell=content=>`<div class="layout"><aside class="sidebar"><div class="brand">XP ✦</div>${nav()}<div class="sidebottom">🦊 Real life is the game.<br><small class="muted">Every small win counts.</small></div></aside><main class="main">${content}</main></div><nav class="footnav">${tabs.map(([p,i,n])=>`<button data-go="${p}" class="${page===p?'active':''}">${i}<br>${n}</button>`).join('')}</nav>`;
const quests=list=>list.length?list.map(t=>`<div class="task ${t.done?'done':''}"><button class="check ${t.done?'done':''}" data-complete="${t.id}" aria-label="Toggle completion">${t.done?'✓':''}</button><div class="taskbody"><div class="taskname">${esc(t.title)}</div><div class="sub">${esc(t.category||'✨ Life')} · ${t.minutes||15} min ${t.due?' · 📅 '+esc(t.due):''}</div></div><span class="badge">+${reward(t)} XP</span><button class="btn ghost sm" data-play="${t.id}">▶</button><button class="close" title="Delete quest" data-del="${t.id}">×</button></div>`).join(''):'<div class="empty">No quests here. Start something brilliant! ✨</div>';
const projectTile=p=>{const tasks=data.tasks.filter(t=>t.projectId===p.id);const done=tasks.filter(t=>t.done).length;return `<button class="project" data-project="${p.id}"><div style="font-size:35px">${esc(p.icon||'🚀')}</div><h3>${esc(p.title)}</h3><p>${done}/${tasks.length} quests completed</p><div class="progress"><div class="fill" style="width:${tasks.length?done/tasks.length*100:0}%"></div></div></button>`};
const rec=()=>XP.recommend(data,date());
function today(){const open=data.tasks.filter(t=>!t.done),r=rec(),done=data.tasks.filter(t=>t.done).length;return head('Hey, '+esc(data.name)+'! 👋','YOUR ADVENTURE STARTS HERE','<button class="btn sm" data-modal="task">+ Quest</button>')+`<div class="grid"><div class="stack"><section class="hero"><div><div class="kicker" style="color:#eee6ff">✨ YOUR NEXT CHAPTER</div><h2>Little steps.<br>Legendary progress.</h2><p>Make today count, one quest at a time.</p><button class="btn orange" ${r?'data-play="'+r.id+'"':'data-modal="task"'}>${r?'Start a mission →':'Create your first quest →'}</button></div><div class="mascot">${esc(data.avatar)}</div></section><div class="card"><div class="row between"><h2>🎯 Your quests</h2><button class="btn ghost sm" data-modal="task">+ Add</button></div>${quests(open)}${data.tasks.some(t=>t.done)?'<h3 class="space">🌟 Recent wins</h3>'+quests(data.tasks.filter(t=>t.done).slice(-3).reverse()):''}</div><div class="row between"><h2>🧩 Your projects</h2><button class="btn ghost sm" data-go="projects">See all</button></div><div class="projects">${data.projects.slice(0,2).map(projectTile).join('')||'<div class="card">Your first project is one click away.</div>'}</div></div><div class="stack"><div class="card"><div class="row between"><h3>⚡ Your power</h3><span class="badge">Level ${lvl()}</span></div>${levels()}<p class="muted">Personal, self-reported progress.</p><div class="stats"><div><b>${done}</b><span>Quests done</span></div><div><b>${data.tasks.length?Math.round(100*done/data.tasks.length):0}%</b><span>Completion</span></div><div><b>${data.xp}</b><span>Total XP</span></div></div></div><div class="card"><div class="kicker">🌟 SMART PICK</div><h2>${esc(r?.title||'Your adventure awaits')}</h2><p class="muted">${r?'Try this next. '+(r.due&&r.due<=date()?'It is due now. ':'')+'It is one of your highest-priority quests.':'Add a task and XP will help you pick a next step.'}</p><div class="row" style="flex-wrap:wrap">${[15,30,60].map(m=>`<button class="chip ${data.minutes===m?'on':''}" data-time="${m}">${m} min</button>`).join('')}</div><div class="row" style="margin-top:10px;flex-wrap:wrap">${['gentle','steady','bold'].map(e=>`<button class="chip ${data.energy===e?'on':''}" data-energy="${e}">${e}</button>`).join('')}</div>${r?'<button class="btn orange" style="margin-top:19px" data-play="'+r.id+'">Let\'s go →</button>':''}</div><div class="card"><h3>💜 No broken streaks</h3><p class="muted">We celebrate progress, not perfect attendance. Your journey is yours.</p></div></div></div>`}
function projects(){const p=data.projects.find(x=>x.id===selected);if(p)return head(esc(p.title),'YOUR PROJECT','<button class="btn sm" data-modal="task">+ Quest</button>')+`<button class="btn ghost sm" data-back="1">← All projects</button><div class="card space"><h2>${esc(p.icon)} ${esc(p.title)}</h2><p class="muted">${esc(p.description||'A collection of meaningful wins.')}</p>${quests(data.tasks.filter(t=>t.projectId===p.id))}</div>`;return head('Projects 🧩','BIG GOALS, LITTLE WINS','<button class="btn sm" data-modal="project">+ Project</button>')+`<div class="hero"><div><h2>Build something awesome.</h2><p>Turn a big dream into a series of small adventures.</p><button class="btn orange" data-modal="project">Begin →</button></div><div class="mascot">🚀</div></div><div class="projects space">${data.projects.map(projectTile).join('')}</div>`}
function paths(){let cats=['📚 Learning','💪 Fitness','🎨 Creativity','💻 Work','💖 Life','🌎 Adventure'];return head('Your paths 🪐','GROW INTO YOUR NEXT SELF')+`<div class="card"><h2>Every quest builds your story.</h2><p class="muted">Your completed quests, grouped into the skills and interests you actually work on.</p><div class="projects">${cats.map(c=>{let ts=data.tasks.filter(t=>t.category===c),done=ts.filter(t=>t.done).length;return `<div class="project"><h3>${c}</h3><p>${done} victories · ${ts.length} quests</p><div class="progress"><div class="fill" style="width:${ts.length?done/ts.length*100:0}%"></div></div></div>`}).join('')}</div></div>`}
function you(){let days=Array.from({length:7},(_,i)=>{let d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10)});let vals=days.map(d=>data.events.filter(e=>e.date===d).length),max=Math.max(1,...vals);return head('Your legend ✨','YOU ARE THE MAIN CHARACTER')+`<div class="grid"><div class="stack"><div class="hero"><div><h2>${esc(data.name)}</h2><p>Level ${lvl()} · ${data.xp} XP · ${data.coins} coins</p><button class="btn orange" data-modal="avatar">Customize character</button></div><div class="mascot">${esc(data.avatar)}</div></div><div class="card"><h2>🏆 Accomplishment archive</h2>${data.events.length?data.events.slice(-10).reverse().map(e=>`<div class="socialitem">🌟 ${esc(e.title)} <small class="muted">${esc(e.date)}</small></div>`).join(''):'<p class="muted">Your first completed quest becomes your first trophy.</p>'}</div></div><div class="stack"><div class="card"><h2>📊 The past 7 days</h2><div class="bars">${vals.map((v,i)=>`<div class="barcol"><div class="bar" style="height:${Math.max(4,v/max*100)}px"></div><div class="barlabel">${days[i].slice(5)}</div></div>`).join('')}</div><p class="muted">Completed quests per day</p></div><div class="card"><h2>Save your journey</h2><button class="btn ghost" data-export="1">Download backup</button><p class="muted">Solo work is stored on this browser, not automatically synced between devices.</p>${user?'<p class="muted">Signed in as '+esc(user.email||'your account')+'</p><button class="btn ghost" data-logout="1">Sign out</button>':'<button class="btn ghost" data-modal="auth">Sign in for friends</button>'}</div></div></div>`}
async function api(path,method='GET',body=null){
  if(!token)throw Error('Sign in first');
  const r=await auth.request(path,{method,headers:{Prefer:'return=representation'},body:body?JSON.stringify(body):null});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(j.message||j.error_description||j.error||'Network request failed')}
  const t=await r.text();return t?JSON.parse(t):null
}
async function signOut(){
  try{await auth.signOut()}catch{}
  cloud=null;syncBlocked=false;cloudStatus='Guest mode · saved locally';
  accountOwner=null;data=XP.load(localStorage,KEY);draw();toast('Signed out. Guest progress is separate from account data.')
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
    if(!value){modal='';draw();toast('Check your email for a confirmation link ✉️');return}
    modal='';await loadAccount();toast('Welcome to the crew! 🎉');
  }catch(e){
    if(mode==='signup'&&/rate limit|too many requests|email.*limit|over_email_send_rate_limit/i.test(e.message)){
      authCooldownUntil=Date.now()+15*60*1000;
      authMessage='Supabase has temporarily reached its email sending limit. Your account may already exist. Please wait before trying again or sign in with an account you have confirmed.';
    }else{authMessage=e.message}
    draw();
  }finally{authBusy=false}
}
async function socialLoad(){if(!user)return;try{let fs=await api('/rest/v1/xp_friendships?select=*&or=(requester_id.eq.'+user.id+',addressee_id.eq.'+user.id+')');let ids=[...new Set(fs.flatMap(x=>[x.requester_id,x.addressee_id]).filter(x=>x!==user.id))];let ps=ids.length?await api('/rest/v1/xp_profiles?select=id,username,avatar&id=in.('+ids.join(',')+')'):[];const target=$('#socialdata');if(!target)return;target.innerHTML=fs.length?fs.map(x=>{let p=ps.find(z=>z.id===(x.requester_id===user.id?x.addressee_id:x.requester_id));return `<div class="socialitem">👤 ${esc(p?.username||'Player')} · ${esc(x.status)} ${x.status==='pending'&&x.addressee_id===user.id?'<button class="btn sm" data-accept="'+x.id+'">Accept</button>':''}</div>`}).join(''):'<p class="muted">Your next teammate is out there.</p>'}catch(e){toast(e.message)}}
function social(){return head('The crew 🤝','REAL PROJECTS, REAL FRIENDS')+(user?`<div class="grid"><div class="card"><h2>🔎 Find your friends</h2><form id="findForm"><label>Search player username<input name="query" minlength="2" placeholder="Their username" required></label><button class="btn">Search players</button></form><div id="findresults"></div></div><div class="card"><h2>💌 Friends & requests</h2><div id="socialdata"><p class="muted">Loading social adventures…</p></div></div></div>`:`<div class="card center"><div style="font-size:55px">🤝</div><h2>Adventures are better together.</h2><p class="muted">Create an account to find friends and send invitations.</p><button class="btn" data-modal="auth">Sign in / sign up</button></div>`)}
function overlay(){if(!modal)return'';let body='';if(modal==='import')body=`<h2>☁️ Bring your adventure?</h2><p class="muted">We found quests on this browser, but your account has no cloud progress. Import your tasks, projects, XP and history, or start fresh.</p><div class="actions"><button class="btn ghost" data-import="no">Start fresh</button><button class="btn orange" data-import="yes">Import my progress</button></div>`;if(modal==='task')body=`<h2>✨ New quest</h2><p class="muted">One real thing you want to accomplish.</p><form id="questForm"><label>What are we doing?<input name="title" maxlength="160" placeholder="e.g. Finish my presentation" required autofocus></label><label>Life path<select name="category">${['📚 Learning','💪 Fitness','🎨 Creativity','💻 Work','💖 Life','🌎 Adventure'].map(c=>'<option>'+c+'</option>').join('')}</select></label><label>Estimated minutes<input name="minutes" type="number" min="5" max="600" value="25"></label><label>Due date (optional)<input type="date" name="due"></label><label>Priority<select name="priority"><option value="1">Normal</option><option value="2">Important</option><option value="3">Urgent</option></select></label><label>Project<select name="project"><option value="">No project</option>${data.projects.map(p=>'<option value="'+p.id+'" '+(selected===p.id?'selected':'')+'>'+esc(p.title)+'</option>').join('')}</select></label><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn">Add quest ✨</button></div></form>`;
if(modal==='project')body=`<h2>🚀 New project</h2><form id="projectForm"><label>Project name<input name="title" maxlength="120" required placeholder="Build a portfolio"></label><label>Description<input name="description" maxlength="350" placeholder="What makes this worth doing?"></label><label>Icon<select name="icon"><option>🚀</option><option>🧩</option><option>🎨</option><option>📚</option><option>🌱</option><option>💻</option></select></label><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn">Create project</button></div></form>`;
if(modal==='avatar')body=`<h2>🎨 Your character</h2><p class="muted">Choose a look for your real-life hero.</p><form id="avatarForm"><label>Name<input name="name" maxlength="30" value="${esc(data.name)}" required></label><label>Avatar<select name="avatar">${['🦊','🐻','🐱','🐼','🐸','🦄','🐉','👩‍🚀','🧙','🦖'].map(a=>'<option '+(a===data.avatar?'selected':'')+'>'+a+'</option>').join('')}</select></label><div class="actions"><button type="button" class="btn ghost" data-close="1">Cancel</button><button class="btn">Save character</button></div></form>`;
if(modal==='auth')body=`<h2>🤝 Join the crew</h2><p class="muted">XP uses Supabase authentication. You may need to verify your email.</p><form id="authForm" data-mode="login">${authMessage?'<p role="alert" class="muted">'+esc(authMessage)+'</p>':''}<label>Email<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" minlength="6" name="password" autocomplete="current-password" required></label><div class="actions"><button type="button" class="btn ghost" data-mode="signup">New here? Create an account</button><button type="submit" class="btn">Sign in</button></div></form><button class="btn ghost" style="margin-top:12px" data-close="1">Cancel</button>`;
if(modal==='mission'){const t=data.tasks.find(t=>t.id===selected);body=`<div class="center"><div style="font-size:60px">⚔️</div><div class="kicker">YOUR REAL-WORLD MISSION</div><h2>${esc(t?.title||'Your quest')}</h2><p class="muted">Put down your phone and do the thing. Come back when you're ready!</p><h1 id="timer"> ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}</h1><div class="row" style="justify-content:center"><button class="btn ghost" data-timer="1">${ticker?'Pause':'Start focus timer'}</button><button class="btn orange" data-finish="${selected}">Mission complete ✓</button></div><p class="muted">+ ${reward(t||{})} personal XP. Completion is self-reported.</p><button class="btn ghost space" data-close="1">Back to dashboard</button></div>`}
return `<div class="modalback"><div class="dialog">${body}</div></div>`}
function draw(){let content=page==='today'?today():page==='projects'?projects():page==='paths'?paths():page==='social'?social():you();$('#app').innerHTML=shell(content)+`<div id="syncstatus" role="status" aria-live="polite" style="position:fixed;bottom:70px;right:12px;z-index:4;background:#fff;border:1px solid #ddd;border-radius:10px;padding:5px 9px;font-size:11px;color:#454057">${esc(cloudStatus)}</div>`+overlay();if(page==='social'&&user)queueMicrotask(socialLoad)}
function finish(id){if(ticker){clearInterval(ticker);ticker=null}const result=XP.complete(data,id,uid,date);if(!result)return;save();modal='';draw();toast(result.points?'🎉 QUEST COMPLETE! +'+result.points+' XP!':'Quest marked complete. XP was already earned for this quest.')}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;try{
if(d.import){await importGuest(d.import==='yes');return}
if(d.go)return go(d.go);
if(d.modal){modal=d.modal;draw();return}
if(d.close){modal='';if(ticker){clearInterval(ticker);ticker=null}draw();return}
if(d.back){selected='';draw();return}
if(d.project){selected=d.project;draw();return}
if(d.time){data.minutes=+d.time;save();draw();return}
if(d.energy){data.energy=d.energy;save();draw();return}
if(d.play){selected=d.play;seconds=(+data.tasks.find(t=>t.id===selected)?.minutes||15)*60;modal='mission';draw();return}
if(d.timer){if(ticker){clearInterval(ticker);ticker=null;draw()}else{ticker=setInterval(()=>{seconds=Math.max(0,seconds-1);const n=$('#timer');if(n)n.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(!seconds){clearInterval(ticker);ticker=null;toast('Focus time finished! 🎯')}},1000);draw()}return}
if(d.finish)return finish(d.finish);
if(d.complete){const t=data.tasks.find(t=>t.id===d.complete);if(t?.done){XP.toggleComplete(data,t.id);save();draw()}else finish(d.complete);return}
if(d.del){if(confirm('Remove this quest?')){XP.removeTask(data,d.del);save();draw()}return}
if(d.logout){await signOut();return}
if(d.export){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='xp-next-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);return}
if(d.mode){const form=$('#authForm');form.dataset.mode=d.mode;const submit=form.querySelector('button[type=submit]'),switcher=form.querySelector('button[data-mode]'),password=form.querySelector('input[name=password]');if(submit)submit.textContent=d.mode==='signup'?'Create account':'Sign in';if(switcher){switcher.dataset.mode=d.mode==='signup'?'login':'signup';switcher.textContent=d.mode==='signup'?'Already have an account? Sign in':'New here? Create an account'}if(password)password.autocomplete=d.mode==='signup'?'new-password':'current-password';return}
if(d.accept){await api('/rest/v1/xp_friendships?id=eq.'+encodeURIComponent(d.accept),'PATCH',{status:'accepted'});toast('Friend added! 💌');socialLoad();return}
if(d.friend){await api('/rest/v1/xp_friendships','POST',{requester_id:user.id,addressee_id:d.friend,status:'pending'});toast('Friend request sent!');socialLoad();return}
}catch(x){toast(x.message)}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const fd=new FormData(f);try{
if(f.id==='questForm'){data.tasks.unshift({id:uid(),title:String(fd.get('title')).trim().slice(0,160),category:fd.get('category'),minutes:Math.max(5,Math.min(600,+fd.get('minutes')||25)),priority:+fd.get('priority')||1,due:fd.get('due')||'',projectId:fd.get('project')||'',done:false});modal='';save();draw();toast('New quest unlocked! 🌟')}
if(f.id==='projectForm'){XP.createProject(data,{id:uid(),title:String(fd.get('title')).trim().slice(0,120),description:String(fd.get('description')||''),icon:fd.get('icon')});modal='';save();go('projects');toast('New adventure created! 🚀')}
if(f.id==='avatarForm'){data.name=String(fd.get('name')).trim().slice(0,30);data.avatar=fd.get('avatar');modal='';save();draw();toast('Looking legendary! 🎨')}
if(f.id==='authForm')await authSubmit(f);
if(f.id==='findForm'){let q=String(fd.get('query')).replace(/[^a-zA-Z0-9_]/g,'').slice(0,24);if(q.length<2)throw Error('Search at least two characters');const p=await api('/rest/v1/xp_profiles?select=id,username,avatar&username=ilike.*'+encodeURIComponent(q)+'*&limit=12');$('#findresults').innerHTML=p.filter(x=>x.id!==user.id).map(x=>`<div class="socialitem">${esc(x.avatar)} ${esc(x.username)} <button class="btn sm" data-friend="${x.id}">Add friend</button></div>`).join('')||'<p class="muted">Nobody found yet.</p>'}
}catch(x){toast(x.message)}});
async function resume(){
  const callback=location.hash.includes('access_token=')||location.hash.includes('error=');
  if(callback){
    try{
      const verified=await auth.completeEmailConfirmation(location.hash);
      history.replaceState(null,'',location.pathname+location.search);
      if(verified){await loadAccount();toast('Email confirmed! Welcome to XP 🎉');return;}
    }catch(e){history.replaceState(null,'',location.pathname+location.search);toast(e.message)}
  }
  const active=await auth.restore();if(active)await loadAccount();
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&auth.session?.expires_at<Date.now()+60000)auth.refresh().catch(()=>auth.expire());
});
draw();resume();
})();
