/* Native browser demonstration. No sensor, camera, model, or experiment API is called. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), canvas=$('#workbench-canvas'), ctx=canvas.getContext('2d');
  const state={vehicle:{x:6,y:-2},radar:{density:65,color:'height'},vision:{threshold:25,time:30,boxes:true},direction:{az:0,el:0,ha:3,he:3,min:.1,max:20,window:500,points:5}};
  let view='vehicle', applied=null, yaw=-.6,pitch=.53,zoom=1,width=1,height=1,drag=null;
  const rad=n=>n*Math.PI/180, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sphere=(az,el,r=8)=>[r*Math.cos(rad(el))*Math.cos(rad(az)),r*Math.cos(rad(el))*Math.sin(rad(az)),r*Math.sin(rad(el))];
  const sceneMeta={vehicle:['VEHICLE / SPATIAL PRESET','车体坐标与人员预设','B · 车体坐标 / m','空间布局预设','⌖'],radar:['LIDAR / POINT CLOUD','探索巷道的点云结构','XYZ · 示意点云','程序生成 · 非采集','◉'],vision:['VISION / DETECTION PREVIEW','视觉候选交互演示','CAMERA · 场景示意','未运行 YOLO','▣'],direction:['LIDAR / DIRECTIONAL RANGING','指定方向持续测距','球面方向参考','雷达未连接','↗']};
  function range(id,label,value,min,max,step,unit){return `<label class="demo-range" for="demo-${id}"><span>${label}<output data-output="${id}">${value}${unit}</output></span><input id="demo-${id}" name="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
  function number(name,label,value,min,max,step){return `<label for="direction-${name}">${label}<input id="direction-${name}" name="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" required></label>`;}
  function controls(){
    const s=state[view];let content='';
    if(view==='direction')content=`<form id="direction-form" novalidate><div class="demo-control-title"><h4>测距方向预设</h4><span>CONFIGURE</span></div><div class="direction-fields">${number('az','水平中心角 / °',s.az,-180,180,1)}${number('el','俯仰中心角 / °',s.el,-90,90,1)}${number('ha','水平半宽 ± / °',s.ha,.5,60,.5)}${number('he','俯仰半宽 ± / °',s.he,.5,60,.5)}${number('min','最小距离 / m',s.min,.1,60,.1)}${number('max','最大距离 / m',s.max,.1,60,.1)}<label for="direction-window">累积时间<select id="direction-window" name="window">${[250,500,1000].map(n=>`<option value="${n}" ${n===s.window?'selected':''}>${n} ms</option>`).join('')}</select></label>${number('points','至少需要点数',s.points,1,1000,1)}</div><div class="direction-shortcuts"><button type="button" data-direction-axis="0">+X 前向</button><button type="button" data-direction-axis="90">+Y 左向</button></div><button class="demo-primary" type="submit">应用方向预设 <span>↗</span></button><p class="demo-form-message" id="direction-message" role="status"></p></form>`;
    if(view==='vehicle')content=`<div class="demo-control-title"><h4>人员位置预设</h4><span>PERSON A</span></div><p class="demo-setting-copy">调整相对车体的方位，观察人员标记与坐标的变化。</p>${range('x','前后位置 X',s.x,-8,12,.1,' m')}${range('y','左右位置 Y',s.y,-8,8,.1,' m')}<div class="demo-coordinates"><span>+X → 车头前方</span><span>+Y → 车体左侧</span><span>+Z → 车体上方</span></div><button type="button" class="demo-secondary" id="reset-person">恢复人员预设</button><p class="demo-setting-note">当前为手动空间预设，展示页未绑定车体实时反馈。</p>`;
    if(view==='radar')content=`<div class="demo-control-title"><h4>点云显示</h4><span>CLOUD VIEW</span></div><p class="demo-setting-copy">通过密度与着色观察巷道轮廓。此处点云由程序生成。</p>${range('density','显示密度',s.density,10,100,5,'%')}<label class="demo-select" for="demo-color">点云着色<select id="demo-color"><option value="height" ${s.color==='height'?'selected':''}>按高度 Z</option><option value="distance" ${s.color==='distance'?'selected':''}>按距原点距离</option></select></label><div class="demo-color-key"><i></i><span id="cloud-color-caption">低 → 高</span></div><p class="demo-setting-note">拖动旋转场景；点击图形后，滚动滚轮可缩放。</p>`;
    if(view==='vision')content=`<div class="demo-control-title"><h4>候选框筛选</h4><span>VISION DEMO</span></div><p class="demo-setting-copy">两个示意目标带有固定的示例分数，可体验阈值筛选和框选显示。</p>${range('threshold','置信度阈值',s.threshold,10,95,5,'%')}${range('time','示意时间轴',s.time,0,60,1,' s')}<label class="demo-check"><input type="checkbox" id="demo-boxes" ${s.boxes?'checked':''}>显示示例候选框</label><p class="demo-setting-note">场景和分数为示意。本页不调用摄像头或 YOLO 模型。</p>`;
    $('#demo-settings').innerHTML=content;
    if(view==='direction'){
      const form=$('#direction-form');
      form.addEventListener('input',()=>readDirection(false));
      form.addEventListener('change',()=>readDirection(false));
      form.addEventListener('submit',e=>{e.preventDefault();if(readDirection(true)){applied={...state.direction};directionStatus();}});
      form.querySelectorAll('[data-direction-axis]').forEach(button=>button.addEventListener('click',()=>{$('#direction-az').value=button.dataset.directionAxis;$('#direction-el').value=0;readDirection(false);}));
      directionStatus();
    } else {
      $('#demo-settings').querySelectorAll('input[type="range"]').forEach(input=>input.addEventListener('input',()=>{s[input.name]=input.valueAsNumber;refresh();}));
      if(view==='radar')$('#demo-color').addEventListener('change',e=>{s.color=e.target.value;refresh();});
      if(view==='vision')$('#demo-boxes').addEventListener('change',e=>{s.boxes=e.target.checked;refresh();});
      if(view==='vehicle')$('#reset-person').addEventListener('click',()=>{Object.assign(s,{x:6,y:-2});controls();refresh();});
    }
  }
  function readDirection(report){
    const max=$('#direction-max');max.setCustomValidity('');
    const form=$('#direction-form'), inputs=[...form.querySelectorAll('input[type="number"]')];
    let valid=inputs.every(input=>input.validity.valid&&Number.isFinite(input.valueAsNumber));
    if(valid&&$('#direction-min').valueAsNumber>=max.valueAsNumber){max.setCustomValidity('最大距离必须大于最小距离。');valid=false;}
    if(!valid){$('#direction-message').textContent=max.validationMessage||'请填写范围内的有效参数；角度、距离与点数不能为空。';$('#direction-message').classList.add('error');if(report)form.reportValidity();return false;}
    inputs.forEach(input=>state.direction[input.name]=input.valueAsNumber);
    state.direction.window=Number($('#direction-window').value);
    directionStatus();refresh();return true;
  }
  function directionStatus(){
    const status=$('#direction-message');if(!status)return;
    status.classList.remove('error');
    status.textContent=!applied?'调整参数预览选区；尚未连接雷达。':JSON.stringify(applied)===JSON.stringify(state.direction)?'方向预设已应用到演示 · 等待雷达接入。':'选区已预览 · 有尚未应用的修改。';
  }
  function readouts(values){$('#demo-readouts').replaceChildren(...values.map(([label,value,unit=''])=>{const node=document.createElement('div');const caption=document.createElement('span');caption.textContent=label;const number=document.createElement('strong');number.textContent=value;const suffix=document.createElement('small');suffix.textContent=unit;number.append(suffix);node.append(caption,number);return node;}));}
  function refresh(){
    const s=state[view];
    if(view==='direction'){
      $('#demo-scene-state').textContent=`水平 ${s.az}° / 俯仰 ${s.el}°`;
      readouts([['方向距离中位数','—','m'],['最近回波','—','m'],['方向内点数','—','点'],['数据连接','未连接']]);
      canvas.dataset.selection=`${s.az},${s.el},${s.ha},${s.he},${s.min},${s.max}`;
    } else if(view==='vehicle'){
      readouts([['预设 X',s.x.toFixed(1),'m'],['预设 Y',s.y.toFixed(1),'m'],['预设相对距离',Math.hypot(s.x,s.y).toFixed(2),'m'],['车体反馈','未绑定']]);
      $('#demo-settings [data-output="x"]').textContent=`${s.x.toFixed(1)} m`;$('#demo-settings [data-output="y"]').textContent=`${s.y.toFixed(1)} m`;
    } else if(view==='radar'){
      readouts([['示意点数',Math.round(cloud.length*s.density/100).toLocaleString(),'点'],['显示密度',s.density,'%'],['着色依据',s.color==='height'?'高度':'距离'],['数据来源','程序生成']]);
      $('#demo-settings [data-output="density"]').textContent=`${s.density}%`;$('#cloud-color-caption').textContent=s.color==='height'?'低 → 高':'近 → 远';
    } else {
      const count=[82,64].filter(conf=>conf>=s.threshold).length;
      readouts([['达阈值候选',String(count),'示例'],['筛选阈值',s.threshold,'%'],['框图层',s.boxes?'显示':'隐藏'],['模型执行','未运行']]);
      $('#demo-settings [data-output="threshold"]').textContent=`${s.threshold}%`;$('#demo-settings [data-output="time"]').textContent=`${s.time} s`;
    }
    draw();
  }
  function select(key){
    if(!Object.hasOwn(state,key))return;view=key;
    const [kicker,title,label,status,icon]=sceneMeta[key];
    $('#demo-kicker').textContent=kicker;$('#demo-title').textContent=title;$('#demo-scene-label').textContent=label;$('#demo-scene-state').textContent=status;$('.demo-icon').textContent=icon;
    $('#interactive-workbench').dataset.view=key;
    canvas.setAttribute('aria-label',`${title}，交互示意而非实测。${key==='vision'?'使用右侧阈值和时间轴控制。':'拖动或方向键旋转，点击后滚轮缩放，Home 复位。'}`);
    $('.demo-view-tools').hidden=key==='vision';controls();refresh();resize();
  }
  document.addEventListener('atlas:view',e=>select(e.detail));

  let seed=29351;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const cloud=Array.from({length:2600},()=>{const x=-8+random()*24,choice=random();let y,z;if(choice<.65){y=(random()<.5?-1:1)*5+(random()-.5)*.15;z=random()*3;}else if(choice<.92){const a=random()*Math.PI;y=Math.cos(a)*5;z=3+Math.sin(a)*3;}else{y=(random()-.5)*10;z=0;}return {p:[x,y,z],size:.6+random()*.8};});
  function project(p){const [x,y,z]=p;const f=x*Math.cos(yaw)+y*Math.sin(yaw),l=-x*Math.sin(yaw)+y*Math.cos(yaw),depth=f*Math.cos(pitch)-z*Math.sin(pitch);const factor=34/(34+depth),scale=(view==='vehicle'?Math.min(width/18,height/13):Math.min(width/23,height/18))*zoom;return {x:width*.5-l*scale*factor,y:height*.65-(f*Math.sin(pitch)+z*Math.cos(pitch))*scale*factor,depth};}
  function line(points,color='#47748860',thickness=1,fill=null){ctx.beginPath();points.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(color){ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();}}
  function label(p,text,color='#79adb9',offset=[6,0]){const q=project(p);ctx.font='11px "Segoe UI","Microsoft YaHei",sans-serif';ctx.fillStyle=color;ctx.fillText(text,q.x+offset[0],q.y+offset[1]);}
  function ring(r,z=0,color='#47748860'){line(Array.from({length:97},(_,i)=>[Math.cos(i/96*Math.PI*2)*r,Math.sin(i/96*Math.PI*2)*r,z]),color,.8);}
  function grid(){for(let n=-12;n<=16;n+=2){line([[n,-10,0],[n,10,0]],'#3b6b8527',.7);line([[-12,n,0],[16,n,0]],'#3b6b8527',.7);}for(const r of [4,8,12])ring(r,0,'#5dabb630');}
  function axes(size){line([[0,0,0],[size,0,0]],'#6ef1d6a0');line([[0,0,0],[0,size,0]],'#67aaf5a0');line([[0,0,0],[0,0,size]],'#82baf8a0');label([size,0,0],'+X · 前','#80f2d6');label([0,size,0],'+Y · 左','#85bdf5');label([0,0,size],'+Z','#85bdf5');}
  function point(p,color,size=2){const q=project(p);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q.x,q.y,size,0,Math.PI*2);ctx.fill();}
  function vehicleScene(){
    const {x,y}=state.vehicle;
    ringAt(x,y,.55,'#eac67870');
    AtlasModels.render(ctx,project,[{kind:'loader'},{kind:'worker',position:[x,y,0]}]);
    label([x,y,2.35],'人员 A · 预设','#e8cf9e',[-26,0]);
  }
  function ringAt(x,y,r,color){line(Array.from({length:49},(_,i)=>[x+Math.cos(i/48*Math.PI*2)*r,y+Math.sin(i/48*Math.PI*2)*r,.02]),color,1);}
  function direction(){
    const s=state.direction;
    ring(8,0,'#4ee9d690');
    for(let el=15;el<=75;el+=15)line(Array.from({length:73},(_,i)=>sphere(i*5,el)),'#4b9aa448',.8);
    for(let az=0;az<360;az+=30)line(Array.from({length:25},(_,i)=>sphere(az,i*90/24)),'#438d9e48',.8);
    if(s.el-s.he<0)for(const el of [-30,-60])line(Array.from({length:73},(_,i)=>sphere(i*5,el)),'#596c8d23',.7);
    axes(9);point([0,0,0],'#d3f5f3',4);label([0,0,0],'雷达原点','#b0d5db',[-20,20]);
    const near=8*s.min/s.max, a=s.az-s.ha,b=s.az+s.ha,c=clamp(s.el-s.he,-90,90),d=clamp(s.el+s.he,-90,90);
    const corners=r=>[sphere(a,c,r),sphere(b,c,r),sphere(b,d,r),sphere(a,d,r)];
    const inner=corners(near),outer=corners(8),color=s.el<0?'#dc8acb':'#ffbf62';
    for(let i=0;i<4;i++){const j=(i+1)%4;line([inner[i],outer[i],outer[j],inner[j]],color+'a0',1,color+'18');}
    const cap=[...Array.from({length:13},(_,i)=>sphere(a+(b-a)*i/12,c)),...Array.from({length:13},(_,i)=>sphere(b,c+(d-c)*i/12)),...Array.from({length:13},(_,i)=>sphere(b-(b-a)*i/12,d)),...Array.from({length:13},(_,i)=>sphere(a,d-(d-c)*i/12))];
    line(cap,color,1.3,color+'37');line([sphere(s.az,s.el,near),sphere(s.az,s.el,8)],color,2);point(sphere(s.az,s.el,8),color,4);
    label(sphere(s.az,s.el,8),`${s.min}–${s.max} m`,color,[9,-10]);
    ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#7294a3';ctx.fillText(`外壳参考 ${s.max} m · 角度选区示意`,18,height-20);
  }
  function radar(){const s=state.radar,limit=Math.round(cloud.length*s.density/100);grid();for(let i=0;i<limit;i++){const point=cloud[i],q=project(point.p);if(q.x<0||q.y<0||q.x>width||q.y>height)continue;const value=s.color==='height'?point.p[2]/6:Math.hypot(...point.p)/19;ctx.fillStyle=`hsla(${210-clamp(value,0,1)*180},85%,62%,.75)`;ctx.fillRect(q.x,q.y,point.size*1.5,point.size*1.5);}axes(4);}
  function vision(){
    const s=state.vision,vanish={x:width*.5,y:height*.35};
    const polygon=(pts,fill,stroke='#4d789332')=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();};
    polygon([[0,0],[width,0],[width*.66,vanish.y],[width*.34,vanish.y]],'#122431');polygon([[0,0],[width*.34,vanish.y],[width*.34,height*.6],[0,height]],'#132f3d');polygon([[width,0],[width*.66,vanish.y],[width*.66,height*.6],[width,height]],'#16323f');polygon([[0,height],[width*.34,height*.6],[width*.66,height*.6],[width,height]],'#183746');polygon([[width*.34,vanish.y],[width*.66,vanish.y],[width*.66,height*.6],[width*.34,height*.6]],'#071620');
    ctx.strokeStyle='#668d9f24';for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(vanish.x,height*.48);ctx.lineTo(width*i/8,height);ctx.stroke();}for(let i=0;i<4;i++){const y=height*(.62+i*.09);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    const t=s.time/60;const people=[{x:width*(.38+.2*Math.sin(t*Math.PI*2)),y:height*.80,h:height*.39,score:82,id:'A'},{x:width*(.64-.17*Math.sin(t*Math.PI*2)),y:height*.69,h:height*.27,score:64,id:'B'}];
    people.sort((a,b)=>a.y-b.y).forEach(p=>{
      const scale=p.h/1.86,top=p.y-p.h;
      AtlasModels.render(ctx,point=>({x:p.x-point[1]*scale,y:p.y-point[2]*scale,depth:-point[0]}),[{kind:'worker'}]);
      if(s.boxes&&p.score>=s.threshold){
        const x=p.x-p.h*.24,y=top-9,w=p.h*.48,h=p.h+17;
        ctx.strokeStyle='#5ce4d6';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#214b51';ctx.fillRect(x,y-21,Math.min(width-x-5,95),21);ctx.fillStyle='#adfff0';ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText(`${p.id} · 示例 ${p.score}%`,x+6,y-7);
      }
    });
    ctx.fillStyle='#80aab8';ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillText(`示意时间 ${s.time.toFixed(0).padStart(2,'0')} s / 60 s`,16,height-18);
  }
  function draw(){
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);const bg=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.5,width*.8);bg.addColorStop(0,'#102d3b');bg.addColorStop(1,'#08151f');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    if(view==='direction')direction();else if(view==='radar')radar();else if(view==='vision')vision();else{grid();axes(6);line([[0,0,.03],[state.vehicle.x,state.vehicle.y,.03]],'#eac67844',1);vehicleScene();}
    canvas.dataset.view=view;canvas.dataset.camera=[yaw.toFixed(2),pitch.toFixed(2),zoom.toFixed(2)].join(',');
  }
  function resize(){if(!ctx)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  const reset=()=>{yaw=-.6;pitch=.53;zoom=1;draw();};
  document.querySelectorAll('[data-demo-camera]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.demoCamera==='top'){yaw=0;pitch=1.5;zoom=1;draw();}else reset();}));
  canvas.addEventListener('pointerdown',e=>{if(view==='vision'||e.button!==0||!e.isPrimary)return;canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.008;pitch=clamp(pitch+(e.clientY-drag.y)*.006,.12,1.5);drag.x=e.clientX;drag.y=e.clientY;draw();});
  const end=()=>{drag=null;canvas.classList.remove('dragging');};
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,end));window.addEventListener('blur',end);
  canvas.addEventListener('wheel',e=>{if(view==='vision'||document.activeElement!==canvas)return;e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.55,1.8);draw();},{passive:false});
  canvas.addEventListener('keydown',e=>{if(view==='vision'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){reset();return;}if(e.key==='ArrowLeft')yaw+=.12;if(e.key==='ArrowRight')yaw-=.12;if(e.key==='ArrowUp')pitch=clamp(pitch+.08,.12,1.5);if(e.key==='ArrowDown')pitch=clamp(pitch-.08,.12,1.5);draw();});
  canvas.addEventListener('dblclick',reset);new ResizeObserver(resize).observe(canvas);
  if(!ctx)$('#demo-scene-state').textContent='当前浏览器无法显示图形预览';
})();
