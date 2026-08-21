(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
class AstroHoverCard{
  constructor({elementId="astroHoverCard",offset=14}={}){this.el=document.getElementById(elementId);this.offset=offset;this.visible=false;this.currentId=null}
  render(info){
    if(!this.el)return;
    const rows=(info?.rows||[]).filter(r=>r&&r.value!=null&&r.value!=="");
    const badges=(info?.badges||[]).filter(Boolean);
    let html='<div class="astroHoverHead"><div><b>'+esc(info?.title||'')+'</b>';
    if(info?.subtitle)html+='<span>'+esc(info.subtitle)+'</span>';
    html+='</div>';
    if(badges.length)html+='<div class="astroHoverBadges">'+badges.map(x=>'<i>'+esc(x)+'</i>').join('')+'</div>';
    html+='</div>';
    if(rows.length)html+='<div class="astroHoverRows">'+rows.map(r=>'<div><span>'+esc(r.label)+'</span><b>'+esc(r.value)+'</b></div>').join('')+'</div>';
    this.el.innerHTML=html;
  }
  show(info,x,y){if(!this.el||!info)return;this.render(info);this.currentId=info.id||null;this.visible=true;this.el.classList.add("open");this.move(x,y)}
  move(x,y){if(!this.el||!this.visible)return;const pad=10,w=this.el.offsetWidth||230,h=this.el.offsetHeight||100;let left=x+this.offset,top=y+this.offset;if(left+w>innerWidth-pad)left=Math.max(pad,x-w-this.offset);if(top+h>innerHeight-pad)top=Math.max(pad,y-h-this.offset);this.el.style.left=`${Math.round(left)}px`;this.el.style.top=`${Math.round(top)}px`}
  hide(id=null){if(!this.el)return;if(id&&this.currentId&&id!==this.currentId)return;this.visible=false;this.currentId=null;this.el.classList.remove("open")}
}
core.AstroHoverCard=AstroHoverCard;
})();
