
'use strict';(()=>{const $=s=>document.querySelector(s),isAdmin=location.pathname.endsWith('/admin.html');let auth,db;const accounts={A0001:'a0001@gmail.com.tw',V0001:'v0001@gmail.com',V0002:'v0002@gmail.com'};const fail=s=>{$('#unifiedLoginError').textContent=s};
const gate=$('#unifiedGate'),main=$('#unifiedMain'),frame=$('#cloudFrame'),panel=$('#cloudPanel'),content=$('#content');
const originalPages=document.querySelectorAll('nav [data-page]');
function showCloud(){panel.hidden=false;content.hidden=true;frame.src='./'+(isAdmin?'sync-admin.html':'sync-test.html')+'?embedded=1&v=730';window.scrollTo({top:0,behavior:'smooth'})}
function showOriginal(){panel.hidden=true;content.hidden=false;}
$('#cloudTab').addEventListener('click',showCloud);originalPages.forEach(b=>b.addEventListener('click',showOriginal));
try{if(!window.VOLUNTEER_FIREBASE_CONFIG?.apiKey)throw Error('firebase-config.js 尚未設定，請保留你已在 GitHub 設好的版本');if(!window.firebase)throw Error('無法載入 Firebase SDK，請檢查網路');if(!firebase.apps.length)firebase.initializeApp(window.VOLUNTEER_FIREBASE_CONFIG);auth=firebase.auth();db=firebase.database();}catch(e){fail(e.message);return;}
$('#unifiedLoginForm').addEventListener('submit',async e=>{e.preventDefault();const code=$('#unifiedCode').value.trim().toUpperCase();const pin=$('#unifiedPin').value;if(!accounts[code])return fail('此代號尚未建立帳號。現階段支援 A0001、V0001、V0002。');if(isAdmin&&!code.startsWith('A')||!isAdmin&&!code.startsWith('V'))return fail('請使用正確身分的登入入口。');$('#unifiedSubmit').disabled=true;fail('登入驗證中…');try{await auth.signInWithEmailAndPassword(accounts[code],pin);$('#unifiedPin').value='';}catch(err){fail('登入失敗：'+(err.message||err.code))}finally{$('#unifiedSubmit').disabled=false}});
$('#unifiedLogout').addEventListener('click',async()=>{await auth.signOut();frame.src='about:blank'});
auth.onAuthStateChanged(async user=>{gate.hidden=false;main.hidden=true;if(!user)return;const code=(user.email||'').split('@')[0].toUpperCase();if(!accounts[code]||(!isAdmin&&!code.startsWith('V'))||(isAdmin&&!code.startsWith('A'))){fail('此登入身分無法開啟本頁，請先登出後使用正確入口。');await auth.signOut();return;}if(isAdmin){try{const s=await db.ref('roles/'+user.uid).once('value');if(s.val()!=='admin'){fail('此帳號沒有管理權限');await auth.signOut();return}}catch(e){fail('無法驗證幹部權限：'+e.message);return}}
$('#unifiedIdentity').textContent=code;gate.hidden=true;main.hidden=false;showCloud();});
})();
