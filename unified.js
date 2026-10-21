'use strict';
(()=>{
  const $=s=>document.querySelector(s);
  const isAdmin=location.pathname.endsWith('/admin.html');
  const accounts={A0001:'a0001@gmail.com.tw',V0001:'v0001@gmail.com',V0002:'v0002@gmail.com',V0003:'v0003@gmail.com'};
  const gate=$('#unifiedGate'),main=$('#unifiedMain'),frame=$('#cloudFrame'),panel=$('#cloudPanel'),content=$('#content');
  const loginForm=$('#unifiedLoginForm'),error=$('#unifiedLoginError'),submit=$('#unifiedSubmit');
  const fail=s=>{error.textContent=s||'';};
  let auth,db,verifiedUid=null,authGeneration=0,explicitLogout=false,cloudLoaded=false;
  function showCloud(){
    panel.hidden=false;content.hidden=true;
    if(!cloudLoaded){frame.src='./'+(isAdmin?'sync-admin.html':'sync-test.html')+'?embedded=1&v=760';cloudLoaded=true;}
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showOriginal(){panel.hidden=true;content.hidden=false;}
  $('#cloudTab').addEventListener('click',showCloud);
  document.querySelectorAll('nav [data-page]').forEach(b=>b.addEventListener('click',showOriginal));
  try{
    const cfg=window.VOLUNTEER_FIREBASE_CONFIG;
    if(!cfg?.apiKey||!cfg.databaseURL)throw Error('firebase-config.js 尚未設定');
    if(!window.firebase)throw Error('無法載入 Firebase SDK');
    if(!firebase.apps.length)firebase.initializeApp(cfg);
    auth=firebase.auth();db=firebase.database();
  }catch(e){fail(e.message);return;}
  // Firebase 將登入資訊保留在瀏覽器，只有主動登出才清除登入。
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e=>{
    fail('無法保存登入狀態：'+e.message);
  });
  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();const code=$('#unifiedCode').value.trim().toUpperCase(),pin=$('#unifiedPin').value;
    if(!accounts[code])return fail('此代號尚未建立登入帳號');
    if((isAdmin&&!code.startsWith('A'))||(!isAdmin&&!code.startsWith('V')))return fail('請使用正確身分的登入入口。');
    submit.disabled=true;fail('登入驗證中…');
    try{
      await auth.signInWithEmailAndPassword(accounts[code],pin);
      $('#unifiedPin').value='';
    }catch(err){fail('登入失敗：'+(err.message||err.code));}
    finally{submit.disabled=false;}
  });
  $('#unifiedLogout').addEventListener('click',async()=>{
    explicitLogout=true;
    try{await auth.signOut();}catch(e){explicitLogout=false;fail('登出失敗：'+e.message);}
  });
  auth.onAuthStateChanged(async user=>{
    const token=++authGeneration;
    // 同一帳號的回呼不應重建 iframe、清除草稿或跳回登入畫面。
    if(user&&verifiedUid===user.uid&&main.hidden===false)return;
    if(!user){
      verifiedUid=null;cloudLoaded=false;
      frame.src='about:blank';panel.hidden=true;
      gate.hidden=false;main.hidden=true;
      if(!explicitLogout)fail('登入已失效，請重新登入。');else fail('');
      explicitLogout=false;
      return;
    }
    const code=(user.email||'').split('@')[0].toUpperCase();
    if(accounts[code]!==user.email||((isAdmin&&!code.startsWith('A'))||(!isAdmin&&!code.startsWith('V')))){
      // 不因開啟錯誤身分的頁面而踢掉另一個頁面的 Firebase Session。
      verifiedUid=null;gate.hidden=false;main.hidden=true;
      fail('此帳號不適用於本頁，請使用正確身分的登入入口。若要更換帳號，請先在原登入頁登出。');
      return;
    }
    if(isAdmin){
      try{
        const role=await db.ref('roles/'+user.uid).once('value');
        if(token!==authGeneration)return;
        if(role.val()!=='admin'){
          verifiedUid=null;gate.hidden=false;main.hidden=true;
          fail('目前帳號沒有幹部權限，請確認 Firebase roles 設定。');return;
        }
      }catch(err){
        if(token!==authGeneration)return;
        // 權限確認失敗不強制登出；如果已展示本帳號畫面，保持畫面與草稿。
        if(verifiedUid===user.uid)return;
        gate.hidden=false;main.hidden=true;
        fail('幹部權限確認失敗：'+err.message+'。請檢查網路及資料庫規則。');return;
      }
    }
    if(token!==authGeneration)return;
    verifiedUid=user.uid;
    $('#unifiedIdentity').textContent=code;
    fail('');gate.hidden=true;main.hidden=false;
    showCloud();
  },err=>{
    // 短暫驗證/網路異常不應清除已開啟的後台。
    if(verifiedUid) return;
    fail('登入狀態確認失敗：'+err.message);
  });
})();
