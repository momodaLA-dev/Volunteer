'use strict';
(()=>{
const $=s=>document.querySelector(s),app=$('#app'),admin=document.body.dataset.kind==='admin';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const emails={A0001:'a0001@gmail.com.tw',V0001:'v0001@gmail.com',V0002:'v0002@gmail.com'};
const code=u=>String(u?.email||'').split('@')[0].toUpperCase();
let auth,db,user=null,form=null,docId=null,lock=false,dirty=false,records={},baseUpdatedAt=null,baseRev=null;
const path=(id)=>db.ref('v9/selfCounts/'+user.uid+'/'+id);
const time=t=>t?new Date(t).toLocaleString('zh-TW',{hour12:false}):'—';
const status=(s,bad=false)=>{let el=$('#msg');if(el){el.textContent=s;el.className='notice'+(bad?' bad':'');el.hidden=false;}};
const noEmpty=v=>String(v??'').trim();
const localDatetime=t=>{const d=new Date(t);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const WAREHOUSES=['008倉','0089倉','0088倉'];
const blank=()=>({warehouse:'008倉',sku:'',quantity:'',expiry:''});
const storageKey=()=>`vc-simple-v1-${user.uid}`;
function defaultForm(){return {donor:'',note:'',items:[blank()]};}
function localSave(){if(admin||!user||!form)return;try{localStorage.setItem(storageKey(),JSON.stringify({docId,form,savedAt:Date.now(),baseUpdatedAt,baseRev,dirty}));}catch(e){status('本機儲存失敗：'+e.message,true)}}
function localClear(){try{localStorage.removeItem(storageKey())}catch(e){}}
function showLogin(note=''){
 user=null;form=null;
 app.innerHTML=`<div class="card" style="max-width:480px;margin:35px auto"><h2>${admin?'幹部登入':'志工登入'}</h2><form id="login"><label>代號</label><input id="account" value="${admin?'A0001':'V0001'}" required><label>PIN</label><input id="password" type="password" minlength="6" autocomplete="current-password" required><button type="submit">登入</button></form><div id="msg" class="notice bad" ${note?'':'hidden'}>${esc(note)}</div><p class="muted">使用 Firebase Authentication；PIN 不會寫入清點紀錄。</p></div>`;
 $('#login').onsubmit=async e=>{e.preventDefault();const c=$('#account').value.trim().toUpperCase(),email=emails[c];if(!email||!(admin?c==='A0001':c.startsWith('V')))return status('請使用已建立的測試帳號（V0001／V0002 或 A0001）。',true);const b=$('#login button');b.disabled=true;try{await auth.signInWithEmailAndPassword(email,$('#password').value)}catch(err){status('登入未成功：'+err.code+'。請核對 Firebase Authentication 的帳號及 PIN。',true)}finally{if(b.isConnected)b.disabled=false}};
}
function rowHtml(r,i){return `<div class="line" data-i="${i}"><div><label>倉別</label><select data-f="warehouse">${WAREHOUSES.map(w=>`<option value="${esc(w)}" ${w===(r.warehouse||'008倉')?'selected':''}>${esc(w)}</option>`).join('')}</select></div><div><label>品號（2碼）</label><input data-f="sku" enterkeyhint="next" type="text" inputmode="numeric" pattern="[0-9]{2}" maxlength="2" autocomplete="off" value="${esc(r.sku)}" placeholder="例如 01"></div><div><label>數量</label><input data-f="quantity" enterkeyhint="next" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(r.quantity)}" placeholder="0"></div><div><label>效期（YYYYMM）</label><input data-f="expiry" enterkeyhint="next" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" value="${esc(r.expiry)}" placeholder="202712"></div><button class="danger" data-del="${i}" title="刪除這列" type="button">×</button></div>`}
function inputView(){
 app.innerHTML=`<div class="card"><div class="top"><div><h2>自行清點單</h2><div class="muted">登入：${esc(code(user))}｜<span id="currentId">${esc(docId||'尚未建立雲端編號')}</span></div></div><button id="logout" class="secondary">登出</button></div><div id="msg" class="notice" hidden></div><label>捐贈者資訊（自由填寫，可留空）</label><input id="donor" maxlength="200" placeholder="例如：捐贈者名稱／單位" value="${esc(form.donor||'')}"><label>清點備註（可選填）</label><textarea id="note" rows="2" maxlength="300">${esc(form.note)}</textarea><h2>清點品項</h2><div class="muted">同品號不同效期請分列；每筆原樣保留，不自動合併；下方另顯示各倉別、品號的加總。數量 0 表示確認現場無存量。</div><div id="rows">${form.items.map(rowHtml).join('')}</div><div id="totals" class="totals"></div><div class="row actionbar"><button id="newDoc" class="secondary">＋ 新增清點單（全新雲端編號）</button><button id="add" class="secondary">＋ 新增一筆</button><button id="local" class="secondary">儲存本機草稿</button><button id="cloud" class="secondary">同步雲端草稿</button><button id="submit">正式送出給幹部</button></div><p id="saveInfo" class="tiny">變更會暫存在本機。雲端儲存及送審需要網路。</p></div><div class="card"><h2>我的雲端清點紀錄</h2><button id="refresh" class="secondary">重新整理</button><div id="history">讀取中…</div></div>`;
 $('#logout').onclick=async()=>{collect();localSave();await auth.signOut()};$('#add').onclick=()=>appendRow(true);$('#rows').onclick=e=>{const btn=e.target.closest('[data-del]');if(!btn)return;collect();if(form.items.length<=1)return status('至少保留一列；可清空欄位。',true);form.items.splice(Number(btn.dataset.del),1);dirty=true;localSave();inputView()};
 app.onkeydown=e=>{const field=e.target.closest('[data-f=sku],[data-f=quantity],[data-f=expiry]');if(!field||e.key!=='Enter')return;e.preventDefault();const line=field.closest('.line'),next=field.dataset.f==='sku'?'quantity':field.dataset.f==='quantity'?'expiry':null;if(next){line.querySelector(`[data-f=${next}]`)?.focus({preventScroll:true})}else{const nextLine=line.nextElementSibling;if(nextLine?.classList.contains('line'))nextLine.querySelector('[data-f=sku]')?.focus({preventScroll:true});else $('#add')?.focus({preventScroll:true})}};
 app.oninput=e=>{if(e.target.matches('[data-f=sku],[data-f=quantity],[data-f=expiry]')){const max=e.target.dataset.f==='sku'?2:e.target.dataset.f==='expiry'?6:16;e.target.value=e.target.value.replace(/[^0-9]/g,'').slice(0,max)}if(e.target.closest('#rows')||['donor','note'].includes(e.target.id)){collect();dirty=true;localSave();renderTotals();const s=$('#saveInfo');if(s)s.textContent='資料已保存在本機（未必同步至雲端）'}};
 $('#rows').onchange=e=>{if(e.target.matches('[data-f]')){collect();dirty=true;localSave()}};
 $('#local').onclick=()=>{collect();localSave();status('已儲存本機草稿。此裝置的其他人可能看得到，使用公用裝置請避免輸入敏感資料。')};
 $('#newDoc').onclick=()=>withBusy(createNewDocument);$('#cloud').onclick=()=>withBusy(()=>cloudSave(false));$('#submit').onclick=()=>withBusy(submit);$('#refresh').onclick=history;
 renderTotals();history();
}
function appendRow(focus){collect();form.items.push(blank());dirty=true;localSave();const rows=$('#rows');rows.insertAdjacentHTML('beforeend',rowHtml(form.items[form.items.length-1],form.items.length-1));renderTotals();if(focus)rows.lastElementChild.querySelector('[data-f=sku]')?.focus({preventScroll:true})}
function renderTotals(){const el=$('#totals');if(!el||!form)return;const groups=new Map();for(const r of form.items){if(!WAREHOUSES.includes(r.warehouse)||!/^\d{2}$/.test(r.sku)||!/^\d+$/.test(String(r.quantity)))continue;const n=Number(r.quantity);if(!Number.isSafeInteger(n))continue;const key=JSON.stringify([r.warehouse,r.sku]);const g=groups.get(key)||{warehouse:r.warehouse,sku:r.sku,total:0,lines:0};if(!Number.isSafeInteger(g.total+n))continue;g.total+=n;g.lines++;groups.set(key,g)}el.innerHTML=`<h3>倉別／品號加總（不影響逐筆清點紀錄）</h3>`+(groups.size?`<div class="totals-scroll"><table><thead><tr><th>倉別</th><th>品號</th><th>筆數</th><th>合計數量</th></tr></thead><tbody>${[...groups.values()].map(g=>`<tr><td>${esc(g.warehouse)}</td><td>${esc(g.sku)}</td><td>${g.lines}</td><td><strong>${g.total}</strong></td></tr>`).join('')}</tbody></table></div>`:'<p class="tiny">輸入品號和數量後，這裡會即時計算。</p>')}
function collect(){if(!form)return;form.donor=$('#donor')?.value??form.donor;form.note=$('#note')?.value??form.note;const elements=[...document.querySelectorAll('#rows .line')];if(elements.length)form.items=elements.map(el=>{const obj={};for(const input of el.querySelectorAll('[data-f]'))obj[input.dataset.f]=input.value;return obj})}
function validated(){
 collect();const items=form.items.map(r=>({warehouse:noEmpty(r.warehouse),sku:noEmpty(r.sku),quantity:noEmpty(r.quantity),expiry:noEmpty(r.expiry)}));
 if(!items.length)throw Error('至少需要一筆品項');const result=[];
 for(let i=0;i<items.length;i++){
  const r=items[i];if(!WAREHOUSES.includes(r.warehouse)||!r.sku||r.quantity===''||!r.expiry)throw Error(`第 ${i+1} 筆的倉別、品號、數量、效期都必須填寫`);
  if(!/^\d{2}$/.test(r.sku))throw Error(`第 ${i+1} 筆品號須為兩碼數字，例如 01、12`);
  if(!/^\d+$/.test(r.quantity)||!Number.isSafeInteger(Number(r.quantity)))throw Error(`第 ${i+1} 筆數量必須是非負整數`);
  if(!/^\d{6}$/.test(r.expiry)||Number(r.expiry.slice(0,4))<2000||Number(r.expiry.slice(4))<1||Number(r.expiry.slice(4))>12)throw Error(`第 ${i+1} 筆效期請填 YYYYMM`);
  result.push({warehouse:r.warehouse,sku:r.sku,quantity:Number(r.quantity),expiry:r.expiry});
 }
 return result;
}
async function withBusy(fn){if(lock)return;lock=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn()}catch(e){status('操作未完成：'+e.message,true)}finally{lock=false;document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
// A fixed submission ID is saved locally before the first network write. After a
// lost acknowledgement, verify the same ID instead of creating another document.
// A new form gets its own server-backed push ID. Existing drafts and submissions
// are never reused when the user explicitly requests a new document.
async function createNewDocument(){
 collect();
 if(dirty){
   status('這張清點單還有未同步變更。請先同步雲端草稿，再新增另一張清點單，以免資料遺失。',true);
   return;
 }
 const parent=db.ref('v9/selfCounts/'+user.uid);
 const newRef=parent.push();
 const newId=newRef.key;
 // The empty input row is a draft only; it cannot be submitted until validated.
 const next=defaultForm();
 const payload={uid:user.uid,title:'自行清點',donor:'',note:'',state:'draft',items:next.items,updatedAt:firebase.database.ServerValue.TIMESTAMP,createdAt:firebase.database.ServerValue.TIMESTAMP,schemaVersion:3,rev:0};
 // Create-only atomic transaction: never overwrite a record even if a key collides.
 const created=await newRef.transaction(current=>current===null?payload:undefined,undefined,false);
 if(!created.committed)throw Error('新單建立未完成，請重新點選新增清點單。');
 const check=(await newRef.once('value')).val();
 if(!check||check.uid!==user.uid||check.state!=='draft')throw Error('雲端新單回讀核對未通過，請從歷史清單檢查。');
 docId=newId;baseUpdatedAt=check.updatedAt||null;baseRev=Number.isSafeInteger(check.rev)?check.rev:0;form=next;dirty=false;
 localSave();inputView();
 status('已在 Firebase 建立全新清點單：'+newId+'。這張單與其他手機建立的清點單彼此獨立。');
}
// A compare-and-swap transaction makes simultaneous writes to the same document
// mutually exclusive. Legacy documents without `rev` are treated as revision 0.
// Timestamp comparisons cover those legacy records without silently overriding them.
const snapshotMatches=(saved,items)=>saved&&JSON.stringify(saved.items)===JSON.stringify(items)&&String(saved.donor||'')===noEmpty(form.donor)&&String(saved.note||'')===noEmpty(form.note);
const revisionOf=value=>Number.isSafeInteger(value?.rev)&&value.rev>=0?value.rev:0;
async function cloudSave(final){
 const items=validated(),id=docId||db.ref('v9/selfCounts/'+user.uid).push().key;
 if(!docId){docId=id;baseRev=null;baseUpdatedAt=null;localSave()}
 const ref=path(id);
 // Priming the local cache is important: RTDB transactions can initially receive
 // null even when an existing node is present on the server.
 const existing=(await ref.once('value')).val();
 if(existing?.state==='submitted'){
   if(final&&snapshotMatches(existing,items))return confirmReceipt(id,existing);
   throw Error('這張清點單已送出，不允許修改。請從歷史紀錄確認。');
 }
 if(existing&&baseRev===null&&baseUpdatedAt===null){
   throw Error('雲端存在同編號清點單，但尚未取得原始版本；請重新開啟歷史草稿。');
 }
 // Never overwrite a revision newer than the one this device loaded.
 if(existing&&(revisionOf(existing)!==(baseRev??0)||existing.updatedAt!==(baseUpdatedAt??null))){
   dirty=true;localSave();
   throw Error('儲存衝突：另一支手機已更新這張清點單。本機輸入已保留，雲端資料未遭覆蓋。請先備份本機內容，再核對雲端草稿。');
 }
 const expectedRevision=existing?revisionOf(existing):null;
 const expectedTimestamp=existing?existing.updatedAt:null;
 let sawMismatch=false;
 const transactionResult=await ref.transaction(current=>{
   if(current===null){
     // Allow a new, never-before-created document; do not recreate a deleted
     // document if the caller previously loaded it.
     if(existing||baseRev!==null||baseUpdatedAt!==null){sawMismatch=true;return;}
   }else{
     if(expectedRevision===null||current.state!=='draft'||
        revisionOf(current)!==expectedRevision||
        current.updatedAt!==expectedTimestamp||current.uid!==user.uid){
       sawMismatch=true;return;
     }
   }
   const payload={uid:user.uid,title:'自行清點',donor:noEmpty(form.donor),
     state:final?'submitted':'draft',items,note:noEmpty(form.note),
     updatedAt:firebase.database.ServerValue.TIMESTAMP,
     createdAt:current?.createdAt||firebase.database.ServerValue.TIMESTAMP,
     schemaVersion:3,rev:current?revisionOf(current)+1:1};
   if(final)payload.submittedAt=firebase.database.ServerValue.TIMESTAMP;
   return payload;
 },undefined,false);
 if(!transactionResult.committed){
   dirty=true;localSave();
   const latest=transactionResult.snapshot?.val();
   if(final&&latest?.state==='submitted'&&snapshotMatches(latest,items))return confirmReceipt(id,latest);
   throw Error(sawMismatch?'儲存衝突：雲端版本已有變動，本機輸入保留，未覆寫其他手機資料。':'交易未完成，資料保留在本機，請確認網路及雲端版本後再試。');
 }
 const snap=(await ref.once('value')).val();
 if(!snap||snap.state!==(final?'submitted':'draft')||!snapshotMatches(snap,items)||
    !Number.isSafeInteger(snap.rev)||snap.rev!==(expectedRevision===null?1:expectedRevision+1)||
    (final&&!Number.isFinite(snap.submittedAt))){
   dirty=true;localSave();
   throw Error('雲端寫入後回讀核對未通過。保留本機草稿及單號，請先確認歷史資料。');
 }
 baseUpdatedAt=snap.updatedAt||null;baseRev=snap.rev;dirty=false;
 form.items=items.map(r=>({...r,quantity:String(r.quantity)}));localSave();
 $('#currentId').textContent=id;renderTotals();
 try{await history()}catch(_err){}
 if(final)return confirmReceipt(id,snap);
 status('雲端草稿儲存成功（版本 '+baseRev+'），已回讀核對。');return true;
}

function confirmReceipt(id,snap){
 if(!Number.isFinite(snap.submittedAt))throw Error('雲端已提交但送出時間未完成核對，請查看歷史紀錄。');
 // A positive receipt is necessary before removing the local pending copy.
 status('已確認送達 Firebase｜單號：'+id+'｜送出：'+time(snap.submittedAt));
 return true;
}
async function submit(){
 if(!confirm('確定正式送出？送出後不能覆寫原始清點資料。'))return;
 const receiptId=docId;
 const done=await cloudSave(true);
 if(done){
   const confirmedId=docId||receiptId;
   localClear();form=defaultForm();docId=null;baseUpdatedAt=null;baseRev=null;dirty=false;
   inputView();status('雲端已確認送出。收件單號：'+confirmedId+'。請至下方歷史核對。');
 }
}
async function history(){const out=$('#history');if(!out)return;try{const data=(await db.ref('v9/selfCounts/'+user.uid).once('value')).val()||{};const entries=Object.entries(data).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));out.innerHTML=entries.length?entries.map(([id,v])=>`<div class="item"><strong>${esc(v.donor?'捐贈者：'+v.donor:'自行清點')}</strong>｜${v.state==='submitted'?'已送出':'草稿'}<div class="tiny">${esc(id)}｜${time(v.updatedAt)}｜${Array.isArray(v.items)?v.items.length:0} 筆</div>${v.state==='draft'?`<button class="secondary" data-load="${esc(id)}">繼續編輯</button>`:''}</div>`).join(''):'尚無雲端紀錄';out.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{if(dirty&&!confirm('本機有尚未同步的清點資料！切換其他草稿將放棄這些變更。請先自行備份內容。確定仍要切換嗎？'))return;const v=data[b.dataset.load];if(!v||v.state!=='draft')return;docId=b.dataset.load;baseUpdatedAt=v.updatedAt||null;baseRev=revisionOf(v);form={donor:v.donor||'',note:v.note||'',items:v.items.map(r=>({...r,quantity:String(r.quantity)}))};dirty=false;localSave();inputView();status('已載入雲端草稿')})}catch(e){out.textContent='無法讀取：'+e.message}}
async function adminView(){const role=(await db.ref('roles/'+user.uid).once('value')).val();if(role!=='admin'){app.innerHTML='<div class="card">此帳號沒有幹部權限。</div>';return}app.innerHTML=`<div class="card"><div class="top"><h2>志工自行清點｜已送出清單</h2><button id="logout" class="secondary">登出</button></div><div id="msg" class="notice" hidden></div><div class="grid"><div><label>依日期、倉別、志工、品號搜尋</label><input id="query" placeholder="輸入關鍵字"></div><div><label>狀態</label><select id="filter"><option value="submitted">已送出</option><option value="all">全部（含草稿，僅限管理查閱）</option></select></div></div><div class="row"><button id="refresh">更新收件匣</button><button id="csv" class="secondary">匯出目前篩選 CSV</button></div><p class="muted">志工送出代表「清點回報」，並不等於庫存已確認。此頁不會自動更新庫存。</p><div id="results">讀取中…</div></div>`;$('#logout').onclick=()=>auth.signOut();$('#refresh').onclick=loadAdmin;$('#query').oninput=renderAdmin;$('#filter').onchange=renderAdmin;$('#csv').onclick=exportCsv;await loadAdmin()}
async function loadAdmin(){try{records=(await db.ref('v9/selfCounts').once('value')).val()||{};renderAdmin();status('收件匣讀取成功。')}catch(e){status('幹部端讀取失敗：'+e.message,true)}}
function visible(){let arr=[];for(const [uid,docs] of Object.entries(records))for(const [id,v] of Object.entries(docs&&typeof docs==='object'?docs:{})){if(!v||typeof v!=='object')continue;if($('#filter').value==='submitted'&&v.state!=='submitted')continue;const needle=JSON.stringify([uid,id,v.title,v.donor,v.items,v.note,v.submittedAt,v.updatedAt]).toLowerCase();if(!needle.includes($('#query').value.trim().toLowerCase()))continue;arr.push({uid,id,...v})}return arr.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))}
function summaryHtml(items){const groups=new Map();for(const r of Array.isArray(items)?items:[]){const n=Number(r.quantity);if(!Number.isSafeInteger(n)||n<0)continue;const k=JSON.stringify([r.warehouse,r.sku]);const g=groups.get(k)||{warehouse:r.warehouse,sku:r.sku,total:0};if(!Number.isSafeInteger(g.total+n))continue;g.total+=n;groups.set(k,g)}return `<h4>各倉別／品號合計（逐筆紀錄保留）</h4><table><thead><tr><th>倉別</th><th>品號</th><th>合計數量</th></tr></thead><tbody>${[...groups.values()].map(g=>`<tr><td>${esc(g.warehouse)}</td><td>${esc(g.sku)}</td><td>${g.total}</td></tr>`).join('')}</tbody></table>`}
function renderAdmin(){const out=$('#results');if(!out)return;const rows=visible();out.innerHTML=`<p class="muted">符合條件：${rows.length} 張清點單</p>`+(rows.length?rows.map((v,i)=>`<details class="item"><summary><strong>${esc(v.donor?'捐贈者：'+v.donor:'自行清點')}</strong>｜${esc(v.state)}｜${time(v.submittedAt||v.updatedAt)}｜${esc(v.uid.slice(0,8))}…</summary><p class="tiny">單號 ${esc(v.id)}｜UID ${esc(v.uid)}｜送出時間 ${time(v.submittedAt|| (v.state==='submitted'?v.updatedAt:null))}｜捐贈者 ${esc(v.donor||'未填')}｜備註 ${esc(v.note||'')}</p><table><thead><tr><th>倉別</th><th>品號</th><th>數量</th><th>效期</th></tr></thead><tbody>${(Array.isArray(v.items)?v.items:[]).map(r=>`<tr><td>${esc(r.warehouse)}</td><td>${esc(r.sku)}</td><td>${esc(r.quantity)}</td><td>${esc(r.expiry)}</td></tr>`).join('')}</tbody></table>${summaryHtml(v.items)}</details>`).join(''):'<p>尚無符合的清點單</p>')}
function exportCsv(){const rows=[['清點單號','志工 UID','狀態','捐贈者資訊','送出時間（伺服器）','倉別','品號','數量','效期','備註']];for(const v of visible())for(const r of (Array.isArray(v.items)?v.items:[]))rows.push([v.id,v.uid,v.state,v.donor||'',time(v.submittedAt||(v.state==='submitted'?v.updatedAt:null)),r.warehouse,r.sku,r.quantity,r.expiry,v.note||'']);const safe=x=>{let s=String(x??'').replace(/[\u0000-\u001F\u007F]/g,' ');if(/^[\s\uFEFF]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};const csv='\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='VolunteerCare_SelfCount_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
try{const config=window.VOLUNTEER_FIREBASE_CONFIG;if(!config?.apiKey||!config?.databaseURL)throw Error('找不到 firebase-config.js');if(!firebase.apps.length)firebase.initializeApp(config);auth=firebase.auth();db=firebase.database();let seq=0;auth.onAuthStateChanged(async u=>{const current=++seq;if(!u){user=null;docId=null;baseUpdatedAt=null;baseRev=null;showLogin();return}if(admin?code(u)!=='A0001':!/^V\d{4}$/.test(code(u))){showLogin('目前登入的帳號不適用此頁，請先登出原帳號再登入。');return}user=u;if(admin){await adminView();return}try{let saved;try{saved=JSON.parse(localStorage.getItem(storageKey())||'null')}catch(e){}docId=saved?.docId||null;baseUpdatedAt=saved?.baseUpdatedAt??null;baseRev=saved?.baseRev??null;form=saved?.form?.items?.length?saved.form:defaultForm();dirty=Boolean(saved?.dirty);if(docId){const online=(await path(docId).once('value')).val();if(current!==seq)return;if(online?.state==='submitted'){if(dirty){inputView();status('另一裝置已送出這張清點單。這台手機尚未同步的輸入仍保留在本機，且不會覆寫已送出紀錄；請先自行備份後再開新單。',true);return;}docId=null;baseUpdatedAt=null;baseRev=null;form=defaultForm();dirty=false;localClear()}else if(online?.state==='draft'){if(!dirty && (baseUpdatedAt===null || online.updatedAt!==baseUpdatedAt)){form={donor:online.donor||'',note:online.note||'',items:Array.isArray(online.items)?online.items.map(r=>({...r,quantity:String(r.quantity)})):[blank()]};baseUpdatedAt=online.updatedAt||null;baseRev=revisionOf(online);dirty=false;localSave()}}}inputView();if(dirty)status('本機有尚未同步的變更。已保留輸入，儲存時會使用版本交易檢查，避免覆蓋其他手機。',true)}catch(e){app.innerHTML='<div class="card">無法開啟：'+esc(e.message)+'</div>'}})}catch(e){app.innerHTML='<div class="card">無法啟動：'+esc(e.message)+'</div>'}
})();
