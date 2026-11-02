(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = 420, H = 680;
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("bestScore");
  const finalEl = document.getElementById("finalScore");
  const recordMessage = document.getElementById("recordMessage");
  const startOverlay = document.getElementById("startOverlay");
  const resultOverlay = document.getElementById("resultOverlay");
  const tapAudio = document.getElementById("tapAudio");
  const overAudio = document.getElementById("overAudio");
  const character = new Image();
  character.src = "assets/charan.png";

  let state = "ready", score = 0, best = Number(localStorage.getItem("fahhBest") || 0);
  let player, obstacles, particles, lastTime = 0, spawnTimer = 0, world = 0, newRecord = false;
  bestEl.textContent = best;

  const rand = (a,b) => a + Math.random() * (b-a);
  function reset() {
    score = 0; scoreEl.textContent = "0";
    player = {x:112,y:300,vy:0,r:25,rot:0};
    obstacles = []; particles = []; spawnTimer = 0; world = 0;
    addObstacle(W + 30);
  }
  function addObstacle(x) {
    const gap = Math.max(158, 184 - Math.min(score, 10) * 2);
    const topH = rand(105, 330);
    obstacles.push({x, w:76, topH, gap, passed:false, seed:Math.floor(rand(0,4))});
  }
  function playSound(audio) {
    try { audio.pause(); audio.currentTime = 0; const p=audio.play(); if(p) p.catch(()=>{}); } catch (_) {}
  }
  function start() {
    if(state === "playing") return;
    reset(); state = "playing";
    startOverlay.classList.add("hidden"); resultOverlay.classList.add("hidden");
    flap();
  }
  function flap() {
    if(state !== "playing") return;
    player.vy = -430;
    player.rot = -.35;
    for(let i=0;i<5;i++) particles.push({x:player.x-17,y:player.y+8,vx:rand(-90,-20),vy:rand(-65,65),life:.35});
    playSound(tapAudio);
  }
  function endGame() {
    if(state !== "playing") return;
    state = "over";
    newRecord = score > best;
    if(newRecord){best=score;localStorage.setItem("fahhBest",String(best));bestEl.textContent=best;}
    finalEl.textContent=score;
    recordMessage.textContent = newRecord && score > 0 ? "NEW PERSONAL BEST!" : "One more round?";
    resultOverlay.classList.remove("hidden");
    playSound(overAudio);
  }
  function roundedRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function drawBook(x,y,w,h,index,flip=false) {
    if(h<=0)return;
    const colors=["#1c5260","#bd654c","#e2b65d","#435d88","#4f806d"];
    const c=colors[index%colors.length];
    // book spine with a small offset edge for a stacked-paper look
    ctx.fillStyle="#142b3b";ctx.fillRect(x+5,y+5,w,h);
    ctx.fillStyle=c;ctx.fillRect(x,y,w-5,h);
    ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(x+7,y+4,4,Math.max(0,h-8));
    ctx.fillStyle="rgba(8,20,30,.22)";ctx.fillRect(x+w-15,y+3,5,Math.max(0,h-6));
    ctx.fillStyle="#f3d9a4";ctx.fillRect(x+13,y+Math.min(12,h/2),w-28,3);
    if(h>34){ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(x+13,y+Math.min(22,h-8),w-27,2);}
    ctx.fillStyle="rgba(8,20,30,.18)";ctx.fillRect(x,y+h-5,w-5,5);
  }
  function drawBackground(dt) {
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#bce9e4");sky.addColorStop(.64,"#e2edcf");sky.addColorStop(1,"#c3d9bd");
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // soft sun and distant campus blocks
    ctx.fillStyle="rgba(255,255,255,.38)";ctx.beginPath();ctx.arc(330,105,48,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#a7c9bb";
    for(let i=0;i<6;i++){
      const x=((i*95 - (world*.16)%95)+W+95)%W;
      const h=90+(i%3)*28;ctx.fillRect(x,390-h,58,h);
      ctx.fillStyle="#d8e8d6";for(let j=0;j<3;j++)ctx.fillRect(x+10+j*15,410-h,7,12);
      ctx.fillStyle="#a7c9bb";
    }
    // campus lawn
    ctx.fillStyle="#91b99c";ctx.fillRect(0,590,W,90);
    ctx.fillStyle="#769e84";ctx.fillRect(0,590,W,5);
    ctx.fillStyle="rgba(255,255,255,.22)";
    for(let i=0;i<14;i++){let x=(i*43-(world*.5)%43+W)%W;ctx.fillRect(x,610+(i%3)*18,20,2);}
  }
  function drawPlayer() {
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.rot);
    // subtle shadow
    ctx.fillStyle="rgba(24,50,54,.2)";ctx.beginPath();ctx.ellipse(2,23,20,6,0,0,Math.PI*2);ctx.fill();
    if(character.complete && character.naturalWidth){
      const h=68,w=h*character.naturalWidth/character.naturalHeight;
      ctx.drawImage(character,-w/2,-h/2,w,h);
    } else {
      ctx.fillStyle="#d8b79a";ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function draw() {
    drawBackground();
    // floor line
    ctx.fillStyle="#648e75";ctx.fillRect(0,588,W,5);
    for(const o of obstacles){
      const bottomY=o.topH+o.gap;
      // upper stack and lower stack
      let remain=o.topH, y=0, n=0;
      while(remain>0){const h=Math.min(remain,28 + ((n*7 + o.seed*5)%11));drawBook(o.x,y,o.w,h,n++);y+=h;remain-=h;}
      remain=H-bottomY-92;y=bottomY;n=2;
      while(remain>0){const h=Math.min(remain,28 + ((n*7 + o.seed*5)%11));drawBook(o.x,y,o.w,h,n++);y+=h;remain-=h;}
      // clean cap edges
      ctx.fillStyle="#193b4a";ctx.fillRect(o.x-4,o.topH-7,o.w+3,8);
      ctx.fillRect(o.x-4,bottomY-1,o.w+3,8);
    }
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.35);ctx.fillStyle="#fff4c6";ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    drawPlayer();
    // tiny score chip in playfield
    if(state==="playing"){ctx.fillStyle="rgba(16,42,54,.55)";roundedRect(15,15,76,34,10,"rgba(16,42,54,.55)");ctx.fillStyle="#f7ffff";ctx.font="800 14px system-ui";ctx.fillText(" "+score,28,37);}
  }
  function update(dt) {
    if(state!=="playing")return;
    world += dt*95;
    player.vy += 1250*dt;
    player.y += player.vy*dt;
    player.rot = Math.min(.95,Math.max(-.45,player.vy/650));
    spawnTimer += dt;
    if(spawnTimer>1.55){spawnTimer=0;addObstacle(W+10);}
    for(const o of obstacles){
      o.x -= (205+Math.min(score*3,55))*dt;
      if(!o.passed && o.x+o.w<player.x-10){o.passed=true;score++;scoreEl.textContent=score;}
    }
    obstacles=obstacles.filter(o=>o.x+o.w>-10);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    // circle-vs-rectangle collision with a forgiving visual hitbox
    const r=18;
    if(player.y-r<0 || player.y+r>588){endGame();return;}
    for(const o of obstacles){
      const overlapsX=player.x+r>o.x && player.x-r<o.x+o.w;
      if(overlapsX && (player.y-r<o.topH || player.y+r>o.topH+o.gap)){endGame();return;}
    }
  }
  function loop(ts) {
    const dt=Math.min((ts-lastTime)/1000||0,.033);lastTime=ts;
    update(dt);draw();requestAnimationFrame(loop);
  }
  function action() {
    if(state==="ready" || state==="over"){start();return;}
    flap();
  }
  canvas.addEventListener("pointerdown",e=>{e.preventDefault();action();},{passive:false});
  document.getElementById("startBtn").addEventListener("click",e=>{e.stopPropagation();start();});
  document.getElementById("restartBtn").addEventListener("click",e=>{e.stopPropagation();start();});
  document.addEventListener("keydown",e=>{
    if(e.code==="Space" || e.code==="ArrowUp"){e.preventDefault();action();}
    if((e.key==="Enter") && state!=="playing")start();
  });
  // Prevent accidental page gestures while the game surface is being touched.
  canvas.addEventListener("touchmove",e=>e.preventDefault(),{passive:false});
  reset();requestAnimationFrame(loop);
})();