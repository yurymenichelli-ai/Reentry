import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

test('un campo nascosto id non impedisce il salvataggio di un obiettivo', () => {
  const source = readFileSync(new URL('app.js', root), 'utf8');
  const start = source.indexOf("document.addEventListener('submit'");
  const end = source.indexOf("document.addEventListener('input'", start);
  let submit, saved = 0, rendered = 0, closed = 0;
  const state = { accumulationPlans: [] };
  const context = {
    document: { addEventListener(type, handler) { if (type === 'submit') submit = handler; } },
    FormData: class { constructor(form) { this.values = form.values; } get(name) { return this.values[name] ?? null; } },
    state, save() { saved++; }, render() { rendered++; }, toast() {},
  };
  vm.runInNewContext(source.slice(start, end), context);
  const form = {
    // HTMLFormElement named properties can shadow the form's DOM id.
    id: { value: '' },
    getAttribute(name) { return name === 'id' ? 'accumulation-form' : null; },
    values: { id: '', name: 'Viaggio', target: '1200', months: '12', priority: '1' },
    closest() { return { remove() { closed++; } }; },
  };
  submit({ target: form, preventDefault() {} });
  assert.equal(state.accumulationPlans.length, 1);
  assert.equal(state.accumulationPlans[0].name, 'Viaggio');
  assert.equal(state.accumulationPlans[0].target, 1200);
  assert.equal(state.accumulationPlans[0].months, 12);
  assert.equal(saved, 1);
  assert.equal(rendered, 1);
  assert.equal(closed, 1);
});

function loadTheme(stored, systemDark = false, storageBlocked = false) {
  const media = { matches: systemDark, addEventListener(_type, listener) { this.changed = listener; } };
  const html = { dataset: {}, style: {} };
  let storedValue = stored;
  const window = {};
  vm.runInNewContext(readFileSync(new URL('theme.js', root), 'utf8'), {
    window, matchMedia: () => media,
    localStorage: {
      getItem() { if (storageBlocked) throw new Error('blocked'); return storedValue; },
      setItem(_key, value) { if (storageBlocked) throw new Error('blocked'); storedValue = value; },
    },
    document: { documentElement: html, querySelector: () => null, querySelectorAll: () => [] },
  });
  return { html, media, theme: window.rientroTheme, stored: () => storedValue };
}

test('il tema esplicito prevale sul sistema ed è persistito', () => {
  const { html, media, theme, stored } = loadTheme('light', true);
  assert.equal(html.dataset.theme, 'light');
  theme.set('dark');
  assert.equal(html.dataset.theme, 'dark');
  assert.equal(stored(), 'dark');
  media.matches = false; media.changed();
  assert.equal(html.dataset.theme, 'dark');
});

test('Sistema segue il dispositivo e un valore non valido torna a Sistema', () => {
  const { html, media, theme } = loadTheme('invalid', true);
  assert.equal(theme.get(), 'system');
  assert.equal(html.dataset.theme, 'dark');
  media.matches = false; media.changed();
  assert.equal(html.dataset.theme, 'light');
  theme.set('invalid');
  assert.equal(theme.get(), 'system');
});

test('il tema funziona anche quando lo storage non è disponibile', () => {
  const { theme, html } = loadTheme(null, false, true);
  assert.doesNotThrow(() => theme.set('dark'));
  assert.equal(html.dataset.theme, 'dark');
});

