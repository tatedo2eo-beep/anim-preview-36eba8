(function(){
var D=window.DRINKS, N=D.length, root=document.documentElement;
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]rm=1/.test(location.search);
var QA=/[?&]qa=1/.test(location.search);
if(RM) root.classList.add('rm');
var car=document.getElementById('car'), stage=document.getElementById('stage'), ring=document.getElementById('ring'),
    bgs=document.getElementById('bgs'), info=document.getElementById('info'), dots=document.getElementById('dots'), curEl=document.getElementById('cur');
var G=[],B=[],I=[],DT=[];
function clamp(v,a,b){return v<a?a:v>b?b:v}
function pad(n){return (n<10?'0':'')+n}
D.forEach(function(d,i){
  var bg=document.createElement('div'); bg.className='bg';
  bg.style.background='radial-gradient(ellipse 34% 46% at var(--sx) 30%,'+d.spot+'59,transparent 72%),radial-gradient(ellipse 90% 60% at var(--sx) 104%,'+d.c1+',transparent 70%),linear-gradient(180deg,'+d.c1+' 0%,'+d.c2+' 100%)';
  bgs.appendChild(bg); B.push({el:bg,o:-1});
  var g=document.createElement('div'); g.className='g';
  g.innerHTML='<img class="b" alt="" decoding="async" src="img/'+d.id+'_b.webp"><img class="s" alt="'+d.name+'" decoding="async" src="img/'+d.id+'.webp">';
  ring.appendChild(g); G.push({el:g,s:g.querySelector('.s'),b:g.querySelector('.b'),t:'',so:-1,bo:-1,z:-1,v:''});
  var it=document.createElement('div'); it.className='it'; it.setAttribute('aria-hidden',i?'true':'false');
  it.innerHTML='<p class="k" style="color:'+d.acc+'">'+pad(i+1)+' · '+d.kick+'</p><h2>'+d.name+'</h2><p>'+d.line+'</p><div class="tags">'+d.tags.map(function(t){return '<span>'+t+'</span>'}).join('')+'</div><div class="meta"><span><b>'+d.min+' min</b>to make</span><span><b>'+d.kcal+'</b>kcal</span><span><b>0%</b>alcohol</span></div><a class="btn" href="#">Get the recipe</a>';
  info.appendChild(it); I.push({el:it,o:-1,y:null});
  var b=document.createElement('button'); b.setAttribute('aria-label',d.name); b.onclick=function(){go(i)}; dots.appendChild(b); DT.push(b);
});
// grid
var grid=document.getElementById('grid');
D.forEach(function(d,i){ var c=document.createElement('div'); c.className='card'; c.style.background='linear-gradient(180deg,'+d.c1+','+d.c2+')';
  c.innerHTML='<img alt="" loading="lazy" src="img/'+d.id+'.webp"><b>'+d.name+'</b><span>'+d.kick+'</span>'; c.onclick=function(){go(i)}; grid.appendChild(c); });
var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ var k=[].indexOf.call(grid.children,e.target); e.target.style.transitionDelay=(RM?0:k*70)+'ms'; e.target.classList.add('in'); io.unobserve(e.target);} })},{threshold:.15});
[].forEach.call(grid.children,function(c){io.observe(c)});

