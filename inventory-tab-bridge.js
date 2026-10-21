(()=>{
 'use strict';
 const admin=/\/admin\.html$/.test(location.pathname);
 const targets=admin?['inventoryAdmin']:['inventory'];
 document.querySelectorAll('nav button[data-page]').forEach(button=>{
  if(!targets.includes(button.dataset.page))return;
  button.addEventListener('click',event=>{
   event.preventDefault();event.stopImmediatePropagation();
   document.querySelectorAll('nav .navbtn').forEach(b=>b.classList.remove('active'));
   button.classList.add('active');
   document.getElementById('cloudTab')?.click();
  },true);
 });
 // Separate inventory module and old pages intentionally share Firebase login;
 // old non-inventory data is not automatically mirrored into Firebase.
})();
