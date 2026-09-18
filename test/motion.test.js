import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../motion.js',import.meta.url),'utf8').replaceAll('export ','');
function load(reduced=false){
 const context=vm.createContext({matchMedia:query=>({matches:query.includes('reduced-motion')?reduced:true})});
 vm.runInContext(source,context);
 return context;
}
test('financial feedback preserves the actual value and cancels an overlapping animation',()=>{
 const context=load();let cancel=0,animations=0;
 const figure={isConnected:true,textContent:'1.250 €',animate(){animations++;return {cancel(){cancel++;}}}};
 context.settleFigure(figure);context.settleFigure(figure);
 assert.equal(figure.textContent,'1.250 €');assert.equal(animations,2);assert.equal(cancel,1);
});
test('reduced motion and detached figures never start feedback animations',()=>{
 let animations=0;const figure={isConnected:true,animate(){animations++;}};
 load(true).settleFigure(figure);figure.isConnected=false;load().settleFigure(figure);
 assert.equal(animations,0);
});
test('a double dismissal removes the dialog only after its animation completes',async()=>{
 const context=load();let remove=0,resolve,animations=0;
 const finished=new Promise(done=>resolve=done);
 const backdrop={dataset:{},querySelector:()=>null,animate(){animations++;return {finished}},remove(){remove++;}};
 context.closeDialog(backdrop);context.closeDialog(backdrop);
 assert.equal(remove,0);assert.equal(animations,1);
 resolve();await finished;await Promise.resolve();assert.equal(remove,1);
});
test('reduced motion closes a dialog immediately',()=>{
 let removed=0;
 load(true).closeDialog({dataset:{},remove(){removed++;}});
 assert.equal(removed,1);
});
