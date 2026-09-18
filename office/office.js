import {initializeCloud,cloudUser,signInCloud,signUpCloud,signOutCloud} from '../cloud.js?v=40';
import {createScene} from './scene.js';
const $=selector=>document.querySelector(selector);
const stations=[
 {id:'dashboard',name:'Disponibile',object:'La bacheca',short:'Bacheca',x:.12,y:.30,kicker:'SULLA BACHECA',title:'Quanto puoi spendere'},
 {id:'plan',name:'Debiti e piano',object:'I fascicoli',short:'Debiti',x:.30,y:.56,kicker:'NEI TUOI FASCICOLI',title:'Debiti e piano'},
 {id:'transactions',name:'Movimenti',object:'Il computer',short:'Computer',x:.56,y:.43,kicker:'SUL TUO COMPUTER',title:'Movimenti e spese future'},
 {id:'calendar',name:'Scadenze',object:'Il calendario',short:'Scadenze',x:.44,y:.25,kicker:'SUL CALENDARIO',title:'Le prossime scadenze'},
 {id:'goals',name:'Obiettivi',object:'Il tavolo dei progetti',short:'Obiettivi',x:.90,y:.59,kicker:'SUL TAVOLO DEI PROGETTI',title:'I tuoi obiettivi'},
 {id:'analysis',name:'Analisi',object:'Il report',short:'Analisi',x:.48,y:.60,kicker:'NEL TUO REPORT',title:'Le tue analisi'},
 {id:'profile',name:'Profilo',object:'L’agenda',short:'Profilo',x:.65,y:.61,kicker:'NELLA TUA AGENDA',title:'Il tuo profilo'}
];
let scene,authenticated=false,entering=false,entered=false,selected=null,frameReady=false,transition=0,statusTimer,frameTimeout,audioContext,ambientGain;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionQuery.matches;
try{reduced=reduced||localStorage.getItem('rientro-office-motion')==='reduced';}catch{}
const hotspots=stations.map((s,i)=>{const button=document.createElement('button');button.className='hotspot';button.dataset.short=s.short;button.dataset.edge=s.x>.75?'right':'left';button.setAttribute('aria-label',`${s.object}: ${s.name}`);button.style.setProperty('--fallback-x',s.x*100+'%');button.style.setProperty('--fallback-y',s.y*100+'%');button.innerHTML=`<span class="dot" aria-hidden="true">${i+1}</span><span class="hotspot-label"><small>${s.object}</small>${s.name}</span>`;button.onclick=()=>openStation(s);$('#hotspots').append(button);return button;});
for(const s of stations){const b=document.createElement('button');b.textContent=s.name;b.dataset.station=s.id;b.onclick=()=>openStation(s);$('#station-nav').append(b);}
function status(text){$('#status').textContent=text;clearTimeout(statusTimer);if(text)statusTimer=setTimeout(()=>{$('#status').textContent='';},4500);}
function applyMotion(){scene?.reduced(reduced);$('#motion').setAttribute('aria-pressed',String(reduced));$('#motion span').textContent=reduced?'ridotto':'cinema';}
$('#motion').onclick=()=>{reduced=!reduced;try{localStorage.setItem('rientro-office-motion',reduced?'reduced':'cinema');}catch{}applyMotion();};
motionQuery.addEventListener('change',e=>{reduced=e.matches;applyMotion();});
let audioEnabled=false;
function tone(frequency=200,duration=.14){if(!audioEnabled||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(frequency*.55,audioContext.currentTime+duration);g.gain.setValueAtTime(.025,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}
$('#sound').onclick=async()=>{
 try{audioEnabled=!audioEnabled;if(audioEnabled){audioContext??=new AudioContext();await audioContext.resume();if(!ambientGain){const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate);const data=buffer.getChannelData(0);let previous=0;for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.02)/1.02;data[i]=previous*3.5;}const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;ambientGain=audioContext.createGain();ambientGain.gain.value=.04;noise.connect(filter).connect(ambientGain).connect(audioContext.destination);noise.start();}tone(380);}else await audioContext?.suspend();$('#sound').setAttribute('aria-pressed',String(audioEnabled));$('#sound span').textContent=audioEnabled?'on':'off';}catch{audioEnabled=false;status('Audio non disponibile su questo dispositivo.');}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)audioContext?.suspend();else if(audioEnabled)audioContext?.resume();});
