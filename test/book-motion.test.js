import test from 'node:test';
import assert from 'node:assert/strict';
import {pagePoint,dampSpring,smoothCamera} from '../office/book-motion.js';
test('la pagina resta legata al dorso in ogni fase dello sfoglio',()=>{for(let i=0;i<=100;i++){const p=pagePoint(0,.5,i/100);assert.equal(p.x,0);assert.equal(p.y,0);assert.equal(p.z,0);}});
test('il foglio passa da destra a sinistra senza attraversare il tavolo',()=>{for(let i=0;i<=100;i++)for(let j=0;j<=10;j++){const p=pagePoint(j/10,.7,i/100);assert.ok(Number.isFinite(p.x+p.y+p.z));assert.ok(p.y>=0);assert.ok(Math.hypot(p.x,p.y)<=.47);}assert.ok(Math.abs(pagePoint(1,.5,0).x-.46)<1e-8);assert.ok(Math.abs(pagePoint(1,.5,1).x+.46)<1e-8);assert.ok(pagePoint(1,.5,.5).y>.4);});
test('la molla converge anche con frequenze di rendering diverse',()=>{for(const fps of [24,30,60,120]){let value=0,velocity=0;for(let i=0;i<fps*4;i++)({value,velocity}=dampSpring(value,velocity,1,1/fps));assert.ok(Math.abs(value-1)<1e-4);assert.ok(Math.abs(velocity)<1e-3);}});
test('il movimento della camera parte e si arresta senza scatti di velocità',()=>{assert.equal(smoothCamera(0),0);assert.equal(smoothCamera(1),1);assert.ok(smoothCamera(.001)<1e-7);assert.ok(1-smoothCamera(.999)<1e-7);});
