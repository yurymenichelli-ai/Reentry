import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('il nome si salva dalla pagina impostazioni senza richiedere un modal',()=>{
 let submit,saved=0,rendered=0;
 const context={state:{name:'Prima'},document:{addEventListener:(_,fn)=>submit=fn},FormData:class{get(){return 'Dopo'}},save:()=>saved++,render:()=>rendered++,toast:()=>{}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf("document.addEventListener('submit'"),source.indexOf('function refreshSpendingChoice')),context);
 submit({preventDefault(){},target:{getAttribute:()=> 'settings-form',closest:()=>null}});
 assert.equal(context.state.name,'Dopo');assert.equal(saved,1);assert.equal(rendered,1);
});
test('impostazioni e guida sono destinazioni renderizzabili',()=>{
 const context={state:{name:'Yury',budgetMethod:'503020'},cloudUser:()=>null,budgetEscape:s=>s,themeChoices:()=>'',brandSignature:()=> 'Rientro',shell:s=>s};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function settingsPage()'),source.indexOf('function resetAllModal()')),context);
 const page=context.settingsPage();assert.match(page,/data-app-guide/);assert.match(page,/data-budget-method/);assert.match(page,/data-reset-all/);
 assert.match(context.appGuide(),/non una doppia sottrazione/);assert.match(context.appGuide(),/data-settings/);
});
