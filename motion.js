/* Motion never interpolates financial values: the displayed amount is always real. */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new WeakMap();
export function settleFigure(element) {
  running.get(element)?.cancel();
  if (reducedMotion() || !element.isConnected) return;
  const animation = element.animate([
    { opacity: .68, transform: 'translateY(3px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {duration: 240, easing: 'cubic-bezier(.22,1,.36,1)'});
  running.set(element, animation);
}
let observer;
let previousView;
export function revealPage(root) {
  observer?.disconnect();
  const page = root.querySelector('.shell');
  if (!page) return;
  const changed = previousView !== page.className;
  previousView = page.className;
  if (reducedMotion() || !changed) return;
  const sections = [...root.querySelectorAll('main > .reveal, main > .plan-summary, main > .goal-section, main > .advance-control, .scenario, .analysis-grid > .reveal, .list-row.transaction, .saving-section')];
  const enter = (element, delay = 0) => {
    element.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:480,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    element.querySelectorAll('.ring-value').forEach(ring => {
      ring.animate([{strokeDashoffset:100},{strokeDashoffset:0}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
    });
    element.querySelectorAll('.chart-track i,.progress-track i,.route-progress i').forEach(bar => {
      bar.animate([{transform:'scaleX(0)',transformOrigin:'left'},{transform:'scaleX(1)',transformOrigin:'left'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
    });
  };
  // No content is hidden while waiting for the observer, including without JS.
  observer = new IntersectionObserver(entries => {
    entries.filter(entry=>entry.isIntersecting).forEach((entry,index)=>{
      if (!reducedMotion()) enter(entry.target,Math.min(index*45,135));
      observer.unobserve(entry.target);
    });
  },{threshold:.08});
  sections.forEach(element=>observer.observe(element));
}
export function closeDialog(backdrop) {
  if (!backdrop || backdrop.dataset.closing) return;
  if (reducedMotion()) {backdrop.remove();return;}
  backdrop.dataset.closing = 'true';
  const modal = backdrop.querySelector('.modal');
  const mobile = matchMedia('(max-width:800px)').matches;
  const fade = backdrop.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease-in',fill:'forwards'});
  modal?.animate([{transform:'translateY(0)'},{transform:`translateY(${mobile?'64px':'10px'})`}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  fade.finished.then(()=>backdrop.remove()).catch(()=>backdrop.remove());
}
