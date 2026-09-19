import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('lo switch apre subito la home scelta e conserva la ripartizione tornando indietro',()=>{
 const state={budgetMethod:'adaptive',capitalConfigured:true};let rendered=0,started=0,saved=0;
 const context={state,view:'analysis',totalCapital:()=>1120,startBudget:(s)=>{started++;s.budgetSnapshot={capital:1120};},save:()=>saved++,render:()=>rendered++,scrollTo:()=>{},document:{querySelectorAll:()=>[]}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function switchBudgetMethod('),source.indexOf('function shell(')),context);
 context.switchBudgetMethod('503020');assert.equal(context.view,'dashboard');assert.equal(state.budgetMethod,'503020');assert.equal(rendered,1);
 context.switchBudgetMethod('adaptive');assert.equal(state.budgetMethod,'adaptive');context.switchBudgetMethod('503020');assert.equal(started,1);assert.equal(saved,3);assert.equal(rendered,3);
});
test('home 503020 usa un renderer dedicato prima di calcolare la home adattiva',()=>{
 const context={state:{budgetMethod:'503020'},budgetHomeContent:()=>'<section>Tre quote</section>',budget503020:()=>({}),capitalBalances:()=>({}),shell:x=>x};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function dashboard(){'),source.indexOf('\nfunction plan(){')),context);
 assert.equal(context.dashboard(),'<section>Tre quote</section>');
});
