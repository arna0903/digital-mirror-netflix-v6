// MIRROR BEAR - the user's reflection, drawn with p5.js only (no audio library).
// bridge.js sets M.target (0 = rested ... 1 = worn out); M.s eases toward it, so the bear and the room
// degrade and recover smoothly. Every visual below is a function of s.
const W = 1280, H = 720;
const M = { s: 0, target: 0, t: 0, ph: 0, caption: '', cap2: '', capA: 0, debug: false, fly: [], mote: [] };
const L = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const rgb = (a, al = 1) => `rgba(${a.map(v => Math.round(v)).join(',')},${al})`;
const lg = (x0, y0, x1, y1, st) => { const g = drawingContext.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rg = (x, y, r, st) => { const g = drawingContext.createRadialGradient(x, y, 0, x, y, r); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const ease = (a, b, x) => constrain((x - a) / (b - a), 0, 1);
const gel = (x, y, rx, ry, g) => { const c = drawingContext; c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TWO_PI); c.fill(); };

function setup() {
  const c = createCanvas(windowWidth, windowHeight); c.parent('mirrorStage');
  pixelDensity(1); noLoop(); noiseSeed(7); textFont('Georgia');
  [[255, 224, 140], [255, 252, 245], [190, 214, 255], [255, 192, 170]].forEach((c2, i) => M.fly.push({ ph: i * 1.7, c: c2 }));
  for (let i = 0; i < 40; i++) M.mote.push({ a: random(), u: random(), v: random(0.3, 1), ph: random(TWO_PI) });
}
function prefersReducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function windowResized() { resizeCanvas(windowWidth, windowHeight); if (prefersReducedMotion()) redraw(); }
function mirrorShow(snap) { if (typeof resizeCanvas !== 'function') return; resizeCanvas(windowWidth, windowHeight); if (snap || prefersReducedMotion()) M.s = M.target; if (prefersReducedMotion()) { noLoop(); redraw(); } else loop(); }
function mirrorHide() { noLoop(); }
function keyPressed() { if (key === 'd') M.debug = !M.debug; }

function pose(s, t) {
  return { hx: 640 + s * 30 + sin(t * 0.5) * (1 - s) * 7, hy: 232 + s * 92 + sin(t * lerp(1.4, 0.6, s)) * lerp(4, 1.5, s) };
}
function draw() { try { drawScene(); } catch (e) { console.error(e); background(20); fill(255); textSize(16); text('mirror error: ' + e.message, 20, 40); noLoop(); } }
function drawScene() {
  const reduced = prefersReducedMotion(), frameStep = min(deltaTime / 1000, 0.1);
  const dt = reduced ? 1 : frameStep;
  if (!reduced) M.t += frameStep;
  const t = M.t;
  M.s = lerp(M.s, M.target, reduced ? 1 : 1 - exp(-dt * 0.9)); const s = M.s, P = pose(s, t);
  const per = lerp(2.6, 9, s), dur = lerp(0.16, 0.38, s);          // blinking slows down as he tires
  if (reduced) { M.ph = 0; P.blink = 0; }
  else { M.ph += dt / per; const f = M.ph % 1, d = dur / per; P.blink = f < d ? sin(PI * f / d) : 0; }
  background(0);
  const k = max(width / W, height / H);
  push(); translate(width / 2, height / 2); scale(k); translate(-W / 2, -H / 2);
  room(s, t); bear(s, t, P); desk(s, t, P); lighting(s, t, P);
  pop();
  caption(dt, s);
  if (reduced) noLoop();
}

// ---------- ROOM ----------
function room(s, t) {
  const c = drawingContext, wx = 70, wy = 110, ww = 280, wh = 290, day = 1 - ease(0.18, 0.42, s), night = ease(0.56, 0.80, s);
  c.fillStyle = lg(0, 0, 0, H, [[0, rgb(L([224, 215, 200], [34, 34, 40], s))], [1, rgb(L([206, 195, 178], [28, 28, 34], s))]]); c.fillRect(0, 0, W, H);
  noStroke(); fill(...L([214, 204, 188], [30, 30, 36], s)); rect(0, 430, W, 100); fill(255, 255, 255, 30 * (1 - s)); rect(0, 430, W, 3);
  // curtains
  fill(...L([196, 178, 156], [40, 38, 44], s)); rect(wx - 56, wy - 30, 64, wh + 100, 8); rect(wx + ww - 8, wy - 30, 64, wh + 100, 8);
  stroke(0, 0, 0, 26); strokeWeight(3); for (let i = 0; i < 4; i++) { line(wx - 46 + i * 15, wy - 26, wx - 46 + i * 15, wy + wh + 60); line(wx + ww + 2 + i * 15, wy - 26, wx + ww + 2 + i * 15, wy + wh + 60); } noStroke();
  fill(...L([240, 236, 228], [44, 44, 52], s)); rect(wx - 10, wy - 10, ww + 20, wh + 20, 6);
  // the world outside: day -> night
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
  c.fillStyle = lg(0, wy, 0, wy + wh, [[0, rgb(L([138, 188, 232], [12, 18, 42], s))], [1, rgb(L([214, 234, 246], [34, 40, 66], s))]]); c.fillRect(wx, wy, ww, wh);
  c.fillStyle = rg(wx + 200, wy + 80, 150, [[0, `rgba(255,240,180,${0.9 * day})`], [1, 'rgba(255,240,180,0)']]); c.fillRect(wx, wy, ww, wh);
  fill(255, 248, 205, 255 * day); circle(wx + 200, wy + 80, 38);
  fill(255, 255, 255, 220 * day); for (let i = 0; i < 3; i++) { const x = wx + ((t * (4 + i * 3) + i * 120) % (ww + 160)) - 80; ellipse(x, wy + 50 + i * 40, 90, 24); ellipse(x + 26, wy + 40 + i * 40, 54, 22); }
  fill(230, 236, 250, 240 * night); circle(wx + 70, wy + 60, 26);
  for (let i = 0; i < 16; i++) { fill(255, 255, 255, 220 * night * (0.6 + 0.4 * sin(t * 2 + i))); circle(wx + (i * 97) % 270 + 4, wy + (i * 53) % 150 + 6, 2.2); }
  fill(...L([104, 150, 104], [10, 14, 18], s)); ellipse(wx + 70, wy + wh, 200, 130); ellipse(wx + 230, wy + wh + 6, 190, 110);
  fill(...L([70, 120, 82], [8, 12, 16], s)); circle(wx + 50, wy + wh - 80, 70); circle(wx + 90, wy + wh - 70, 54); rect(wx + 66, wy + wh - 50, 8, 50);
  c.restore();
  fill(...L([240, 236, 228], [44, 44, 52], s)); rect(wx + ww / 2 - 3, wy, 6, wh); rect(wx, wy + wh / 2 - 3, ww, 6); rect(wx - 18, wy + wh + 8, ww + 36, 10, 3);
  // poster
  fill(...L([246, 242, 234], [40, 40, 46], s)); rect(950, 120, 190, 250, 4);
  c.fillStyle = lg(0, 132, 0, 358, [[0, rgb(L([244, 196, 150], [36, 34, 44], s))], [1, rgb(L([150, 190, 200], [30, 34, 44], s))]]); c.fillRect(962, 132, 166, 226);
  fill(...L([250, 232, 200], [60, 60, 76], s)); circle(1045, 200, 46);
  fill(...L([96, 132, 120], [24, 28, 34], s)); triangle(962, 358, 1020, 250, 1080, 358); fill(...L([70, 104, 100], [20, 24, 30], s)); triangle(1030, 358, 1090, 270, 1128, 358);
  ['#e9c46a', '#a8c4b8', '#e8a598'].forEach((col, i) => { fill(...L(color(col).levels.slice(0, 3), [50, 50, 56], s)); rect(880 + i * 6, 150 + i * 44, 44, 40, 2); });   // sticky notes
  // fairy lights (dorm classic): glow fades, bulbs go dull
  const glow = 1 - ease(0.28, 0.55, s);
  for (let x = 0; x <= W; x += 40) {
    const u = (x % 320) / 320, y = 58 + 28 * sin(PI * u), tw = 0.7 + 0.3 * sin(t * 2 + x);
    fill(255, 224, 160, 55 * glow * tw); circle(x, y + 6, 30); fill(...L([255, 232, 170], [96, 92, 90], ease(0, 0.8, s))); circle(x, y + 6, 8);
  }
  // sunbeams + dust
  if (day > 0.02) {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = lg(wx + ww, wy + i * 90, 900, 520, [[0, `rgba(255,236,176,${0.3 * day})`], [1, 'rgba(255,236,176,0)']]);
      c.beginPath(); c.moveTo(wx + ww, wy + 20 + i * 90); c.lineTo(wx + ww, wy + 80 + i * 90); c.lineTo(820 + i * 70, 520); c.lineTo(640 + i * 70, 520); c.closePath(); c.fill();
    }
    M.mote.forEach(m => { m.u = (m.u + m.v * 0.0012) % 1; fill(255, 248, 220, 200 * sin(PI * m.u) * day); circle(lerp(wx + ww + 10, 760, m.u) + sin(t + m.ph) * 8, lerp(wy + 20 + m.a * 250, 520, m.u), 2.4); });
  }
  // butterflies: only while he is rested
  const a = 1 - ease(0.06, 0.30, s);
  if (a > 0.01) M.fly.forEach((b, i) => {
    const x = [440, 520, 900, 990][i] + sin(t * 0.35 + b.ph) * 80, y = [300, 380, 300, 400][i] + cos(t * 0.5 + b.ph * 1.3) * 70 + sin(t * 2 + i) * 6, fl = abs(sin(t * 9 + b.ph * 3));
    push(); translate(x, y); rotate(cos(t * 0.35 + b.ph) * 0.5);
    fill(...b.c, 230 * a); ellipse(-9, -3, 4 + 14 * fl, 13); ellipse(9, -3, 4 + 14 * fl, 13);
    fill(...b.c, 170 * a); ellipse(-7, 6, 3 + 9 * fl, 9); ellipse(7, 6, 3 + 9 * fl, 9);
    fill(60, 44, 36, 230 * a); ellipse(0, 1, 3, 14); pop();
  });
}

