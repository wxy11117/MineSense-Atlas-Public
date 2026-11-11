/* Motion decorates the showcase only. No hardware states, readings or records are simulated here. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const root=document.documentElement,system=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
  const enabled=()=>!root.classList.contains('reduce-motion')&&!system.matches&&!document.hidden;
  const active=new Set();
  function enter(elements){
    if(!enabled())return;
    elements.filter(Boolean).forEach((element,index)=>{
      // Cancel a previous transition on the same element when tabs are switched quickly.
      for(const animation of active)if(animation.effect?.target===element){animation.cancel();active.delete(animation);}
      const animation=element.animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,delay:index*40,easing:'cubic-bezier(.2,.7,.2,1)'});
      active.add(animation);animation.finished.then(()=>active.delete(animation),()=>active.delete(animation));
    });
  }
  const zoneObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>target.classList.toggle('motion-inview',isIntersecting)),{threshold:0});
  $$('.hero,.sensor-card,.architecture-map,.evidence-record,.journey,.environment-flow,.experience').forEach(zone=>{zone.classList.add('motion-zone');zoneObserver.observe(zone);});
  const staggerObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
    if(!isIntersecting)return;target.classList.add('motion-seen');staggerObserver.unobserve(target);
  }),{threshold:.12});
  $$('.sensor-grid,.workspace-tabs,.evidence-tabs,.principles,.journey,.evidence-strip,.module-flow').forEach(group=>{
    [...group.children].forEach((child,i)=>{child.classList.add('motion-item');child.style.setProperty('--arrival-delay',`${i*85}ms`);});staggerObserver.observe(group);
  });
  const basePath=$('.graph-lines path');
  if(basePath){const trace=basePath.cloneNode();trace.classList.add('flow-trace');trace.setAttribute('aria-hidden','true');basePath.after(trace);}
  const cards=$$('.sensor-card,.workspace-tabs button,.evidence-tabs button,.environment-flow>div,.evidence-record');
  cards.forEach(card=>{
    let pending=null,point=null;
    function clear(){if(pending!==null)cancelAnimationFrame(pending);pending=null;point=null;['--pointer-x','--pointer-y','--tilt-x','--tilt-y'].forEach(key=>card.style.removeProperty(key));}
    card.addEventListener('pointermove',event=>{
      if(!enabled()||!fine.matches||event.pointerType!=='mouse')return;point={x:event.clientX,y:event.clientY};
      if(pending!==null)return;
      pending=requestAnimationFrame(()=>{pending=null;if(!enabled()||!point)return;const rect=card.getBoundingClientRect(),x=Math.max(0,Math.min(rect.width,point.x-rect.left)),y=Math.max(0,Math.min(rect.height,point.y-rect.top));card.style.setProperty('--pointer-x',`${x}px`);card.style.setProperty('--pointer-y',`${y}px`);if(card.classList.contains('sensor-card')){card.style.setProperty('--tilt-x',`${(0.5-y/rect.height)*4}deg`);card.style.setProperty('--tilt-y',`${(x/rect.width-0.5)*4}deg`);}});
    },{passive:true});
    card.addEventListener('pointerleave',clear);card.addEventListener('pointercancel',clear);document.addEventListener('atlas:motion',clear);document.addEventListener('visibilitychange',clear);
  });
  document.addEventListener('pointerdown',event=>{
    if(!enabled()||event.button!==0)return;
    const target=event.target.closest('.button,.workspace-tabs button,.evidence-tabs button,.graph-node');if(!target)return;
    target.querySelector('.motion-wave')?.remove();const rect=target.getBoundingClientRect(),wave=document.createElement('span');wave.className='motion-wave';wave.setAttribute('aria-hidden','true');wave.style.setProperty('--wave-x',`${event.clientX-rect.left}px`);wave.style.setProperty('--wave-y',`${event.clientY-rect.top}px`);wave.style.setProperty('--wave-size',`${Math.hypot(rect.width,rect.height)*2}px`);target.append(wave);wave.addEventListener('animationend',()=>wave.remove(),{once:true});
  },{passive:true});
  document.addEventListener('click',event=>{
    if(event.target.closest('.graph-node'))enter([$('#architecture-name'),$('#architecture-description'),$('#architecture-detail dl')]);
  });
  document.addEventListener('atlas:view',()=>enter([$('.demo-heading'),$('#demo-settings'),$('#demo-readouts'),$('.workspace-context')]));
  document.addEventListener('atlas:evidence-step',event=>{
    $('.evidence-tabs').style.setProperty('--step-progress',String((event.detail+1)/4));enter([$('.evidence-copy'),$('.evidence-record')]);
  });
  let scrollFrame=null;
  function updateScroll(){
    scrollFrame=null;const distance=Math.max(1,root.scrollHeight-innerHeight);root.style.setProperty('--read-progress',String(Math.min(1,Math.max(0,scrollY/distance))));
    const hero=$('.hero');hero.style.setProperty('--hero-drift',enabled()&&fine.matches?`${Math.min(scrollY,hero.offsetHeight)*.08}px`:'0px');
  }
  function scheduleScroll(){if(scrollFrame===null)scrollFrame=requestAnimationFrame(updateScroll);}
  window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll,{passive:true});new ResizeObserver(scheduleScroll).observe(document.body);
  function sync(){
    root.classList.toggle('page-inactive',document.hidden);
    if(!enabled()){for(const animation of active)animation.cancel();active.clear();$$('.motion-wave').forEach(wave=>wave.remove());}
    scheduleScroll();
  }
  document.addEventListener('atlas:motion',sync);document.addEventListener('visibilitychange',sync);system.addEventListener('change',sync);sync();
})();
