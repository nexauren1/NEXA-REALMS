import Phaser from "phaser";

window.addEventListener("error", (event) => {
  const el=document.getElementById("game");
  if (el && !el.dataset.errorShown) { el.dataset.errorShown="1"; el.innerHTML="<div style=\"padding:24px;font-family:system-ui;color:#eaf7f1;background:#10211d;height:100%;box-sizing:border-box\"><h2>NEXA REALMS</h2><p>Game startup error. Reload the app.</p><small>"+String(event.error?.message||event.message||"Unknown error")+"</small></div>"; }
});

const SAVE_KEY="nexa-realms-save-v1";
const C={Kysam:0x7fe3c0,Nova:0xf5c45c,Kai:0x82b8ff,Zara:0xd59cff};
const ROLE={Kysam:"THE RESONANT",Nova:"MAPKEEPER",Kai:"TRAIL SCOUT",Zara:"ARCHIVIST"};
const DEFAULT={stones:{grove:false,lake:false,ridge:false},level:1,xp:0,pulse:1,motes:0,complete:false};
const load=()=>{try{return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(SAVE_KEY)||"{}"),{stones:Object.assign({},DEFAULT.stones,JSON.parse(localStorage.getItem(SAVE_KEY)||"{}").stones||{})})}catch{return JSON.parse(JSON.stringify(DEFAULT))}};
const save=s=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch{}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function text(scene,x,y,s,size=16,color="#edf6f1"){return scene.add.text(x,y,s,{fontFamily:"Arial",fontSize:size,color})}
function hero(scene,x,y,name,scale=1){
  const g=scene.add.graphics().setDepth(20), c=C[name];
  g.fillStyle(0x09120f,.38).fillEllipse(x,y+25*scale,40*scale,14*scale);
  g.fillStyle(0x1e4035,1).fillTriangle(x,y-17*scale,x-20*scale,y+17*scale,x+20*scale,y+17*scale);
  g.fillStyle(c,1).fillCircle(x,y-7*scale,16*scale);
  g.fillStyle(0x182a24,1).fillEllipse(x,y-14*scale,26*scale,11*scale);
  g.lineStyle(2,c,1).strokeCircle(x,y-7*scale,16*scale);
  return g;
}
function label(scene,x,y,s){text(scene,x,y,s,11,"#d5e1da").setOrigin(.5)}

class Menu extends Phaser.Scene{
  constructor(){super("Menu")}
  create(){
    this.cameras.main.setBackgroundColor("#10211d");
    const w=this.scale.width,h=this.scale.height,cx=w/2,s=load();
    text(this,cx,90,"NEXA",72,"#c8ffea").setOrigin(.5).setFontStyle("bold");
    text(this,cx,158,"REALMS",44,"#f5c45c").setOrigin(.5).setFontStyle("bold");
    text(this,cx,198,"THE VEIL OF AUREN",16,"#91b0a2").setOrigin(.5);
    text(this,cx,235,s.complete?"CHAPTER 1 COMPLETE":"AUREN • LUMEN  "+Object.values(s.stones).filter(Boolean).length+"/3",13,"#6f8d80").setOrigin(.5);
    const b=this.add.rectangle(cx,315,330,62,0x7fe3c0).setStrokeStyle(2,0xcaffef).setInteractive();
    text(this,cx,315,"BEGIN ADVENTURE",19,"#10211d").setOrigin(.5).setFontStyle("bold");
    b.on("pointerdown",()=>this.scene.start("World"));
    const r=this.add.rectangle(cx,390,330,50,0x233b34).setStrokeStyle(2,0x5d8474).setInteractive();
    text(this,cx,390,"RESET SAVE",15,"#e8f2ed").setOrigin(.5);
    r.on("pointerdown",()=>{localStorage.removeItem(SAVE_KEY);this.scene.restart()});
    ["Kysam","Nova","Kai","Zara"].forEach((n,i)=>{
      const x=cx-225+i*150;hero(this,x,510,n,.9);label(this,x,545,n);label(this,x,565,ROLE[n]);
    });
    text(this,16,h-18,"v0.1.0 • Phaser 4 • Capacitor 8",12,"#5e7c70");
  }
}

