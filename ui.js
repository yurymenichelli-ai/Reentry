import { closeDialog, reducedMotion } from './motion.js?v=45';
/* Presentation-only behavior. Financial state and persistence live in app.js. */
const focusable = 'button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]';
let activeDialog = null;
let returnFocus = null;
let dialogCounter = 0;
const app = document.querySelector('#app');
const visibleControls = root => [...root.querySelectorAll(focusable)].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
new MutationObserver(() => {
  const dialog = document.querySelector('.modal-backdrop:last-of-type .modal');
  if (dialog === activeDialog) return;
  if (dialog) {
    if (!activeDialog) returnFocus = document.activeElement;
    activeDialog = dialog;
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    const heading = dialog.querySelector('h2');
    if (heading) {
      if (!heading.id) heading.id = `dialog-heading-${++dialogCounter}`;
      dialog.setAttribute('aria-labelledby', heading.id);
    }
    const error = dialog.querySelector('.form-error');
    if (error) error.setAttribute('role','alert');
    app.inert = true;
    document.body.classList.add('dialog-open');
    dialog.tabIndex = -1;
    dialog.focus({preventScroll:true});
  } else {
    activeDialog = null;
    app.inert = false;
    document.body.classList.remove('dialog-open');
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    else document.querySelector('.mobile-masthead .brand, .sidebar .brand')?.focus({preventScroll:true});
    returnFocus = null;
  }
}).observe(document.body,{childList:true});
document.addEventListener('keydown',event => {
  if (!activeDialog) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (!document.body.classList.contains('login-locked') && !activeDialog.classList.contains('login-scene')) closeDialog(activeDialog.closest('.modal-backdrop'));
  }
  if (event.key === 'Tab') {
    const controls = visibleControls(activeDialog);
    const first = controls[0], last = controls.at(-1);
    if (!first) {event.preventDefault();return;}
    if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) {
      event.preventDefault();last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === activeDialog)) {
      event.preventDefault();first.focus();
    }
  }
});

// A press follows the finger; cancellation and quick repeated taps release cleanly.
let pressedControl;
const releasePress = () => {
  if (!pressedControl) return;
  pressedControl.classList.remove('is-pressed');
  pressedControl = null;
};
document.addEventListener('pointerdown', event => {
  releasePress();
  if (event.button !== 0 || reducedMotion()) return;
  const control = event.target.closest('button:not(:disabled),summary');
  if (!control) return;
  pressedControl = control;
  control.classList.add('is-pressed');
}, {passive:true});
['pointerup','pointercancel','dragstart'].forEach(type=>document.addEventListener(type,releasePress,{passive:true}));
window.addEventListener('blur',releasePress);

// Animate both directions of a disclosure, retaining its native keyboard semantics.
const disclosures = new WeakMap();
document.addEventListener('click', event => {
  const summary = event.target.closest('summary');
  if (!summary || reducedMotion() || event.defaultPrevented) return;
  const details = summary.parentElement;
  if (details.tagName !== 'DETAILS') return;
  event.preventDefault();
  const current = disclosures.get(details);
  const opening = current ? !current.opening : !details.open;
  const from = details.getBoundingClientRect().height;
  current?.animation.cancel();
  details.open = true;
  details.style.height = '';
  const to = opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
  details.style.overflow = 'clip';
  const animation = details.animate([{height:from+'px'},{height:to+'px'}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'});
  const record = {animation,opening};
  disclosures.set(details,record);
  animation.finished.then(()=>{
    if (disclosures.get(details)!==record) return;
    details.open = opening;
    details.style.overflow = '';
    disclosures.delete(details);
  }).catch(()=>{});
});
