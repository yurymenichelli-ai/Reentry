import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {defaultCategories} from '../budget.js';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('il feedback della spesa segue le assegnazioni personali e cambia insieme alla categoria',()=>{
 const hint={innerHTML:''};let handler;
 const context={state:{budgetCategories:{Debiti:'wants'}},defaultCategories,document:{addEventListener:(_,fn)=>handler=fn}};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function categoryImpact('),source.indexOf('function categoryFields(')),context);
 assert.equal(context.categoryImpact('Debiti'),'Svago · 30%');assert.equal(context.categoryImpact('Alimentari'),'Necessità · 50%');
 vm.runInContext(source.slice(source.indexOf("document.addEventListener('change'"),source.indexOf("window.addEventListener('rientro-cloud-status'")),context);
 handler({target:{matches:s=>s.includes('select[name="category"]'),value:'Alimentari',form:{querySelector:()=>hint}}});
 assert.match(hint.innerHTML,/Necessità · 50%/);
});
