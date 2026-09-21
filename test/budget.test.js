import test from 'node:test';
import assert from 'node:assert/strict';
import {startBudget,capitalBudget} from '../budget.js';
const now=new Date(2026,8,19,12);
test('ripartisce il capitale e scala solo la quota scelta senza duplicare lo storico',()=>{
 const state={transactions:[{id:1,type:'expense',amount:203,category:'Casa'}]};startBudget(state,917,now);
 state.transactions.push({id:2,type:'expense',amount:60,category:'Alimentari'},{id:3,type:'expense',amount:25,category:'Cena fuori'});
 const result=capitalBudget(state,now);
 assert.equal(result.needsTarget,560);assert.equal(result.needsRemaining,297);assert.equal(result.wantsRemaining,311);assert.equal(result.futureRemaining,224);
});
test('rispetta categorie personalizzate, sforamenti, versamenti e date future',()=>{
 const state={transactions:[],budgetCategories:{Sigarette:'needs',Debiti:'future'}};startBudget(state,100,now);
 state.transactions.push({id:1,type:'expense',amount:60,category:'Sigarette'},{id:2,type:'expense',amount:10,planKind:'debt'},{id:3,type:'expense',amount:99,recordedAt:'2026-09-20'},{id:4,type:'income',amount:100});
 const result=capitalBudget(state,now);assert.equal(result.needsRemaining,-10);assert.equal(result.wantsRemaining,30);assert.equal(result.futureRemaining,10);assert.equal(result.unallocatedIncome,100);
 state.budgetCategories.Sigarette='wants';assert.equal(capitalBudget(state,now).wantsRemaining,-30);
 state.transactions=state.transactions.filter(t=>t.id!==1);assert.equal(capitalBudget(state,now).wantsRemaining,30);
});
test('nuova ripartizione include lo storico e mantiene fuori i movimenti futuri',()=>{
 const state={transactions:[{id:1,type:'expense',amount:20},{id:2,type:'expense',amount:10,recordedAt:'2026-09-20'}]};startBudget(state,80,now,{restart:true});
 assert.equal(capitalBudget(state,now).wantsRemaining,24);assert.equal(capitalBudget(state,new Date(2026,8,20,12)).wantsRemaining,14);
});

test('debiti nel 50% per default e assegnazioni libere anche per i versamenti',()=>{
 const state={transactions:[]};startBudget(state,1000,now);
 state.transactions.push({id:1,type:'expense',planKind:'debt',amount:100},{id:2,type:'expense',planKind:'saving',amount:40});
 let g=capitalBudget(state,now);assert.equal(g.needsRemaining,400);assert.equal(g.futureRemaining,160);
 state.budgetCategories={Debiti:'wants',Obiettivi:'needs'};
 g=capitalBudget(state,now);assert.equal(g.needsRemaining,460);assert.equal(g.wantsRemaining,200);assert.equal(g.futureRemaining,200);
});

test('una spesa in adattivo compare al primo switch senza doppia sottrazione',()=>{
 const state={transactions:[{id:1,type:'expense',amount:15,category:'Casa',recordedAt:'2026-09-19'}]};startBudget(state,1085,now);
 const g=capitalBudget(state,now);assert.equal(g.capital,1100);assert.equal(g.needsSpent,15);assert.equal(g.needsRemaining+g.wantsRemaining+g.futureRemaining,1085);
});
test('ripristina le spese escluse dalle vecchie ripartizioni una sola volta',()=>{
 const state={budgetSnapshot:{capital:1085,includedIds:['1']},transactions:[{id:1,type:'expense',amount:15,category:'Casa'}]};
 assert.equal(capitalBudget(state,now).needsSpent,15);assert.equal(capitalBudget(state,now).capital,1100);
 state.transactions[0].amount=20;assert.equal(capitalBudget(state,now).capital,1100);assert.equal(capitalBudget(state,now).needsSpent,20);
 state.transactions=[];assert.equal(capitalBudget(state,now).needsSpent,0);
});
