(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let userMotion = null;
  try { userMotion = localStorage.getItem('minesense-showcase-motion'); } catch {}
  let reduced = userMotion === 'off' || reducedQuery.matches;
  const setMotion = () => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
    $('#motion-toggle').textContent = `动效：${reduced ? '关闭' : '开启'}`;
    $('#motion-toggle').setAttribute('aria-pressed', String(reduced));
    const quick=$('#motion-quick-toggle');
    quick.querySelector('span').textContent=`动效：${reduced ? '关闭' : '开启'}`;
    quick.querySelector('i').textContent=reduced?'▷':'Ⅱ';
    quick.setAttribute('aria-pressed',String(reduced));
    quick.setAttribute('aria-label',reducedQuery.matches?'已按系统设置减少动态效果':reduced?'开启页面动效':'关闭页面动效');
    for(const button of [quick,$('#motion-toggle')]){button.disabled=reducedQuery.matches;button.title=reducedQuery.matches?'已遵循系统的减少动态效果设置':'暂停或恢复页面展示动效';}
    document.dispatchEvent(new CustomEvent('atlas:motion',{detail:{enabled:!reduced}}));
  };
  setMotion();
  document.documentElement.classList.add('enhanced');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  }), { threshold: .07 });
  $$('.reveal').forEach(el => revealObserver.observe(el));
  const menu = $('.menu-toggle');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('open'); menu.setAttribute('aria-label', '展开导航'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? '收起导航' : '展开导航'); $('#navigation').classList.toggle('open', open);
  });
  $$('#navigation a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });

  const navigationSections=$$('main > section'),navigationLinks=$$('#navigation a');
  let navigationFrame=null;
  function updateNavigation(){
    navigationFrame=null;
    const referenceY=Math.min(innerHeight*.25,220);
    const current=navigationSections.find(section=>{const rect=section.getBoundingClientRect();return rect.top<=referenceY&&rect.bottom>referenceY;});
    const navSection=({architecture:'platform',capabilities:'workspace'})[current?.id]||current?.id;
    navigationLinks.forEach(link=>{if(link.hash===`#${navSection}`)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
  }
  function scheduleNavigation(){if(navigationFrame===null)navigationFrame=requestAnimationFrame(updateNavigation);}
  addEventListener('scroll',scheduleNavigation,{passive:true});
  addEventListener('resize',scheduleNavigation,{passive:true});
  new ResizeObserver(scheduleNavigation).observe($('#main'));
  scheduleNavigation();

  const architecture = {
    lidar: ['INPUT / 01','激光雷达','已有软件能力','原始 XYZ 点云进入点云空间，以传感器原生坐标显示。可切换视角、累积窗口与颜色，并选定角度范围持续测距。','空间几何、方向内回波距离与点数。','原始点云显示与移动 SLAM 分开；车体坐标转换需要安装外参验证。'],
    radar: ['INPUT / 02','毫米波雷达','已有软件能力','毫米波原生回波独立呈现，与激光点云及实验录像按记录对照。不同观测渠道保留各自的来源与坐标。','原生点云与回波分布，以及关联源帧。','两种雷达的空间对应需要经过外参验证，不能仅凭并排显示宣称完成融合。'],
    camera: ['INPUT / 03','摄像头 + YOLO','已有软件能力','本机内置或 USB 摄像头直接取流，调用官方预训练 YOLOv8m，在原始画面上显示人员候选与置信度。','图像、检测框及推理状态；支持离线实验录像。','候选框不等于三维位置、跨帧身份或动作判断；相机与雷达的配准仍需标定。'],
    atlas: ['WORKSPACE / CORE','MineSense Atlas','已有软件能力','在同一个工作空间组织点云、视觉、车辆预设与回放复核，以源帧串联实验，保留传感器原始数据。','一致的观察入口、时间线索与来源标记。','按主机时间关联不等于硬件曝光同步；车体预设不能替代实测外参。'],
    review: ['OUTPUT / 01','复核与导出','已有软件能力','逐帧查看同一源帧的录像、点云和模型候选，人工关联与判断独立保存，再导出可回查的复核记录。','带来源的复核结果，以及实验对比依据。','模型输出与人工判断分开；未完成正式复核的记录不作为真值或精度结论。'],
    mie: ['RESEARCH / 02','Mie 条件实验','仿真研究 · 实测待接入','现有研究保留清洁原始点云，以派生的 Mie 条件与算法结果开展比较。拟引入粒子传感器提供实测环境依据。','环境条件假设、派生结果与算法对比路径。','尚无粉尘实测输入；粒径、流量和光学关系需标定，不能将 PM2.5 直接换算为光学厚度。'],
    vehicle: ['ROADMAP / 03','车辆与移动建图','树莓派已接入 · 映射待验证','树莓派已接入，三维铲运车、车体坐标与人员布局已提供预设界面；继续完善车体反馈映射与移动建图。','当前提供三维观察与布局设计入口。','底盘反馈、车体外参、运动补偿 SLAM 与安全控制闭环尚需接入和验证。']
  };
  $$('.graph-node').forEach(button => button.addEventListener('click', () => {
    const key=button.dataset.node, data=architecture[key];
    $$('.graph-node').forEach(node => { const active=node===button; node.classList.toggle('selected',active); node.setAttribute('aria-pressed',String(active)); });
    ['kicker','name','description','output','limit'].forEach((field,index) => $(`#architecture-${field}`).textContent=data[[0,1,3,4,5][index]]);
    const pending=key==='vehicle'||key==='mie', status=$('#architecture-status');
    status.classList.toggle('pending',pending);
    status.replaceChildren(Object.assign(document.createElement('i'),{className:pending?'':'signal-dot'}),document.createTextNode(data[2]));
  }));

  const views = {
    vehicle: {title:'以车体为原点，探索周围方位',icon:'⌖',description:'调整人员预设的前后与左右位置，观察目标在车体坐标中的变化。可切换俯视、透视，或直接拖动场景。',facts:['+X 前 / +Y 左 / +Z 上','人员预设位置可调整','鼠标拖动与方向键旋转'],note:'车辆与人员均由程序绘制。位置数值属于手动预设，不能作为人员实测定位。',source:'三维交互示意 · 人员位置预设 · 无设备连接',label:'VEHICLE WORKSPACE'},
    radar: {title:'从点的分布，理解空间结构',icon:'◉',description:'在网页中旋转巷道点云，调整显示密度，并在高度与距离着色之间切换，体验点云空间的观察方式。',facts:['巷道点云可旋转与缩放','显示密度即时调整','高度 / 距离着色切换'],note:'本演示使用程序生成的巷道点云。真实采集点云与录像关联请进入本机实验工作台。',source:'程序生成点云 · 用于展示操作方式 · 非采集数据',label:'POINT CLOUD EXPLORER'},
    vision: {title:'调整阈值，观察候选框变化',icon:'▣',description:'拖动示意时间轴查看目标移动，调整置信度阈值，观察候选框的显示与隐藏；也可以关闭框选图层。',facts:['时间轴控制示意目标位置','阈值筛选示例候选框','框选图层可开关'],note:'场景、框和分数都是交互示意。本页不访问摄像头或运行 YOLO；真实推理位于本机软件中。',source:'视觉检测交互示意 · 未运行 YOLO · 无摄像头访问',label:'VISION INTERACTION'},
    direction: {title:'调整一个方向，观察空间选区',icon:'↗',description:'输入水平与俯仰角、角度半宽及距离范围，橙色选区立即响应。可以切换 +X / +Y 方向，再应用方向预设。',facts:['方向、角度与距离范围联动','拖动旋转 / 俯视 / 复位','放大后仍可继续调整参数'],note:'半球为方向参考，非传感器视场标定。这里仅应用演示预设；尚未连接雷达，测量结果保持空值。',source:'方向选区交互演示 · 雷达未连接 · 不产生实测距离',label:'DIRECTIONAL RANGING'}
  };
  const viewButtons=$$('.workspace-tabs button[data-view]'); let currentView='vehicle';
  function selectView(key,focus=false) {
    currentView=key; const data=views[key], index=Object.keys(views).indexOf(key);
    viewButtons.forEach(button => { const active=button.dataset.view===key; button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus(); });
    $('#workspace-panel').setAttribute('aria-labelledby',`view-${key}`);
    $('#workspace-kicker').textContent=`WORKSPACE / 0${index+1}`;
    ['title','icon','description','note','source'].forEach(field => $(`#workspace-${field}`).textContent=data[field]);
    $('#workspace-facts').replaceChildren(...data.facts.map(fact => Object.assign(document.createElement('span'),{textContent:fact})));
    $('.window-toolbar>span').textContent=`MINESENSE ATLAS / ${data.label}`;
    document.dispatchEvent(new CustomEvent('atlas:view',{detail:key}));
  }
  viewButtons.forEach((button,index) => {
    button.addEventListener('click',()=>selectView(button.dataset.view));
    button.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?viewButtons.length-1:(index+(e.key==='ArrowRight'?1:-1)+viewButtons.length)%viewButtons.length;
      selectView(viewButtons[next].dataset.view,true);
    });
  });
  $('#next-workspace').addEventListener('click',()=>{const keys=Object.keys(views);selectView(keys[(keys.indexOf(currentView)+1)%keys.length]);});
  $$('[data-demo-target]').forEach(link=>link.addEventListener('click',()=>selectView(link.dataset.demoTarget)));
  const initialView=new URLSearchParams(location.search).get('demo');
  selectView(Object.hasOwn(views,initialView)?initialView:'vehicle');

  $$('.module-toggle').forEach((button, index) => button.addEventListener('click', () => {
    $$('.module-toggle').forEach((b, i) => {
      const active = index === i;
      b.setAttribute('aria-expanded', String(active)); b.querySelector('b').textContent = active ? '−' : '+';
      $(`#module-panel-${i}`).hidden = !active; b.closest('.module').classList.toggle('is-open', active);
    });
    $('#module-number').textContent = `0${index + 1}`;
  }));
  function openDialog(id) { const dialog=$(id); if (!dialog.open) dialog.showModal(); }
  const workbench=$('#interactive-workbench'), workspaceParent=workbench.parentNode;
  const workbenchMarker=document.createComment('Interactive workspace returns here after closing the dialog.');
  workspaceParent.insertBefore(workbenchMarker,workbench);
  $('#expand-workspace').addEventListener('click', () => {
    const dialog=$('#workbench-dialog');
    if(dialog.open){dialog.close();return;}
    $('#workbench-dialog-content').append(workbench);
    $('#expand-workspace').textContent='收起视图 ↙';
    openDialog('#workbench-dialog');
  });
  $('#workbench-dialog').addEventListener('close',()=>{
    workbenchMarker.after(workbench);$('#expand-workspace').textContent='放大查看 ↗';$('#expand-workspace').focus({preventScroll:true});
  });
  $('#open-local').addEventListener('click', () => openDialog('#local-dialog'));
  $$('dialog').forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      const r=dialog.getBoundingClientRect();
      if (e.target === dialog && (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)) dialog.close();
    });
  });

  const canvas = $('#spatial-scene'), ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) { $('#scene-status').textContent='当前浏览器不支持三维示意预览，可继续查看下方软件界面。'; return; }
  let width=1, height=1, yaw=.88, pitch=.42, drag=null, frame=null, lastFrame=0, visible=true, scanStart=null;
  const layers={lidar:true,radar:true,vision:true};
  const points=[];
  let seed=518;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // A deterministic illustrative tunnel, never a sensor stream or measured map.
  for(let i=0;i<6900;i++){
    const x=-5+random()*34, side=random(), jitter=(random()-.5)*.15;
    let y,z;
    if(side<.57){y=(random()<.5?-1:1)*(4.6+jitter);z=random()*3.2;}
    else if(side<.88){const a=random()*Math.PI;y=Math.cos(a)*4.6;z=3.2+Math.sin(a)*2.6+jitter;}
    else {y=(random()-.5)*9.2;z=jitter*.3;}
    points.push({x,y,z,alpha:.16+random()*.5,size:.5+random()*.75});
  }
  function project(x,y,z=0){
    const forward=x*Math.cos(yaw)+y*Math.sin(yaw), left=-x*Math.sin(yaw)+y*Math.cos(yaw);
    const depth=forward*Math.cos(pitch)-z*Math.sin(pitch), factor=30/Math.max(8,30+depth);
    const scale=Math.min(width/13.8,height/10);
    return {x:width*.40-left*scale*factor,y:height*.65-(forward*Math.sin(pitch)+z*Math.cos(pitch))*scale*factor,depth,scale:factor};
  }
  function path3(points3,color,widthPx=1,fill=null){
    ctx.beginPath();points3.forEach((p,i)=>{const q=project(...p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});
    if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
    if(color){ctx.strokeStyle=color;ctx.lineWidth=widthPx;ctx.stroke();}
  }
  function sceneModels(){
    const instances=[{kind:'loader'}];
    if(layers.vision)instances.push({kind:'worker',position:[7,-2.4,0]});
    AtlasModels.render(ctx,p=>project(...p),instances);
    path3([[3.7,0,.05],[4.7,0,.05],[4.35,.17,.05]],'#81dbcd88',1);
    path3([[4.7,0,.05],[4.35,-.17,.05]],'#81dbcd88',1);
    const label=project(5,0,.05);ctx.fillStyle='#80c8bb';ctx.font='9px Consolas,monospace';ctx.fillText('+X',label.x,label.y);
    if(layers.vision){
      const head=project(7,-2.4,2.06),feet=project(7,-2.4,0),half=Math.max(11,(feet.y-head.y)*.22);
      ctx.strokeStyle='#cbdc8b55';ctx.lineWidth=.7;ctx.strokeRect(head.x-half,head.y-4,half*2,feet.y-head.y+9);
      ctx.fillStyle='#dae7b8';ctx.font='9px Consolas,monospace';ctx.fillText('PERSON / DEMO',head.x-half,head.y-13);
    }
  }
  function draw(now=0){
    ctx.fillStyle='#050b10';ctx.fillRect(0,0,width,height);
    const bg=ctx.createRadialGradient(width*.55,height*.4,5,width*.55,height*.5,width*.58);bg.addColorStop(0,'#0c2732');bg.addColorStop(1,'#050b10');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let x=-6;x<=28;x+=2)path3([[x,-5,0],[x,5,0]],'#4e8f8b16',.6);
    for(let y=-6;y<=6;y+=2)path3([[-6,y,0],[28,y,0]],'#4e8f8b16',.6);
    for(const x of [-4,2,8,14,20,26]){
      const arch=[[x,-4.6,0],[x,-4.6,3.2],...Array.from({length:25},(_,i)=>[x,-Math.cos(i/24*Math.PI)*4.6,3.2+Math.sin(i/24*Math.PI)*2.6]),[x,4.6,0]];
      path3(arch,'#5fa39c24',.7);
    }
    for(const y of [-4.6,4.6])path3([[-6,y,0],[28,y,0]],'#6ab0a544',.8);
    if(layers.lidar){
      const sweep=scanStart!==null?Math.min(1,(now-scanStart)/3500)*32-4:!reduced?(now%14000)/14000*32-4:null;
      for(const p of points){
        const q=project(p.x,p.y,p.z);if(q.x<0||q.x>width||q.y<0||q.y>height)continue;
        const fade=Math.max(.13,1-p.x/42);const boost=sweep!==null&&Math.abs(p.x-sweep)<1.1?(scanStart!==null?.6:.2):0;
        ctx.globalAlpha=Math.min(1,p.alpha*fade+boost);ctx.fillStyle=p.z>3.5?'#aac5a4':p.z<.2?'#66b1a9':'#6cd6c2';
        const s=p.size*q.scale*(boost?1.6:1);ctx.fillRect(q.x,q.y,s,s);
      }
      ctx.globalAlpha=1;
      if(sweep!==null){path3([[sweep,-4.6,0],[sweep,-4.6,3.2],[sweep,0,5.8],[sweep,4.6,3.2],[sweep,4.6,0]],scanStart!==null?'#d3eb8a70':'#76dccb42',1);}
    }
    if(layers.radar){
      for(const r of [2.8,5,7.2]){
        const arc=Array.from({length:91},(_,i)=>{const a=i/90*Math.PI*2;return[Math.cos(a)*r,Math.sin(a)*r,.04];});
        path3(arc,'#d1b97c39',.7);
      }
      const a=reduced?.9:now*.00018;path3([[0,0,.04],[Math.cos(a)*7.2,Math.sin(a)*7.2,.04]],'#c1ba7966',1);
    }
    // The model and floor share one +X-forward coordinate system.
    if(layers.vision)path3([[1,0,1.7],[7,-2.4,.1]],'#d3eb8a33',.5);
    sceneModels();
    if(scanStart!==null&&now-scanStart>3500){scanStart=null;$('[data-scan-trigger]').innerHTML='体验感知扫描 <span>⌁</span>';$('#scene-status').textContent='示意扫描完成。';}
    canvas.dataset.layers=Object.entries(layers).filter(([,v])=>v).map(([k])=>k).join(',');
  }
  function loop(now){
    frame=null;
    if(document.hidden||!visible)return;
    if(now-lastFrame>33){draw(now);lastFrame=now;}
    if(!reduced||scanStart!==null)frame=requestAnimationFrame(loop);
  }
  function schedule(){if(frame===null&&visible&&!document.hidden)frame=requestAnimationFrame(loop);}
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now());schedule();}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else if(frame!==null){cancelAnimationFrame(frame);frame=null;}},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;}else schedule();});
  $$('.scene-controls [data-layer]').forEach(button=>button.addEventListener('click',()=>{
    const layer=button.dataset.layer;layers[layer]=!layers[layer];button.setAttribute('aria-pressed',String(layers[layer]));draw(performance.now());
    $('#scene-status').textContent=`${button.textContent.trim()} 示意图层已${layers[layer]?'开启':'关闭'}。`;
  }));
  const reset=()=>{yaw=.88;pitch=.42;draw(performance.now());};
  $('#reset-scene').addEventListener('click',reset);canvas.addEventListener('dblclick',reset);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.004;pitch=Math.min(1.12,Math.max(.18,pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;draw(performance.now());});
  const endDrag=()=>{drag=null;canvas.classList.remove('dragging');};
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,endDrag));
  window.addEventListener('blur',endDrag);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();if(e.key==='ArrowLeft')yaw+=.12;if(e.key==='ArrowRight')yaw-=.12;if(e.key==='ArrowUp')pitch=Math.min(1.12,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(.18,pitch-.08);draw(performance.now());});
  $('[data-scan-trigger]').addEventListener('click',()=>{
    const button=$('[data-scan-trigger]');
    if(scanStart!==null){scanStart=null;button.innerHTML='体验感知扫描 <span>⌁</span>';draw(performance.now());return;}
    if(!layers.lidar){layers.lidar=true;$('[data-layer="lidar"]').setAttribute('aria-pressed','true');}
    if(reduced){draw(performance.now());$('#scene-status').textContent='已显示静态点云。动效关闭时不播放扫描。';button.innerHTML='静态点云已显示 <span>✓</span>';return;}
    scanStart=performance.now();button.innerHTML='停止示意扫描 <span>Ⅱ</span>';$('#scene-status').textContent='正在播放示意扫描，不代表真实采集。';schedule();
  });
  function applyMotion(){setMotion();scanStart=null;$('[data-scan-trigger]').innerHTML='体验感知扫描 <span>⌁</span>';if(frame!==null){cancelAnimationFrame(frame);frame=null;}draw(performance.now());schedule();}
  $$('#motion-toggle,#motion-quick-toggle').forEach(button=>button.addEventListener('click',()=>{if(reducedQuery.matches)return;reduced=!reduced;userMotion=reduced?'off':'on';try{localStorage.setItem('minesense-showcase-motion',userMotion);}catch{}applyMotion();}));
  reducedQuery.addEventListener('change',e=>{reduced=e.matches||userMotion==='off';applyMotion();});
  resize();
})();
