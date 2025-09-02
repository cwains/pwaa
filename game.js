// super lightweight lane runner with left/right & brake
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width, H = canvas.height;
const lanes = 3;
const laneW = W / lanes;
let playerLane = 1;
let speed = 4;
let maxSpeed = 14;
let score = 0;
let playing = true;

const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const brakeBtn = document.getElementById('brake');
const pauseBtn = document.getElementById('pause');
const scoreEl = document.getElementById('score');

function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

// obstacles
let obstacles = [];
function spawnObstacle(){
  const lane = Math.floor(Math.random()*lanes);
  obstacles.push({ lane, y: -60, h: 60, w: laneW*0.6 });
}

let spawnTimer = 0;

function reset(){
  playerLane = 1;
  speed = 4;
  score = 0;
  obstacles = [];
  spawnTimer = 0;
  playing = true;
}

function update(dt){
  if (!playing) return;
  spawnTimer += dt;
  if (spawnTimer > Math.max(350, 1200 - score*2)) {
    spawnTimer = 0;
    spawnObstacle();
  }
  // move obstacles
  obstacles.forEach(o => o.y += speed);
  // remove offscreen
  obstacles = obstacles.filter(o => o.y < H+100);
  // score + difficulty
  score += Math.floor(speed);
  if (speed < maxSpeed) speed += 0.002 * dt;

  // collision
  const px = playerLane*laneW + laneW/2;
  const py = H - 120;
  const pW = laneW*0.55, pH = 80;

  for (const o of obstacles){
    const ox = o.lane*laneW + laneW/2;
    const oy = o.y;
    if (Math.abs(px-ox) < (pW+o.w)/2 && Math.abs(py-oy) < (pH+o.h)/2){
      playing = false;
      break;
    }
  }
  scoreEl.textContent = score.toString();
}

function drawRoad(){
  // road
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0,0,W,H);
  // lane lines
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 4;
  for (let i=1;i<lanes;i++){
    const x = i*laneW;
    ctx.setLineDash([20,16]);
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPlayer(){
  const x = playerLane*laneW + laneW/2;
  const y = H - 120;
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = '#4ade80';
  roundRect(-laneW*0.275,-40,laneW*0.55,80,12);
  ctx.fill();
  // windshield
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(-laneW*0.20,-20,laneW*0.40,28,8);
  ctx.fill();
  ctx.restore();
}

function drawObstacles(){
  ctx.fillStyle = '#f43f5e';
  for (const o of obstacles){
    const x = o.lane*laneW + laneW/2;
    roundRect(x - o.w/2, o.y - o.h/2, o.w, o.h, 10);
    ctx.fill();
  }
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawUI(){
  if (!playing){
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('crashed!', W/2, H/2 - 20);
    ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('tap to restart', W/2, H/2 + 12);
  }
}

// input
function left(){ playerLane = clamp(playerLane-1, 0, lanes-1); }
function right(){ playerLane = clamp(playerLane+1, 0, lanes-1); }
function brake(pressed){ speed = pressed ? Math.max(2, speed*0.5) : Math.min(maxSpeed, speed+0.2); }

leftBtn.addEventListener('touchstart', e => { e.preventDefault(); left(); });
rightBtn.addEventListener('touchstart', e => { e.preventDefault(); right(); });
let braking = false;
brakeBtn.addEventListener('touchstart', e => { e.preventDefault(); braking = true; });
brakeBtn.addEventListener('touchend', e => { e.preventDefault(); braking = false; });
brakeBtn.addEventListener('touchcancel', e => { e.preventDefault(); braking = false; });

pauseBtn.addEventListener('click', () => playing = !playing);

canvas.addEventListener('touchstart', e => {
  if (!playing) { reset(); return; }
  const x = e.touches[0].clientX;
  if (x < window.innerWidth/2) left(); else right();
}, {passive:false});

// keyboard (for desktop testing)
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') left();
  if (e.key === 'ArrowRight') right();
  if (e.key.toLowerCase() === ' ') braking = true;
  if (e.key.toLowerCase() === 'p') playing = !playing;
});
window.addEventListener('keyup', e => {
  if (e.key.toLowerCase() === ' ') braking = false;
});

let last = performance.now();
function loop(t){
  const dt = Math.min(50, t - last);
  last = t;
  if (braking) brake(true); else brake(false);
  update(dt);
  drawRoad();
  drawObstacles();
  drawPlayer();
  drawUI();
  requestAnimationFrame(loop);
}
reset();
requestAnimationFrame(loop);
