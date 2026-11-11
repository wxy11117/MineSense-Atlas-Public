/* Decorative particle field; no device or experiment data. */
(() => {
  'use strict';
  const canvas=document.querySelector('#ambient-particles');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer={x:0,y:0,active:false},ripples=[];
  let width=1,height=1,points=[],frame=null,last=0,phase=0;
  const enabled=()=>!document.hidden&&!media.matches&&!document.documentElement.classList.contains('reduce-motion');
  let seed=718;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  function resize(){
    width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    seed=718;points=Array.from({length:Math.min(100,Math.max(32,Math.round(width*height/15000)))},()=>({x:rand()*width,y:rand()*height,vx:(rand()-.5)*7,vy:(rand()-.5)*7,r:.7+rand()*1.5,p:rand()*6.28,d:.4+rand(),blue:rand()>.65}));
    draw(0);schedule();
  }
  function draw(dt){
    phase+=dt;ctx.clearRect(0,0,width,height);
    if(pointer.active&&enabled()){
      const glow=ctx.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,200);
      glow.addColorStop(0,'#39cce215');glow.addColorStop(1,'#39cce200');ctx.fillStyle=glow;ctx.fillRect(pointer.x-200,pointer.y-200,400,400);
    }
    for(const p of points){
      if(dt){
        p.x+=(p.vx+Math.sin(phase*.35+p.p)*2)*dt;p.y+=(p.vy+Math.cos(phase*.3+p.p)*2)*dt;
        if(pointer.active){const dx=pointer.x-p.x,dy=pointer.y-p.y,d=Math.hypot(dx,dy);if(d>10&&d<180){const pull=(1-d/180)*dt*.07;p.x+=dx*pull;p.y+=dy*pull;}}
        p.x=(p.x+width)%width;p.y=(p.y+height)%height;
      }
    }
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(distance<130){ctx.strokeStyle=`rgba(98,180,218,${(1-distance/130)*.14})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    }
    for(const p of points){
      const opacity=.42+Math.sin(phase*1.1+p.p)*.16;
      ctx.fillStyle=p.blue?`rgba(106,165,255,${opacity})`:`rgba(109,235,220,${opacity})`;
      ctx.shadowColor=p.blue?'#6798ee':'#6cead8';ctx.shadowBlur=7;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      const d=Math.hypot(p.x-pointer.x,p.y-pointer.y);
      if(pointer.active&&enabled()&&d<155){ctx.strokeStyle=`rgba(100,235,220,${(1-d/155)*.27})`;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();}
    }
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.age+=dt;ctx.strokeStyle=`rgba(103,235,224,${Math.max(0,(1-r.age/1.25)*.3)})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(r.x,r.y,15+r.age*115,0,Math.PI*2);ctx.stroke();if(r.age>=1.25)ripples.splice(i,1);}
  }
  function loop(now){frame=null;if(!enabled()){last=0;return;}if(now-last>=40){const dt=last?Math.min((now-last)/1000,.08):0;last=now;draw(dt);}frame=requestAnimationFrame(loop);}
  function schedule(){if(frame===null&&enabled())frame=requestAnimationFrame(loop);}
  function sync(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;if(!enabled()){pointer.active=false;ripples.length=0;draw(0);}schedule();}
  addEventListener('resize',resize);
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&enabled()){pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;}},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{pointer.active=false;});
  addEventListener('pointerdown',e=>{if(enabled()){ripples.push({x:e.clientX,y:e.clientY,age:0});if(ripples.length>6)ripples.shift();}},{passive:true});
  document.addEventListener('atlas:motion',sync);document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
  resize();
})();
