
'use strict';
(()=>{
 const $=s=>document.querySelector(s);
 const admin=/\/admin\.html$/.test(location.pathname);
 const gate=$('#unifiedGate'), main=$('#unifiedMain'), frame=$('#cloudFrame'), panel=$('#cloudPanel'), content=$('#content');
 const loginForm=$('#unifiedLoginForm'), error=$('#unifiedLoginError'), submit=$('#unifiedSubmit');
 const identities={A0001:'a0001@gmail.com.tw',V0001:'v0001@gmail.com',V0002:'v0002@gmail.com',V0003:'v0003@gmail.com'};
 const authEmail=code=>identities[code]||null;
 let auth=null, db=null, verified=false, firebaseReady=false, busy=false;
 const setError=message=>{if(error)error.textContent=message||''};
 // PREVIEW ONLY: all original local/demo tabs are visible without authentication.
 // Firebase data is NEVER exposed or written without a verified session.
 function showOriginal(){panel.hidden=true;content.hidden=false;}
 function showPreview(){gate.hidden=true;main.hidden=false;showOriginal();}
 function openCloud(){
  panel.hidden=false;content.hidden=true;
  if(verified && auth?.currentUser){
   const target='./'+(admin?'inventory-admin.html':'inventory-volunteer.html')+'?embedded=1&v=20261022-v22';
   if(frame.getAttribute('src')!==target)frame.src=target;
   const hint=panel.querySelector('.cloud-hint');if(hint)hint.textContent='目前為已驗證的 Firebase 雲端工作區。';
  } else {
   frame.removeAttribute('src'); frame.hidden=true;
   const hint=panel.querySelector('.cloud-hint');
   if(hint)hint.textContent='清點雲端資料須先完成 Firebase 身分驗證。登入介面已暫時隱藏，尚未取消權限。可先操作其他選單的本機示範內容。';
   let actions=panel.querySelector('#previewCloudActions');
   if(!actions){actions=document.createElement('div');actions.id='previewCloudActions';actions.className='cloud-header';actions.style.marginTop='12px';panel.insertBefore(actions,frame);}
   actions.textContent='目前為介面預覽模式；無法讀寫正式清點任務。 ';
   const btn=document.createElement('button');btn.type='button';btn.textContent='需要時開啟原本登入';btn.onclick=()=>{gate.hidden=false;setError('');};actions.appendChild(btn);
  }
 }
 function updateCloud(){
  const actions=panel.querySelector('#previewCloudActions');if(actions)actions.remove();
  frame.hidden=false;
  if(!panel.hidden)openCloud();
 }
 showPreview();
 document.querySelectorAll('nav [data-page]').forEach(b=>b.addEventListener('click',showOriginal));
 $('#cloudTab')?.addEventListener('click',openCloud);
 // Existing code/PIN login remains in the repository for later restoration.
 $('#unifiedLogout')?.addEventListener('click',async()=>{try{await auth?.signOut();showPreview();}catch(e){setError(e.message)}});
 try {
  const cfg=window.VOLUNTEER_FIREBASE_CONFIG;
  if(!cfg?.apiKey||!cfg?.databaseURL||!window.firebase)throw Error('Firebase 尚未正確載入');
  if(!firebase.apps.length)firebase.initializeApp(cfg);
  auth=firebase.auth();db=firebase.database();firebaseReady=true;
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
  auth.onAuthStateChanged(async user=>{
   verified=false;
   if(user){
    const code=(user.email||'').split('@')[0].toUpperCase();
    if(authEmail(code)===user.email&&((admin&&code.startsWith('A'))||(!admin&&code.startsWith('V')))){
     if(!admin)verified=true;
     else try{verified=(await db.ref('roles/'+user.uid).once('value')).val()==='admin'}catch(e){verified=false;}
     if(verified)$('#unifiedIdentity').textContent=code;
    }
   }
   showPreview();updateCloud();
  });
 }catch(e){console.warn('預覽模式：',e.message);}
 loginForm?.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const code=$('#unifiedCode').value.trim().toUpperCase(),pin=$('#unifiedPin').value;
  if(!firebaseReady)return setError('Firebase 無法連線；其他示範分頁仍可查看。');
  if(!authEmail(code)||((admin&&!code.startsWith('A'))||(!admin&&!code.startsWith('V'))))return setError('請使用這個頁面適用的帳號。');
  busy=true;submit.disabled=true;setError('驗證中…');
  try{await auth.signInWithEmailAndPassword(authEmail(code),pin);$('#unifiedPin').value='';gate.hidden=true;setError('');}
  catch(err){setError('驗證失敗：'+(err.message||err.code));}
  finally{busy=false;submit.disabled=false;}
 });
})();
