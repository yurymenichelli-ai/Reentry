export function commitCapital({ state, values, persist = () => {} }) {
  const get = key => typeof values.get === 'function' ? values.get(key) : values[key];
  const mode = get('capitalMode') === 'split' ? 'split' : 'total';
  const account = mode === 'split' ? Number(get('account')) : Number(get('total'));
  const cash = mode === 'split' ? Number(get('cash')) : 0;
  if (![account, cash].every(Number.isFinite) || account < 0 || cash < 0) return { ok: false, error: 'Inserisci importi validi e non negativi.' };
  state.capital = { account, cash };
  state.capitalConfigured = true;
  state.capitalMode = mode;
  persist();
  return { ok: true, capital: state.capital, total: account + cash, mode };
}
