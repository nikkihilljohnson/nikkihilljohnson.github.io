(function(){
  /* ---------- current page + in-page jumps ---------- */
  var current=document.body.getAttribute("data-page");
  var navCur=document.getElementById("nav-"+(current==="nnd"?"campaigns":current)); if(navCur) navCur.setAttribute("aria-current","page");
  document.querySelectorAll("[data-jump]").forEach(function(el){
    el.addEventListener("click",function(e){
      var t=document.getElementById(el.getAttribute("data-jump")); if(!t) return;
      e.preventDefault(); closeMenu();
      t.scrollIntoView({behavior:"smooth"});
    });
  });

  /* ---------- mobile menu ---------- */
  var hdr=document.querySelector("header.site"), mb=document.getElementById("menu-btn");
  function closeMenu(){hdr.classList.remove("menu-open");mb.setAttribute("aria-expanded","false");}
  mb.addEventListener("click",function(){var o=hdr.classList.toggle("menu-open");mb.setAttribute("aria-expanded",o?"true":"false");});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&hdr.classList.contains("menu-open")){closeMenu();mb.focus();}});

  /* ---------- video thumbnails: pink play button opens the lightbox ---------- */
  document.querySelectorAll("main video").forEach(function(v){
    v.removeAttribute("controls");
    var w=document.createElement("span");w.className="vwrap";v.parentNode.insertBefore(w,v);w.appendChild(v);
    var b=document.createElement("button");b.type="button";b.className="play";b.setAttribute("aria-label","Play video"+(cap(v)?": "+cap(v):""));b.innerHTML="<span></span>";w.appendChild(b);
  });
  function cap(el){var f=el.closest("figure");var c=f&&f.querySelector("figcaption");return c?c.textContent.trim():"";}

  /* ---------- horizontal rails with desktop arrows ---------- */
  document.querySelectorAll(".case .media").forEach(function(m){
    var r=document.createElement("div");r.className="rail";m.parentNode.insertBefore(r,m);
    var p=document.createElement("button"),n=document.createElement("button");
    p.type=n.type="button";p.className="rail-btn prev";n.className="rail-btn next";p.innerHTML="←";n.innerHTML="→";
    p.setAttribute("aria-label","Scroll to earlier work");n.setAttribute("aria-label","Scroll to more work");
    r.appendChild(p);r.appendChild(m);r.appendChild(n);
    function upd(){var max=m.scrollWidth-m.clientWidth-2;p.disabled=m.scrollLeft<=2;n.disabled=m.scrollLeft>=max;}
    function step(d){m.scrollBy({left:d*m.clientWidth*0.8,behavior:"smooth"});}
    p.addEventListener("click",function(){step(-1)});n.addEventListener("click",function(){step(1)});
    m.addEventListener("scroll",upd,{passive:true});window.addEventListener("resize",upd);
    m.querySelectorAll("img").forEach(function(i){i.addEventListener("load",upd)});
    upd(); setTimeout(upd,600);
  });

  /* ---------- shared lightbox for every portfolio image, video, and carousel ---------- */
  var GROUPS=".media, #gallery, .rwall, .ba, .tc-track, .rc-grid";
  var lbx=document.getElementById("lbx"),stage=document.getElementById("lbx-stage"),cnt=document.getElementById("lbx-count"),
      capEl=document.getElementById("lbx-cap"),prevB=document.getElementById("lbx-prev"),nextB=document.getElementById("lbx-next");
  var seq=[],pos=0,opener=null,isOpen=false;

  function entriesFor(fig){
    var c=fig.querySelector(".carbtn"),v=fig.querySelector("video"),i=fig.querySelector("img"),t=cap(fig).replace(/\s+/g," ");
    if(c){var slug=c.getAttribute("data-car"),n=+c.getAttribute("data-n"),out=[];
      var mo=c.hasAttribute("data-motion"),base="/media/car/"+slug+"/";
      for(var k=1;k<=n;k++)out.push(mo?{type:"video",motion:true,src:base+k+".mp4",poster:base+k+".jpg",w:864,h:1080,cap:t+" · slide "+k+" of "+n,fig:fig}
        :{type:"img",src:base+k+".jpg",alt:(c.querySelector("img").alt||"")+", slide "+k,cap:t+" · slide "+k+" of "+n,fig:fig});
      return out;}
    if(v)return [{type:"video",src:v.getAttribute("src"),poster:v.getAttribute("poster"),w:v.getAttribute("width"),h:v.getAttribute("height"),cap:t,fig:fig}];
    if(i)return [{type:"img",src:i.getAttribute("src"),alt:i.alt,cap:(fig.closest(".rc")?"Behind the numbers · ":"")+t,lbw:i.getAttribute("data-lbw"),fig:fig}];
    return [];
  }
  function figsIn(g){return Array.prototype.filter.call(g.children,function(f){return f.tagName==="FIGURE"&&!f.hidden;});}

  // make each portfolio item an obvious, keyboard-reachable trigger
  document.querySelectorAll(GROUPS).forEach(function(g){
    figsIn(g).forEach(function(f){
      var t=f.querySelector(".carbtn")||f.querySelector(".play")||f.querySelector("img");
      if(!t)return;
      if(t.tagName==="IMG"){t.setAttribute("tabindex","0");t.setAttribute("role","button");t.setAttribute("aria-label","View larger: "+(t.alt||cap(f)));}
      t.classList.add("lbable");t.setAttribute("data-lbtrigger","");
    });
  });
  document.addEventListener("click",function(e){
    var t=e.target.closest("[data-lbtrigger]");if(!t)return;
    e.preventDefault();openFrom(t,t.classList.contains("play"));
  });
  document.addEventListener("keydown",function(e){
    var t=e.target;if((e.key==="Enter"||e.key===" ")&&t.matches&&t.matches("img[data-lbtrigger]")){e.preventDefault();openFrom(t,false);}
  });

  function openFrom(trigger,autoplay){
    var fig=trigger.closest("figure"),g=fig.parentElement;
    seq=[];var start=0;
    figsIn(g).forEach(function(f){if(f===fig)start=seq.length;seq=seq.concat(entriesFor(f));});
    opener=trigger;pos=start;
    lbx.hidden=false;isOpen=true;document.documentElement.style.overflow="hidden";
    try{history.pushState({lbx:true},"");}catch(e){}
    render(autoplay);
    document.getElementById("lbx-close").focus();
  }
  function render(autoplay){
    stage.classList.remove("zoom");stage.innerHTML="";
    var it=seq[pos];
    if(it.type==="img"){
      var im=document.createElement("img");im.src=it.src;im.alt=it.alt||"";if(it.lbw)im.style.width=it.lbw+"px";
      im.addEventListener("click",function(){if(window.matchMedia("(hover:hover)").matches)stage.classList.toggle("zoom");});
      stage.appendChild(im);
    }else{
      var v=document.createElement("video");v.src=it.src;v.poster=it.poster||"";v.controls=true;v.playsInline=true;v.setAttribute("playsinline","");v.preload="metadata";
      if(it.w&&it.h){v.width=+it.w;v.height=+it.h;}
      if(it.motion){v.controls=false;v.muted=true;v.loop=true;v.preload="auto";autoplay=true;}
      stage.appendChild(v);
      if(autoplay){var p=v.play();if(p&&p.catch)p.catch(function(){});}
    }
    cnt.textContent=seq.length>1?(pos+1)+" / "+seq.length:"";
    capEl.textContent=it.cap||"";
    prevB.disabled=pos===0;nextB.disabled=pos===seq.length-1;
    prevB.hidden=nextB.hidden=seq.length<2;
  }
  function go(d){var n=pos+d;if(n<0||n>=seq.length)return;pos=n;render(false);}
  function teardown(){
    if(!isOpen)return;isOpen=false;
    stage.querySelectorAll("video").forEach(function(v){v.pause();});
    stage.innerHTML="";lbx.hidden=true;document.documentElement.style.overflow="";
    if(opener&&document.body.contains(opener))opener.focus();
  }
  function close(){ if(!isOpen)return; if(history.state&&history.state.lbx){history.back();}else{teardown();} }
  window.addEventListener("popstate",function(){ if(isOpen)teardown(); });
  window.addEventListener("hashchange",function(){ if(isOpen)teardown(); });
  document.getElementById("lbx-close").addEventListener("click",close);
  prevB.addEventListener("click",function(){go(-1)});nextB.addEventListener("click",function(){go(1)});
  lbx.addEventListener("click",function(e){if(e.target===lbx||e.target===stage)close();});
  document.addEventListener("keydown",function(e){
    if(!isOpen)return;
    if(e.key==="Escape"){e.preventDefault();close();}
    else if(e.key==="ArrowRight"){go(1);}
    else if(e.key==="ArrowLeft"){go(-1);}
    else if(e.key==="Tab"){ // keep focus inside the dialog
      var f=Array.prototype.filter.call(lbx.querySelectorAll("button,video"),function(x){return !x.hidden&&!x.disabled;});
      if(!f.length)return;var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
    }
  });
  // swipe between items (single finger, not while zoomed or pinching)
  var sx=null,sy=null;
  stage.addEventListener("touchstart",function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY;}else sx=null;},{passive:true});
  stage.addEventListener("touchend",function(e){
    if(sx===null||stage.classList.contains("zoom")||(window.visualViewport&&window.visualViewport.scale>1.05))return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)go(dx<0?1:-1);
  },{passive:true});

  /* ---------- work gallery: client links, filters, ordered masonry ---------- */
  var gal=document.getElementById("gallery");
  if(gal){
  var CL={};try{CL=JSON.parse(document.getElementById("work-clients").textContent);}catch(e){}
  Array.prototype.forEach.call(gal.querySelectorAll(".tile"),function(t){
    var c=CL[t.getAttribute("data-client")],fc=t.querySelector("figcaption");
    if(!c||!fc)return;
    var a=document.createElement("a");a.className="cl";a.textContent=c.name;
    a.href="/"+c.page+"#"+c.case;a.setAttribute("aria-label",c.name+": see the case study");
    var sep=document.createElement("span");sep.className="sep";sep.setAttribute("aria-hidden","true");sep.textContent="·";
    fc.insertBefore(sep,fc.firstChild);fc.insertBefore(document.createTextNode(" "),sep);fc.insertBefore(a,sep.previousSibling);
    fc.insertBefore(document.createTextNode(" "),sep.nextSibling);
  });
  function layout(){
    if(!gal.offsetParent)return; // view hidden
    gal.classList.add("masonry");
    var W=gal.clientWidth,gap=16,rowGap=16,n=W>=860?4:(W>=560?3:2);
    var w=(W-gap*(n-1))/n,h=[];for(var i=0;i<n;i++)h.push(0);
    Array.prototype.forEach.call(gal.querySelectorAll(".tile"),function(t){
      if(t.hidden)return;
      t.style.width=w+"px";
      var c=0;for(var j=1;j<n;j++)if(h[j]<h[c]-1)c=j;
      t.style.transform="translate("+(c*(w+gap))+"px,"+h[c]+"px)";
      h[c]+=t.offsetHeight+rowGap;
    });
    gal.style.height=Math.max(0,Math.max.apply(null,h)-rowGap)+"px";
  }
  var raf=null;function relayout(){if(raf)return;raf=requestAnimationFrame(function(){raf=null;layout();});}
  window.addEventListener("resize",relayout);
  window.addEventListener("hashchange",function(){setTimeout(relayout,0);});
  window.addEventListener("load",relayout);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(relayout);
  if("ResizeObserver" in window){var ro=new ResizeObserver(relayout);Array.prototype.forEach.call(gal.querySelectorAll(".tile figcaption, .tile img"),function(x){ro.observe(x);});}
  relayout();
  var chips=document.querySelectorAll(".chips button");
  chips.forEach(function(c){
    c.addEventListener("click",function(){
      var f=c.getAttribute("data-f");
      chips.forEach(function(o){o.setAttribute("aria-pressed",o===c?"true":"false");});
      gal.querySelectorAll(".tile").forEach(function(t){
        t.hidden = !(f==="all" || (" "+t.getAttribute("data-k")+" ").indexOf(" "+f+" ")>-1);
      });
      layout();
    });
  });

  }
  /* ---------- copy email ---------- */
  var btn=document.getElementById("copy-email");
  btn.addEventListener("click",function(){
    var el=document.getElementById("email");
    function sel(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent="Selected. Press Ctrl/⌘ C";}
    try{navigator.clipboard.writeText(el.textContent).then(function(){btn.textContent="Copied";setTimeout(function(){btn.textContent="Copy email"},1800)},sel);}catch(e){sel();}
  });
})();


