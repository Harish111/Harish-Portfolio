import * as THREE from 'three';
import { ZONES } from './content.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const SKY = new THREE.Color('#e9a463');     // warm autumn sky
const FOG = new THREE.Color('#e8b27a');
scene.background = SKY;
scene.fog = new THREE.Fog(FOG, 45, 160);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 8, 14);

// ---------------------------------------------------------------------------
// Lighting — low, golden "magic hour" sun to evoke Yotei
// ---------------------------------------------------------------------------
const sun = new THREE.DirectionalLight('#ffd9a0', 1.5);
sun.position.set(-40, 50, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 200;
const s = 90;
sun.shadow.camera.left = -s;
sun.shadow.camera.right = s;
sun.shadow.camera.top = s;
sun.shadow.camera.bottom = -s;
scene.add(sun);

scene.add(new THREE.HemisphereLight('#ffe7c2', '#6b4a33', 0.7));
scene.add(new THREE.AmbientLight('#ffffff', 0.25));

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(170, 64),
  new THREE.MeshStandardMaterial({ color: '#c79a55', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// A subtle darker path ring so the world has a center
const path = new THREE.Mesh(
  new THREE.RingGeometry(20, 26, 48),
  new THREE.MeshStandardMaterial({ color: '#a87f43', roughness: 1 })
);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.01;
path.receiveShadow = true;
scene.add(path);

// ---------------------------------------------------------------------------
// Prop factories (all low-poly, built from primitives)
// ---------------------------------------------------------------------------
function makeMaple(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: '#5b3a24', roughness: 1 })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  g.add(trunk);

  const leafColors = ['#d64545', '#e8702a', '#e8a93a', '#c0392b'];
  for (let i = 0; i < 4; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9 + Math.random() * 0.5, 0),
      new THREE.MeshStandardMaterial({
        color: leafColors[(Math.random() * leafColors.length) | 0],
        roughness: 1,
        flatShading: true,
      })
    );
    blob.position.set(
      (Math.random() - 0.5) * 1.4,
      2.2 + Math.random() * 0.9,
      (Math.random() - 0.5) * 1.4
    );
    blob.castShadow = true;
    g.add(blob);
  }
  g.scale.setScalar(scale);
  return g;
}

function makePine(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.22, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: '#5b3a24', roughness: 1 })
  );
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  g.add(trunk);
  const mat = new THREE.MeshStandardMaterial({ color: '#3f6b3f', roughness: 1, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3 - i * 0.3, 1.5, 7), mat);
    cone.position.y = 1.6 + i * 1.0;
    cone.castShadow = true;
    g.add(cone);
  }
  g.scale.setScalar(scale);
  return g;
}

function makeLantern() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#8d8576', roughness: 1, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.4, 6), stone);
  base.position.y = 0.2; base.castShadow = true; g.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 6), stone);
  post.position.y = 0.9; post.castShadow = true; g.add(post);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), stone);
  head.position.y = 1.6; head.castShadow = true; g.add(head);
  // glowing light inside
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshBasicMaterial({ color: '#ffd27a' })
  );
  glow.position.y = 1.6; g.add(glow);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.45, 4), stone);
  roof.position.y = 2.05; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  return g;
}

// A torii gate marks each content zone
function makeTorii(color = '#d64545') {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const black = new THREE.MeshStandardMaterial({ color: '#2b1a12', roughness: 0.8 });
  const H = 6, W = 5;
  const legGeo = new THREE.CylinderGeometry(0.32, 0.4, H, 10);
  const left = new THREE.Mesh(legGeo, mat);
  left.position.set(-W / 2, H / 2, 0); left.castShadow = true; g.add(left);
  const right = new THREE.Mesh(legGeo, mat);
  right.position.set(W / 2, H / 2, 0); right.castShadow = true; g.add(right);
  // top beam (kasagi) — slightly wider, dark
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + 2.2, 0.6, 0.9), black);
  top.position.set(0, H, 0); top.castShadow = true; g.add(top);
  const top2 = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, 0.4, 0.7), mat);
  top2.position.set(0, H - 0.8, 0); top2.castShadow = true; g.add(top2);
  // small mid tie beam
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), black);
  tie.position.set(0, H - 1.4, 0); g.add(tie);
  return g;
}

