(function(){
if(/nodraw/.test(location.search)) window.__NODRAW=1;
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm=1/.test(location.search);
var portrait=function(){return innerWidth/innerHeight<1};
var P=portrait(), T=P?'m':'d';
var pad=function(i){return String(i).padStart(3,'0')};
var hero=document.getElementById('hero'), dish=document.getElementById('dish');
var chs=[].slice.call(document.querySelectorAll('.ch')).map(function(el){return {el:el,r:el.dataset.r.split(',').map(Number),o:-1,y:0}});
var facts=[].slice.call(document.querySelectorAll('.f')).map(function(el){return {el:el,at:+el.dataset.at,on:false}});
var LUT=window.HERO_LUT, N=721;

// reveal + counters (IntersectionObserver, transform/opacity only)
document.querySelectorAll('.grid .rv').forEach(function(el,i){el.style.transitionDelay=(i%3)*90+'ms'});
var counters=[];
var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(!e.isIntersecting) return; var t=e.target;
  if(t.dataset.c){ counters.push({el:t,to:+t.dataset.c,d:+(t.dataset.d||0),s:t.dataset.s||'',t0:performance.now()}); }
  else t.classList.add('on'); io.unobserve(t); })},{rootMargin:'0px 0px -12% 0px'});
document.querySelectorAll('.rv,[data-c]').forEach(function(el){io.observe(el)});
function fmt(v,d){return d?v.toFixed(d):Math.round(v).toLocaleString('en-US')}
function tickCounters(now){ for(var i=counters.length-1;i>=0;i--){var c=counters[i],k=Math.min(1,(now-c.t0)/1600),e=1-Math.pow(1-k,4);
  c.el.textContent=fmt(c.to*e,c.d)+(k===1?c.s:''); if(k===1) counters.splice(i,1);} }

if(RM){
  document.documentElement.classList.add('rm');
  facts.forEach(function(f){f.el.classList.add('on')});
  var dc=document.getElementById('dishc'), im=new Image(); im.onload=function(){var r=dc.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);dc.width=r.width*d;dc.height=r.height*d;dc.getContext('2d').drawImage(im,0,0,dc.width,dc.height)}; im.src='frames/dish/000.webp';
  (function loop(t){tickCounters(t);requestAnimationFrame(loop)})(0);
  return;
}

var seq=new Seq({canvas:document.getElementById('seq'),count:N,hi:function(i){return 'frames/'+T+'/'+pad(i)+'.webp'},lo:function(i){return 'frames/'+T+'l/'+pad(i)+'.webp'},
  iw:P?720:1280,ih:P?960:720,loStep:4,cap:P?26:40,maxFetch:P?4:6,maxDec:(+new URLSearchParams(location.search).get("dec"))||8,focusY:P?.42:.5,minFill:P?.8:1});
seq.start();
var dseq=new Seq({canvas:document.getElementById('dishc'),count:145,iw:640,ih:640,hi:function(i){return 'frames/dish/'+pad(i)+'.webp'},cap:P?20:30,maxFetch:3});
var dishStarted=false;

var lenis=new Lenis({lerp:.1,smoothWheel:true});
window.__lenis=lenis; window.__seq=seq; window.__dseq=dseq;
var hT,hH,dT,dH,vh;
function measure(){vh=innerHeight;hT=hero.offsetTop;hH=hero.offsetHeight-vh;dT=dish.offsetTop;dH=dish.offsetHeight-vh;}
measure(); addEventListener('resize',measure); addEventListener('load',measure);
var clamp=function(v,a,b){return v<a?a:v>b?b:v};
var lastS=-1;
function frame(t){
  lenis.raf(t);
  var s=lenis.animatedScroll;
  tickCounters(t);
  if(s!==lastS){ lastS=s;
    // hero
    var p=clamp((s-hT)/hH,0,1);
    if(s<hT+hH+vh){
      var fp=clamp(p/.9,0,1), fi=LUT[Math.round(fp*(N-1))];
      seq.set(Math.round(fi));
      for(var i=0;i<chs.length;i++){var c=chs[i],r=c.r,o,y;
        if(p<r[0]){o=0;y=36}else if(p<r[1]){var k=(p-r[0])/(r[1]-r[0]);o=k;y=36*(1-k)}else if(p<=r[2]){o=1;y=0}else if(p<r[3]){var k2=(p-r[2])/(r[3]-r[2]);o=1-k2;y=-36*k2}else{o=0;y=-36}
        if(r[1]===0&&p<=r[2]){o=1;y=0}
        o=Math.round(o*100)/100; y=Math.round(y);
        if(o!==c.o||y!==c.y){c.o=o;c.y=y; c.el.style.opacity=o; c.el.style.transform=(c.el.classList.contains('end')&&!P?'translate3d(-50%,':c.el.classList.contains('end')?'translate3d(-50%,':'translate3d(0,')+y+'px,0)'; c.el.style.visibility=o>0?'visible':'hidden';}
      }
    }
    // dish
    if(!dishStarted && s>dT-vh*2.5){dishStarted=true;dseq.start();}
    if(s>dT-vh && s<dT+dH+vh){
      var dp=clamp((s-dT)/dH,0,1);
      dseq.set(Math.round(clamp(dp/.86,0,1)*144));
      for(var j=0;j<facts.length;j++){var f=facts[j],on=dp>=f.at&&s>dT-vh*.4; if(on!==f.on){f.on=on;f.el.classList.toggle('on',on);}}
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