// ---------- BEAR ----------
function bear(s, t, P) {
  const c = drawingContext, { hx, hy } = P, hu = -s * 32, u = s * 0.6;
  const fur = L([158, 112, 76], [114, 94, 88], u), hi = L([192, 144, 102], [132, 112, 106], u), dk = L([108, 72, 48], [70, 56, 56], u);
  const muz = L([228, 198, 160], [162, 148, 142], u), hood = L([112, 130, 136], [54, 60, 72], s * 0.7), hoodD = L([88, 104, 112], [38, 44, 56], s * 0.7);
  // hoodie
  fill(...hood); beginShape(); vertex(hx - 240, 600);
  bezierVertex(hx - 246, 440, hx - 210, 380 - hu, hx - 120, 360 - hu); bezierVertex(hx - 60, 350 - hu, hx + 60, 350 - hu, hx + 120, 360 - hu);
  bezierVertex(hx + 210, 380 - hu, hx + 246, 440, hx + 240, 600); endShape(CLOSE);
  fill(0, 0, 0, 40); ellipse(hx - 205, 470, 70, 150); ellipse(hx + 205, 470, 70, 150);
  fill(...hoodD); ellipse(hx, hy + 100, 270, 92); fill(...L([62, 76, 84], [26, 30, 40], s * 0.7)); ellipse(hx, hy + 112, 150, 44);
  stroke(...L([236, 230, 218], [120, 120, 128], s)); strokeWeight(3); strokeCap(ROUND); line(hx - 26, hy + 120, hx - 30, 420); line(hx + 26, hy + 120, hx + 32, 424); noStroke();
  fill(...fur); ellipse(hx, hy + 84, 130, 62);
  // head
  push(); translate(hx, hy); rotate(sin(t * 0.4) * 0.04 * (1 - s) - s * 0.14);
  stroke(...L([108, 72, 48], [70, 56, 56], u)); strokeWeight(4); line(96, -52, 112, -110); stroke(238, 196, 64); strokeWeight(5); line(98, -58, 111, -104); noStroke();   // pencil behind the ear
  [-1, 1].forEach(sd => {
    const ex = sd * (78 + s * 14), ey = -62 + s * 22;
    fill(...dk); circle(ex, ey, 70); fill(...fur); circle(ex, ey, 62); fill(...L([190, 132, 112], [118, 100, 110], s)); circle(ex, ey + 3, 32);
  });
  stroke(...fur); strokeWeight(5); strokeCap(ROUND);
  for (let i = 0; i < 40; i++) { const a = i / 40 * TWO_PI, n = noise(i * 0.7) * 8; line(cos(a) * 92, sin(a) * 83, cos(a) * (98 + n), sin(a) * (89 + n)); }
  noStroke(); gel(0, 0, 96, 86, rg(-30, -44, 140, [[0, rgb(hi)], [1, rgb(fur)]]));
  noFill(); stroke(...dk); strokeWeight(5); const sw = sin(t * 1.3) * 3 * (1 - s);          // cowlick
  bezier(-6, -84, -12, -112, 6 + sw, -120, 12 + sw, -108); bezier(4, -84, 2, -104, 22 + sw, -110, 26 + sw, -98); noStroke();
  fill(...muz); ellipse(0, 30, 104, 76); fill(224, 112, 104, 60 * (1 - s)); ellipse(-56, 22, 28, 15); ellipse(56, 22, 28, 15);
  fill(54, 38, 32); ellipse(0, 12, 26, 17); fill(255, 255, 255, 90); ellipse(-4, 8, 8, 4);
  const sm = lerp(1, -0.7, s); noFill(); stroke(...dk); strokeWeight(3); line(0, 20, 0, 38);
  bezier(-20, 44, -10, 44 + 14 * sm, 10, 44 + 14 * sm, 20, 44); noStroke();
  // Tiredness is deliberately clearest in stage 3: red-rimmed eyes, puffy shadows, and a heavy brow.
  const tired = ease(0.38, 0.78, s);
  const open = (1 - s * 0.90) * (1 - P.blink);
  const eh = max(2 + 20 * open, 8 + 5 * tired);
  const gx = lerp((noise(t * 0.25) - 0.5) * 8, 0, ease(0, 0.5, s)), gy = lerp(-1, 3, s);
  [-1, 1].forEach(sd => {
    const ex = sd * 36, ey = -10, cy = ey + (22 - eh) / 2 + 4 * tired;
    fill(76, 38, 56, 70 + 150 * tired); ellipse(ex, ey + 18, 44 + 8 * tired, 18 + 10 * tired);
    fill(...L([250, 244, 232], [244, 128, 126], tired)); ellipse(ex, cy, 29, eh);
    c.save(); c.beginPath(); c.ellipse(ex, cy, 14.5, eh / 2, 0, 0, TWO_PI); c.clip();
    fill(...L([98, 62, 40], [126, 48, 46], tired)); circle(ex + gx, ey + gy + 2 * tired, 17);
    fill(20, 14, 12); circle(ex + gx, ey + gy + 2 * tired, lerp(9, 6, s));
    fill(255, 255, 255, 220); circle(ex + gx - 3, ey + gy - 3, 3.2);
    c.restore();
    if (tired > 0.05) {
      stroke(174, 28, 42, 70 + 175 * tired); strokeWeight(1 + 1.2 * tired);
      for (let k = 0; k < 3; k++) line(ex + sd * 14, cy + (k - 1) * 3, ex + sd * 7, cy + (k - 1) * 1.7);
      noStroke();
    }
    noFill(); stroke(112, 48, 48, 110 + 125 * tired); strokeWeight(2 + 2.5 * tired); ellipse(ex, cy, 35, eh + 7);
    stroke(74, 48, 44, 150 + 80 * tired); strokeWeight(2.4 + 1.8 * tired);
    arc(ex, cy - 1, 31, eh + 4, PI, TWO_PI); noStroke();
    if (tired > 0.35) {
      stroke(78, 48, 44, 100 + 120 * tired); strokeWeight(4 + 2 * tired);
      line(ex - 17, cy - 8, ex + 15, cy - 4); noStroke();
    }
  });
  // glasses (the screen reflection fades enough to keep his strained eyes visible)
  [-1, 1].forEach(sd => {
    const ex = sd * 36; fill(190, 215, 255, 22 + 45 * s * (1 - tired)); circle(ex, -10, 66);
    fill(255, 255, 255, 70 * s); quad(ex - 18, -30, ex - 8, -30, ex - 22, -8, ex - 30, -8);
    noFill(); stroke(62, 44, 36); strokeWeight(5); circle(ex, -10, 66); line(sd * 66, -14, sd * 92, -8);
  });
  strokeWeight(4); arc(0, -14, 14, 10, PI, TWO_PI);
  stroke(84, 56, 40); strokeWeight(6); [-1, 1].forEach(sd => line(sd * 60, -52 + s * 3 - (1 - s) * 3, sd * 16, -58 - s * 6 - (1 - s) * 3)); noStroke();
  pop();
}