// ---------------------------------------------------------------------------
// Scatter scenery
// ---------------------------------------------------------------------------
function rand(min, max) { return min + Math.random() * (max - min); }

const SCATTER_COUNT = 140;
for (let i = 0; i < SCATTER_COUNT; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(34, 150);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  let tree;
  const r = Math.random();
  if (r < 0.6) tree = makeMaple(rand(0.8, 1.5));
  else if (r < 0.85) tree = makePine(rand(0.9, 1.6));
  else { tree = makeLantern(); }
  tree.position.set(x, 0, z);
  tree.rotation.y = Math.random() * Math.PI * 2;
  scene.add(tree);
}

// Pampas-grass field hint: scattered thin golden cones near the center ring
const grassMat = new THREE.MeshStandardMaterial({ color: '#e8c87a', roughness: 1, flatShading: true });
for (let i = 0; i < 200; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(28, 60);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, rand(1.2, 2.4), 4), grassMat);
  blade.position.set(Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius);
  blade.rotation.set(rand(-0.2, 0.2), Math.random() * Math.PI, rand(-0.2, 0.2));
  scene.add(blade);
}

// ---------------------------------------------------------------------------
// Content zones — a torii + lanterns + floating label at each
// ---------------------------------------------------------------------------
function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(247,239,226,0.92)';
  roundRect(ctx, 6, 6, 500, 116, 24); ctx.fill();
  ctx.fillStyle = '#d64545';
  ctx.font = 'bold 56px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

ZONES.forEach((zone) => {
  const gate = makeTorii(zone.color);
  gate.position.set(zone.x, 0, zone.z);
  gate.lookAt(0, 0, 0);
  scene.add(gate);

  const l1 = makeLantern(); l1.position.set(zone.x - 3.5, 0, zone.z); scene.add(l1);
  const l2 = makeLantern(); l2.position.set(zone.x + 3.5, 0, zone.z); scene.add(l2);

  const label = makeLabel(zone.title);
  label.position.set(zone.x, 8.5, zone.z);
  scene.add(label);
});

// ---------------------------------------------------------------------------
// Car (boxes) + arcade driving
// ---------------------------------------------------------------------------
function makeCar() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.6, 3.4),
    new THREE.MeshStandardMaterial({ color: '#2b2b3a', roughness: 0.5, metalness: 0.2 })
  );
  body.position.y = 0.7; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.6, 1.7),
    new THREE.MeshStandardMaterial({ color: '#d64545', roughness: 0.4 })
  );
  cabin.position.set(0, 1.2, -0.2); cabin.castShadow = true; g.add(cabin);
  // windshield
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.45, 0.1),
    new THREE.MeshStandardMaterial({ color: '#9fd3e0', roughness: 0.1, metalness: 0.3 })
  );
  glass.position.set(0, 1.25, 0.65); g.add(glass);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
  const wheels = [];
  const offs = [
    [-0.95, 0.42, 1.1], [0.95, 0.42, 1.1],
    [-0.95, 0.42, -1.1], [0.95, 0.42, -1.1],
  ];
  offs.forEach((o) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...o);
    w.castShadow = true;
    g.add(w);
    wheels.push(w);
  });
  g.userData.wheels = wheels;
  return g;
}

const car = makeCar();
scene.add(car);

const carState = { x: 0, z: 30, heading: Math.PI, speed: 0 };

