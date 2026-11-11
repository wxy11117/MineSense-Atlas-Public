/* Scenario guide. Presentation content only; does not access sensors or experiment data. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const tabs=[...document.querySelectorAll('[data-scenario]')];
  const scenarios={
    geometry:{kicker:'01 / TUNNEL GEOMETRY',title:'先看清巷道，再讨论感知。',description:'在激光点云中观察巷道的轮廓与局部回波。以方向选区提出具体问题：这个方向有什么，距离如何分布，哪些回波值得回看。',input:'激光 XYZ 点云 · 毫米波独立回波',output:'空间视图 · 定向距离统计 · 源帧线索',status:'已有点云与测距界面',label:'体验定向测距',href:'#workspace',demo:'direction',map:'方向选区 / 几何观察',zone:'01'},
    people:{kicker:'02 / HUMAN–VEHICLE SPACE',title:'从一个候选，理解相对方位。',description:'以车体为参考，探索人员与车辆的空间关系。将视觉候选、坐标预设和原始观测放在一起，为后续外参验证与真实定位建立清晰的观察入口。',input:'摄像头 / YOLOv8m · 车体坐标约定',output:'人员候选查看 · 相对位置预设 · 复核线索',status:'已有检测 · 定位待验证',label:'探索车辆空间',href:'#workspace',demo:'vehicle',map:'人车关系 / 空间预设',zone:'02'},
    environment:{kicker:'03 / ENVIRONMENTAL RESEARCH',title:'把环境条件，写进实验依据。',description:'面向粉尘影响研究，串联粒径分布、Mie 光学条件与感知方案评估。保留原始点云作为基线，再比较不同条件下的派生结果。',input:'既有 Mie 仿真 · 计划接入的颗粒测量',output:'条件记录 · 原始基线 · 方案对比路径',status:'研究路径 · 颗粒测量待接入',label:'了解环境研究',href:'#research',demo:null,map:'颗粒条件 / 研究节点',zone:'03'}
  };
  function selectScenario(key,focus=false){
    const data=scenarios[key];if(!data)return;
    tabs.forEach(tab=>{const active=tab.dataset.scenario===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
    $('#scenario-panel').setAttribute('aria-labelledby',`scenario-${key}`);
    for(const [id,value] of Object.entries({'scenario-kicker':data.kicker,'scenario-title':data.title,'scenario-description':data.description,'scenario-input':data.input,'scenario-output':data.output,'scenario-status':data.status,'scenario-map-label':data.map}))$('#'+id).textContent=value;
    const link=$('#scenario-link');link.href=data.href;link.querySelector('span').textContent=data.label;
    if(data.demo)link.dataset.demoTarget=data.demo;else delete link.dataset.demoTarget;
    document.querySelectorAll('[data-map-zone]').forEach(zone=>zone.classList.toggle('is-active',zone.dataset.mapZone===data.zone));
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectScenario(tab.dataset.scenario));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();selectScenario(tabs[next].dataset.scenario,true);
    });
  });
  // Keep guide links on the same tab-selection path as the existing workbench.
  $('#scenario-link').addEventListener('click',event=>{
    const key=event.currentTarget.dataset.demoTarget;
    if(key)document.querySelector(`[data-view="${key}"]`)?.click();
  });
  new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting)),{threshold:.1}).observe($('#scenarios'));
  // Native disclosures work without JavaScript; keep only one answer expanded here.
  const answers=[...document.querySelectorAll('.faq-list details')];
  answers.forEach(answer=>answer.addEventListener('toggle',()=>{if(answer.open)answers.forEach(other=>{if(other!==answer)other.open=false;});}));
  const menu=$('.menu-toggle');
  menu.addEventListener('click',()=>{if(menu.getAttribute('aria-expanded')==='true')$('#navigation a').focus();});
  $('#navigation').addEventListener('keydown',event=>{if(event.key==='Escape')menu.focus();});
  selectScenario('geometry');
})();