// ---------- DESK + PROPS ----------
function desk(s, t, P) {
  const c = drawingContext, { hx } = P, g = ease(0, 0.6, s);
  c.fillStyle = lg(0, 520, 0, 552, [[0, rgb(L([186, 158, 124], [38, 32, 30], s))], [1, rgb(L([158, 130, 100], [28, 24, 24], s))]]); c.fillRect(0, 520, W, 32);
  fill(...L([132, 106, 82], [22, 19, 19], s)); rect(0, 552, W, 168); stroke(0, 0, 0, 18); strokeWeight(2); for (let y = 570; y < H; y += 24) line(0, y, W, y); noStroke();
  fill(255, 255, 255, 40 * (1 - s)); rect(0, 520, W, 2);
  // laptop, seen from behind: its light only shows at the edges
  fill(...L([120, 122, 130], [60, 62, 70], s)); rect(440, 508, 400, 14, 4);
  fill(0); c.fillStyle = lg(0, 356, 0, 516, [[0, rgb(L([196, 198, 204], [96, 98, 108], s))], [1, rgb(L([168, 170, 178], [80, 82, 92], s))]]); rect(460, 356, 360, 160, 10);
  noFill(); stroke(150, 184, 255, 60 + 180 * s); strokeWeight(3); line(466, 358, 814, 358); line(461, 366, 461, 500); line(819, 366, 819, 500); noStroke();
  // forearms and paws on the desk
  [-1, 1].forEach(sd => {
    const x = hx + sd * (262 - s * 36); fill(...L([112, 130, 136], [54, 60, 72], s * 0.7)); ellipse(x, 506, 150, 50);
    fill(...L([158, 112, 76], [114, 94, 88], s * 0.6)); ellipse(x - sd * 72, 508, 44, 38);
  });
  // mug: steam fades, tea goes cold
  fill(...L([240, 234, 224], [82, 80, 86], s)); rect(915, 466, 52, 54, 0, 0, 10, 10); noFill(); stroke(...L([240, 234, 224], [82, 80, 86], s)); strokeWeight(5); arc(968, 492, 26, 26, -HALF_PI, HALF_PI);
  stroke(255, 255, 255, 150 * (1 - ease(0, 0.6, s))); strokeWeight(3);
  for (let i = 0; i < 3; i++) { beginShape(); for (let y = 0; y < 50; y += 4) vertex(926 + i * 12 + sin(t * 1.6 + y * 0.15 + i) * 5, 460 - y); endShape(); } noStroke();
  // plant wilts
  fill(...L([196, 128, 98], [70, 52, 48], s)); quad(1060, 480, 1120, 480, 1112, 520, 1068, 520);
  for (let i = 0; i < 7; i++) {
    push(); translate(1090, 482); rotate(-HALF_PI + (i - 3) * 0.4 + s * (i - 3) * 0.35 + sin(t * 0.8 + i) * 0.03 * (1 - s));
    const ln = lerp(96, 56, s); fill(...L([72, 140, 86], [76, 80, 74], s)); ellipse(ln / 2, 0, ln, lerp(26, 12, s)); pop();
  }
  // books + lamp (lamp is switched off late)
  [[[196, 100, 90], 1130, 500], [[96, 130, 170], 1136, 482], [[226, 190, 96], 1128, 464]].forEach(([col, x, y]) => { fill(...L(col, [60, 60, 66], s * 0.9)); rect(x, y, 84, 18, 2); });
  fill(...L([196, 170, 120], [60, 56, 52], s)); ellipse(230, 518, 90, 14); stroke(...L([196, 170, 120], [60, 56, 52], s)); strokeWeight(6); noFill(); bezier(230, 516, 200, 440, 230, 400, 290, 380); noStroke();
  fill(...L([220, 196, 140], [64, 60, 56], s)); push(); translate(296, 376); rotate(0.5); quad(-22, -6, 22, -6, 36, 30, -36, 30); pop();
  fill(255, 226, 160, 255 * (1 - ease(0.1, 0.6, s))); circle(300, 404, 12);
}

