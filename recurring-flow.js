export function commitRecurring({ state, values, now = Date.now, persist = () => {}, close = () => {}, recalculate = () => {}, confirm = () => {} }) {
  const get = key => typeof values.get === 'function' ? values.get(key) : values[key];
  const id = String(get('id') || '');
  const type = get('type') === 'income' ? 'income' : 'expense';
  const name = String(get('name') || '').trim();
  const amount = Number(get('amount'));
  const frequency = ['weekly','monthly','quarterly','yearly'].includes(get('frequency')) ? get('frequency') : 'monthly';
  if (!name || !Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Controlla nome e importo.' };
  const collection = type === 'income' ? state.incomes : state.expenses;
  const existing=collection.find(entry => String(entry.id) === id);
  const stamp=now(),created=new Date(typeof stamp==='number'?stamp:Date.now());
  const due=Number(get('due')) || null;
  let startsOn=existing?.startsOn||null;
  if(!id&&due){const first=new Date(created.getFullYear(),created.getMonth(),Math.min(28,due),12);if(due<created.getDate())first.setMonth(first.getMonth()+1);startsOn=first.toISOString().slice(0,10)}
  const item = { id: id ? Number(id) : stamp, name, amount, frequency, due, ...(startsOn?{startsOn}:{}) };
  if (type === 'expense') { item.essential = get('essential') === 'on' || get('essential') === true; item.kind = 'fixed'; }
  const index = collection.findIndex(entry => String(entry.id) === id);
  if (index >= 0) collection[index] = item; else collection.push(item);
  persist();
  close();
  recalculate();
  const label = type === 'income' ? 'Entrata' : 'Spesa';
  confirm(`${label} fissa ${index >= 0 ? 'aggiornata' : 'salvata'}. Budget e piano aggiornati.`);
  return { ok: true, item, type, updated: index >= 0 };
}
