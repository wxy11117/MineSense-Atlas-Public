/* Deterministic demonstration state; seconds and metres are scenario presets, not telemetry. */
(() => {
  'use strict';
  const duration=68,starts=[0,8,34,42],names=['铲装作业','重载运输','定点卸载','空载返回'];
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const mix=(a,b,t)=>a+(b-a)*smooth(t);
  function sample(input){
    const t=Math.max(0,Math.min(duration,Number(input)||0));
    let x=-14.5,y=0,heading=Math.PI,lift=0,tilt=0,load=0,phase=0;
    if(t<8){const q=t/8;lift=mix(0,.55,(q-.35)/.65);tilt=mix(0,.18,q);load=smooth((q-.15)/.65);}
    else if(t<34){phase=1;load=1;lift=.55;tilt=.18;
      if(t<14){const q=(t-8)/6;x=mix(-14.5,-9.5,q);y=-1.35*Math.sin(q*Math.PI/2);heading=mix(Math.PI,0,q);}
      else if(t<30){const q=(t-14)/16;x=mix(-9.5,12,q);y=-1.35;heading=0;}
      else{const q=(t-30)/4;x=mix(12,14.5,q);y=mix(-1.35,0,q);heading=0;}
    } else if(t<42){phase=2;x=14.5;heading=0;const q=(t-34)/8;lift=.55+Math.sin(q*Math.PI)*.8;tilt=.18-Math.sin(q*Math.PI)*.9;load=1-smooth((q-.25)/.55);}
    else{phase=3;heading=Math.PI;const q=(t-42)/26;lift=.55*(1-smooth(q*2));tilt=.18*(1-smooth(q*2));
      if(t<48){const s=(t-42)/6;x=mix(14.5,9.5,s);y=1.35*Math.sin(s*Math.PI/2);heading=mix(0,Math.PI,s);}
      else if(t<64){const s=(t-48)/16;x=mix(9.5,-12,s);y=1.35;}
      else{const s=(t-64)/4;x=mix(-12,-14.5,s);y=mix(1.35,0,s);}
    }
    return {t,x,y,heading,lift,tilt,load,phase,name:names[phase]};
  }
  function state(input){const s=sample(input),a=sample(Math.max(0,s.t-.02)),b=sample(Math.min(duration,s.t+.02));return {...s,speed:Math.hypot(b.x-a.x,b.y-a.y)/(b.t-a.t||1)};}
  const api=Object.freeze({duration,starts,names,state});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.AtlasTwinState=api;
})();
