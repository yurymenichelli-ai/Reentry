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

function rawAccumulationPlans(data) {
  if (Array.isArray(data.accumulationPlans)) return data.accumulationPlans;
  if (!data.accumulationEnabled) return [];
  return [{ id:'legacy', name:data.accumulationName, target:data.accumulationTarget, months:data.accumulationMonths, current:data.accumulationCurrent, priority:1 }];
}

export function accumulationPlans(data) {
  const plan = calculatePlan(data);
  const debtPlan = selectedDebtPlan(data);
  const comfortMargin = Math.min(plan.freeCash, Math.max(50, plan.freeCash * .1));
  const debtRate = plan.remainingDebt ? (debtPlan?.feasible ? debtPlan.rate : plan.minimumPayments) : 0;
  const safeCapacity = Math.max(0, Math.floor((plan.freeCash - debtRate - comfortMargin) / 10) * 10);
  let capacityLeft = safeCapacity;
  return rawAccumulationPlans(data).slice().sort((a,b)=>(Number(a.priority)||99)-(Number(b.priority)||99)).map((item,index)=>{
    const totalTarget=Math.max(0,Number(item.target)||0), accumulated=Math.min(totalTarget,Math.max(0,Number(item.current)||0));
    const target=Math.max(0,totalTarget-accumulated), months=Math.max(1,Number(item.months)||12), requestedRate=target?Math.ceil(target/months):0;
    const monthlyRate=Math.min(requestedRate,capacityLeft);capacityLeft=Math.max(0,capacityLeft-monthlyRate);
    return { id:item.id??index+1,name:item.name||'Il mio obiettivo',priority:Number(item.priority)||index+1,target,totalTarget,accumulated,progress:totalTarget?Math.round(accumulated/totalTarget*100):0,months,requestedRate,monthlyRate,safeCapacity,comfortMargin,debtRate,feasible:requestedRate<=monthlyRate,estimatedMonths:monthlyRate?Math.ceil(target/monthlyRate):null };
  });
}

export function accumulationPlan(data) { return accumulationPlans(data)[0] || null; }

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
    const plans=rawAccumulationPlans(data), saving=plans.find(item=>String(item.id)===String(values.targetId))||plans[0];
    if (!saving) return { ok:false, error:'Crea prima un piano di accumulo.' };
    const remaining = Math.max(0, Number(saving.target) - (Number(saving.current) || 0));
    amount = Math.min(requested, remaining);
    if (!amount) return { ok:false, error:'Obiettivo di accumulo già raggiunto.' };
    if(Array.isArray(data.accumulationPlans)) saving.current=(Number(saving.current)||0)+amount; else data.accumulationCurrent=(Number(data.accumulationCurrent)||0)+amount;
    label = `Accumulo · ${saving.name || 'Obiettivo'}`;
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

export function capitalBalances(data, reference = new Date()) {
  const cutoff=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),23,59,59);
  return (data.transactions || []).filter(transaction=>!transaction.recordedAt||new Date(`${transaction.recordedAt}T12:00:00`)<=cutoff).reduce((balances, transaction) => {
    const channel = transaction.channel === 'cash' ? 'cash' : 'account';
    const sign = transaction.type === 'income' ? 1 : -1;
    balances[channel] += sign * (Number(transaction.amount) || 0);
    return balances;
  }, { cash: Number(data.capital?.cash) || 0, account: Number(data.capital?.account) || 0 });
}

