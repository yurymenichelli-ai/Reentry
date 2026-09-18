export function connectOffice({isAuthenticated,navigate}) {
 if(window.parent===window||new URLSearchParams(location.search).get('office')!=='1')return;
 document.documentElement.classList.add('office-embedded');
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./office/embed.css?v=1';document.head.append(sheet);
 const allowed=new Set(['dashboard','plan','transactions','calendar','goals','analysis','profile']);
 const notify=()=>window.parent.postMessage({type:isAuthenticated()?'rientro:office:ready':'rientro:office:locked'},location.origin);
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='rientro:office:navigate'||!allowed.has(event.data.target))return;
  if(!isAuthenticated()){notify();return;}
  navigate(event.data.target);
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('.modal-backdrop')){event.preventDefault();window.parent.postMessage({type:'rientro:office:close'},location.origin);}
 },true);
 window.addEventListener('rientro-cloud-status',()=>{if(!isAuthenticated())notify();});
 notify();
}