class World extends Phaser.Scene{
  create(){
    this.s=load();this.npcs=[];this.stones=[];this.enemies=[];this.cool=0;this.dialog=false;this.touch={};
    const W=2200,H=1500,g=this.add.graphics();
    g.fillStyle(0x2b5948,1).fillRect(0,0,W,H);
    for(let y=24;y<H;y+=48)for(let x=24;x<W;x+=48){g.fillStyle(((x+y)/48)%3===0?0x315f4e:0x2b5948,.95).fillRect(x-20,y-20,40,40)}
    const roads=[[[650,760],[650,500],[420,300]],[[650,760],[500,1110]],[[720,760],[1450,760],[1880,710]],[[650,650],[1100,500],[1100,120]]];
    roads.forEach(p=>this.path(g,p));
    g.fillStyle(0x2f7890,1).fillEllipse(500,1300,590,340);
    this.build(g,650,700,230,150,"DAWN HALL");this.build(g,850,560,160,110,"NOVA'S MAP ROOM");
    this.build(g,850,910,160,110,"ZARA'S ARCHIVE");this.build(g,500,900,160,105,"KAI'S CAMP");
    g.fillStyle(0xd1b47d,1).fillCircle(650,760,72);
    g.fillStyle(0x2a2238,1).fillRect(1030,65,140,95);g.lineStyle(6,0x7754b7,1).strokeRect(1030,65,140,95);
    text(this,1100,35,"RIFT GATE",15,"#d1c4f7").setOrigin(.5);
    let seed=17;this.obs=[];
    for(let y=45;y<H-40;y+=85)for(let x=45;x<W-40;x+=85){
      seed=(seed*9301+49297)%233280;const px=x+(seed/233280-.5)*34;
      seed=(seed*9301+49297)%233280;const py=y+(seed/233280-.5)*34;
      const nearRoad=roads.some(r=>r.some((p,i)=>i<r.length-1&&pointSeg(px,py,p[0],p[1],r[i+1][0],r[i+1][1])<52));
      if(Math.hypot(px-650,py-760)<255||nearRoad||Math.hypot(px-500,py-1300)<320)continue;
      tree(this,px,py);
      this.obs.push({x:px-16,y:py+4,w:32,h:25});
    }
    label(this,650,585,"DAWN VILLAGE");label(this,330,230,"WHISPERING GROVE");label(this,500,1080,"MOONWATER LAKE");label(this,1880,675,"EMBER RIDGE");
    this.p=this.add.container(650,865).setDepth(30);this.p.add(hero(this,0,0,"Kysam",1.05));
    const data=[["Nova",850,760,"The western stone answers to the old road."],["Kai",540,980,"The lake stone is on the north shore."],["Zara",930,980,"Restore all three stones and the Rift Gate will open."]];
    data.forEach(n=>{const o={name:n[0],x:n[1],y:n[2],msg:n[3],g:this.add.container(n[1],n[2]).setDepth(25)};o.g.add(hero(this,0,0,n[0],.9));label(this,0,29,n[0]).setOrigin(.5);this.npcs.push(o)});
    [["grove",330,235],["lake",500,1110],["ridge",1880,710]].forEach(a=>this.makeStone(a[0],a[1],a[2]));
    [[270,420],[1540,560],[1760,950],[2100,850]].forEach((p,i)=>this.enemy(p[0],p[1],i));
    this.makeUi();
    this.input.keyboard.on("keydown-E",()=>this.interact());this.input.keyboard.on("keydown-SPACE",()=>this.pulse());
    this.input.keyboard.on("keydown-ESC",()=>{this.dialog?this.close():this.scene.start("Menu")});
    this.cameras.main.setBounds(0,0,W,H).startFollow(this.p,true,.08,.08);
    this.toast("Find Nova, then restore the three Lumen Stones.");
  }
  path(g,p){g.lineStyle(64,0x8b7653,1);p.slice(1).forEach((q,i)=>g.lineBetween(p[i][0],p[i][1],q[0],q[1]));g.lineStyle(52,0xb89a6b,1);p.slice(1).forEach((q,i)=>g.lineBetween(p[i][0],p[i][1],q[0],q[1]))}
  build(g,x,y,w,h,name){g.fillStyle(0xead7b3,1).fillRect(x-w/2,y-h/2,w,h);g.fillStyle(0x754c35,1).fillTriangle(x-w/2-8,y-h/2,x+w/2+8,y-h/2,x,y-h/2-55);g.fillStyle(0x5b4131,1).fillRect(x-18,y+h/2-42,36,42);this.obs?.push({x:x-w/2,y:y-h/2,w,h});label(this,x,y+h/2+13,name)}
  makeStone(id,x,y){const g=this.add.graphics().setDepth(18);this.drawStone(g,x,y,this.s.stones[id]);const o={id,x,y,g};this.stones.push(o)}
  drawStone(g,x,y,on){g.clear();g.fillStyle(0x0d201a,.5).fillEllipse(x,y+15,70,22);g.fillStyle(on?0x6de9cc:0x5c7e79,1).fillTriangle(x,y-40,x-25,y+25,x+28,y+25);g.lineStyle(3,on?0xb9fff0:0xa1b8b0,1).strokeTriangle(x,y-40,x-25,y+25,x+28,y+25)}
  enemy(x,y,i){const g=this.add.graphics().setDepth(19);g.fillStyle(0x0b1215,.5).fillEllipse(x,y+18,36,14);g.fillStyle(0x707aa8,1).fillCircle(x,y,19);g.fillStyle(0xd5dcff,1).fillCircle(x-6,y-4,4);g.fillStyle(0xd5dcff,1).fillCircle(x+6,y-4,4);this.enemies.push({x,y,hp:2+i%2,speed:40+i*7,g,alive:true,hit:0})}
  makeUi(){const h=this.scale.height,w=this.scale.width;this.hud=text(this,22,20,"",14).setScrollFactor(0).setDepth(80);this.obj=text(this,22,75,"",13,"#eed7a4").setScrollFactor(0).setDepth(80);this.toastT=0;this.toastG=text(this,w/2,25,"",14).setOrigin(.5).setScrollFactor(0).setDepth(90);
    const mk=(x,y,t,fn)=>{const b=this.add.rectangle(x,y,58,50,0x18342b,.9).setStrokeStyle(2,0x71988c).setScrollFactor(0).setDepth(90).setInteractive();text(this,x,y,t,17).setOrigin(.5).setScrollFactor(0).setDepth(91);b.on("pointerdown",fn)};
    mk(70,h-45,"←",()=>this.touch.left=false);mk(135,h-45,"→",()=>this.touch.right=false);mk(70,h-105,"↑",()=>this.touch.up=false);mk(135,h-105,"↓",()=>this.touch.down=false);
    [[70,h-45,"left"],[135,h-45,"right"],[70,h-105,"up"],[135,h-105,"down"]].forEach(a=>{const x=a[0],y=a[1],k=a[2];const b=this.add.zone(x,y,58,50).setScrollFactor(0).setDepth(92).setInteractive();b.on("pointerdown",()=>this.touch[k]=true);b.on("pointerup",()=>this.touch[k]=false);b.on("pointerout",()=>this.touch[k]=false)});
    mk(w-85,h-62,"PULSE",()=>this.pulse());mk(w-165,h-62,"E",()=>this.interact());
  }
  blocked(x,y){if(x<20||y<20||x>2180||y>1480)return true;return this.obs.some(o=>x+15>o.x&&x-15<o.x+o.w&&y+15>o.y&&y-15<o.y+o.h)}
  interact(){if(this.dialog)return this.close();const n=this.npcs.find(n=>dist(this.p,n)<82);if(n)return this.dialogBox(n.name,n.msg);
    const s=this.stones.find(s=>dist(this.p,s)<82);if(s){if(this.s.stones[s.id])return this.toast("This Lumen Stone is already restored.");this.s.stones[s.id]=true;this.s.xp+=35;this.levelUp();save(this.s);this.drawStone(s.g,s.x,s.y,true);return this.toast("Lumen restored • "+Object.values(this.s.stones).filter(Boolean).length+"/3")}
    if(Object.values(this.s.stones).every(Boolean)&&dist(this.p,{x:1100,y:120})<120)return this.scene.start("Dungeon");
    this.toast("The Resonance finds nothing here.");
  }
  levelUp(){const need=this.s.level*60;if(this.s.xp>=need){this.s.xp-=need;this.s.level++;this.s.pulse=Math.min(3,this.s.pulse+1);this.toast("Kysam reached level "+this.s.level)}}
  pulse(){if(this.cool>0)return;this.cool=650;const r=125+this.s.pulse*12,ring=this.add.circle(this.p.x,this.p.y,18,0x9ff2df,.06).setStrokeStyle(4,0xcaffef,.85).setDepth(50);this.tweens.add({targets:ring,radius:r,alpha:0,duration:300,onComplete:()=>ring.destroy()});this.enemies.forEach(e=>{if(e.alive&&dist(this.p,e)<r){e.hp-=this.s.pulse;e.hit=130;if(e.hp<=0){e.alive=false;e.g.destroy();this.s.xp+=15;this.s.motes++;this.levelUp();save(this.s)}}})}
  dialogue(n){const d=this.npcs.find(npc=>npc.name===n);return d?this.dialogBox(d.name,d.msg):null}
  dialogBox(t,msg){this.dialog=true;this.db=this.db||this.add.rectangle(this.scale.width/2,this.scale.height-100,Math.min(900,this.scale.width-30),125,0x10211d,.97).setStrokeStyle(2,0x77988d).setScrollFactor(0).setDepth(110);this.dt=this.dt||text(this,0,0,"",15).setScrollFactor(0).setDepth(111);this.dt.setPosition(30,this.scale.height-145).setText(t+"\n"+msg+"\n\nPress E to close.").setVisible(true);this.db.setVisible(true)}
  close(){this.dialog=false;if(this.db)this.db.setVisible(false);if(this.dt)this.dt.setVisible(false)}
  toast(s){this.toastG.setText(s).setAlpha(1);this.toastT=2500}
  update(time,delta){if(this.dialog)return;const k=this.input.keyboard;let dx=(k.addKey("D").isDown||k.addKey("RIGHT").isDown||this.touch.right?1:0)-(k.addKey("A").isDown||k.addKey("LEFT").isDown||this.touch.left?1:0);let dy=(k.addKey("S").isDown||k.addKey("DOWN").isDown||this.touch.down?1:0)-(k.addKey("W").isDown||k.addKey("UP").isDown||this.touch.up?1:0);if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;const nx=this.p.x+dx*185*delta/1000,ny=this.p.y+dy*185*delta/1000;if(!this.blocked(nx,this.p.y))this.p.x=nx;if(!this.blocked(this.p.x,ny))this.p.y=ny}this.cool=Math.max(0,this.cool-delta);this.toastT-=delta;if(this.toastT<=0)this.toastG.setAlpha(0);this.enemies.forEach(e=>{if(!e.alive)return;const d=dist(this.p,e);if(d<270&&d>42){e.x+=(this.p.x-e.x)/d*e.speed*delta/1000;e.y+=(this.p.y-e.y)/d*e.speed*delta/1000}e.g.x=e.x;e.g.y=e.y});this.hud.setText("KYSAM • LEVEL "+this.s.level+"\nXP "+this.s.xp+"/"+this.s.level*60+"   PULSE "+this.s.pulse+"   MOTES "+this.s.motes);this.obj.setText(Object.values(this.s.stones).filter(Boolean).length<3?"OBJECTIVE • Restore the three Lumen Stones.":"OBJECTIVE • Return to the northern Rift Gate.")}
}

