"use strict";
/* v6.2: task assignment scope + guided visible-check or blind recount; local prototype only. */
const v62OldAdmin=v6admin, v62OldRoundUI=v6roundUI, v62OldBind=v6Bind;
const v62Modes={all:'全單複點',diff:'異常品號複點',scope:'指定倉別／品號／儲位複點'};
const v62Key=x=>JSON.stringify([x.warehouse,x.sku]);
const v62Nm=x=>String(x||'').replace(/\D/g,'');
const v62Expiry=x=>String(x||'').slice(0,6);
function v62Rows(o,r){
  let src=o.lines||[], mode=r.mode||'all';
  if(mode==='diff'){
    let last=v6last(o), base=last?.lines||o.lines;
    let sum=(arr)=>{let a=new Map();for(let x of arr){let k=JSON.stringify([x.warehouse,x.sku,v62Expiry(x.expiry)]);a.set(k,(a.get(k)||0n)+BigInt(x.quantity||0));}return a};
    let a=sum(o.lines),b=sum(base),keys=new Set([...a.keys(),...b.keys()]);
    let selected=new Set([...keys].filter(k=>(a.get(k)||0n)!==(b.get(k)||0n)).map(k=>{let arr=JSON.parse(k);return JSON.stringify(arr.slice(0,2))}));
    src=src.filter(x=>selected.has(v62Key(x)));
  }
  if(mode==='scope')src=src.filter(x=>(!r.scopeWarehouse||x.warehouse===r.scopeWarehouse)&&(!r.scopeSku||x.sku==='#'+v62Nm(r.scopeSku).padStart(2,'0')));
  return src;
}
function v62Target(o,r){if(!r.targetLines){r.targetLines=v62Rows(o,r).map(x=>({...x}));vSave();}return r.targetLines;}
function v62Editor(o,r){
 let rows=v62Target(o,r),completed=r.lines.length,style=r.display||'blind';
 let hint=style==='guided'?'顯示原清點內容。正確按「✓ 確認相同」，有差異按「修改」。':'獨立複點：只顯示倉別及品號，不顯示之前的數量與效期。';
 let cards=rows.map((x,i)=>{let saved=r.lines.find(z=>z.targetId===x.id),isDone=!!saved;
 return `<article class="v62-card" data-target="${esc(x.id)}"><div class="v62-cardtop"><div><small>第 ${i+1} 項／${rows.length}</small><h3>${esc(x.warehouse)}　${esc(x.sku)}</h3></div><span class="v62-state ${isDone?'isdone':''}">${isDone?'✓ 已完成':'尚未確認'}</span></div>
 ${style==='guided'?`<div class="v62-pair"><div><small>原始數量</small><b>${esc(x.quantity)}</b></div><div><small>原始效期</small><b>${esc(v62Expiry(x.expiry))}</b></div></div>`:`<p class="muted small">請以現場實際物資為準，不參考前一版答案。</p>`}
 ${isDone?`<p class="v62-done">本輪：${esc(saved.quantity)} 件・效期 ${esc(saved.expiry)}</p><button class="outline" data-v62="edit" data-i="${i}" data-oid="${esc(o.id)}" data-rid="${esc(r.id)}">重新確認此項</button>`:
 `<div class="v62-edit" id="v62Edit${i}" hidden><label class="field">實際數量<input data-n="qty" inputmode="numeric" type="text" placeholder="輸入實際件數" value="${style==='guided'?esc(x.quantity):''}"></label><label class="field">實際效期（YYYYMM）<input data-n="expiry" inputmode="numeric" maxlength="6" type="text" placeholder="例如 202712" value="${style==='guided'?esc(v62Expiry(x.expiry)):''}"></label><div class="v62-actions"><button class="outline" data-v62="cancel" data-i="${i}">取消</button><button class="primary" data-v62="save" data-i="${i}" data-oid="${esc(o.id)}" data-rid="${esc(r.id)}">✓ 儲存核對</button></div></div>
 <div class="v62-actions" id="v62Actions${i}">${style==='guided'?`<button class="primary" data-v62="same" data-i="${i}" data-oid="${esc(o.id)}" data-rid="${esc(r.id)}">✓ 確認相同</button>`:''}<button class="outline" data-v62="edit" data-i="${i}" data-oid="${esc(o.id)}" data-rid="${esc(r.id)}">${style==='guided'?'✎ 不同，修改':'輸入實際清點結果'}</button></div>`}</article>`}).join('');
 let done=rows.filter(x=>r.lines.some(y=>y.targetId===x.id)).length;
 return panel(`V${r.version}｜${esc(o.name)}`,`<div class="v62-heading"><strong>${esc(v62Modes[r.mode]||v62Modes.all)}</strong><span>${style==='guided'?'☑ 勾選核對':'◉ 獨立清點'}</span></div><p class="muted small">${hint}</p>${r.scopeLocation?`<p>指定儲位：${esc(r.scopeLocation)}</p>`:''}<p class="v62-count">已完成 ${done}／${rows.length} 項</p><div class="v62-progress"><div style="width:${rows.length?100*done/rows.length:0}%"></div></div>${cards||'<p class="notice">本次指派沒有符合範圍的項目，請幹部重新選擇任務。</p>'}<button class="primary v62-submit" data-v62="submit" data-oid="${esc(o.id)}" data-rid="${esc(r.id)}" ${rows.length===0||done!==rows.length?'disabled':''}>送出 V${r.version} 給幹部審核</button><p class="muted small">每次操作會自動暫存於此瀏覽器。送出後不會直接更新庫存。</p>`);
}
v6roundUI=function(o,r){return v62Editor(o,r)};
v6admin=function(o){let h=v62OldAdmin(o);let options=`<div class="v62-config"><h3>本輪複點設定</h3><label class="field">複點範圍<select id="v62Mode"><option value="all">① 全單複點</option><option value="diff">② 只複點異常品號</option><option value="scope">③ 指定倉別／品號／儲位</option></select></label><label class="field">志工核對方式<select id="v62Display"><option value="guided">顯示原清點資料，可勾選相同或修改</option><option value="blind">獨立複點，隱藏原數量及效期</option></select></label><div id="v62Scope" class="v62-scope" hidden><label class="field">倉別<select id="v62Warehouse"><option value="">全部倉別</option>${[...new Set(o.lines.map(x=>x.warehouse))].map(w=>`<option value="${esc(w)}">${esc(w)}</option>`).join('')}</select></label><label class="field">品號（可不填）<input id="v62Sku" inputmode="numeric" maxlength="2" placeholder="例如 02"></label><label class="field">儲位註記（可不填）<input id="v62Location" placeholder="例如 A-03 棧板"></label></div><p class="muted small">異常模式依已完成版本與初點比較；若尚未有差異，請用全單模式。</p></div>`;
 h=h.replace(/(<button class="primary" data-v6="assign")/,options+'$1');
 return h;
};
function v62Store(o,r,i,qty,expiry){let targets=v62Target(o,r),src=targets[i];if(!src)return;let q=String(qty).trim(),e=String(expiry).trim();if(!/^\d+$/.test(q)||BigInt(q)<0n)return toast('數量請填寫零或正整數');if(!/^\d{6}$/.test(e)||+e.slice(4)<1||+e.slice(4)>12)return toast('效期請填六碼 YYYYMM');let existing=r.lines.findIndex(x=>x.targetId===src.id);let row={id:existing>=0?r.lines[existing].id:vId(),targetId:src.id,seq:i+1,warehouse:src.warehouse,sku:src.sku,quantity:q,expiry:e,at:vStamp()};if(existing>=0)r.lines[existing]=row;else r.lines.push(row);vSave();let y=scrollY;render();requestAnimationFrame(()=>scrollTo(0,y));toast('已儲存此筆核對');}
let v62OldRender=render;
render=function(){v62OldRender();let mode=document.querySelector('#v62Mode');if(mode){let update=()=>{let area=document.querySelector('#v62Scope');if(area)area.hidden=mode.value!=='scope'};mode.onchange=update;update()};document.querySelectorAll('[data-v62]').forEach(b=>b.onclick=()=>{let a=b.dataset.v62,i=+b.dataset.i,o=vFind(b.dataset.oid),r=o&&v6rounds(o).find(x=>x.id===b.dataset.rid);let box=document.querySelector('#v62Edit'+i),acts=document.querySelector('#v62Actions'+i);if(a==='edit'){if(box){box.hidden=false;if(acts)acts.hidden=true;}return;}if(a==='cancel'){if(box){box.hidden=true;if(acts)acts.hidden=false;}return;}if(!o||!r)return;if(a==='same'){let x=v62Target(o,r)[i];return v62Store(o,r,i,x.quantity,v62Expiry(x.expiry));}if(a==='save')return v62Store(o,r,i,box?.querySelector('[data-n="qty"]')?.value,box?.querySelector('[data-n="expiry"]')?.value);if(a==='submit'){
 let targets=v62Target(o,r);if(!targets.length||targets.some(x=>!r.lines.some(y=>y.targetId===x.id)))return toast('還有項目未完成');if(!confirm('確認送出此輪複點？送出後無法直接修改。'))return;r.status='submitted';r.submittedAt=vStamp();vAudit(o,`V${r.version} ${v62Modes[r.mode]||'複點'}完成`);vSave();page='inventory';render();toast('已送出，等待幹部審核');
 }});
};
// Assignment validation and initialization for selected scope and discrepancy mode.
const v62BaseBind=v6Bind;
v6Bind=function(){v62BaseBind();let btn=document.querySelector('[data-v6="assign"]');if(btn){btn.addEventListener('click',e=>{let o=vFind(btn.dataset.oid),mode=document.querySelector('#v62Mode')?.value;if(!o||!mode)return;let probe={mode,scopeWarehouse:document.querySelector('#v62Warehouse')?.value||'',scopeSku:document.querySelector('#v62Sku')?.value||''};let candidate=v62Rows(o,probe);if(candidate.length===0){e.stopImmediatePropagation();toast('所選範圍沒有可複點明細，請調整條件');}},true)}};
// Existing v6 wrapper calls v6Bind; force final render and rewire controls.
render();