// ---------------------------------------------------------------------------
// Input — keyboard + touch
// ---------------------------------------------------------------------------
const keys = { up: false, down: false, left: false, right: false };
const keyMap = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};
window.addEventListener('keydown', (e) => {
  if (keyMap[e.code]) { keys[keyMap[e.code]] = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  if (keyMap[e.code]) { keys[keyMap[e.code]] = false; }
});

// Touch controls
const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) {
  const touchEl = document.getElementById('touch');
  touchEl.classList.remove('hidden');
  touchEl.querySelectorAll('.tbtn').forEach((btn) => {
    const k = btn.dataset.key;
    const on = (e) => { e.preventDefault(); keys[k] = true; };
    const off = (e) => { e.preventDefault(); keys[k] = false; };
    btn.addEventListener('touchstart', on, { passive: false });
    btn.addEventListener('touchend', off, { passive: false });
    btn.addEventListener('touchcancel', off, { passive: false });
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
  });
}

// ---------------------------------------------------------------------------
// Content panel
// ---------------------------------------------------------------------------
const panelEl = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
document.getElementById('panel-close').addEventListener('click', () => {
  panelEl.classList.add('hidden');
});
let activeZoneId = null;
function openZone(zone) {
  panelContent.innerHTML = zone.html;
  panelEl.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Driving physics + loop
// ---------------------------------------------------------------------------
const MAX_SPEED = 0.42;
const ACCEL = 0.012;
const FRICTION = 0.96;
const TURN = 0.045;
const WORLD_RADIUS = 158;

const clock = new THREE.Clock();

function update() {
  // accelerate / brake
  if (keys.up) carState.speed += ACCEL;
  if (keys.down) carState.speed -= ACCEL;
  carState.speed *= FRICTION;
  carState.speed = THREE.MathUtils.clamp(carState.speed, -MAX_SPEED * 0.5, MAX_SPEED);

  // steering scales with speed (can't turn while parked)
  const dir = carState.speed >= 0 ? 1 : -1;
  const steerAmount = TURN * THREE.MathUtils.clamp(Math.abs(carState.speed) / MAX_SPEED * 3, 0, 1);
  if (keys.left) carState.heading += steerAmount * dir;
  if (keys.right) carState.heading -= steerAmount * dir;

  // move
  carState.x += Math.sin(carState.heading) * carState.speed;
  carState.z += Math.cos(carState.heading) * carState.speed;

  // keep inside the world
  const distFromCenter = Math.hypot(carState.x, carState.z);
  if (distFromCenter > WORLD_RADIUS) {
    carState.x *= WORLD_RADIUS / distFromCenter;
    carState.z *= WORLD_RADIUS / distFromCenter;
    carState.speed *= 0.4;
  }

  car.position.set(carState.x, 0, carState.z);
  car.rotation.y = carState.heading;

  // spin wheels
  const spin = carState.speed * 1.6;
  car.userData.wheels.forEach((w) => { w.rotation.x += spin; });

  // follow camera
  const camDist = 12, camHeight = 6.5;
  const targetCamX = carState.x - Math.sin(carState.heading) * camDist;
  const targetCamZ = carState.z - Math.cos(carState.heading) * camDist;
  camera.position.x += (targetCamX - camera.position.x) * 0.08;
  camera.position.z += (targetCamZ - camera.position.z) * 0.08;
  camera.position.y += (camHeight - camera.position.y) * 0.08;
  camera.lookAt(carState.x, 1.2, carState.z);

  // zone proximity
  let inZone = null;
  for (const zone of ZONES) {
    if (Math.hypot(carState.x - zone.x, carState.z - zone.z) < 7) { inZone = zone; break; }
  }
  if (inZone && inZone.id !== activeZoneId) {
    activeZoneId = inZone.id;
    openZone(inZone);
  } else if (!inZone) {
    activeZoneId = null;
  }
}

function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Resize + boot
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Fake-but-honest loading: fill the bar over a couple frames, then reveal.
const loadingEl = document.getElementById('loading');
const fill = document.querySelector('.loading-fill');
let p = 0;
const boot = setInterval(() => {
  p = Math.min(100, p + 12);
  fill.style.width = p + '%';
  if (p >= 100) {
    clearInterval(boot);
    setTimeout(() => {
      loadingEl.classList.add('gone');
      animate();
    }, 250);
  }
}, 60);