class Dungeon extends Phaser.Scene{
  create(){
    this.s=load();this.a=0;this.hp=20;this.alive=false;this.dialog=false;const w=1700,h=1000,g=this.add.graphics();
    g.fillStyle(0x182a2a,1).fillRect(0,0,w,h);g.fillStyle(0x253a36,1).fillRect(140,140,1420,720);g.lineStyle(10,0x5c746b,1).strokeRect(140,140,1420,720);g.fillStyle(0x3f2f5f,1).fillEllipse(850,500,300,360);
    text(this,850,58,"RIFT SANCTUARY",28,"#ddcef9").setOrigin(.5).setFontStyle("bold");text(this,850,92,"Activate three anchors. Then face the Guardian.",14,"#9eafa8").setOrigin(.5);
    this.p=this.add.container(250,500).setDepth(30);this.p.add(hero(this,0,0,"Kysam",1.05));
    this.core={x:850,y:500};this.guard={x:850,y:500};this.pg=[];[[500,500],[850,315],[1200,500]].forEach(p=>{const q=this.add.graphics().setDepth(15);this.ped(q,p[0],p[1],false);this.pg.push({x:p[0],y:p[1],g:q,on:false})});
    this.gg=this.add.graphics().setDepth(20);this.drawGuard();this.ui();this.input.keyboard.on("keydown-E",()=>this.interact());this.input.keyboard.on("keydown-SPACE",()=>this.pulse());this.input.keyboard.on("keydown-ESC",()=>this.scene.start("World"));this.cameras.main.setBounds(0,0,w,h).startFollow(this.p,true,.08,.08);this.toast("Explore the sanctuary and activate every anchor.");
  }
  ped(g,x,y,on){g.clear();g.fillStyle(0x0b1714,.5).fillEllipse(x,y+18,78,20);g.fillStyle(on?0x6be2ce:0x6d7d78,1).fillRect(x-22,y-2,44,32);g.fillStyle(on?0xb8fff2:0xa2aea8,1).fillTriangle(x,y-55,x-22,y-5,x+22,y-5)}
  drawGuard(){this.gg.clear();const a=this.alive?1:.18;this.gg.fillStyle(0x0a1114,.5).fillEllipse(this.guard.x,this.guard.y+40,110,30);this.gg.fillStyle(0x8e79bb,a).fillCircle(this.guard.x,this.guard.y,48);this.gg.fillStyle(0xd7d7ff,a).fillCircle(this.guard.x-15,this.guard.y-5,6);this.gg.fillStyle(0xd7d7ff,a).fillCircle(this.guard.x+15,this.guard.y-5,6);this.gg.lineStyle(4,0xc5b5f0,a).strokeCircle(this.guard.x,this.guard.y,54)}
  ui(){const w=this.scale.width,h=this.scale.height;this.hud=text(this,22,20,"",14).setScrollFactor(0).setDepth(90);const b=this.add.rectangle(w-82,h-62,100,76,0x3a2f5d).setStrokeStyle(2,0xd1bdf8).setScrollFactor(0).setDepth(90).setInteractive();text(this,w-82,h-62,"PULSE",14,"#efe6ff").setOrigin(.5).setScrollFactor(0).setDepth(91);b.on("pointerdown",()=>this.pulse());}
  interact(){if(this.dialog){this.dialog=false;this.box?.setVisible(false);return}const p=this.pg.find(x=>!x.on&&dist(this.p,x)<85);if(p){p.on=true;this.a++;this.ped(p.g,p.x,p.y,true);this.toast("Anchor "+this.a+"/3");if(this.a===3){this.alive=true;this.drawGuard();this.toast("The Guardian awakens. Use Pulse to quiet it.")}return}if(this.alive&&dist(this.p,this.guard)<110){this.box=this.box||this.add.rectangle(this.scale.width/2,this.scale.height-90,Math.min(900,this.scale.width-30),110,0x10211d,.97).setStrokeStyle(2,0x8c78c2).setScrollFactor(0).setDepth(100);this.box.setVisible(true);this.dialog=true;return}if(!this.alive&&dist(this.p,this.core)<115){this.s.complete=true;save(this.s);this.box=this.box||this.add.rectangle(this.scale.width/2,this.scale.height-90,Math.min(900,this.scale.width-30),110,0x10211d,.97).setStrokeStyle(2,0x77988d).setScrollFactor(0).setDepth(100);text(this,this.scale.width/2-200,this.scale.height-120,"RIFT CORE RESTORED\nChapter 1 complete • Press E",18,"#c8ffea").setScrollFactor(0).setDepth(101);this.dialog=true;this.finish=true}}
  pulse(){if(!this.alive||this.cool>0)return;this.cool=650;const r=130,ring=this.add.circle(this.p.x,this.p.y,18,0x9ff2df,.06).setStrokeStyle(4,0xcaffef,.85).setDepth(50);this.tweens.add({targets:ring,radius:r,alpha:0,duration:300,onComplete:()=>ring.destroy()});if(dist(this.p,this.guard)<r){this.hp-=this.s.pulse;this.toast("Guardian resonance "+Math.max(this.hp,0)+"/20");if(this.hp<=0){this.alive=false;this.drawGuard();this.toast("The Core is reachable.")}}}
  toast(s){this.t=this.t||text(this,this.scale.width/2,26,"",14).setOrigin(.5).setScrollFactor(0).setDepth(95);this.t.setText(s).setAlpha(1);this.tt=2200}
  update(time,delta){if(this.dialog){if(this.finish&&this.input.keyboard.checkDown(this.input.keyboard.addKey("E")))this.scene.start("Menu");return}this.cool=Math.max(0,(this.cool||0)-delta);const k=this.input.keyboard,dx=(k.addKey("D").isDown||k.addKey("RIGHT").isDown?1:0)-(k.addKey("A").isDown||k.addKey("LEFT").isDown?1:0),dy=(k.addKey("S").isDown||k.addKey("DOWN").isDown?1:0)-(k.addKey("W").isDown||k.addKey("UP").isDown?1:0);if(dx||dy){const l=Math.hypot(dx,dy);this.p.x=Phaser.Math.Clamp(this.p.x+dx/l*190*delta/1000,175,1525);this.p.y=Phaser.Math.Clamp(this.p.y+dy/l*190*delta/1000,175,825)}if(this.alive){const d=dist(this.p,this.guard);if(d>70&&d<340){this.guard.x+=(this.p.x-this.guard.x)/d*35*delta/1000;this.guard.y+=(this.p.y-this.guard.y)/d*35*delta/1000;this.drawGuard()}}this.hud.setText("RIFT SANCTUARY\nANCHORS "+this.a+"/3 • GUARDIAN "+(this.alive?"ACTIVE":"QUIET")+" • PULSE "+this.s.pulse);if(this.tt){this.tt-=delta;if(this.tt<=0)this.t?.setAlpha(0)}}
}

function tree(scene,x,y){const g=scene.add.graphics().setDepth(5);g.fillStyle(0x704a35,1).fillRect(x-7,y+6,14,38);g.fillStyle(0x173a2d,1).fillCircle(x,y,30);g.fillStyle(0x2e684c,1).fillCircle(x-16,y-8,20);g.fillStyle(0x3b7958,1).fillCircle(x+17,y-8,20)}
function pointSeg(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,d=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/d));return Math.hypot(px-(x1+t*dx),py-(y1+t*dy))}
new Phaser.Game({type:Phaser.CANVAS,parent:"game",width:1280,height:720,backgroundColor:"#10211d",pixelArt:true,render:{antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:4},scene:[Menu,World,Dungeon]});
