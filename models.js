/* Shared illustrative meshes. Dimensions describe the display model, not a CAD measurement. */
(() => {
  'use strict';
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const light=unit([-.4,-.6,1]);
  function face(mesh,pts,color,emissive=false){
    const n=unit(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])));
    const luminance=emissive?1:.61+.39*Math.max(0,n.reduce((sum,v,i)=>sum+v*light[i],0));
    const rgb=color.match(/\w\w/g).map(c=>Math.round(parseInt(c,16)*luminance));
    mesh.push({pts,color:`rgb(${rgb.join(',')})`,edge:emissive?'#d2fff222':'#a7d1d01b'});
  }
  function box(mesh,x,y,z,l,w,h,color){
    const p=[[x,y,z],[x+l,y,z],[x+l,y+w,z],[x,y+w,z],[x,y,z+h],[x+l,y,z+h],[x+l,y+w,z+h],[x,y+w,z+h]];
    [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(mesh,ids.map(i=>p[i]),color));
  }
  function tube(mesh,a,b,r,color,sides=12,rEnd=r){
    const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[2])>.9?[1,0,0]:[0,0,1])),v=cross(axis,u);
    const ring=(p,radius)=>Array.from({length:sides},(_,i)=>add(p,add(mul(u,Math.cos(i/sides*2*Math.PI)*radius),mul(v,Math.sin(i/sides*2*Math.PI)*radius))));
    const p=ring(a,r),q=ring(b,rEnd);face(mesh,[...p].reverse(),color);face(mesh,q,color);
    for(let i=0;i<sides;i++){const j=(i+1)%sides;face(mesh,[p[i],p[j],q[j],q[i]],color);}
  }
  function ellipsoid(mesh,c,r,color,rows=6,sides=12){
    const at=(i,j)=>[c[0]+r[0]*Math.cos(i/rows*Math.PI-Math.PI/2)*Math.cos(j/sides*2*Math.PI),c[1]+r[1]*Math.cos(i/rows*Math.PI-Math.PI/2)*Math.sin(j/sides*2*Math.PI),c[2]+r[2]*Math.sin(i/rows*Math.PI-Math.PI/2)];
    for(let i=0;i<rows;i++)for(let j=0;j<sides;j++)face(mesh,[at(i,j),at(i,j+1),at(i+1,j+1),at(i+1,j)],color);
  }
  function wheel(mesh,x,y){
    tube(mesh,[x,y-.21,.59],[x,y+.21,.59],.57,'#263d46',20);
    for(let i=0;i<20;i++){
      const a=i/20*Math.PI*2,b=a+.19;
      const p=(angle,side,r=.583)=>[x+Math.cos(angle)*r,y+side,.59+Math.sin(angle)*r];
      face(mesh,[p(a,-.22),p(b,-.22),p(b+.1,.22),p(a+.1,.22)],i%2?'#465b61':'#354a53');
    }
    for(const side of [-1,1]){
      tube(mesh,[x,y+side*.212,.59],[x,y+side*.235,.59],.38,'#172a33',20);
      tube(mesh,[x,y+side*.237,.59],[x,y+side*.26,.59],.25,'#91a9ac',12);
      tube(mesh,[x,y+side*.262,.59],[x,y+side*.29,.59],.105,'#40616b',12);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;tube(mesh,[x+Math.cos(a)*.17,y+side*.261,.59+Math.sin(a)*.17],[x+Math.cos(a)*.17,y+side*.273,.59+Math.sin(a)*.17],.022,'#cedcdf',6);}
    }
  }
  function loader(){
    const m=[],body='#83a9ad',steel='#537b86',dark='#294651',gold='#d5b76d';
    box(m,-2.05,-.8,.53,1.9,1.6,.55,body);box(m,.25,-.75,.52,1.38,1.5,.48,body);
    box(m,-.18,-.35,.64,.52,.7,.31,dark);tube(m,[.05,0,.45],[.05,0,1.06],.18,'#b7c8c8');
    box(m,-2.15,-.87,.52,.19,1.74,.25,dark);box(m,-1.96,-.68,1.08,1.03,1.36,.36,body);
    for(let i=0;i<8;i++)box(m,-1.88+i*.108,-.53,1.445,.045,1.06,.015,dark);
    for(let i=0;i<6;i++)box(m,-2.166,-.54+i*.18,.65,.02,.1,.22,'#769496');
    box(m,-.87,-.65,1.04,1.04,1.3,.09,steel);
    // Tapered glazed cabin with separate frame, roof, sill and entry step.
    box(m,-.78,-.57,1.14,.88,1.14,.62,'#275568');
    face(m,[[.105,-.48,1.21],[.105,.48,1.21],[.105,.43,1.7],[.105,-.43,1.7]],'#6db5c4');
    for(const side of [-1,1]){
      face(m,[[-.69,side*.576,1.23],[-.02,side*.576,1.23],[-.08,side*.576,1.69],[-.64,side*.576,1.69]],'#43869d');
      tube(m,[-.74,side*.59,1.11],[-.7,side*.59,1.78],.035,body,6);
      tube(m,[.06,side*.59,1.11],[.02,side*.59,1.78],.035,body,6);
      box(m,-.75,side<0?-.8:.65,.86,.83,.15,.08,dark);
      tube(m,[-.55,side*.61,1.32],[-.36,side*.61,1.32],.018,'#cfdddf',6);
      tube(m,[.03,side*.56,1.53],[.19,side*.87,1.56],.018,steel,6);box(m,.12,side<0?-.96:.85,1.49,.12,.11,.2,dark);
    }
    box(m,-.89,-.7,1.77,1.16,1.4,.1,'#b3c9c9');
    // Low-mounted arms, silver piston rods and open bucket facing +X.
    const armStart=m.length;
    for(const y of [-.54,.54]){
      tube(m,[.78,y,.98],[2.4,y,.49],.095,steel,6);
      tube(m,[.7,y,.77],[1.62,y,.92],.065,gold,10);
      tube(m,[1.5,y,.9],[2.24,y,.62],.031,'#dce5e3',10);
      tube(m,[2.22,y-.08,.5],[2.22,y+.08,.5],.12,dark,10);
    }
    m.slice(armStart).forEach(f=>f.part='arm');
    const bucketStart=m.length;
    const profile=[[2.23,.22],[2.18,.88],[2.43,.84],[3.39,.13],[3.39,.06]];
    for(const side of [-1,1])face(m,profile.map(([x,z])=>[x,side*1.11,z]),gold);
    face(m,[[2.23,-1.11,.22],[3.39,-1.11,.06],[3.39,1.11,.06],[2.23,1.11,.22]],gold);
    face(m,[[2.23,-1.08,.24],[2.23,1.08,.24],[2.43,1.08,.82],[2.43,-1.08,.82]],'#8d794c');
    box(m,3.25,-1.15,.08,.19,2.3,.09,'#e2d3a8');
    for(const y of [-.9,-.45,0,.45,.9])box(m,3.39,y-.065,.055,.23,.13,.09,'#abbab8');
    m.slice(bucketStart).forEach(f=>f.part='bucket');
    for(const x of [-1.36,1.08])for(const y of [-.94,.94]){const start=m.length;wheel(m,x,y);m.slice(start).forEach(f=>{f.part='wheel';f.pivot=[x,y,.59];});}
    for(const x of [-1.36,1.08])for(const y of [-.99,.99])box(m,x-.61,y-.17,1.18,1.22,.34,.075,steel);
    for(const y of [-.57,.57]){
      box(m,1.63,y-.1,.77,.03,.2,.13,dark);face(m,[[1.666,y-.08,.79],[1.666,y+.08,.79],[1.666,y+.08,.88],[1.666,y-.08,.88]],'#d3fff1',true);
      box(m,-2.166,y-.08,.84,.02,.16,.1,'#dc846d');
    }
    tube(m,[-1.16,.43,1.4],[-1.16,.43,1.93],.045,dark,8);tube(m,[-1.16,.43,1.93],[-1.31,.43,1.93],.046,dark,8);
    // LiDAR, camera pod and beacon remain geometrical design cues.
    tube(m,[-.36,0,1.87],[-.36,0,1.98],.16,dark,16);tube(m,[-.36,0,1.98],[-.36,0,2.06],.18,'#69e2cf',16);tube(m,[-.36,0,2.06],[-.36,0,2.1],.17,'#d3e4dd',16);
    box(m,.27,-.12,1.42,.12,.24,.18,dark);tube(m,[.39,0,1.51],[.42,0,1.51],.065,'#7be5dd',12);
    tube(m,[-.72,.48,1.88],[-.72,.48,2.04],.065,'#edbf66',10);
    return m;
  }
  function worker(){
    const m=[],navy='#3d6478',vest='#d3b96a',skin='#bcaa91',boot='#263f4c',stripe='#dbe8c7';
    // Slightly offset stance, articulated limbs and dimensional protective clothing.
    box(m,-.11,-.21,.04,.38,.18,.15,boot);box(m,-.13,.05,.04,.36,.18,.15,boot);
    tube(m,[0,-.13,.2],[-.035,-.14,.59],.09,navy,8);tube(m,[-.035,-.14,.59],[0,-.13,.94],.104,navy,8);
    tube(m,[-.02,.14,.2],[.07,.14,.57],.09,navy,8);tube(m,[.07,.14,.57],[0,.13,.94],.104,navy,8);
    box(m,-.13,-.23,.86,.29,.46,.17,navy);
    const bottom=[[-.14,-.21,1],[.15,-.21,1],[.15,.21,1],[-.14,.21,1]],top=[[-.13,-.25,1.4],[.17,-.25,1.4],[.17,.25,1.4],[-.13,.25,1.4]];
    for(let i=0;i<4;i++){const j=(i+1)%4;face(m,[bottom[i],bottom[j],top[j],top[i]],vest);}face(m,top,vest);
    box(m,-.146,-.225,1.08,.305,.45,.045,stripe);
    for(const y of [-.15,.12])box(m,.17,y,1.16,.012,.035,.23,stripe);
    for(const s of [-1,1]){
      const shoulder=[0,s*.28,1.36],elbow=[.035,s*.35,1.1],wrist=[.12,s*.35,.91];
      ellipsoid(m,shoulder,[.11,.105,.12],navy,4,8);tube(m,shoulder,elbow,.078,navy,8);tube(m,elbow,wrist,.067,navy,8);ellipsoid(m,wrist,[.074,.068,.084],skin,4,8);
    }
    tube(m,[0,0,1.39],[0,0,1.52],.066,skin,8);ellipsoid(m,[.015,0,1.61],[.116,.13,.15],skin,6,12);
    ellipsoid(m,[0,0,1.74],[.145,.154,.115],'#e4c376',4,12);tube(m,[0,0,1.705],[0,0,1.735],.178,'#f0d395',16);
    box(m,.152,-.043,1.735,.035,.086,.05,'#c4f6e8');box(m,.124,-.09,1.61,.012,.18,.048,'#254753');
    return m;
  }
  const meshes={loader:loader(),worker:worker()};
  function render(ctx,project,instances){
    const faces=[];
    for(const {kind,position=[0,0,0],scale=1,heading=0,wheelAngle=0,lift=0,bucketTilt=0} of instances)for(const item of meshes[kind]){
      const pts=item.pts.map(original=>{
        let p=[...original];
        if(item.part==='wheel'&&wheelAngle){const [x,y,z]=sub(p,item.pivot),c=Math.cos(wheelAngle),s=Math.sin(wheelAngle);p=add([x*c+z*s,y,-x*s+z*c],item.pivot);}
        if(item.part==='bucket'){
          const x=p[0]-2.23,z=p[2]-.45,c=Math.cos(bucketTilt),s=Math.sin(bucketTilt);
          p=[2.23+x*c-z*s,p[1],.45+x*s+z*c+lift];
        } else if(item.part==='arm')p[2]+=lift*Math.max(0,Math.min(1,(p[0]-.7)/1.6));
        const c=Math.cos(heading),s=Math.sin(heading);p=[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];
        return project(add(mul(p,scale),position));
      });
      faces.push({pts,color:item.color,edge:item.edge,depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});
    }
    faces.sort((a,b)=>b.depth-a.depth);
    for(const f of faces){ctx.beginPath();f.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.edge;ctx.lineWidth=.45;ctx.stroke();}
  }
  window.AtlasModels=Object.freeze({render});
})();