$('#show-password').onclick=()=>{const show=$('#password').type==='password';$('#password').type=show?'text':'password';$('#show-password').textContent=show?'Nascondi':'Mostra';$('#show-password').setAttribute('aria-label',show?'Nascondi password':'Mostra password');$('#show-password').setAttribute('aria-pressed',String(show));};
function authError(message){$('#auth-error').textContent=message;$('#auth-error').hidden=!message;}
async function login(register=false){
 if(!$('#login').reportValidity())return;
 authError('');$('#enter').disabled=true;$('#register').disabled=true;$('#enter span').textContent=register?'Creo il tuo account…':'Apro la porta…';
 try{const result=await (register?signUpCloud:signInCloud)($('#email').value.trim(),$('#password').value);if(!result.ok)throw new Error(result.error||'Accesso non riuscito.');$('#password').value='';if(result.needsConfirmation){authError('Controlla la tua email e conferma l’account. Poi torna qui per entrare.');return;}authenticated=Boolean(cloudUser());if(authenticated)await enterOffice();else authError('Completa l’accesso per aprire il tuo ufficio.');}
 catch(error){authError(error.message==='Invalid login credentials'?'Email o password non corrette. Riprova.':error.message||'Connessione non disponibile. Riprova.');}
 finally{$('#enter').disabled=false;$('#register').disabled=false;$('#enter span').textContent='Entra nel tuo ufficio';}
}
$('#login').onsubmit=e=>{e.preventDefault();login();};$('#register').onclick=()=>login(true);
$('#return-enter').onclick=()=>enterOffice();
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function enterOffice(){
 if(!authenticated||entering||entered)return;
 const run=++transition;entering=true;$('#threshold').inert=true;$('#skip').hidden=reduced;$('#threshold').style.opacity='0';$('#threshold-note').style.opacity='0';
 try{
  tone(230);if(!reduced)await scene?.aim(.72,.52,1.8,700);
  if(run!==transition)return;
  $('#cut').classList.add('active');if(!reduced)await delay(150);
  if(run!==transition)return;
  $('#threshold').hidden=true;$('#threshold-note').hidden=true;$('.threshold-footer').hidden=true;document.body.dataset.stage='office';
  const entry=scene?.enter();$('#scene').style.backgroundImage="url('assets/studio.jpg')";$('#cut').classList.remove('active');await entry;
  if(run!==transition)return;
  finishEntry();
 }catch{if(run===transition){document.body.classList.add('webgl-fallback');finishEntry();}}
}
function finishEntry(){entered=true;entering=false;document.body.dataset.stage='office';$('#threshold').hidden=true;$('#threshold-note').hidden=true;$('.threshold-footer').hidden=true;$('#office-ui').hidden=false;$('#office-ui').inert=false;$('#skip').hidden=true;$('#cut').classList.remove('active');$('#overview').focus({preventScroll:true});}
$('#skip').onclick=async()=>{if(!authenticated)return;++transition;scene?.reduced(true);try{await scene?.enter();}catch{}$('#scene').style.backgroundImage="url('assets/studio.jpg')";applyMotion();finishEntry();};
function sendNavigation(){if(frameReady&&authenticated&&selected){$('#app-frame').contentWindow?.postMessage({type:'rientro:office:navigate',target:selected.id},location.origin);}}
async function openStation(station){
 if(!authenticated||!entered)return;
 const run=++transition;selected=station;$('#office-ui').inert=true;tone(300);
 for(const button of $('#station-nav').children)button.setAttribute('aria-current',String(button.dataset.station===station.id));
 await scene?.aim(station.x,station.y,innerWidth<600?1.3:1.6,reduced?0:780);
 if(run!==transition)return;
 $('#workspace-kicker').textContent=station.kicker;$('#workspace-title').textContent=station.title;
 $('#full-app').href='../';
 if(!$('#workspace').open)$('#workspace').showModal();
 $('#close-workspace').focus();
 if(!$('#app-frame').getAttribute('src')){$('#app-frame').src='../index.html?office=1';$('#frame-status').hidden=false;$('#app-frame').hidden=true;frameTimeout=setTimeout(()=>{if(!frameReady)$('#frame-status').textContent='Il caricamento richiede più tempo. Puoi aprire l’app classica dal collegamento qui sopra.';},15000);}else sendNavigation();
}
function closeWorkspace(){++transition;if($('#workspace').open)$('#workspace').close();$('#office-ui').inert=false;const target=selected;scene?.aim(.5,.5,1,reduced?0:650);hotspots[stations.indexOf(target)]?.focus({preventScroll:true});}
$('#close-workspace').onclick=closeWorkspace;$('#workspace').addEventListener('cancel',event=>{event.preventDefault();closeWorkspace();});
$('#workspace').addEventListener('click',event=>{if(event.target===$('#workspace')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeWorkspace();}});
$('#overview').onclick=()=>{scene?.aim(.5,.5,1,reduced?0:750);status('Scegli un oggetto o usa la navigazione qui sotto.');};
function lockOffice(){++transition;authenticated=false;entered=false;entering=false;if($('#workspace').open)$('#workspace').close();$('#app-frame').removeAttribute('src');$('#app-frame').hidden=true;frameReady=false;clearTimeout(frameTimeout);$('#office-ui').hidden=true;$('#threshold').hidden=false;$('#threshold').inert=false;$('#threshold').style.opacity='1';$('#threshold-note').hidden=false;$('#threshold-note').style.opacity='1';$('.threshold-footer').hidden=false;$('#returning').hidden=true;$('#login').hidden=false;$('#skip').hidden=true;$('#cut').classList.remove('active');document.body.dataset.stage='threshold';scene?.threshold();$('#scene').style.backgroundImage="url('assets/threshold.jpg')";$('#email').focus({preventScroll:true});}
$('#signout').onclick=async()=>{try{await signOutCloud();lockOffice();status('La porta è chiusa. A presto.');}catch{status('Non è stato possibile uscire. Riprova.');}};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('#app-frame').contentWindow)return;
 if(event.data?.type==='rientro:office:close'&&authenticated){closeWorkspace();return;}
 if(event.data?.type==='rientro:office:locked'){lockOffice();return;}
 if(event.data?.type==='rientro:office:ready'&&authenticated){frameReady=true;clearTimeout(frameTimeout);$('#frame-status').hidden=true;$('#app-frame').hidden=false;sendNavigation();}
});
window.addEventListener('rientro-cloud-status',event=>{if(event.detail?.status==='local'&&(entered||entering)&&!cloudUser())lockOffice();});
const sceneReady=createScene($('#scene'),project=>{hotspots.forEach((button,i)=>{const p=project(stations[i].x,stations[i].y);button.style.left=p.x+'px';button.style.top=p.y+'px';button.hidden=!p.visible;});}).then(value=>{scene=value;applyMotion();}).catch(()=>{document.body.classList.add('webgl-fallback');hotspots.forEach(button=>{button.hidden=false;});});
applyMotion();
try{const auth=await initializeCloud();await sceneReady;authenticated=Boolean(auth.user);$('#enter').disabled=false;$('#enter span').textContent='Entra nel tuo ufficio';if(authenticated){$('#login').hidden=true;$('#returning').hidden=false;}else if(auth.available===false){authError('Connessione all’account non disponibile. Puoi riprovare ricaricando la pagina.');}}
catch{authError('Connessione non disponibile. Ricarica la pagina per riprovare.');$('#enter').disabled=false;$('#enter span').textContent='Entra nel tuo ufficio';}
window.addEventListener('pagehide',()=>{scene?.dispose();audioContext?.close();},{once:true});
