// A ruled, inextensible sheet: integrate tangent angles rather than rotate a flat card.
export function pagePoint(u,v,progress,width=.46,depth=.65){
 const p=Math.max(0,Math.min(1,progress)),bend=Math.sin(Math.PI*p),n=24;let x=0,y=0;
 for(let i=0;i<n;i++){const s=u*(i+.5)/n;const angle=Math.PI*p+bend*(.95*(s-.45)+.18*Math.sin(v*Math.PI));x+=Math.cos(angle)*width*u/n;y+=Math.sin(angle)*width*u/n;}
 return {x,y:Math.max(0,y)+bend*.013*Math.sin(u*Math.PI)*Math.cos(v*Math.PI)+(1-bend)*.0025*Math.sin(u*Math.PI),z:(v-.5)*depth};
}
export function smoothCamera(t){t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);}
export function dampSpring(value,velocity,target,dt,stiffness=65,damping=17){
 const steps=Math.max(1,Math.ceil(dt/.008)),h=Math.min(dt,.1)/steps;
 for(let i=0;i<steps;i++){velocity+=(stiffness*(target-value)-damping*velocity)*h;value+=velocity*h;}
 return {value,velocity};
}