test('la cache offline include risorse esistenti senza richieste duplicate', async () => {
  let install, pending, assets;
  vm.runInNewContext(readFileSync(new URL('sw.js', root), 'utf8'), {
    self: { addEventListener(name, handler) { if (name === 'install') install = handler; }, skipWaiting() {} },
    caches: { async open() { return { async addAll(paths) { assets = paths; } }; } },
  });
  install({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.equal(new Set(assets).size, assets.length);
  for (const asset of assets) assert.ok(existsSync(new URL(asset.split('?')[0], root)), `Missing offline asset: ${asset}`);
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(scripts).size, scripts.length);
  for (const script of scripts) assert.ok(assets.includes(`./${script}`), `Script not cached: ${script}`);
});

test('search and type filters combine without changing movement order or data', () => {
  const source=readFileSync(new URL('app.js',root),'utf8');
  const start=source.indexOf('function filterMovements(){');
  const end=source.indexOf("document.addEventListener('click',event=>",start);
  let type='expense',query='caff';
  const transactions=[{label:'Caffè',type:'expense',amount:2.5},{label:'Rimborso',type:'income',amount:48}];
  const before=JSON.stringify(transactions),rows=[{},{}],empty={hidden:true};
  const context=vm.createContext({state:{transactions},document:{
    querySelector(selector){if(selector==='[data-movement-search]')return {value:query};if(selector==='.search-empty')return empty;return {dataset:{movementFilter:type}};},
    querySelectorAll(){return rows;}
  }});
  vm.runInContext(source.slice(start,end),context);
  context.filterMovements();assert.equal(rows[0].hidden,false);assert.equal(rows[1].hidden,true);
  type='income';context.filterMovements();assert.equal(rows[0].hidden,true);assert.equal(empty.hidden,false);
  query='';context.filterMovements();assert.equal(rows[1].hidden,false);assert.equal(empty.hidden,true);
  assert.equal(JSON.stringify(transactions),before);
});

test('calendar filter shows one day and calculates its expense total', () => {
  const source=readFileSync(new URL('app.js',root),'utf8');
  const start=source.indexOf('function filterMovements(){');
  const end=source.indexOf("document.addEventListener('click',event=>",start);
  const transactions=[{label:'Caffè',type:'expense',amount:2.5,recordedAt:'2026-09-18'},{label:'Spesa',type:'expense',amount:24.8,recordedAt:'2026-09-18'},{label:'Rimborso',type:'income',amount:48,recordedAt:'2026-09-17'}];
  const rows=[{},{},{}],empty={hidden:true},summary={hidden:true},clear={hidden:true},label={},total={};
  const context=vm.createContext({state:{transactions},ledgerMoney:value=>`${Number(value).toFixed(2)} €`,document:{
    querySelector(selector){if(selector==='[data-movement-search]')return {value:''};if(selector==='[data-movement-date]')return {value:'2026-09-18'};if(selector==='[data-movement-day-summary]')return summary;if(selector==='[data-clear-movement-date]')return clear;if(selector==='[data-movement-day-label]')return label;if(selector==='[data-movement-day-total]')return total;if(selector==='.search-empty')return empty;return {dataset:{movementFilter:'all'}};},
    querySelectorAll(){return rows;}
  }});
  vm.runInContext(source.slice(start,end),context);context.filterMovements();
  assert.deepEqual(rows.map(row=>row.hidden),[false,false,true]);assert.equal(summary.hidden,false);assert.equal(clear.hidden,false);assert.match(label.textContent,/18 settembre/);assert.equal(total.textContent,'27.30 €');
});

test('la spesa veloce chiede subito se usare conto o contanti', () => {
  const source=readFileSync(new URL('app.js',root),'utf8');
  const start=source.indexOf('function quickExpenseModal()');
  const end=source.indexOf('function budgetMethodModal()',start);
  const modal=source.slice(start,end);
  assert.ok(modal.indexOf('class="channel-choice quick-channel"') < modal.indexOf('class="quick-options"'));
  assert.match(modal,/name="channel" value="account"/);
  assert.match(modal,/name="channel" value="cash"/);
});

test('eliminare un obiettivo rimuove anche preferenze precedenti e forza il ricalcolo', () => {
  const source=readFileSync(new URL('app.js',root),'utf8');
  const handler=source.slice(source.indexOf("if(e.target.closest('[data-clear-goal]'))"),source.indexOf("if(e.target.closest('[data-clear-accumulation]'))"));
  assert.match(handler,/goalEnabled=false/);
  assert.match(handler,/goalMonths=null/);
  assert.match(handler,/targetDate:null/);
  assert.match(handler,/dailySpendingTarget=null/);
  assert.match(handler,/save\(\).*render\(\)/s);
});

test('la home mostra separatamente conto e contanti senza aprire la previsione', () => {
  const source=readFileSync(new URL('app.js',root),'utf8');
  assert.match(source,/class="balance-split"/);
  assert.match(source,/money\(balances\.account\)/);
  assert.match(source,/money\(balances\.cash\)/);
});