// geometry
var vw,vh,P,gh,gw,cx,cy,R,step,top0,ANG=.75;
function layout(){
  vw=innerWidth; vh=stage.clientHeight; P=vw/vh<1;
  if(P){ var base=vh-372; gh=Math.min(vh*.7,(base-78)/.673,vw*1.75); cx=vw/2; cy=base-.25*gh; R=vw*.62; }
  else { gh=Math.min(vh*.86,1150); cx=vw*.64; cy=vh*.8-.25*gh; R=Math.min(vw*.3,gh*.7); }
  gw=gh*640/1200; step=Math.round(vh*(P?.75:.9));
  car.style.height=(vh+step*(N-1))+'px';
  stage.style.setProperty('--gw',gw+'px'); stage.style.setProperty('--gh',gh+'px');
  stage.style.setProperty('--cx',cx+'px'); stage.style.setProperty('--cy',cy+'px'); stage.style.setProperty('--sx',(cx/vw*100).toFixed(1)+'%');
  top0=car.getBoundingClientRect().top+(window.scrollY||0);
  G.forEach(function(g){g.t=''}); last=-1;
}
var lenis=null;
if(!RM && window.Lenis){ lenis=new Lenis({lerp:.1,smoothWheel:true}); window.__lenis=lenis; }
function sy(){return lenis?lenis.animatedScroll:window.scrollY}
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function go(i){ i=clamp(i,0,N-1); var y=top0+i*step; if(lenis) lenis.scrollTo(y,{duration:Math.min(1.4,.75+.18*Math.abs(i-pos)),easing:ease,force:true}); else window.scrollTo(0,y); }
window.__go=go;
document.getElementById('prev').onclick=function(){go(Math.round(pos)-1)};
document.getElementById('next').onclick=function(){go(Math.round(pos)+1)};
addEventListener('keydown',function(e){ if(pos<=-.5||pos>=N-.5) return; if(e.key==='ArrowRight'){go(Math.round(pos)+1);e.preventDefault()} if(e.key==='ArrowLeft'){go(Math.round(pos)-1);e.preventDefault()} });

// drag / swipe (horizontal); vertical touch stays native scroll
var dr=null;
stage.addEventListener('pointerdown',function(e){ if(e.target.closest('button,a')) return; dr={x:e.clientX,y:e.clientY,s:top0+clamp(pos,0,N-1)*step,mode:0,t:performance.now(),lx:e.clientX,vx:0,id:e.pointerId}; });
addEventListener('pointermove',function(e){ if(!dr||e.pointerId!==dr.id) return; var dx=e.clientX-dr.x, dy=e.clientY-dr.y;
  if(!dr.mode){ if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.2){dr.mode=1; stage.classList.add('drag'); try{stage.setPointerCapture(e.pointerId)}catch(_){} } else if(Math.abs(dy)>10){dr=null;return} else return; }
  var now=performance.now(), dt=Math.max(1,now-dr.t); dr.vx=.8*((e.clientX-dr.lx)/dt)+.2*dr.vx; dr.lx=e.clientX; dr.t=now;
  var y=clamp(dr.s-dx*step/(P?vw*.8:vw*.32),top0,top0+(N-1)*step); if(lenis) lenis.scrollTo(y,{immediate:true,force:true}); else window.scrollTo(0,y); });
function up(e){ if(!dr) return; var m=dr.mode, vx=dr.vx; dr=null; stage.classList.remove('drag'); if(!m) return;
  var tgt=Math.abs(vx)>.35?(vx<0?Math.ceil(pos):Math.floor(pos)):Math.round(pos); go(tgt); }
addEventListener('pointerup',up); addEventListener('pointercancel',up);

// snap when idle inside the section
var lastY=0, idle=0, dir=1, snapping=false;
var wheelT=0, wheelStart=null;
addEventListener('wheel',function(){ var n=performance.now(); if(wheelStart===null) wheelStart=lenis?lenis.targetScroll:scrollY; wheelT=n; },{passive:true});
function snap(now){
  if(lenis&&wheelStart!==null&&now-wheelT>110){
    var tg=lenis.targetScroll, pt=(tg-top0)/step, wd=tg>=wheelStart?1:-1; wheelStart=null;
    if(pt>0&&pt<N-1){ var fr=pt-Math.floor(pt); if(fr>.003&&fr<.997){ idle=now+1e4; lastY=sy(); go(wd>0?Math.ceil(pt-.16):Math.floor(pt+.16)); return; } }
  }
  if(wheelStart!==null) return;
  var y=sy(); if(Math.abs(y-lastY)>.5){ dir=y>lastY?1:-1; lastY=y; idle=now; return; }
  if(dr||now-idle<(lenis?140:220)) return;
  if(pos<=0||pos>=N-1) return;
  var f=pos-Math.floor(pos); if(f<.003||f>.997) return;
  var t=dir>0?Math.ceil(pos-.16):Math.floor(pos+.16); idle=now+1e4; go(t);
}