/* Odometer-style roll for the big pink stats. Runs once per stat, when it scrolls into view.
   The real number stays in the HTML; without JS or with reduced motion nothing changes. */
(function(){
  if(!("IntersectionObserver" in window))return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var els=[].slice.call(document.querySelectorAll(".proof .big, .case .stats dd")).filter(function(e){return /\d/.test(e.textContent)&&!e.children.length;});
  var DUR=1200,EASE="cubic-bezier(.16,.84,.3,1)";
  function roll(el,delay){
    var txt=el.textContent,cs=getComputedStyle(el),fs=parseFloat(cs.fontSize),lh=parseFloat(cs.lineHeight);
    if(!lh||isNaN(lh))lh=fs;
    var ih=Math.round(fs*1.35),w=Math.max(lh,fs*.98),off=(w-ih)/2;
    var box=document.createElement("span");box.className="odo";
    box.style.setProperty("--lh",lh+"px");box.style.setProperty("--ih",ih+"px");box.style.setProperty("--w",w+"px");
    box.setAttribute("aria-hidden","true");
    var strips=[],digits=0;
    for(var i=0;i<txt.length;i++){var ch=txt[i],c=document.createElement("span");c.className="oc";
      var st=document.createElement("span");st.className="os";st.style.transform="translateY("+off+"px)";
      if(/\d/.test(ch)){var d=+ch,h="";for(var j=0;j<10+d+1;j++)h+="<span>"+(j%10)+"</span>";st.innerHTML=h;strips.push([st,10+d,digits++]);}
      else{var one=document.createElement("span");one.textContent=ch;st.appendChild(one);}
      c.appendChild(st);box.appendChild(c);}
    el.setAttribute("aria-label",txt);el.textContent="";el.appendChild(box);
    void box.offsetWidth;
    strips.forEach(function(x){var st=x[0];
      st.style.transition="transform "+DUR+"ms "+EASE+" "+(delay+x[2]*60)+"ms";
      st.style.transform="translateY("+(off-x[1]*ih)+"px)";});
    setTimeout(function(){el.textContent=txt;el.removeAttribute("aria-label");},delay+digits*60+DUR+80);
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);
      var sibs=[].slice.call(e.target.closest(".proof, .stats").querySelectorAll(".big, dd"));
      roll(e.target,Math.max(0,sibs.indexOf(e.target))*110);
    });
  },{threshold:.6});
  els.forEach(function(e){io.observe(e);});
})();


