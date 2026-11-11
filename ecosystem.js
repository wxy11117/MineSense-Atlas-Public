/* Presents project progress and the ecosystem; never connects to or controls a vehicle. */
(() => {
  'use strict';
  const section=document.querySelector('#ecosystem');if(!section)return;
  const $=selector=>section.querySelector(selector);
  const tabs=[...section.querySelectorAll('[data-eco-node]')];
  const nodes={
    vehicle:{number:'01',kicker:'VEHICLE / PHYSICAL FOUNDATION',title:'车端与执行系统',description:'以铲运车为物理载体，用车体坐标表达车身、铲斗与传感器的安装关系。树莓派已接入，下一步完善车体反馈与数字模型的对应关系。',status:'已有车体预设 · 状态映射待验证',input:'车体原点、结构尺寸、传感器安装位置。',output:'车速、转向角、工作装置和设备状态的映射规划。',dependency:'底盘协议、单位、采样频率及实车反馈需确认；展示站不下发控制指令。',focus:'从物理车体出发：+X 前、+Y 左、+Z 上。',domain:'physical',link:'查看车辆空间预设',href:'#workspace',demo:'vehicle'},
    sensing:{number:'02',kicker:'SENSING / MULTISENSOR OBSERVATION',title:'感知与安装布局',description:'激光雷达提供空间回波，毫米波保留独立观测，相机记录画面。围绕安装方位、视场和遮挡组织传感器，让每种观测保持可识别的来源。',status:'已有点云与视频 · 联合标定待验证',input:'激光 XYZ 点云、毫米波回波、电脑内置或 USB 摄像头。',output:'空间观测、视频画面与后续算法使用的原始记录。',dependency:'核对外参和时间依据；二自由度云台、粉尘传感器仍为后续接入方向。',focus:'保留各传感器原生坐标，再验证与车体的安装关系。',domain:'physical',link:'探索雷达与视觉架构',href:'#architecture'},
    edge:{number:'03',kicker:'EDGE / DATA TRANSPORT',title:'边缘计算与通信',description:'树莓派已接入，成为连接车端与本机平台的边缘节点。电脑侧承担观察、推理与复核，后续围绕数据格式、时间对应和状态映射完善协同。',status:'树莓派已接入',input:'树莓派边缘节点；车端观测、反馈与心跳的字段需逐项核对。',output:'拟统一的消息字段：来源、时间戳、序号、坐标系、单位与质量标记。',dependency:'接入状态已更新；通信延迟、断连恢复、时间同步及车体反馈映射仍需实测验证。',focus:'树莓派已接入 · 继续完善车端数据与平台的状态映射。',domain:'both',link:'了解设备与标定模块',href:'#capabilities',module:'4'},
    intelligence:{number:'04',kicker:'PERCEPTION / SPATIAL INTELLIGENCE',title:'空间感知与智能',description:'将 YOLO 人员候选与雷达观测放在同一研究路径中。先验证时间和坐标的对应，再开展三维定位、跨帧跟踪与移动建图研究。',status:'已有 YOLOv8m · 融合定位待验证',input:'点云、图像、内外参、同步依据与实验参数。',output:'当前支持候选查看与测距；后续研究人员位置、轨迹和巷道地图。',dependency:'候选框不是三维位置；SLAM、多人跟踪与动作识别需独立数据与验证。',focus:'从观测到解释：先验证对应关系，再评估定位和建图。',domain:'digital',link:'体验视觉候选查看',href:'#workspace',demo:'vision'},
    twin:{number:'05',kicker:'TWIN / DIGITAL REPRESENTATION',title:'数字孪生与场景',description:'把车辆结构、矿道、人员与作业阶段组织成可观察的数字空间。当前用预设轨迹演示作业；后续以真实地图、定位与反馈驱动状态映射。',status:'已有循环演示 · 实测映射待接入',input:'当前为概念矿道、三维简模与预设作业周期。',output:'全景、跟车、俯视及作业阶段展示，支持扫描、路线、人员图层。',dependency:'真实地图配准、状态同步和映射误差需验证；演示不等于车辆动力学模型。',focus:'从物理状态到数字映射：当前展示由预设场景驱动。',domain:'digital',link:'进入地下作业孪生',href:'#twin-viewer'},
    validation:{number:'06',kicker:'EVIDENCE / RESEARCH VALIDATION',title:'数据与实验验证',description:'把源帧、模型候选与人工判断分开留存，用回放追溯每一次观察。再结合环境条件与标定依据，为不同方案建立可比较的实验过程。',status:'已有回放复核 · 系统验证持续完善',input:'原始片段、候选输出、人工复核、标定与环境条件。',output:'来源清楚的复核记录，以及定位、同步、建图方案的验证路径。',dependency:'真值、评价指标和适用工况需明确；Mie 仿真条件不能替代粉尘实测。',focus:'验证连接两端：用真实记录检验数字表达与感知结果。',domain:'both',link:'查看证据记录流程',href:'#evidence-journey'}
  };
  function select(key,focus=false){
    const data=nodes[key];if(!data)return;
    tabs.forEach(tab=>{const active=tab.dataset.ecoNode===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
    $('#eco-panel').setAttribute('aria-labelledby',`eco-tab-${key}`);
    section.dataset.selectedNode=key;
    $('#eco-status').dataset.stage=({vehicle:'demo',twin:'demo'})[key]||'ready';
    for(const field of ['kicker','title','description','status','input','output','dependency','focus','number'])$('#eco-'+field).textContent=data[field];
    section.querySelectorAll('[data-eco-domain]').forEach(domain=>domain.classList.toggle('dimmed',data.domain!=='both'&&domain.dataset.ecoDomain!==data.domain));
    const link=$('#eco-link');link.href=data.href;link.querySelector('span').textContent=data.link;
    link.dataset.demo=data.demo||'';link.dataset.module=data.module||'';
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab.dataset.ecoNode));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();select(tabs[next].dataset.ecoNode,true);
    });
  });
  $('#eco-link').addEventListener('click',event=>{
    const {demo,module}=event.currentTarget.dataset;
    if(demo)document.querySelector(`[data-view="${demo}"]`)?.click();
    if(module){const button=document.querySelector(`#module-button-${module}`);if(button?.getAttribute('aria-expanded')==='false')button.click();}
  });
  new IntersectionObserver(entries=>entries.forEach(entry=>section.classList.toggle('eco-visible',entry.isIntersecting)),{threshold:.05}).observe(section);
  select('vehicle');
})();
