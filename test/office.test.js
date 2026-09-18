import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../office/bridge.js',import.meta.url),'utf8').replace('export function','function');
function setup(authenticated=true){
 const callbacks={},sent=[],navigated=[];const parent={postMessage:(...message)=>sent.push(message)};
 const window={parent,addEventListener:(name,fn)=>callbacks[name]=fn};
 const context={window,URLSearchParams,location:{origin:'https://example.test',search:'?office=1'},document:{addEventListener(){},documentElement:{classList:{add(){}}},createElement:()=>({}),head:{append(){}}}};
 vm.createContext(context);vm.runInContext(source,context);context.connectOffice({isAuthenticated:()=>authenticated,navigate:target=>navigated.push(target)});
 return {callbacks,sent,navigated,parent};
}
test('office bridge accepts only authenticated messages from its own parent and origin',()=>{
 const s=setup();const data={type:'rientro:office:navigate',target:'plan'};
 s.callbacks.message({origin:'https://evil.test',source:s.parent,data});
 s.callbacks.message({origin:'https://example.test',source:{},data});
 assert.equal(s.navigated.length,0);
 s.callbacks.message({origin:'https://example.test',source:s.parent,data});assert.deepEqual(s.navigated,['plan']);
});
test('office bridge refuses navigation without an authenticated session',()=>{
 const s=setup(false);s.callbacks.message({origin:'https://example.test',source:s.parent,data:{type:'rientro:office:navigate',target:'dashboard'}});
 assert.equal(s.navigated.length,0);assert.equal(s.sent.at(-1)[0].type,'rientro:office:locked');
});
test('office bridge does not accept arbitrary actions or routes',()=>{
 const s=setup();for(const target of ['delete','reset','https://evil.test',null])s.callbacks.message({origin:'https://example.test',source:s.parent,data:{type:'rientro:office:navigate',target}});
 assert.equal(s.navigated.length,0);
});