// render
var pos=0, last=-1, front=-1, minEdge=1e9;
function render(){
  for(var i=0;i<N;i++){
    var d=i-pos, ad=Math.abs(d), g=G[i];
    var vis=ad<3.1?'visible':'hidden'; if(vis!==g.v){g.v=vis; g.el.style.visibility=vis;}
    if(vis==='hidden') continue;
    var a=clamp(d,-3.2,3.2)*ANG, z=1-Math.cos(a), s=1/(1+z*1.6), x=Math.sin(a)*R, ty=.25*gh*(1-s)-z*gh*.06;
    var tr='translate3d('+x.toFixed(1)+'px,'+ty.toFixed(1)+'px,0) scale('+s.toFixed(4)+')';
    if(tr!==g.t){g.t=tr; g.el.style.transform=tr;}
    var op=clamp(1.3-ad*.42,0,1), so=clamp(1-ad*1.15,0,1)*op, bo=(1-clamp(1-ad*1.15,0,1))*op*.92;
    so=Math.round(so*100)/100; bo=Math.round(bo*100)/100;
    if(so!==g.so){g.so=so; g.s.style.opacity=so;} if(bo!==g.bo){g.bo=bo; g.b.style.opacity=bo;}
    var zi=100-Math.round(ad*10); if(zi!==g.z){g.z=zi; g.el.style.zIndex=zi;}
  }
  for(i=0;i<N;i++){
    var w=Math.round(clamp(1-Math.abs(i-pos),0,1)*100)/100, bb=B[i]; if(i===0&&pos<0) w=1; if(i===N-1&&pos>N-1) w=1;
    if(w!==bb.o){bb.o=w; bb.el.style.opacity=w; bb.el.style.visibility=w>0?'visible':'hidden';}
    var it=I[i], dd=i-pos, o=Math.round(clamp(1-Math.abs(dd)*2.4,0,1)*100)/100, yy=Math.round(dd*-46);
    if(o!==it.o||yy!==it.y){it.o=o;it.y=yy; it.el.style.opacity=o; it.el.style.transform='translate3d(0,'+yy+'px,0)'; it.el.style.visibility=o>0?'visible':'hidden';}
  }
  var f=clamp(Math.round(pos),0,N-1);
  if(f!==front){ if(front>=0){DT[front].classList.remove('on'); I[front].el.setAttribute('aria-hidden','true');} front=f; DT[f].classList.add('on'); I[f].el.setAttribute('aria-hidden','false'); curEl.textContent=pad(f+1); root.style.setProperty('--acc',D[f].acc); }
  if(QA&&pos>=0&&pos<=N-1){ var fr=G[f].s.getBoundingClientRect(), cwid=fr.width*300/640, l=fr.left+fr.width/2-cwid/2; minEdge=Math.min(minEdge,l,vw-(l+cwid),fr.top+fr.height*92/1200); }
}
window.__perfExtra=function(){return {minEdgePx:QA?Math.round(minEdge):null, step:step, gh:Math.round(gh)}};
function frame(t){
  if(lenis) lenis.raf(t);
  var p=clamp((sy()-top0)/step,-1,N);
  if(p!==last){ last=p; pos=p; render(); }
  snap(t);
  requestAnimationFrame(frame);
}
layout(); pos=0; render();
addEventListener('resize',function(){layout(); render();});
addEventListener('load',function(){layout();});
requestAnimationFrame(frame);
})();
