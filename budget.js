export const defaultCategories = {Casa:'needs',Alimentari:'needs',Trasporti:'needs',Benzina:'needs',Salute:'needs','Tempo libero':'wants','Cena fuori':'wants',Sigarette:'wants',Altro:'wants'};
export function startBudget(state, capital, reference = new Date()) {
  const day = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(),23,59,59);
  state.budgetSnapshot = { capital: Math.max(0, Number(capital)||0), date: reference.toISOString(), includedIds: (state.transactions||[]).filter(t=>!t.recordedAt||new Date(`${t.recordedAt}T12:00:00`)<=day).map(t=>String(t.id)) };
}
export function capitalBudget(state, reference = new Date()) {
  const snapshot = state.budgetSnapshot || {capital:0,includedIds:[]};
  const excluded = new Set(snapshot.includedIds);
  const cutoff = new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),23,59,59);
  const spent = {needs:0,wants:0,future:0};
  const categories = {...defaultCategories,...state.budgetCategories};
  let unallocatedIncome = 0;
  for(const t of state.transactions||[]) {
    if(excluded.has(String(t.id)) || (t.recordedAt && new Date(`${t.recordedAt}T12:00:00`)>cutoff)) continue;
    if(t.type==='income') {unallocatedIncome+=Number(t.amount)||0;continue;}
    const bucket=t.planKind?'future':categories[t.category]||'wants';
    spent[bucket]+=Number(t.amount)||0;
  }
  const capital=snapshot.capital;
  return {capital,needsTarget:capital*.5,wantsTarget:capital*.3,futureTarget:capital*.2,needsSpent:spent.needs,wantsSpent:spent.wants,futureCommitted:spent.future,needsRemaining:capital*.5-spent.needs,wantsRemaining:capital*.3-spent.wants,futureRemaining:capital*.2-spent.future,unallocatedIncome};
}