export function totalCapital(data, reference = new Date()) {
  const balances = capitalBalances(data,reference);
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
      const alreadyPaid=item.id!=null&&(data.transactions||[]).some(transaction=>transaction.type==='expense'&&transaction.recurringId!=null&&String(transaction.recurringId)===String(item.id)&&transaction.recordedAt&&new Date(`${transaction.recordedAt}T12:00:00`).getMonth()===occurrence.getMonth()&&new Date(`${transaction.recordedAt}T12:00:00`).getFullYear()===occurrence.getFullYear());
      if(alreadyPaid)return sum;
    }
    return sum+untilPayday(item);
  },0);
  const recurringUpcomingIncome = incomes.filter(item=>item!==mainIncome).reduce((sum,item)=>{
    if(item.due){const occurrence=dateAtDay(reference,item.due),alreadyReceived=item.id!=null&&(data.transactions||[]).some(transaction=>transaction.type==='income'&&transaction.recurringId!=null&&String(transaction.recurringId)===String(item.id)&&transaction.recordedAt&&new Date(`${transaction.recordedAt}T12:00:00`).getMonth()===occurrence.getMonth()&&new Date(`${transaction.recordedAt}T12:00:00`).getFullYear()===occurrence.getFullYear());if(alreadyReceived)return sum}
    return sum+untilPayday(item);
  },0);
  const futureTransactions=(data.transactions||[]).filter(item=>item.recordedAt&&!item.recurringId&&!item.planKind&&new Date(`${item.recordedAt}T12:00:00`)>reference&&new Date(`${item.recordedAt}T12:00:00`)<=payday);
  const futureExpenses=futureTransactions.filter(item=>item.type==='expense').reduce((sum,item)=>sum+(Number(item.amount)||0),0);
  const futureIncome=futureTransactions.filter(item=>item.type==='income').reduce((sum,item)=>sum+(Number(item.amount)||0),0);
  const upcomingIncome=recurringUpcomingIncome+futureIncome;
  const allUpcomingExpenses=upcomingExpenses+futureExpenses;
  const plan = calculatePlan(data);
  const debtChoice = selectedDebtPlan(data);
  const paidThisMonth = kind => (data.transactions||[]).filter(transaction=>transaction.planKind===kind&&transaction.recordedAt&&new Date(`${transaction.recordedAt}T12:00:00`).getMonth()===reference.getMonth()&&new Date(`${transaction.recordedAt}T12:00:00`).getFullYear()===reference.getFullYear()).reduce((sum,transaction)=>sum+(Number(transaction.amount)||0),0);
  const debtSetAside = Math.max(0,(plan.remainingDebt ? (debtChoice?.feasible ? debtChoice.rate : plan.minimumPayments) : 0) + plan.capitalForDebt-paidThisMonth('debt'));
  const savingSetAside = Math.max(0,accumulationPlans(data).reduce((sum,item)=>sum+item.monthlyRate,0)-paidThisMonth('saving'));
  const liquidNow = Math.max(0,totalCapital(data,reference));
  const beforeComfort = Math.max(0,liquidNow+upcomingIncome-allUpcomingExpenses-debtSetAside-savingSetAside);
  const comfortMargin = Math.min(beforeComfort,Math.max(50,beforeComfort*.1));
  const spendable = Math.max(0,beforeComfort-comfortMargin);
  const daily = Math.floor(spendable/daysRemaining);
  const weekly = Math.floor(daily*Math.min(7,daysRemaining));
  return { available:true, mainIncome, payday, estimatedPayday:!mainIncome.due, daysRemaining, liquidNow, upcomingIncome, upcomingExpenses:allUpcomingExpenses, futureIncome, futureExpenses, debtSetAside, savingSetAside, comfortMargin, spendable, daily, weekly };
}

export function accountForecast(data, reference = new Date()) {
  const pace=spendingPace(data,reference);if(!pace.available)return null;
  const balances=capitalBalances(data);
  const commitments=pace.upcomingExpenses+pace.debtSetAside+pace.savingSetAside;
  const accountBeforeDaily=Math.max(0,balances.account+pace.upcomingIncome-commitments);
  return { ...pace, accountNow:balances.account, cashNow:balances.cash, commitments, accountBeforeDaily, totalBeforeDaily:Math.max(0,pace.liquidNow+pace.upcomingIncome-commitments), endComfort:pace.comfortMargin };
}

