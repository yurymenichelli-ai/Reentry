export const money = value => `${Math.round(Number(value) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
export function monthlyAmount(item) {
  const amount = Number(item.amount) || 0;
  return item.frequency === 'weekly' ? amount * 52 / 12 : item.frequency === 'quarterly' ? amount / 3 : item.frequency === 'yearly' ? amount / 12 : amount;
}

export function calculatePlan(data) {
  const essential = data.expenses.filter(x => x.essential).reduce((s, x) => s + monthlyAmount(x), 0);
  const income = data.incomes.reduce((s, x) => s + monthlyAmount(x), 0);
  const expenses = data.expenses.reduce((s, x) => s + monthlyAmount(x), 0);
  const debtTotal = data.debts.reduce((s, x) => s + Number(x.balance), 0);
  const reserveTarget = Math.round(essential * 2);
  const freeCash = Math.max(0, income - expenses);
  const sustainable = Math.max(0, Math.floor((freeCash * 0.7) / 10) * 10);
  const minimumPayments = data.debts.reduce((sum, debt) => sum + (Number(debt.minimumPayment) || 0), 0);
  const availableCapital = data.capitalConfigured === false ? 0 : Math.max(0, totalCapital(data));
  const protectedCapital = Math.min(availableCapital, reserveTarget);
  const maximumAdvance = Math.min(debtTotal, Math.max(0, availableCapital - reserveTarget));
  const capitalForDebt = data.useCapitalAdvance && data.capitalAdvanceConfirmed
    ? Math.min(maximumAdvance, Math.max(0, Number(data.capitalAdvanceAmount) || 0)) : 0;
  const remainingDebt = Math.max(0, debtTotal - capitalForDebt);
  const preferredRate = data.mode === 'common'
    ? Math.max(minimumPayments, Math.ceil(debtTotal / Math.max(1, Number(data.targetMonths))))
    : data.debts.reduce((sum, d) => sum + Math.max(Number(d.minimumPayment) || 0, Math.ceil(Number(d.balance) / Math.max(1, Number(d.months) || 18))), 0);
  const recommendedRate = remainingDebt ? Math.max(minimumPayments, sustainable) : 0;
  const feasible = !remainingDebt || (recommendedRate > 0 && minimumPayments <= freeCash && recommendedRate <= freeCash);
  const recommendedMonths = recommendedRate && feasible ? Math.ceil(remainingDebt / recommendedRate) : null;
  const suggestedMonths = recommendedMonths;
  return { essential, income, expenses, debtTotal, reserveTarget, freeCash, sustainable, minimumPayments, availableCapital, protectedCapital, maximumAdvance, capitalForDebt, remainingDebt, preferredRate, monthlyRate: preferredRate, recommendedRate, recommendedMonths, feasible, suggestedMonths };
}

export function paymentBreakdown(plan, rate, months) {
  const installmentsTotal = Math.max(0, Number(rate) || 0) * Math.max(0, Number(months) || 0);
  const totalPlanned = plan.capitalForDebt + installmentsTotal;
  return { rate, months, advance: plan.capitalForDebt, installmentsTotal, totalCovered: Math.min(plan.debtTotal, totalPlanned), residual: Math.max(0, plan.debtTotal - totalPlanned), rounding: Math.max(0, totalPlanned - plan.debtTotal) };
}

export function planScenarios(data) {
  const plan = calculatePlan(data);
  const minimumPayments = data.debts.reduce((sum, debt) => sum + (Number(debt.minimumPayment) || 0), 0);
  return [
    { id: 'prudent', name: 'Prudente', share: .45 },
    { id: 'balanced', name: 'Bilanciato', share: .7 },
    { id: 'fast', name: 'Veloce', share: .9 }
  ].map(({ share, ...scenario }) => {
    const rate = plan.remainingDebt ? Math.max(minimumPayments, Math.floor((plan.freeCash * share) / 10) * 10) : 0;
    const feasible = !plan.remainingDebt || (rate > 0 && rate <= plan.freeCash && minimumPayments <= plan.freeCash);
    const months = rate && feasible ? Math.ceil(plan.remainingDebt / rate) : null;
    const endDate = months ? new Date(2026, 7 + months, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) : null;
    return { ...scenario, rate, margin: feasible ? Math.max(0, plan.freeCash - rate) : null, months, endDate, feasible, recommended: scenario.id === 'balanced' && feasible, breakdown: paymentBreakdown(plan, rate, months) };
  });
}

export function selectedDebtPlan(data) {
  const scenarios = planScenarios(data);
  return scenarios.find(scenario => scenario.id === data.selectedPlanId) || scenarios.find(scenario => scenario.recommended) || scenarios[0];
}

export function accumulationPlan(data) {
  if (!data.accumulationEnabled) return null;
  const plan = calculatePlan(data);
  const debtPlan = selectedDebtPlan(data);
  const totalTarget = Math.max(0, Number(data.accumulationTarget) || 0);
  const accumulated = Math.min(totalTarget, Math.max(0, Number(data.accumulationCurrent) || 0));
  const target = Math.max(0, totalTarget - accumulated);
  const months = Math.max(1, Number(data.accumulationMonths) || 12);
  const comfortMargin = Math.min(plan.freeCash, Math.max(50, plan.freeCash * .1));
  const debtRate = plan.remainingDebt ? (debtPlan?.feasible ? debtPlan.rate : plan.minimumPayments) : 0;
  const safeCapacity = Math.max(0, Math.floor((plan.freeCash - debtRate - comfortMargin) / 10) * 10);
  const requestedRate = target ? Math.ceil(target / months) : 0;
  const monthlyRate = Math.min(requestedRate, safeCapacity);
  const feasible = requestedRate <= safeCapacity;
  const estimatedMonths = monthlyRate ? Math.ceil(target / monthlyRate) : null;
  const progress = totalTarget ? Math.round(accumulated / totalTarget * 100) : 0;
  return { name: data.accumulationName || 'Il mio obiettivo', target, totalTarget, accumulated, progress, months, requestedRate, monthlyRate, safeCapacity, comfortMargin, debtRate, feasible, estimatedMonths };
}

export function applyPlanContribution(data, values, now = () => Date.now()) {
  const kind = values.kind;
  const requested = Number(values.amount) || 0;
  if (requested <= 0 || !['debt','saving'].includes(kind)) return { ok:false, error:'Inserisci un importo valido.' };
  const channel = values.channel === 'cash' ? 'cash' : 'account';
  if (requested > Math.max(0,capitalBalances(data)[channel])) return { ok:false, error:`La somma supera il saldo disponibile in ${channel==='cash'?'contanti':'conto'}.` };
  let amount = requested, label = '';
  if (kind === 'debt') {
    const debt = (data.debts || []).find(item => String(item.id) === String(values.targetId));
    if (!debt) return { ok:false, error:'Debito non trovato.' };
    amount = Math.min(requested, Number(debt.balance) || 0);
    if (!amount) return { ok:false, error:'Questo debito risulta già estinto.' };
    debt.originalBalance = Math.max(Number(debt.originalBalance) || 0, Number(debt.balance) || 0);
    debt.balance = Math.max(0, Number(debt.balance) - amount);
    label = `Rata ${debt.name}`;
  } else {
    if (!data.accumulationEnabled) return { ok:false, error:'Crea prima un piano di accumulo.' };
    const remaining = Math.max(0, Number(data.accumulationTarget) - (Number(data.accumulationCurrent) || 0));
    amount = Math.min(requested, remaining);
    if (!amount) return { ok:false, error:'Obiettivo di accumulo già raggiunto.' };
    data.accumulationCurrent = (Number(data.accumulationCurrent) || 0) + amount;
    label = `Accumulo · ${data.accumulationName || 'Obiettivo'}`;
  }
  const stamp = now();
  const recordedAt = typeof stamp === 'string' ? stamp : new Date(stamp).toISOString().slice(0,10);
  const transaction = { id: typeof stamp === 'number' ? stamp : Date.now(), label, amount, type:'expense', channel, category:kind==='debt'?'Piano di rientro':'Accantonamento', planKind:kind, planTargetId:values.targetId||null, recordedAt, date:'Oggi' };
  data.transactions ||= [];
  data.transactions.unshift(transaction);
  return { ok:true, amount, transaction };
}

function monthsUntil(date, reference = new Date(2026, 7, 1)) {
  if (!date) return null;
  const target = new Date(`${date}T12:00:00`);
  return Math.max(1, (target.getFullYear() - reference.getFullYear()) * 12 + target.getMonth() - reference.getMonth());
}

export function evaluateGoal(data) {
  const plan = calculatePlan(data);
  let months = data.goalEnabled ? (Number(data.goalMonths) || monthsUntil(data.goalDate)) : null;
  let label = months ? 'tutti i debiti' : null;
  let necessaryRate = 0;
  if (months) necessaryRate = Math.max(plan.minimumPayments, Math.ceil(plan.remainingDebt / months));
  else {
    const ratio = plan.debtTotal ? plan.remainingDebt / plan.debtTotal : 0;
    const goals = data.debts.filter(debt => debt.months || debt.targetDate);
    if (goals.length) {
      label = goals.length === 1 ? goals[0].name : `${goals.length} debiti`;
      necessaryRate = data.debts.reduce((sum, debt) => {
        const debtMonths = Number(debt.months) || monthsUntil(debt.targetDate);
        const amount = Number(debt.balance) * ratio;
        return sum + Math.max(Number(debt.minimumPayment) || 0, debtMonths ? Math.ceil(amount / debtMonths) : 0);
      }, 0);
      months = Math.max(...goals.map(debt => Number(debt.months) || monthsUntil(debt.targetDate)));
    }
  }
  if (!months) return null;
  const feasible = necessaryRate <= plan.freeCash && plan.minimumPayments <= plan.freeCash;
  const recommendedMonths = plan.recommendedMonths;
  return { label, months, necessaryRate, feasible, margin: feasible ? plan.freeCash - necessaryRate : null, recommendedMonths, extensionMonths: !feasible && recommendedMonths ? Math.max(0, recommendedMonths - months) : 0, recommendedRate: plan.recommendedRate, breakdown: paymentBreakdown(plan, necessaryRate, months) };
}

export function capitalBalances(data) {
  return (data.transactions || []).reduce((balances, transaction) => {
    const channel = transaction.channel === 'cash' ? 'cash' : 'account';
    const sign = transaction.type === 'income' ? 1 : -1;
    balances[channel] += sign * (Number(transaction.amount) || 0);
    return balances;
  }, { cash: Number(data.capital?.cash) || 0, account: Number(data.capital?.account) || 0 });
}

export function totalCapital(data) {
  const balances = capitalBalances(data);
  return balances.cash + balances.account;
}

function dateAtDay(reference, day, forceNext = false) {
  const safeDay = Math.min(28, Math.max(1, Number(day) || 27));
  const date = new Date(reference.getFullYear(), reference.getMonth(), safeDay, 12);
  if (forceNext || date <= reference) date.setMonth(date.getMonth() + 1);
  return date;
}

export function spendingPace(data, reference = new Date()) {
  const incomes = data.incomes || [];
  if (!incomes.length || data.capitalConfigured === false) return { available: false, reason: !incomes.length ? 'income' : 'capital' };
  const mainIncome = incomes.slice().sort((a,b) => {
    const aMain = /stipend|pension|salario/i.test(a.name || '') ? 1 : 0;
    const bMain = /stipend|pension|salario/i.test(b.name || '') ? 1 : 0;
    return bMain-aMain || monthlyAmount(b)-monthlyAmount(a);
  })[0];
  const payday = dateAtDay(reference, mainIncome.due);
  const dayMs = 86400000;
  const daysRemaining = Math.max(1, Math.ceil((payday-reference)/dayMs));
  const untilPayday = item => {
    if (item.frequency === 'weekly') return (Number(item.amount)||0) * Math.ceil(daysRemaining/7);
    if (item.frequency === 'quarterly' || item.frequency === 'yearly' || !item.due) return monthlyAmount(item) * daysRemaining/30;
    const occurrence = dateAtDay(reference, item.due);
    return occurrence <= payday ? Number(item.amount)||0 : 0;
  };
  const upcomingExpenses = (data.expenses||[]).reduce((sum,item)=>{
    if(item.frequency!=='weekly' && item.due){
      const occurrence=dateAtDay(reference,item.due);
      const alreadyPaid=(data.transactions||[]).some(transaction=>transaction.type==='expense'&&String(transaction.recurringId)===String(item.id)&&transaction.recordedAt&&new Date(`${transaction.recordedAt}T12:00:00`).getMonth()===occurrence.getMonth()&&new Date(`${transaction.recordedAt}T12:00:00`).getFullYear()===occurrence.getFullYear());
      if(alreadyPaid)return sum;
    }
    return sum+untilPayday(item);
  },0);
  const upcomingIncome = incomes.filter(item=>item!==mainIncome).reduce((sum,item)=>sum+untilPayday(item),0);
  const plan = calculatePlan(data);
  const debtChoice = selectedDebtPlan(data);
  const paidThisMonth = kind => (data.transactions||[]).filter(transaction=>transaction.planKind===kind&&transaction.recordedAt&&new Date(`${transaction.recordedAt}T12:00:00`).getMonth()===reference.getMonth()&&new Date(`${transaction.recordedAt}T12:00:00`).getFullYear()===reference.getFullYear()).reduce((sum,transaction)=>sum+(Number(transaction.amount)||0),0);
  const debtSetAside = Math.max(0,(plan.remainingDebt ? (debtChoice?.feasible ? debtChoice.rate : plan.minimumPayments) : 0) + plan.capitalForDebt-paidThisMonth('debt'));
  const savingSetAside = Math.max(0,(accumulationPlan(data)?.monthlyRate || 0)-paidThisMonth('saving'));
  const liquidNow = Math.max(0,totalCapital(data));
  const beforeComfort = Math.max(0,liquidNow+upcomingIncome-upcomingExpenses-debtSetAside-savingSetAside);
  const comfortMargin = Math.min(beforeComfort,Math.max(50,beforeComfort*.1));
  const spendable = Math.max(0,beforeComfort-comfortMargin);
  const daily = Math.floor(spendable/daysRemaining);
  const weekly = Math.floor(daily*Math.min(7,daysRemaining));
  return { available:true, mainIncome, payday, estimatedPayday:!mainIncome.due, daysRemaining, liquidNow, upcomingIncome, upcomingExpenses, debtSetAside, savingSetAside, comfortMargin, spendable, daily, weekly };
}

export function spendingAnalysis(periods = []) {
  const current = periods[0] || { label: '', entries: [] };
  const previous = periods[1] || { label: '', entries: [] };
  const aggregate = entries => entries.reduce((result, entry) => {
    const category = entry.category || 'Altro';
    result[category] = (result[category] || 0) + Number(entry.amount || 0);
    return result;
  }, {});
  const currentByCategory = aggregate(current.entries || []);
  const previousByCategory = aggregate(previous.entries || []);
  const total = Object.values(currentByCategory).reduce((sum, value) => sum + value, 0);
  const previousTotal = Object.values(previousByCategory).reduce((sum, value) => sum + value, 0);
  const categories = Object.entries(currentByCategory).map(([name, amount]) => ({
    name, amount, percentage: total ? Math.round((amount / total) * 100) : 0,
    previousAmount: previousByCategory[name] || 0
  })).sort((a, b) => b.amount - a.amount);
  return {
    currentLabel: current.label, previousLabel: previous.label, total, previousTotal,
    changePercentage: previousTotal ? Math.round(((total - previousTotal) / previousTotal) * 100) : null,
    categories, highest: categories[0] || null, lowest: categories.at(-1) || null
  };
}
