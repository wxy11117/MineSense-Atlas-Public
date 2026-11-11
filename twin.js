/* Local LHD scenario player. Drawn geometry, vehicle state and scan points are illustrative. */
(() => {
  'use strict';
  const section=document.querySelector('#digital-twin');if(!section)return;
  const $=s=>section.querySelector(s),$$=s=>[...section.querySelectorAll(s)];
  const canvas=$('#twin-canvas'),ctx=canvas.getContext('2d',{alpha:false});if(!ctx){$('#twin-state-note').textContent='当前浏览器无法显示场景，请使用支持 Canvas 的浏览器。';return;}
  const model=window.AtlasTwinState,media=matchMedia('(prefers-reduced-motion: reduce)');
  let time=0,view='overview',yaw=.56,pitch=.68,zoom=1,drag=null,visible=false,frame=null,last=0,lastUI=0,width=1,height=1,wheelAngle=0;
  const layers={scan:true,route:true,people:true};
  const descriptions=['在装载点放下铲斗，收集矿石并抬升工作装置。','沿预设矿道运送矿石，扫描图层随车移动。','到达卸载点，抬升铲斗并倾倒矿石。','卸载完成后调头返回，进入下一次作业循环。'];
  let seed=618;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const rocks=Array.from({length:32},()=>({x:-20+rand()*4.3,y:(rand()-.5)*5.7,z:0,r:.25+rand()*.55,h:.25+rand()*.9}));
  const scanPoints=Array.from({length:800},()=>{const x=-22+rand()*44,wall=rand()>.3;return [x,wall?(rand()>.5?5.1:-5.1):(rand()-.5)*10.2,wall?rand()*4.4:.04];});
  const dust=Array.from({length:24},()=>({x:rand(),y:rand(),z:rand(),p:rand()*Math.PI*2}));
  const motionAllowed=()=>!media.matches&&!document.documentElement.classList.contains('reduce-motion');
  function projection(s){
    const target=view==='follow'?[s.x,s.y,0]:[0,0,0];
    const a=yaw,p=pitch,scale=Math.min(width/(view==='follow'?19:49),height/(view==='follow'?13:26))*zoom;
    return point=>{
      const x=point[0]-target[0],y=point[1]-target[1],z=point[2],side=x*Math.cos(a)-y*Math.sin(a),forward=x*Math.sin(a)+y*Math.cos(a),depth=forward*Math.cos(p)-z*Math.sin(p);
      const perspective=view==='top'?1:70/Math.max(25,70+depth);
      return {x:width*.5+side*scale*perspective,y:height*.57-(forward*Math.sin(p)+z*Math.cos(p))*scale*perspective,depth,scale:scale*perspective};
    };
  }
  function line(project,pts,color,widthPx=1,fill=null){ctx.beginPath();pts.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(color){ctx.strokeStyle=color;ctx.lineWidth=widthPx;ctx.stroke();}}
  function label(project,p,text,color='#a6c6ca',size=10){const q=project(p);ctx.font=`${size}px Consolas,"Microsoft YaHei",sans-serif`;const w=ctx.measureText(text).width;ctx.fillStyle='#071620e8';ctx.fillRect(q.x-w/2-7,q.y-13,w+14,22);ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,q.x,q.y+2);ctx.textAlign='left';}
  function circle(project,x,y,z,r,color,widthPx=1){line(project,Array.from({length:65},(_,i)=>[x+Math.cos(i/64*2*Math.PI)*r,y+Math.sin(i/64*2*Math.PI)*r,z]),color,widthPx);}
  function box(project,x,y,z,l,w,h,color){
    const p=[[x,y,z],[x+l,y,z],[x+l,y+w,z],[x,y+w,z],[x,y,z+h],[x+l,y,z+h],[x+l,y+w,z+h],[x,y+w,z+h]];
    const faces=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].map(ids=>({pts:ids.map(i=>p[i]),depth:ids.reduce((sum,i)=>sum+project(p[i]).depth,0)/4})).sort((a,b)=>b.depth-a.depth);
    for(const f of faces)line(project,f.pts,'#81b2c324',.5,color);
  }
  function draw(s=model.state(time)){
    const project=projection(s);
    ctx.fillStyle='#07111b';ctx.fillRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.5,height*.43,0,width*.5,height*.5,width*.67);glow.addColorStop(0,'#13303b');glow.addColorStop(1,'#07111b');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    // Cut-away floor and a short passing refuge. The roof is represented by open ribs.
    line(project,[[-23,-6,-.22],[23,-6,-.22],[23,6,-.22],[4,6,-.22],[4,9,-.22],[-4,9,-.22],[-4,6,-.22],[-23,6,-.22]],'#6799ab44',1.2,'#142c36');
    line(project,[[-23,-6,-.22],[23,-6,-.22],[23,-6,-1.1],[-23,-6,-1.1]],'#34576655',.7,'#0d202b');
    line(project,[[23,-6,-.22],[23,6,-.22],[23,6,-1.1],[23,-6,-1.1]],'#34576655',.7,'#0d202b');
    for(let x=-22;x<=22;x+=2)line(project,[[x,-5.7,0],[x,5.7,0]],'#79b2bf12',.6);
    for(let y=-5;y<=5;y+=2)line(project,[[-22,y,.01],[22,y,.01]],'#79b2bf12',.6);
    // Back wall facets and arch ribs create a readable underground section.
    for(const [start,end] of [[-23,-4],[4,23]])for(let x=start;x<end;x+=3.8){
      const length=Math.min(3.8,end-x);
      line(project,[[x,5.5,0],[x+length,5.5,0],[x+length,5.7,2.5],[x+length*.4,5.5,3.8],[x,5.6,2.9]],'#6b9fa32e',.6,'#17343b');
      line(project,[[x,5.6,2.9],[x+length*.4,5.5,3.8],[x+length,5.7,2.5]],'#71a4a32a',.7);
    }
    for(let x=-21;x<=21;x+=6){
      const arch=[[x,-5.5,0],[x,-5.5,2.6],...Array.from({length:21},(_,i)=>[x,-Math.cos(i/20*Math.PI)*5.5,2.6+Math.sin(i/20*Math.PI)*3]),[x,5.5,0]];
      line(project,arch,'#69b4c34b',1.2);line(project,arch.map(p=>[p[0]+.1,p[1]*.985,p[2]]),'#a3d5d219',.6);
      // Warm wall lamps and a conduit suspended above the far side.
      line(project,[[x,4.7,3.4],[x+.6,4.7,3.4]],'#ffe4ac',2.6);
      const lamp=project([x+.3,4.7,3.4]);const light=ctx.createRadialGradient(lamp.x,lamp.y,0,lamp.x,lamp.y,22);light.addColorStop(0,'#eadba52e');light.addColorStop(1,'#eadba500');ctx.fillStyle=light;ctx.fillRect(lamp.x-22,lamp.y-22,44,44);
    }
    line(project,[[-23,4.5,4.15],[23,4.5,4.15]],'#457c8a',4);line(project,[[-23,4.5,4.26],[23,4.5,4.26]],'#9bc8ca55',1);
    // Ore pile, dump hopper and safety edge markings.
    for(const r of rocks){line(project,[[r.x-r.r,r.y-r.r,0],[r.x+r.r,r.y-r.r*.7,0],[r.x+r.r*.8,r.y+r.r,0],[r.x-r.r,r.y+r.r*.6,0]],null,1,'#425056');line(project,[[r.x-r.r,r.y-r.r,0],[r.x,r.y,r.h],[r.x+r.r,r.y-r.r*.7,0]],'#81928530',.5,'#788177');line(project,[[r.x,r.y,r.h],[r.x+r.r*.8,r.y+r.r,0],[r.x+r.r,r.y-r.r*.7,0]],'#81928530',.5,'#4c6260');}
    box(project,18,-2.1,-.1,4.3,4.2,.45,'#263c45');line(project,[[18.3,-1.8,.36],[21.9,-1.8,.36],[21.9,1.8,.36],[18.3,1.8,.36]],'#dbc68a7a',1,'#07121a');
    for(let x=18.2;x<22;x+=.6)line(project,[[x,-2.1,.38],[x+.3,-1.8,.38]],'#e5c581aa',2);
    line(project,[[-4,6,.03],[-4,8.8,.03],[4,8.8,.03],[4,6,.03]],'#7bb5c46b',1);
    if(layers.route){
      const outbound=Array.from({length:90},(_,i)=>{const q=model.state(8+i/89*26);return[q.x,q.y,.04];}),inbound=Array.from({length:90},(_,i)=>{const q=model.state(42+i/89*26);return[q.x,q.y,.04];});
      line(project,outbound,'#6be3c951',1.6);ctx.setLineDash([4,6]);line(project,inbound,'#7b9cce55',1);ctx.setLineDash([]);
      for(let x=-8;x<=10;x+=5){line(project,[[x-.4,-1.7,.05],[x,-1.35,.05],[x-.4,-1,.05]],'#75ddc777',1.4);}
    }
    if(layers.scan){
      const sweep=(time%3.5)/3.5*7+1;
      for(const r of [4,sweep,8])circle(project,s.x,s.y,.08,r,r===sweep?'#70e8d167':'#70e8d11b',r===sweep?1.1:.7);
      for(const p of scanPoints){const d=Math.hypot(p[0]-s.x,p[1]-s.y);if(d>8)continue;const q=project(p);ctx.fillStyle=Math.abs(d-sweep)<.6?'#b0ffe8':'#58bcbd70';ctx.fillRect(q.x,q.y,1.6,1.6);}
    }
    // Sensor-facing wedge is transformed with the vehicle heading (+X forward).
    const local=(x,y,z)=>[s.x+x*Math.cos(s.heading)-y*Math.sin(s.heading),s.y+x*Math.sin(s.heading)+y*Math.cos(s.heading),z];
    if(layers.scan)line(project,[[s.x,s.y,1.5],local(8,-3,.05),local(8,3,.05)],'#87c2f133',.6,'#629ce50a');
    circle(project,s.x,s.y,.04,2.7,'#00000024',12);
    const instances=[{kind:'loader',position:[s.x,s.y,.02],heading:s.heading,lift:s.lift,bucketTilt:s.tilt,wheelAngle}];
    if(layers.people)instances.push({kind:'worker',position:[.6,7.1,0],heading:-Math.PI/2});
    AtlasModels.render(ctx,project,instances);
    if(s.load>.05){
      for(let i=0;i<5;i++){const p=local(2.65+(i%2)*.22,-.65+i*.28,.6+s.lift);const q=project(p);ctx.fillStyle=i%2?'#a6a382':'#768a7d';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(1.5,q.scale*.12*s.load),0,Math.PI*2);ctx.fill();}
    }
    if(s.phase===2&&s.load>.02&&s.load<.98){for(let i=0;i<10;i++){const f=(time*1.2+i*.13)%1,p=project([18.1+i%3*.22,(i%4-.5)*.22,1.6-f*1.4]);ctx.fillStyle='#b2ae85aa';ctx.fillRect(p.x,p.y,2.4,2.4);}}
    if(s.phase===0){for(const d of dust){const q=project([-17.5+d.x*2,(d.y-.5)*2,.3+((time*.35+d.z)%1)*1.5]);ctx.fillStyle='#d7c79a25';ctx.beginPath();ctx.arc(q.x,q.y,1.5+d.z*3,0,Math.PI*2);ctx.fill();}}
    if(layers.people){circle(project,.6,7.1,.04,1.15,'#edc56d88',1);label(project,[.6,7.1,2.7],'人员 · 避让区','#efd99c',9);}
    label(project,[-19,-4.3,.15],'A / 装载点','#d8c58d',width<600?8:10);label(project,[20,-4.3,.15],'B / 卸载点','#8dbbd5',width<600?8:10);
    const tag=project([s.x,s.y,3.3]);ctx.fillStyle='#71e1cb';ctx.font='9px Consolas,monospace';ctx.textAlign='center';ctx.fillText('LHD–01 / DEMO',tag.x,tag.y);ctx.textAlign='left';
    line(project,[local(0,0,2.3),local(2.6,0,2.3)],'#9df4dc8c',1);const tip=project(local(2.9,0,2.3));ctx.font='8px Consolas';ctx.fillStyle='#94dfcb';ctx.fillText('+X',tip.x,tip.y);
    // Compact north-up inset keeps the vehicle's position readable when following it.
    const mw=Math.min(146,width*.24),mh=64,mx=18,my=height-102;
    ctx.fillStyle='#091a24df';ctx.strokeStyle='#5c9ca344';ctx.lineWidth=1;ctx.fillRect(mx,my,mw,mh);ctx.strokeRect(mx,my,mw,mh);
    ctx.strokeStyle='#6d9ca34d';ctx.strokeRect(mx+12,my+25,mw-24,17);ctx.fillStyle='#7c9cae';ctx.font='7px Consolas';ctx.fillText('MINE / OVERVIEW',mx+10,my+13);
    ctx.fillStyle='#dec884';ctx.fillRect(mx+10,my+26,4,15);ctx.fillStyle='#83aecb';ctx.fillRect(mx+mw-14,my+26,4,15);
    const px=mx+12+(s.x+23)/46*(mw-24),py=my+33+s.y;ctx.fillStyle='#8af4d9';ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();
    canvas.dataset.phase=String(s.phase);canvas.dataset.time=s.t.toFixed(2);canvas.dataset.view=view;canvas.dataset.position=`${s.x.toFixed(2)},${s.y.toFixed(2)}`;
  }
  function updateUI(){const s=model.state(time),blocked=!motionAllowed();
    $('#twin-phase-title').textContent=s.name;$('#twin-phase-caption').textContent=descriptions[s.phase];
    $('#twin-speed-value').textContent=s.speed.toFixed(2);$('#twin-load-value').textContent=Math.round(s.load*100);$('#twin-coordinate').textContent=`${s.x.toFixed(1)}, ${s.y.toFixed(1)}, 0.0`;
    $('#twin-state-note').textContent=blocked?'已按全站动效设置暂停':'自动循环演示 · 非车辆实时反馈';
    $$('[data-twin-stage]').forEach(item=>item.setAttribute('aria-current',String(Number(item.dataset.twinStage)===s.phase)));
  }
  function loop(now){frame=null;if(document.hidden||!visible)return;const dt=last?Math.min((now-last)/1000,.12):0;if(last&&dt<.04){frame=requestAnimationFrame(loop);return;}last=now;
    if(motionAllowed()){const before=model.state(time);time=(time+dt)%model.duration;const after=model.state(time);wheelAngle+=Math.min(1,Math.hypot(after.x-before.x,after.y-before.y))/.57;}
    draw();if(now-lastUI>160){updateUI();lastUI=now;}if(motionAllowed())frame=requestAnimationFrame(loop);
  }
  function schedule(){if(frame===null&&visible&&!document.hidden&&motionAllowed())frame=requestAnimationFrame(loop);}
  function stopFrame(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}
  function refresh(){draw();updateUI();schedule();}
  function chooseView(next){view=next;zoom=1;yaw=next==='top'?0:.56;pitch=next==='top'?Math.PI/2:next==='follow'?.48:.68;$$('[data-twin-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.twinView===next)));refresh();}
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);refresh();}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stopFrame();if(visible)refresh();},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{stopFrame();if(!document.hidden)refresh();});
  document.addEventListener('atlas:motion',()=>{stopFrame();refresh();});media.addEventListener('change',()=>{stopFrame();refresh();});
  $$('[data-twin-view]').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.twinView)));
  $$('[data-twin-layer]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.twinLayer;layers[key]=!layers[key];b.setAttribute('aria-pressed',String(layers[key]));draw();}));
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.005;pitch=Math.max(.2,Math.min(1.5,pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;draw();});
  const end=()=>{drag=null;canvas.classList.remove('dragging');};['pointerup','pointercancel','lostpointercapture'].forEach(e=>canvas.addEventListener(e,end));addEventListener('blur',end);
  canvas.addEventListener('dblclick',()=>chooseView('overview'));
  canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas)return;e.preventDefault();zoom=Math.max(.7,Math.min(2.1,zoom*Math.exp(-e.deltaY*.001)));draw();},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')chooseView('overview');if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.5,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(.2,pitch-.08);draw();});
  updateUI();resize();
})();