export function spendingPaceInsight(data, reference = new Date()) {
  const current=spendingPace(data,reference);if(!current.available)return null;
  const monthTransactions=(data.transactions||[]).filter(item=>!item.planKind&&item.recordedAt&&new Date(`${item.recordedAt}T12:00:00`).getMonth()===reference.getMonth()&&new Date(`${item.recordedAt}T12:00:00`).getFullYear()===reference.getFullYear());
  if(!monthTransactions.length)return { delta:0, text:'Il ritmo è allineato ai dati programmati. Si aggiornerà dopo ogni nuovo movimento.' };
  const baseline=spendingPace({...data,transactions:(data.transactions||[]).filter(item=>!monthTransactions.includes(item))},reference);
  const delta=current.daily-baseline.daily;
  const expenses=monthTransactions.filter(item=>item.type==='expense').reduce((sum,item)=>sum+(Number(item.amount)||0),0), incomes=monthTransactions.filter(item=>item.type==='income').reduce((sum,item)=>sum+(Number(item.amount)||0),0);
  const text=delta<0?`Dopo ${money(expenses)} di uscite registrate, il ritmo è sceso di ${money(Math.abs(delta))} al giorno.`:delta>0?`Le entrate registrate (${money(incomes)}) hanno aumentato il ritmo di ${money(delta)} al giorno.`:`I movimenti registrati si compensano: il ritmo giornaliero resta invariato.`;
  return { delta, expenses, incomes, text };
}

export function monthlyTimeline(data, reference = new Date()) {
  const month=reference.getMonth(),year=reference.getFullYear(),events=[];
  const currentTransactions=(data.transactions||[]).filter(x=>x.recordedAt&&new Date(`${x.recordedAt}T12:00:00`).getMonth()===month&&new Date(`${x.recordedAt}T12:00:00`).getFullYear()===year);
  const addRecurring=(items,type)=>(items||[]).filter(x=>x.due).forEach(x=>{const done=x.id!=null&&currentTransactions.some(t=>t.type===type&&t.recurringId!=null&&String(t.recurringId)===String(x.id));if(!done){const day=Math.min(28,Number(x.due));events.push({day,label:x.name,amount:Number(x.amount)||0,type,status:day<reference.getDate()?'overdue':'planned',source:'recurring',targetId:x.id})}});
  addRecurring(data.incomes,'income');addRecurring(data.expenses,'expense');
  const paid=kind=>currentTransactions.filter(x=>x.planKind===kind).reduce((sum,x)=>sum+(Number(x.amount)||0),0);
  const debt=selectedDebtPlan(data),debtRemaining=Math.max(0,(debt?.rate||0)-paid('debt'));if((data.debts||[]).length&&debtRemaining)events.push({day:1,label:`Piano di rientro · ${debt.name}`,amount:debtRemaining,type:'debt',status:1<reference.getDate()?'overdue':'planned',source:'plan',targetId:data.debts[0]?.id});
  accumulationPlans(data).filter(x=>x.monthlyRate).forEach((x,index)=>{const contributed=currentTransactions.filter(t=>t.planKind==='saving'&&String(t.planTargetId)===String(x.id)).reduce((sum,t)=>sum+(Number(t.amount)||0),0),remaining=Math.max(0,x.monthlyRate-contributed);if(remaining)events.push({day:2+index,label:`Accumulo · ${x.name}`,amount:remaining,type:'saving',status:2+index<reference.getDate()?'overdue':'planned',source:'plan',targetId:x.id})});
  currentTransactions.forEach(x=>events.push({day:new Date(`${x.recordedAt}T12:00:00`).getDate(),label:x.label,amount:Number(x.amount)||0,type:x.planKind||x.type,status:'done'}));
  return events.sort((a,b)=>a.day-b.day||Number(a.status==='done')-Number(b.status==='done'));
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
