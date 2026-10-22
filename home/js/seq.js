/* Frame-sequence player: compressed blobs in memory, small window of decoded ImageBitmaps. */
(function(){
function Seq(o){
  this.n=o.count; this.hi=o.hi; this.lo=o.lo||null; this.loStep=o.loStep||4;
  this.canvas=o.canvas; this.ctx=o.canvas.getContext('2d',{alpha:false});
  this.fit=o.fit||'cover'; this.bg=o.bg||'#120c0a'; this.focusY=o.focusY==null?.5:o.focusY; this.minFill=o.minFill||1;
  this.cap=o.cap||32; this.iw=o.iw; this.ih=o.ih; this.blobHi=new Array(this.n); this.blobLo=[];
  this.bmp=new Map(); this.bmpLo=new Map(); this.pending=new Set(); this.cur=0; this.drawn=-1; this.dir=1;
  this.fetching=0; this.maxFetch=o.maxFetch||6; this.decoding=0; this.maxDec=o.maxDec||3; this.loaded=0; this.onProgress=o.onProgress;
  this.resize(); var s=this; addEventListener('resize',function(){s.resize();s.drawn=-1;s.draw(s.cur);});
}
Seq.prototype.resize=function(){
  var c=this.canvas, r=c.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2);
  if(this.iw){ var scc=this.fit==='contain'?Math.min(r.width/this.iw,r.height/this.ih):Math.max(r.width/this.iw,r.height*this.minFill/this.ih); d=Math.min(d,Math.max(.5,1/scc)); }
  this.cw=Math.round(r.width*d); this.ch=Math.round(r.height*d);
  if(c.width!==this.cw||c.height!==this.ch){c.width=this.cw;c.height=this.ch;}
  this.ctx.imageSmoothingEnabled=true; this.ctx.imageSmoothingQuality='low';
};
Seq.prototype.start=function(){
  var s=this;
  var loadLo=function(){
    if(!s.lo) return Promise.resolve();
    var m=Math.ceil(s.n/s.loStep), idx=0;
    return new Promise(function(res){
      var active=0, done=0;
      function next(){ while(active<8&&idx<m){ (function(i){active++;
        fetch(s.lo(i)).then(function(r){return r.blob()}).then(function(b){s.blobLo[i]=b;}).catch(function(){}).finally(function(){active--;done++; if(i===0) s.want(); if(done===m) res(); else next();});
      })(idx++);} }
      next();
    });
  };
  return loadLo().then(function(){ s.want(); s.pump(); });
};
Seq.prototype.nextFetch=function(){
  var c=this.cur, best=-1, bd=1e9;
  for(var k=0;k<this.n;k++){ if(this.blobHi[k]!==undefined) continue;
    var d=k-c; d = d>=0 ? d : -d*2.2; if(this.dir<0) d = k<=c ? (c-k) : (k-c)*2.2;
    if(d<bd){bd=d;best=k;} }
  return best;
};
Seq.prototype.pump=function(){
  var s=this;
  while(s.fetching<s.maxFetch){
    var k=s.nextFetch(); if(k<0) return;
    s.blobHi[k]=null; s.fetching++;
    (function(k){ fetch(s.hi(k)).then(function(r){return r.blob()}).then(function(b){s.blobHi[k]=b; s.loaded++; s.onProgress&&s.onProgress(s.loaded/s.n);})
      .catch(function(){s.blobHi[k]=undefined;}).finally(function(){s.fetching--; s.want(); s.pump();}); })(k);
  }
};
Seq.prototype.decode=function(map,key,blob,cap){
  var s=this; if(map.has(key)||s.pending.has(map===s.bmp?key:'l'+key)||!blob) return;
  var pk=map===s.bmp?key:'l'+key; s.pending.add(pk); s.decoding++;
  createImageBitmap(blob).then(function(b){ map.set(key,b); s.evict(map,cap); if(Math.abs(key*(map===s.bmp?1:s.loStep)-s.cur)<3) s.draw(s.cur,true); })
    .catch(function(){}).finally(function(){s.pending.delete(pk); s.decoding--; s.want();});
};
Seq.prototype.evict=function(map,cap){
  if(map.size<=cap) return; var c=map===this.bmp?this.cur:this.cur/this.loStep, s=this;
  var keys=Array.from(map.keys()).sort(function(a,b){return Math.abs(b-c)-Math.abs(a-c)});
  while(map.size>cap){ var k=keys.shift(); var b=map.get(k); map.delete(k); b&&b.close&&b.close(); }
};
Seq.prototype.want=function(){
  var c=this.cur, ahead=this.dir>=0?1:-1;
  // low tier near frames
  if(this.lo){ var lc=Math.round(c/this.loStep); for(var j=-2;j<=4;j++){var q=lc+j*ahead; if(q>=0&&q<this.blobLo.length) this.decode(this.bmpLo,q,this.blobLo[q],24);} }
  var order=[0]; for(var i=1;i<this.cap/2;i++){order.push(i*ahead); if(i<6) order.push(-i*ahead);}
  for(var o=0;o<order.length&&this.decoding<this.maxDec;o++){ var k=c+order[o]; if(k<0||k>=this.n) continue; var b=this.blobHi[k]; if(b) this.decode(this.bmp,k,b,this.cap); }
};
Seq.prototype.pick=function(i){
  var st=this.stat||(this.stat={hi:0,near:0,lo:0,miss:0});
  var b=this.bmp.get(i); if(b){st.hi++; return b;}
  for(var d=1;d<=3;d++){ b=this.bmp.get(i-d*this.dir)||this.bmp.get(i+d*this.dir); if(b){st.near++; return b;} }
  if(this.lo){ var q=Math.round(i/this.loStep); for(var e=0;e<4;e++){ b=this.bmpLo.get(q)||this.bmpLo.get(q-e)||this.bmpLo.get(q+e); if(b){st.lo++; return b;} } }
  st.miss++; return null;
};
Seq.prototype.set=function(i){
  i=Math.max(0,Math.min(this.n-1,i|0)); if(i!==this.cur){ this.dir=i>this.cur?1:-1; this.cur=i; this.want(); }
  this.draw(i);
};
Seq.prototype.draw=function(i,force){
  if(window.__NODRAW) return;
  var b=this.pick(i); if(!b) return; if(!force&&this.drawn===i&&this.lastB===b) return;
  var cw=this.cw, ch=this.ch, iw=b.width, ih=b.height, sc;
  if(this.fit==='contain') sc=Math.min(cw/iw,ch/ih); else sc=Math.max(cw/iw, ch*this.minFill/ih);
  var w=iw*sc, h=ih*sc, x=(cw-w)/2, y=(ch-h)*this.focusY;
  var ctx=this.ctx; if(w<cw||h<ch){ctx.fillStyle=this.bg;ctx.fillRect(0,0,cw,ch);}
  ctx.drawImage(b,x,y,w,h); this.drawn=i; this.lastB=b;
};
window.Seq=Seq;
})();