/* Gentle reveal for case studies: text block and stats fade up, gallery slides in. Once each. */
(function(){
  if(!("IntersectionObserver" in window))return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var items=[];
  document.querySelectorAll(".case").forEach(function(c){
    var m=c.querySelector(":scope > .main"),st=c.querySelector(":scope > .statwrap, :scope > .stats"),
        g=c.querySelector(":scope > .rail")||c.querySelector(":scope > .media"),ba=c.querySelector(":scope > .ba");
    if(m)items.push([m,""]);if(st)items.push([st,""]);if(ba)items.push([ba,""]);if(g)items.push([g,"rv-x"]);
  });
  document.documentElement.classList.add("mo");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.08,rootMargin:"0px 0px -6% 0px"});
  items.forEach(function(x){x[0].classList.add("rv");if(x[1])x[0].classList.add(x[1]);io.observe(x[0]);});
  // anything already on screen when a view opens shows right away (no waiting)
})();


/* Receipts carousel: one card at a time, every 7s. Pauses on hover/focus/touch; stops for good after manual navigation. */
(function(){
  var sec=document.getElementById("receipts"); if(!sec)return;
  var track=sec.querySelector(".tc-track"),cards=[].slice.call(track.querySelectorAll(".tc-card")),
      dots=[].slice.call(sec.querySelectorAll(".tc-dots button")),prev=sec.querySelector(".tc-prev"),next=sec.querySelector(".tc-next");
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stopped=reduce,paused=false,visible=false,timer=null,DELAY=7000;
  // screenshots taller than their frame get a fade and "Tap to read"
  function markTall(){sec.querySelectorAll(".tc-imgbox").forEach(function(b){var i=b.querySelector("img");if(!i)return;var h=b.clientWidth*(+i.getAttribute("height")/ +i.getAttribute("width"));b.classList.toggle("tall",h>b.clientHeight+4);});}
  function maxScroll(){return track.scrollWidth-track.clientWidth;}
  function pad(){return parseFloat(getComputedStyle(track).scrollPaddingLeft)||0;}
  function idx(){var x=track.scrollLeft,best=0,bd=1e9;cards.forEach(function(c,i){var d=Math.abs(c.offsetLeft-pad()-x);if(d<bd){bd=d;best=i;}});if(track.scrollLeft>=maxScroll()-4)best=Math.max(best,lastReachable());return best;}
  function lastReachable(){for(var i=0;i<cards.length;i++){if(cards[i].offsetLeft-pad()>=maxScroll()-4)return i;}return cards.length-1;}
  function go(i){i=(i+cards.length)%cards.length;track.scrollTo({left:Math.min(cards[i].offsetLeft-pad(),maxScroll()),behavior:reduce?"auto":"smooth"});}
  function sync(){var k=idx();dots.forEach(function(d,j){if(j===k)d.setAttribute("aria-current","true");else d.removeAttribute("aria-current");});}
  function tick(){if(stopped||paused||!visible||document.hidden)return;var k=idx();go(k>=lastReachable()?0:k+1);}
  function start(){clearInterval(timer);if(!stopped)timer=setInterval(tick,DELAY);}
  function stop(){stopped=true;clearInterval(timer);}
  prev.addEventListener("click",function(){stop();go(idx()-1);});
  next.addEventListener("click",function(){stop();var k=idx();go(k>=lastReachable()?0:k+1);});
  dots.forEach(function(d,j){d.addEventListener("click",function(){stop();go(j);});});
  ["pointerdown","wheel","keydown"].forEach(function(ev){track.addEventListener(ev,function(e){if(ev==="wheel"&&Math.abs(e.deltaX)<Math.abs(e.deltaY))return;stop();},{passive:true});});
  sec.addEventListener("mouseenter",function(){paused=true;});
  sec.addEventListener("mouseleave",function(){paused=false;});
  sec.addEventListener("focusin",function(){paused=true;});
  sec.addEventListener("focusout",function(){paused=false;});
  track.addEventListener("scroll",function(){window.requestAnimationFrame(sync);},{passive:true});
  if("IntersectionObserver" in window){new IntersectionObserver(function(es){visible=es[0].isIntersecting;},{threshold:.35}).observe(track);}else visible=true;
  window.addEventListener("resize",function(){markTall();sync();});
  track.querySelectorAll("img").forEach(function(i){i.addEventListener("load",markTall);});
  markTall();sync();start();
  // "See the receipts" link on the Work page
  document.querySelectorAll("[data-receipts]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();
    var jump=function(){sec.scrollIntoView({behavior:reduce?"auto":"smooth"});};
    if(!document.getElementById("view-home")){location.href="/#receipts";}else jump();});});
})();


/* "See the receipts": closed by default, opens a full-width panel of analytics screenshots */
(function(){
  [].slice.call(document.querySelectorAll(".rc-btn")).forEach(function(b){
    var p=document.getElementById(b.getAttribute("aria-controls"));if(!p)return;
    var inner=p.querySelector(".rc-in"),t=b.querySelector(".rc-t");
    function set(open,scroll){
      b.setAttribute("aria-expanded",open?"true":"false");t.textContent=open?"Hide the receipts":"See the receipts";
      p.classList.toggle("open",open);inner.inert=!open;
      if(open){inner.removeAttribute("aria-hidden");p.querySelectorAll("img[loading=lazy]").forEach(function(i){i.loading="eager";});}
      else inner.setAttribute("aria-hidden","true");
      if(open&&scroll)setTimeout(function(){var r=p.getBoundingClientRect();if(r.bottom>innerHeight)p.scrollIntoView({block:"nearest",behavior:"smooth"});},420);
    }
    set(false);b.addEventListener("click",function(){set(b.getAttribute("aria-expanded")!=="true",true);});
  });
})();
