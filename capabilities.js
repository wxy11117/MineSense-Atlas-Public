(() => {
  'use strict';
  const stages=[
    {step:'01 / SELECT',title:'先找到这一帧来自哪里',text:'从采集片段进入时间轴，保留录像、雷达记录和源帧标识。后续每一次查看都能回到同一个起点。',checks:['选择片段与观测时间','保留原始记录，不覆盖源数据','确认视频与雷达时间依据'],label:'SOURCE / 来源示例',fields:[['记录片段','clip_demo_01'],['源帧标识','frame_00128'],['时间依据','主机时间 · 示例'],['数据性质','格式示例，非采集记录']]},
    {step:'02 / OBSERVE',title:'并排观察，让差异可见',text:'在同一时间线索下对照录像、点云与模型候选。需要判断空间关系时，再检查坐标约定与标定依据。',checks:['查看原画面与人员候选框','对照 LiDAR 与毫米波回波','区分时间关联与空间配准'],label:'OBSERVATION / 观测示例',fields:[['关联源帧','frame_00128'],['视觉候选','candidate_A · 示意'],['雷达坐标','传感器原生坐标'],['空间对应','待标定依据验证']]},
    {step:'03 / REVIEW',title:'让人工判断独立于模型输出',text:'模型候选和复核结论分别保留。复核人员可以回看原始证据，对关联、遮挡或不确定情况留下说明。',checks:['先核对源帧与候选来源','分别记录模型输出和人工判断','保留无法确认的情况与备注'],label:'REVIEW / 复核示例',fields:[['候选来源','candidate_A · 示意'],['人工状态','未复核'],['关联判断','待填写'],['复核备注','由复核人员记录']]},
    {step:'04 / RETAIN',title:'留存依据，便于下一次比较',text:'在实验工作台导出带来源的记录，用于回查和算法对比。完整的来源与条件比单独一个结果更有价值。',checks:['带上片段、源帧与条件信息','保留模型版本与人工记录','把未复核状态一并留存'],label:'EXPORT / 记录结构',fields:[['来源字段','片段 / 源帧 / 时间依据'],['观测字段','坐标 / 模型 / 候选'],['复核字段','状态 / 关联 / 备注'],['当前演示','仅展示结构，不生成实验记录']]}
  ];
  const buttons=[...document.querySelectorAll('[data-evidence-step]')];
  function select(index,focus=false){
    const data=stages[index];
    buttons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;if(i===index&&focus)button.focus();});
    const panel=document.querySelector('#evidence-panel');panel.setAttribute('aria-labelledby',buttons[index].id);
    for(const [id,key] of [['evidence-kicker','step'],['evidence-title','title'],['evidence-description','text'],['record-label','label']])document.getElementById(id).textContent=data[key];
    document.querySelector('#evidence-checks').replaceChildren(...data.checks.map(text=>Object.assign(document.createElement('li'),{textContent:text})));
    const fields=document.querySelector('#evidence-fields');fields.replaceChildren();
    for(const [label,value] of data.fields){const row=document.createElement('div');row.append(Object.assign(document.createElement('dt'),{textContent:label}),Object.assign(document.createElement('dd'),{textContent:value}));fields.append(row);}
    document.querySelector('#record-step').textContent=`0${index+1} / 04`;
    document.dispatchEvent(new CustomEvent('atlas:evidence-step',{detail:index}));
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4,true);});
  });
  select(0);
})();
