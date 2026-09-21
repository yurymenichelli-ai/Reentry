export const defaultCategories = {Debiti:'needs',Obiettivi:'future',Casa:'needs',Alimentari:'needs',Trasporti:'needs',Benzina:'needs',Salute:'needs','Tempo libero':'wants','Cena fuori':'wants',Sigarette:'wants',Altro:'wants'};
export function startBudget(state, capital, reference = new Date(), { restart = false } = {}) {
  const day = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(),23,59,59);
  const recorded = (state.transactions||[]).filter(t=>!t.recordedAt||new Date(`${t.recordedAt}T12:00:00`)<=day);
  const priorExpenses = restart ? 0 : recorded.filter(t=>t.type==='expense').reduce((sum,t)=>sum+(Number(t.amount)||0),0);
  state.budgetSnapshot = { version:2, capital: Math.max(0, Number(capital)||0)+priorExpenses, date: reference.toISOString(), includedIds: recorded.filter(t=>restart||t.type==='income').map(t=>String(t.id)) };
}
export function migrateBudget(state) {
  const snapshot=state.budgetSnapshot;
  if(!snapshot||snapshot.version===2)return false;
  const included=new Set(snapshot.includedIds||[]);
  const expenses=(state.transactions||[]).filter(t=>t.type==='expense'&&included.has(String(t.id)));
  snapshot.capital=(Number(snapshot.capital)||0)+expenses.reduce((sum,t)=>sum+(Number(t.amount)||0),0);
  const restored=new Set(expenses.map(t=>String(t.id)));
  snapshot.includedIds=[...included].filter(id=>!restored.has(id));
  snapshot.version=2;
  return true;
}
export function capitalBudget(state, reference = new Date()) {
  migrateBudget(state);
  const snapshot = state.budgetSnapshot || {capital:0,includedIds:[]};
  const excluded = new Set(snapshot.includedIds);
  const cutoff = new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),23,59,59);
  const spent = {needs:0,wants:0,future:0};
  const categories = {...defaultCategories,...state.budgetCategories};
  let unallocatedIncome = 0;
  for(const t of state.transactions||[]) {
    if(excluded.has(String(t.id)) || (t.recordedAt && new Date(`${t.recordedAt}T12:00:00`)>cutoff)) continue;
    if(t.type==='income') {unallocatedIncome+=Number(t.amount)||0;continue;}
    const category=t.planKind==='debt'?'Debiti':t.planKind==='saving'?'Obiettivi':t.category;
    const selected=categories[category];
    const bucket=['needs','wants','future'].includes(selected)?selected:'wants';
    spent[bucket]+=Number(t.amount)||0;
  }
  const capital=snapshot.capital;
  return {capital,needsTarget:capital*.5,wantsTarget:capital*.3,futureTarget:capital*.2,needsSpent:spent.needs,wantsSpent:spent.wants,futureCommitted:spent.future,needsRemaining:capital*.5-spent.needs,wantsRemaining:capital*.3-spent.wants,futureRemaining:capital*.2-spent.future,unallocatedIncome};
}