// ---------- LIGHT ----------
function lighting(s, t, P) {
  const c = drawingContext; noStroke();
  fill(255, 196, 120, 30 * (1 - ease(0.08, 0.26, s))); rect(0, 0, W, H);                                    // warm golden hour
  fill(7, 8, 14, 255 * 0.94 * pow(ease(0.34, 0.82, s), 0.85)); rect(0, 0, W, H);                          // the room goes dark
  c.globalCompositeOperation = 'lighter';
  const lamp = 0.18 * ease(0.30, 0.50, s) * (1 - ease(0.56, 0.66, s));
  c.fillStyle = rg(300, 400, 300, [[0, `rgba(255,200,130,${lamp})`], [1, 'rgba(255,200,130,0)']]); c.fillRect(0, 0, W, H);
  c.fillStyle = rg(640, 340, lerp(300, 760, s), [[0, `rgba(150,185,255,${lerp(0.06, 0.7, s)})`], [0.5, `rgba(110,150,240,${lerp(0.02, 0.28, s)})`], [1, 'rgba(90,120,220,0)']]); c.fillRect(0, 0, W, H);
  c.fillStyle = rg(P.hx, P.hy + 10, 180, [[0, `rgba(170,200,255,${0.55 * s})`], [1, 'rgba(170,200,255,0)']]); c.fillRect(0, 0, W, H);   // laptop light on his face
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = rg(W / 2, H / 2, 820, [[0.45, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${0.25 + 0.55 * s})`]]); c.fillRect(0, 0, W, H);
}
function caption(dt, s) {
  if (M.caption) M.cap2 = M.caption;
  M.capA = lerp(M.capA, M.caption ? 1 : 0, 1 - exp(-dt * 3));
  const c = drawingContext;
  if (M.capA > 0.01) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 12; fill(246, 238, 224, 235 * M.capA); noStroke();
    textAlign(CENTER, TOP); textStyle(ITALIC); textSize(max(18, width / 58)); text(M.cap2, width / 2, 28); c.restore(); textStyle(NORMAL);
  }
  if (M.debug) { fill(255, 255, 255, 220); textAlign(LEFT, TOP); textSize(13); text(`s=${s.toFixed(2)} target=${M.target.toFixed(2)} (D hides)`, 12, height - 24); }
}
