/* Desktop-only keyboard workflow. Mobile remains original step-by-step. */
(()=>{'use strict';if(!matchMedia('(min-width: 768px) and (pointer: fine)').matches)return;
const isForm=f=>f?.id==='vEntry'||f?.id==='v6Form';
function enhance(){document.querySelectorAll('#vEntry,#v6Form').forEach(f=>{if(f.dataset.desktopReady)return;f.dataset.desktopReady='1';f.classList.add('desktop-entry');f.querySelectorAll('.v-field,.v6-step').forEach((step,i)=>{step.hidden=i===4;});f.querySelector('.v-step-actions')?.setAttribute('hidden','');const button=document.createElement('button');button.type='button';button.className='primary desktop-save';button.textContent='儲存本筆（Enter）';f.appendChild(button);const inputs=()=>[...f.querySelectorAll('select[name],input[name]:not([type=hidden])')].filter(x=>!x.disabled);
function commit(){const els=inputs();for(const el of els){if(!el.checkValidity()){el.reportValidity();el.focus();return;}}if(f.id==='vEntry'){f.requestSubmit();return;}f.dataset.step='4';const next=f.querySelector('#v6Next');if(next)next.click();}
button.addEventListener('click',commit);f.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.isComposing||e.ctrlKey)return;if(!e.target.matches('input,select'))return;e.preventDefault();const fields=inputs(),i=fields.indexOf(e.target);if(i>=0&&i<fields.length-1){fields[i+1].focus();fields[i+1].select?.();}else commit();},true);
});}
const prior=window.render;if(typeof prior==='function'){window.render=function(...args){const result=prior.apply(this,args);enhance();return result;}}
document.addEventListener('DOMContentLoaded',enhance);enhance();
})();