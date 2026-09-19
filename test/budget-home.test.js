import test from 'node:test';
import assert from 'node:assert/strict';
import {budgetHomeContent} from '../budget-home.js';
import {capitalBudget,startBudget} from '../budget.js';
test('home quote mostra spesa, residuo e sforamento senza indicatori adattivi',()=>{
 const state={capitalConfigured:true,transactions:[]};startBudget(state,1120);
 state.transactions.push({id:1,type:'expense',category:'Alimentari',amount:600});
 const html=budgetHomeContent(state,capitalBudget(state),{account:220,cash:300});
 assert.match(html,/Quota superata di 40 €/);assert.match(html,/Budget <b>560 €/);assert.match(html,/336 €/);assert.match(html,/224 €/);
 assert.equal((html.match(/role="progressbar"/g)||[]).length,3);
 assert.doesNotMatch(html,/Libero dopo le spese|Ritmo fino al prossimo accredito|del mese/);
 assert.match(html,/data-add/);assert.match(html,/data-budget-method/);
});
test('home senza capitale chiede il saldo prima di mostrare quote',()=>{
 const html=budgetHomeContent({capitalConfigured:false},{},{account:0,cash:0});
 assert.match(html,/Inserisci il capitale/);assert.doesNotMatch(html,/quota-track/);
});
