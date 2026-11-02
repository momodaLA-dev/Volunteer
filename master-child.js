'use strict';
(()=>{
const app=document.getElementById('app'),isAdmin=document.body.dataset.role==='admin';
const $=(s,root=document)=>root.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emails={A0001:'a0001@gmail.com.tw',V0001:'v0001@gmail.com',V0002:'v0002@gmail.com'};
const warehouses=['008倉','0089倉','0088倉'];
const root='v10',blank=()=>({warehouse:'008倉',sku:'',quantity:'',expiry:''});
let auth,db,user,masters={},children={},approvals={},draft=null,busy=false,idb=null,loaded=false;
const errtxt=e=>e?.code||e?.message||String(e),clock=n=>n?new Date(n).toLocaleString('zh-TW',{hour12:false}):'—';
function note(s,bad=false){const n=$('#notice');if(n){n.className='notice'+(bad?' bad':'');n.textContent=s;n.hidden=false}}
function uid(){return user?.uid}function code(){return String(user?.email||'').split('@')[0].toUpperCase()}
function showLogin(msg=''){
 app.innerHTML=`<section class="card"><h2>${isAdmin?'幹部':'志工'}登入</h2><form id="login"><label>代號</label><input id="account" value="${isAdmin?'A0001':'V0001'}" required><label>PIN</label><input id="pass" type="password" autocomplete="current-password" required minlength="6"><div class="actions"><button>登入</button></div></form><p class="muted">沿用既有 Firebase 帳號。試辦版尚未提供新增帳號。</p><p id="notice" class="notice bad" ${msg?'':'hidden'}>${esc(msg)}</p></section>`;
 $('#login').onsubmit=async e=>{e.preventDefault();const c=$('#account').value.trim().toUpperCase();if(!emails[c]||(isAdmin?c!=='A0001':!c.startsWith('V')))return note('代號未設定，請使用既有測試帳號。',true);try{await auth.signInWithEmailAndPassword(emails[c],$('#pass').value)}catch(ex){note('登入失敗：'+errtxt(ex),true)}};
}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('VolunteerCare_MC_local_v1',1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('drafts',{keyPath:'key'});s.createIndex('byUid','uid')};r.onsuccess=()=>{idb=r.result;resolve()};r.onerror=()=>reject(r.error)})}
function store(mode,data){return new Promise((resolve,reject)=>{const tx=idb.transaction('drafts',mode),rq=tx.objectStore('drafts')[mode==='readonly'?'get':'put'](data);rq.onsuccess=()=>resolve(rq.result);rq.onerror=()=>reject(rq.error)})}
function allDrafts(){return new Promise((resolve,reject)=>{const tx=idb.transaction('drafts'),rq=tx.objectStore('drafts').index('byUid').getAll(uid());rq.onsuccess=()=>resolve(rq.result||[]);rq.onerror=()=>reject(rq.error)})}
async function persist(){if(!draft)return;draft.updatedLocal=Date.now();await store('readwrite',draft)}
async function loadMasters(){masters=(await db.ref(root+'/masterOrders').once('value')).val()||{}}
function masterOptions(selected){return Object.entries(masters).filter(([,m])=>m.status==='open'||m.status==='closed'&&m.id===selected).map(([k,m])=>`<option value="${esc(k)}" ${k===selected?'selected':''} ${m.status==='open'?'':'disabled'}>${esc(m.displayNo+'｜'+m.title+'（'+(m.status==='open'?'開放收件':'已停止收件')+'）')}</option>`).join('')}
async function startDraft(masterId){if(!masterId||masters[masterId]?.status!=='open')throw Error('請先選擇開放中的母單');draft={key:uid()+':'+crypto.randomUUID(),uid:uid(),masterId,clientId:crypto.randomUUID(),status:'local',donor:(masters[masterId]?.donor||masters[masterId]?.title||''),note:'',items:[blank()],createdLocal:Date.now(),updatedLocal:Date.now()};await persist();renderVolunteer()}
function itemRow(r,i){return `<div class="line" data-i="${i}"><div><label>倉別</label><select data-k="warehouse">${warehouses.map(w=>`<option ${r.warehouse===w?'selected':''}>${w}</option>`).join('')}</select></div><div><label>品號（2碼）</label><input data-k="sku" type="text" pattern="[0-9]*" inputmode="numeric" enterkeyhint="next" maxlength="2" value="${esc(r.sku)}" placeholder="08"></div><div><label>數量</label><input data-k="quantity" type="text" pattern="[0-9]*" inputmode="numeric" enterkeyhint="next" value="${esc(r.quantity)}" placeholder="111"></div><div><label>效期 YYYYMM</label><input data-k="expiry" type="text" pattern="[0-9]*" inputmode="numeric" enterkeyhint="done" maxlength="6" value="${esc(r.expiry)}" placeholder="202701"></div><button type="button" class="light" data-remove="${i}">刪除</button></div>`}
function totals(items){const groups=new Map();for(const r of items){if(!/^\d{2}$/.test(r.sku)||!/^\d+$/.test(String(r.quantity)))continue;const n=Number(r.quantity);if(!Number.isSafeInteger(n)||n<0)continue;const key=r.warehouse+'|'+r.sku,cur=groups.get(key)||{w:r.warehouse,s:r.sku,n:0,total:0};if(!Number.isSafeInteger(cur.total+n))continue;cur.n++;cur.total+=n;groups.set(key,cur)}return `<div class="scroll"><table><thead><tr><th>倉別</th><th>品號</th><th>筆數</th><th>合計</th></tr></thead><tbody>${[...groups.values()].map(x=>`<tr><td>${esc(x.w)}</td><td>${esc(x.s)}</td><td>${x.n}</td><td>${x.total}</td></tr>`).join('')}</tbody></table></div>`}
function capture(){if(!draft)return;draft.items=[...document.querySelectorAll('.line')].map(el=>Object.fromEntries([...el.querySelectorAll('[data-k]')].map(f=>[f.dataset.k,f.value])));draft.donor=(masters[draft.masterId]?.donor||masters[draft.masterId]?.title||'');draft.note=$('#memo')?.value||''}
async function saveLocal(){capture();await persist();note('已儲存於此手機（未上傳雲端）。')}
function validate(){capture();if(!draft.masterId||masters[draft.masterId]?.status!=='open')throw Error('母單已關閉，不能送出');if(draft.items.length<1||draft.items.length>300)throw Error('品項數須為 1 至 300 筆');const rows=draft.items.map((r,i)=>{if(!warehouses.includes(r.warehouse)||!/^\d{2}$/.test(r.sku)||!/^\d+$/.test(r.quantity)||!Number.isSafeInteger(Number(r.quantity))||Number(r.quantity)>100000000||!/^20\d{2}(0[1-9]|1[0-2])$/.test(r.expiry))throw Error(`第 ${i+1} 筆格式錯誤，請確認倉別、2碼品號、非負整數數量、6碼效期`);return {warehouse:r.warehouse,sku:r.sku,quantity:Number(r.quantity),expiry:r.expiry}});if(draft.donor.length>200||draft.note.length>300)throw Error('捐贈者或備註字數超出限制');return rows}
async function performSubmit(){await loadMasters();const rows=validate();await persist();if(!confirm('確認正式送出？送出後原始資料不可修改。'))return;
 // Deterministic server key per local draft: retry always addresses the same immutable child.
 const childId=draft.clientId;const clientId=childId;const ref=db.ref(`${root}/childOrders/${draft.masterId}/${childId}`);
 // A newly created child has no owner UID yet. Firebase rules intentionally deny
 // volunteer reads of nonexistent child paths; do NOT pre-read or transaction-read it.
 // Write once with set(); the server-side !data.exists() rule enforces create-only.
 const master=masters[draft.masterId];
 const payload={uid:uid(),clientId,masterId:draft.masterId,displayNo:master.displayNo+'-'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14)+'-'+childId.slice(0,6).toUpperCase(),donor:draft.donor,note:draft.note,items:rows,state:'submitted',submittedAt:firebase.database.ServerValue.TIMESTAMP,schemaVersion:1};
 let writeError=null;
 try{await ref.set(payload)}catch(e){writeError=e}
 // A network interruption or a rejected repeat write does not prove that the
 // original attempt failed. Read the receipt after attempting the write.
 let received=null,receiptError=null;
 try{received=(await ref.once('value')).val()}catch(e){receiptError=e}
 if(received){
  const same=received.uid===uid()&&received.clientId===childId&&received.masterId===draft.masterId&&received.state==='submitted'&&JSON.stringify(received.items)===JSON.stringify(rows)&&Number.isFinite(received.submittedAt);
  if(!same)throw Error('雲端已有此子單號，但內容與本機不同；保留本機資料，請幹部核對。');
 }else{
  if(writeError)throw Error('尚未確認送出。'+errtxt(writeError)+'；本機資料保留，請確認母單仍開放並重試。');
  if(receiptError)throw Error('送出後無法讀取雲端回執：'+errtxt(receiptError)+'；本機資料保留，請恢復網路後重試。');
  throw Error('尚未取得雲端回執；本機資料保留，請稍後重試。');
 }
 draft.status='submitted';draft.serverId=childId;await persist();note('雲端已確認收到子單：'+received.displayNo+'（待幹部審核）');renderVolunteer();
}
async function withBusy(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(x=>x.disabled=true);try{await fn()}catch(e){note('操作未完成：'+errtxt(e),true)}finally{busy=false;document.querySelectorAll('button').forEach(x=>x.disabled=false)}}
async function renderVolunteer(){mcHidePad();await loadMasters();const list=await allDrafts();const local=list.filter(x=>x.status==='local').sort((a,b)=>b.updatedLocal-a.updatedLocal);if(draft?.status==='submitted')draft=null;
 app.innerHTML=`<section class="card"><div class="actions"><strong>登入：${esc(code())}</strong><button class="light" id="logout">登出</button></div><div id="notice" class="notice" hidden></div><p class="muted">草稿僅在本手機（IndexedDB）。只有按「正式送出」才寫入 Firebase。</p><label>選擇幹部開放中的母單</label><select id="choose"><option value="">請選擇母單</option>${masterOptions(draft?.masterId)}</select><div class="actions"><button id="newDraft" class="light">＋建立本機子單</button><button id="reload" class="light">重新讀取母單</button></div></section><section class="card"><h2>本機未送出子單</h2><div id="localList">${local.length?local.map(x=>`<div class="item">${esc(masters[x.masterId]?.displayNo||'母單已不可用')}｜${clock(x.updatedLocal)}｜${x.items.length} 筆 <button class="light" data-open="${esc(x.key)}">開啟</button></div>`).join(''):'目前沒有本機草稿'}</div></section>${draft?`<section class="card"><h2>清點品項（本機）</h2><div class="muted">母單：${esc(masters[draft.masterId]?.displayNo||draft.masterId)}｜本機草稿：${esc(draft.clientId.slice(0,8))}</div><label>捐贈者／母單名稱（由幹部設定）</label><div class="readonly-field">${esc(masters[draft.masterId]?.donor||masters[draft.masterId]?.title||'未設定')}</div><label>清點備註（選填）</label><textarea id="memo">${esc(draft.note)}</textarea><div id="rows">${draft.items.map(itemRow).join('')}</div><h3>倉別／品號加總（明細不合併）</h3><div id="sum">${totals(draft.items)}</div><div class="actions"><button id="add" class="light">＋新增一筆</button><button id="save" class="light">儲存本機草稿</button><button id="send">正式送出子單</button></div></section>`:''}`;
 $('#logout').onclick=()=>auth.signOut();$('#reload').onclick=()=>withBusy(renderVolunteer);$('#newDraft').onclick=()=>withBusy(async()=>{const target=$('#choose').value;if(draft){await saveLocal()}await startDraft(target)});document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>withBusy(async()=>{if(draft)await saveLocal();draft=await store('readonly',b.dataset.open);await renderVolunteer()}));
 if(!draft)return;$('#choose').value=draft.masterId;$('#choose').disabled=true;async function appendRow(){capture();draft.items.push(blank());await persist();const rows=$('#rows');rows.insertAdjacentHTML('beforeend',itemRow(draft.items.at(-1),draft.items.length-1));return rows.lastElementChild.querySelector('[data-k=sku]')}
 $('#add').onclick=()=>withBusy(async()=>{const next=await appendRow();next.focus({preventScroll:true})});$('#save').onclick=()=>withBusy(saveLocal);$('#send').onclick=()=>withBusy(performSubmit);
 $('#rows').onclick=e=>{const b=e.target.closest('[data-remove]');if(!b)return;if(draft.items.length===1)return note('至少保留一列');capture();draft.items.splice(Number(b.dataset.remove),1);persist().then(renderVolunteer)};
 let timer;app.oninput=e=>{if(!draft||!(e.target.closest('#rows')||e.target.id==='memo'))return;if(e.target.matches('[data-k]')&&e.target.dataset.k!=='warehouse'){const limit=e.target.dataset.k==='sku'?2:e.target.dataset.k==='expiry'?6:9;e.target.value=e.target.value.replace(/\D/g,'').slice(0,limit)}capture();$('#sum').innerHTML=totals(draft.items);clearTimeout(timer);timer=setTimeout(()=>persist().catch(ex=>note('本機儲存失敗：'+errtxt(ex),true)),250)};
 async function stepNext(input){const line=input.closest('.line');const field=input.dataset.k;if(field==='sku'||field==='quantity'){const next=line.querySelector(`[data-k=${field==='sku'?'quantity':'expiry'}]`);next?.focus({preventScroll:true});return}if(field==='expiry'){const sku=line.querySelector('[data-k=sku]')?.value||'',qty=line.querySelector('[data-k=quantity]')?.value||'',expiry=line.querySelector('[data-k=expiry]')?.value||'';if(!/^\d{2}$/.test(sku)||!/^\d+$/.test(qty)||!Number.isSafeInteger(Number(qty))||Number(qty)>100000000||!/^20\d{2}(0[1-9]|1[0-2])$/.test(expiry)){note('這筆清點尚未完整：請確認品號 2 碼、數量及效期 YYYYMM。',true);return}const existing=line.nextElementSibling?.querySelector('[data-k=sku]');if(existing){existing.focus({preventScroll:true});return}const next=await appendRow();next.focus({preventScroll:true})}}
 app.onkeydown=e=>{if(e.key!=='Enter'||!e.target.matches('[data-k]'))return;e.preventDefault();stepNext(e.target).catch(ex=>note('切換下一格失敗：'+errtxt(ex),true))};
 app.onclick=e=>{const b=e.target.closest('[data-next]');if(!b||!draft)return;const input=b.closest('.line')?.querySelector(`[data-k=${b.dataset.next}]`);if(input)stepNext(input).catch(ex=>note('切換下一格失敗：'+errtxt(ex),true))};
}
// Mobile-only, in-page keypad. Native iOS numeric keyboard cannot be customized.
// Keeping the keypad fixed avoids opening the OS keyboard and keeps Next in thumb reach.
let mcPadInput=null;
const mcTouchPad=()=>!isAdmin&&window.matchMedia('(max-width: 650px) and (pointer: coarse)').matches;
function mcPad(){let el=document.getElementById('mc-fixed-pad');if(el)return el;
 el=document.createElement('section');el.id='mc-fixed-pad';el.className='mc-fixed-pad';el.hidden=true;
 el.setAttribute('aria-label','清點數字輸入鍵盤');
 el.innerHTML='<div class="mc-pad-head"><strong id="mc-pad-caption">品號</strong><button type="button" data-pad="hide" class="mc-pad-close">收起</button></div><div class="mc-pad-grid">'+['1','2','3','4','5','6','7','8','9','del','0','next'].map(k=>'<button type="button" data-pad="'+k+'" class="'+(k==='next'?'mc-pad-next':k==='del'?'mc-pad-del':'')+'">'+(k==='del'?'⌫':k==='next'?'下一格 →':k)+'</button>').join('')+'</div>';
 document.body.appendChild(el);
 el.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault()});
 el.addEventListener('click',async e=>{const b=e.target.closest('[data-pad]');if(!b)return;const k=b.dataset.pad;if(k==='hide'){mcHidePad();return}let inp=mcPadInput;if(!inp?.isConnected){mcHidePad();return}if(k==='next'){
  const line=inp.closest('.line');let next=null;
  if(inp.dataset.k==='sku')next=line.querySelector('[data-k="quantity"]');
  else if(inp.dataset.k==='quantity')next=line.querySelector('[data-k="expiry"]');
  else if(inp.dataset.k==='expiry'){
   const sku=line.querySelector('[data-k="sku"]').value,qty=line.querySelector('[data-k="quantity"]').value,expiry=inp.value;
   if(!/^\d{2}$/.test(sku)||!/^\d+$/.test(qty)||Number(qty)>100000000||!/^20\d{2}(0[1-9]|1[0-2])$/.test(expiry)){note('請完成品號兩碼、數量及六碼有效效期。',true);return}
   const following=line.nextElementSibling?.querySelector('[data-k="sku"]');
   if(following)next=following;
   else { const add=document.getElementById('add'); if(add){add.click();await new Promise(resolve=>setTimeout(resolve,50));next=document.querySelector('#rows .line:last-child [data-k="sku"]')} }
  }
  if(next){mcSetPadInput(next);next.focus({preventScroll:true});mcRevealField(next)}return;
 }
 const max=inp.dataset.k==='sku'?2:inp.dataset.k==='expiry'?6:9;
 inp.value=k==='del'?inp.value.slice(0,-1):(inp.value.length<max?inp.value+k:inp.value);
 inp.dispatchEvent(new Event('input',{bubbles:true}));mcUpdatePad();
 });return el;
}
// Keep the newly selected input visible above the anchored on-screen keypad.
function mcRevealField(input){
 if(!input||!input.isConnected||!mcTouchPad())return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!input.isConnected)return;
  const pad=document.getElementById('mc-fixed-pad');
  const padTop=pad&&!pad.hidden?pad.getBoundingClientRect().top:window.innerHeight;
  const r=input.getBoundingClientRect();
  // On a new line, also reveal its warehouse selector and label.
  const line=input.closest('.line');
  const top=line?line.getBoundingClientRect().top:r.top;
  const availableBottom=padTop-18;
  const desiredTop=96;
  let delta=0;
  if(r.bottom>availableBottom||top<desiredTop){delta=top-desiredTop;}
  // scrolling downward for a new line should never leave it underneath the pad
  if(delta!==0)window.scrollBy({top:delta,behavior:'instant'});
 }));
}
function mcHidePad(){const pad=document.getElementById('mc-fixed-pad');if(pad)pad.hidden=true;document.body.classList.remove('mc-keypad-open');mcPadInput=null}
function mcUpdatePad(){const p=mcPad();if(!mcPadInput)return;
 const names={sku:'品號（2 碼）',quantity:'數量',expiry:'效期（YYYYMM）'};
 p.querySelector('#mc-pad-caption').textContent=names[mcPadInput.dataset.k]||'數字';
 p.querySelector('[data-pad="next"]').textContent=mcPadInput.dataset.k==='expiry'?'✓ 新增下一筆':'下一格 →';
}
function mcSetPadInput(input){if(!mcTouchPad()||!input?.matches('#rows [data-k="sku"],#rows [data-k="quantity"],#rows [data-k="expiry"]'))return;
 mcPadInput=input;input.readOnly=true;mcPad().hidden=false;document.body.classList.add('mc-keypad-open');mcUpdatePad();
}
if(!isAdmin){
 document.addEventListener('pointerdown',e=>{const input=e.target.closest('#rows input[data-k]');if(input&&mcTouchPad()){
  input.readOnly=true;mcSetPadInput(input);
 }},true);
 document.addEventListener('focusin',e=>{if(e.target.matches?.('#rows input[data-k]')&&mcTouchPad())mcSetPadInput(e.target)});
 document.addEventListener('click',e=>{if(e.target.closest('#logout,#send,#save,#newDraft,[data-open]'))mcHidePad()},true);
}
async function adminData(){await loadMasters();children=(await db.ref(root+'/childOrders').once('value')).val()||{};approvals=(await db.ref(root+'/approvals').once('value')).val()||{}}
function reviewButton(masterId,childId){return `<button data-approve="${esc(masterId+'|'+childId)}">核准計入</button><button class="light" data-reject="${esc(masterId+'|'+childId)}">不計入</button>`}
function adminHtml(){const entries=Object.entries(masters).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));return `<section class="card"><div class="actions"><b>登入：${esc(code())}</b><button class="light" id="logout">登出</button></div><div id="notice" class="notice" hidden></div><h2>建立母單</h2><form id="create"><label>母單名稱</label><input id="title" maxlength="100" placeholder="例如：11月物資清點" required><label>捐贈者資訊（選填）</label><input id="donorMaster" maxlength="200"><label>備註（選填）</label><textarea id="masterNote" maxlength="300"></textarea><div class="actions"><button type="submit">建立並開放母單</button><button type="button" class="light" id="refresh">重新整理</button></div></form></section><section class="card"><h2>母單、子單與核定數量</h2>${entries.map(([mid,m])=>{const cs=Object.entries(children[mid]||{}),accepted=cs.filter(([cid])=>approvals[mid]?.[cid]?.decision==='approved'),agg=accepted.flatMap(([,v])=>v.items||[]);return `<details class="item" open><summary>${esc(m.displayNo)}｜${esc(m.title)}｜${m.status==='open'?'開放收件':'已停止收件'}｜子單 ${cs.length} 張｜已核准 ${accepted.length} 張</summary><p class="muted">捐贈者：${esc(m.donor||'—')}｜備註：${esc(m.note||'—')}</p><div class="actions"><button class="light" data-close="${esc(mid)}" ${m.status==='closed'?'disabled':''}>停止收件（仍可審核）</button><button class="light" data-csv="${esc(mid)}">匯出明細 CSV</button></div><h3>已核定各倉別品號合計</h3>${totals(agg)}<h3>志工子單</h3>${cs.length?cs.map(([cid,c])=>`<details class="item"><summary>${esc(c.displayNo)}｜${esc(c.uid.slice(0,8))}…｜${clock(c.submittedAt)}｜${esc(approvals[mid]?.[cid]?.decision||'待審核')}</summary><p class="muted">捐贈者：${esc(c.donor)}｜備註：${esc(c.note)}</p><div class="scroll"><table><thead><tr><th>倉別</th><th>品號</th><th>數量</th><th>效期</th></tr></thead><tbody>${(c.items||[]).map(r=>`<tr><td>${esc(r.warehouse)}</td><td>${esc(r.sku)}</td><td>${esc(r.quantity)}</td><td>${esc(r.expiry)}</td></tr>`).join('')}</tbody></table></div>${approvals[mid]?.[cid]?'已審核，原始紀錄保留。':reviewButton(mid,cid)}</details>`).join(''):'尚無子單'}</details>`}).join('')||'<p>尚無母單</p>'}</section>`}
async function renderAdmin(){await adminData();app.innerHTML=adminHtml();$('#logout').onclick=()=>auth.signOut();$('#refresh').onclick=()=>withBusy(renderAdmin);$('#create').onsubmit=e=>{e.preventDefault();withBusy(createMaster)};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>withBusy(()=>closeMaster(b.dataset.close)));document.querySelectorAll('[data-approve],[data-reject]').forEach(b=>b.onclick=()=>withBusy(()=>review(b.dataset.approve||b.dataset.reject,!!b.dataset.approve)));document.querySelectorAll('[data-csv]').forEach(b=>b.onclick=()=>downloadCsv(b.dataset.csv))}
async function createMaster(){const title=$('#title').value.trim(),donor=$('#donorMaster').value.trim(),memo=$('#masterNote').value.trim();if(!title||title.length>100)throw Error('母單名稱不正確');if(donor.length>200||memo.length>300)throw Error('捐贈者或備註過長');const ref=db.ref(root+'/masterOrders').push(),id=ref.key,displayNo='MC-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+id.slice(-6).toUpperCase();const o={id,displayNo,title,donor,note:memo,status:'open',createdBy:uid(),createdAt:firebase.database.ServerValue.TIMESTAMP};await ref.transaction(v=>v===null?o:undefined,undefined,false);const got=(await ref.once('value')).val();if(!got||got.createdBy!==uid()||got.id!==id||got.title!==title||got.status!=='open')throw Error('雲端建立失敗，請先查詢是否已有母單');await renderAdmin();note('母單建立成功：'+displayNo)}
async function closeMaster(mid){if(!confirm('停止收件後無法再新增子單，但既有子單仍可繼續審核。確定停止？'))return;const result=await db.ref(`${root}/masterOrders/${mid}/status`).transaction(v=>v==='open'?'closed':undefined,undefined,false);const latest=(await db.ref(`${root}/masterOrders/${mid}/status`).once('value')).val();if(latest!=='closed')throw Error('無法確認已停止收件');await renderAdmin();note('已停止收件（不代表正式結案）。')}
async function review(composite,approved){const [mid,cid]=composite.split('|');const child=children[mid]?.[cid];if(!child)throw Error('找不到子單');if(!confirm(approved?'確定核准此子單納入母單？請先確認不是重複盤點。':'確定標記不計入？'))return;const ref=db.ref(`${root}/approvals/${mid}/${cid}`),record={decision:approved?'approved':'excluded',reviewedBy:uid(),reviewedAt:firebase.database.ServerValue.TIMESTAMP};await ref.transaction(v=>v===null?record:undefined,undefined,false);const got=(await ref.once('value')).val();if(!got||got.reviewedBy!==uid()||got.decision!==record.decision)throw Error('審核決定已存在或未成功，請重新整理確認；系統未覆寫舊決定');await renderAdmin();note('已記錄審核決定；同一子單不會重複核准。')}
function downloadCsv(mid){const rows=[['母單','子單','審核','UID','送出時間','倉別','品號','數量','效期','捐贈者','備註']];for(const [cid,c] of Object.entries(children[mid]||{}))for(const it of c.items||[])rows.push([masters[mid].displayNo,c.displayNo,approvals[mid]?.[cid]?.decision||'pending',c.uid,clock(c.submittedAt),it.warehouse,it.sku,it.quantity,it.expiry,c.donor||'',c.note||'']);const safe=v=>{let s=String(v??'').replace(/[\x00-\x1f\x7f]/g,' ');if(/^[\s\uFEFF]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};const text='\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=masters[mid].displayNo+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000)}
try{const cfg=window.VOLUNTEER_FIREBASE_CONFIG;if(!cfg?.apiKey||!cfg?.databaseURL)throw Error('缺少現有 firebase-config.js');if(!firebase.apps.length)firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.database();auth.onAuthStateChanged(async u=>{user=u;if(!u){showLogin();return}if(isAdmin?code()!=='A0001':!/^V\d{4}$/.test(code())){app.innerHTML='<section class="card">此頁不適用目前帳號。請先在原網站登出，再使用正確帳號登入。</section>';return}try{if(isAdmin){const role=(await db.ref('roles/'+uid()).once('value')).val();if(role!=='admin')throw Error('沒有管理員角色');await renderAdmin()}else{if(!loaded){await openDB();loaded=true}await renderVolunteer()}}catch(e){app.innerHTML='<section class="card">開啟失敗：'+esc(errtxt(e))+'。請確認 Firebase v10 規則已正確部署。</section>'}})}catch(e){app.textContent='初始化失敗：'+errtxt(e)}
})();
