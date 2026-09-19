import test from 'node:test';
import assert from 'node:assert/strict';
import {startBudget,capitalBudget} from '../budget.js';
const now=new Date(2026,8,19,12);
test('ripartisce il capitale e scala solo la quota scelta senza duplicare lo storico',()=>{
 const state={transactions:[{id:1,type:'expense',amount:203,category:'Casa'}]};startBudget(state,1120,now);
 state.transactions.push({id:2,type:'expense',amount:60,category:'Alimentari'},{id:3,type:'expense',amount:25,category:'Cena fuori'});
 const result=capitalBudget(state,now);
 assert.equal(result.needsTarget,560);assert.equal(result.needsRemaining,500);assert.equal(result.wantsRemaining,311);assert.equal(result.futureRemaining,224);
});
test('rispetta categorie personalizzate, sforamenti, versamenti e date future',()=>{
 const state={transactions:[],budgetCategories:{Sigarette:'needs'}};startBudget(state,100,now);
 state.transactions.push({id:1,type:'expense',amount:60,category:'Sigarette'},{id:2,type:'expense',amount:10,planKind:'debt'},{id:3,type:'expense',amount:99,recordedAt:'2026-09-20'},{id:4,type:'income',amount:100});
 const result=capitalBudget(state,now);assert.equal(result.needsRemaining,-10);assert.equal(result.wantsRemaining,30);assert.equal(result.futureRemaining,10);assert.equal(result.unallocatedIncome,100);
 state.budgetCategories.Sigarette='wants';assert.equal(capitalBudget(state,now).wantsRemaining,-30);
 state.transactions=state.transactions.filter(t=>t.id!==1);assert.equal(capitalBudget(state,now).wantsRemaining,30);
});
test('nuova ripartizione include lo storico e mantiene fuori i movimenti futuri',()=>{
 const state={transactions:[{id:1,type:'expense',amount:20},{id:2,type:'expense',amount:10,recordedAt:'2026-09-20'}]};startBudget(state,80,now);
 assert.equal(capitalBudget(state,now).wantsRemaining,24);assert.equal(capitalBudget(state,new Date(2026,8,20,12)).wantsRemaining,14);
});
