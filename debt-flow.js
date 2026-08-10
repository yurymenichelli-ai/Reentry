export function commitDebt({ state, values, now = Date.now, persist, close, recalculate, confirm }) {
  const get = key => typeof values.get === 'function' ? values.get(key) : values[key];
  const id = String(get('id') || '');
  const name = String(get('name') || '').trim();
  const balance = Number(get('balance'));
  if (!name || !Number.isFinite(balance) || balance <= 0) return { ok: false, error: 'Controlla nome e importo residuo.' };
  const existing = state.debts.find(item => String(item.id) === id);
  const debt = {
    id: id ? Number(id) : now(), name, balance,
    minimumPayment: Number(get('minimumPayment')) || 0,
    months: Number(get('months')) || null,
    targetDate: String(get('targetDate') || '') || null,
    ...(existing?.originalBalance ? { originalBalance: Math.max(Number(existing.originalBalance), balance) } : {})
  };
  const index = state.debts.findIndex(item => String(item.id) === id);
  if (index >= 0) state.debts[index] = debt;
  else state.debts.push(debt);
  persist();
  close();
  recalculate();
  confirm(index >= 0 ? 'Debito aggiornato. Piano ricalcolato.' : 'Debito aggiunto. Piano aggiornato.');
  return { ok: true, debt, updated: index >= 0 };
}
