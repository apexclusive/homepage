(() => {
  'use strict';
  const launcher=document.querySelector('.tool-concierge-launcher');
  const panel=document.querySelector('.tool-concierge');
  const close=panel?.querySelector('.tool-concierge-close');
  const form=panel?.querySelector('form');
  const input=panel?.querySelector('input');
  const messages=panel?.querySelector('.tool-concierge-messages');
  const context=document.body.dataset.tool || 'deze tool';
  if(!launcher||!panel||!form||!input||!messages)return;
  const add=(text,role)=>{const el=document.createElement('div');el.className=`tool-concierge-message ${role}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight};
  const toggle=()=>{const open=panel.hidden;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open)input.focus()};
  launcher.addEventListener('click',toggle);close?.addEventListener('click',toggle);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){toggle();launcher.focus()}});
  const history=[];
  form.addEventListener('submit',async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';add(q,'user');history.push({role:'user',content:q});const send=form.querySelector('button');send.disabled=true;try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:'apex',messages:history.slice(-12),toolContext:context})});const d=await r.json();const a=d.reply||d.error||'Neem voor een persoonlijk advies contact op met Martijn.';add(a,'bot');history.push({role:'assistant',content:a})}catch(_){add('De digitale assistent is tijdelijk niet bereikbaar. U kunt ons rechtstreeks mailen via info@apexclusive.nl.','bot')}finally{send.disabled=false}});
})();
