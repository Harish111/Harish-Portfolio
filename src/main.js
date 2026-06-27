import * as THREE from 'three';
import { ZONES } from './content.js';
import { toggleAudio } from './audio.js';

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
const SKY = new THREE.Color('#bcd6df');     // soft daytime sky
const FOG = new THREE.Color('#d4e4e8');
scene.background = SKY;
scene.fog = new THREE.Fog(FOG, 55, 180);

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

scene.add(new THREE.HemisphereLight('#dff0f5', '#4f6e34', 0.75));
scene.add(new THREE.AmbientLight('#ffffff', 0.25));

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(180, 64),
  new THREE.MeshStandardMaterial({ color: '#6f9e4a', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Stone courtyard ring framing the castle at the center
const path = new THREE.Mesh(
  new THREE.RingGeometry(18, 27, 56),
  new THREE.MeshStandardMaterial({ color: '#b7b0a2', roughness: 1 })
);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.02;
path.receiveShadow = true;
scene.add(path);

// Inner courtyard disc the castle sits on
const courtyard = new THREE.Mesh(
  new THREE.CircleGeometry(14, 48),
  new THREE.MeshStandardMaterial({ color: '#c7c0b1', roughness: 1 })
);
courtyard.rotation.x = -Math.PI / 2;
courtyard.position.y = 0.03;
courtyard.receiveShadow = true;
scene.add(courtyard);

// Japanese castle (tenshu) — sloped stone base + white tiers, each capped by a
// wide, shallow, dark hip roof with big overhanging eaves and a chidori-hafu
// gable on the front. Topped with golden shachihoko ornaments.
function makeCastle() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#9a9387', roughness: 1, flatShading: true });
  const wall = new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#3a4654', roughness: 0.8, flatShading: true });
  const roofEdge = new THREE.MeshStandardMaterial({ color: '#262f38', roughness: 0.8, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: '#d9a93a', metalness: 0.45, roughness: 0.35 });

  const railMat = new THREE.MeshStandardMaterial({ color: '#5b3a24', roughness: 1 });
  const doorMat = new THREE.MeshStandardMaterial({ color: '#1c140e', roughness: 1 });

  // Sloped stone base (4-sided frustum), kept low so the tower dominates.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(7.0, 9.0, 2.6, 4), stone);
  base.rotation.y = Math.PI / 4;
  base.position.y = 1.3;
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  // --- Veranda (engawa) corridor ringing the first tier, with a railing ---
  const verandaY = 2.6;
  const vHalf = 6.4;
  const veranda = new THREE.Mesh(new THREE.BoxGeometry(vHalf * 2, 0.25, vHalf * 2), stone);
  veranda.position.y = verandaY + 0.12; veranda.receiveShadow = true; veranda.castShadow = true;
  g.add(veranda);
  const postGeo = new THREE.BoxGeometry(0.16, 0.7, 0.16);
  for (let t = -vHalf + 0.4; t <= vHalf - 0.4; t += 1.0) {
    for (const [px, pz] of [[t, vHalf], [t, -vHalf], [vHalf, t], [-vHalf, t]]) {
      const post = new THREE.Mesh(postGeo, railMat);
      post.position.set(px, verandaY + 0.5, pz); g.add(post);
    }
  }
  for (const [rx, rz, rw, rd] of [
    [0, vHalf, vHalf * 2, 0.12], [0, -vHalf, vHalf * 2, 0.12],
    [vHalf, 0, 0.12, vHalf * 2], [-vHalf, 0, 0.12, vHalf * 2],
  ]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.1, rd), railMat);
    rail.position.set(rx, verandaY + 0.85, rz); g.add(rail);
  }

  // --- Four stone staircases up to the veranda, one per side ---
  function makeStairs() {
    const s = new THREE.Group();
    const n = 5, depth = 0.7, width = 3.6;
    for (let i = 0; i < n; i++) {
      const h = verandaY * (i + 1) / n;
      const step = new THREE.Mesh(new THREE.BoxGeometry(width, verandaY / n, depth), stone);
      step.position.set(0, h - verandaY / (2 * n), vHalf + (n - i) * depth - depth / 2);
      step.castShadow = true; step.receiveShadow = true; s.add(step);
    }
    return s;
  }
  for (let k = 0; k < 4; k++) {
    const st = makeStairs();
    st.rotation.y = k * Math.PI / 2;
    g.add(st);
  }

  // --- Four entrances (dark doorways) in the first-tier wall ---
  for (let k = 0; k < 4; k++) {
    const grp = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 0.3), railMat);
    frame.position.set(0, verandaY + 1.15, 5.0); grp.add(frame);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, 0.36), doorMat);
    door.position.set(0, verandaY + 0.95, 5.02); grp.add(door);
    grp.rotation.y = k * Math.PI / 2;
    g.add(grp);
  }

  // A castle roof: a wide FLAT-TOPPED frustum (trapezoid, no pointy apex) with
  // an overhanging eave lip. Returns the y of its flat top.
  function roof(wallW, baseY) {
    const eaveW = wallW + 2.6;        // overhang past the wall
    const topW = wallW * 0.62;        // flat top (where the next tier sits)
    const rh = wallW * 0.36;          // roof height (kept modest)
    // thin eave lip sticking out at the bottom of the roof
    const lip = new THREE.Mesh(new THREE.BoxGeometry(eaveW + 0.7, 0.32, eaveW + 0.7), roofEdge);
    lip.position.y = baseY + 0.16; lip.castShadow = true; g.add(lip);
    // flat-topped pyramid (frustum)
    const bottomR = (eaveW / 2) * Math.SQRT2;
    const topR = (topW / 2) * Math.SQRT2;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, rh, 4), roofMat);
    body.rotation.y = Math.PI / 4;
    body.position.y = baseY + 0.32 + rh / 2; body.castShadow = true; g.add(body);
    return { topY: baseY + 0.32 + rh, topW };
  }

  let y = 2.6;
  const walls = [
    { w: 10.0, h: 2.7 },
    { w: 6.6, h: 2.3 },
    { w: 4.4, h: 2.0 },
  ];
  walls.forEach((t, i) => {
    const isTop = i === walls.length - 1;
    // white wall block
    const wm = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.w), wall);
    wm.position.y = y + t.h / 2; wm.castShadow = true; g.add(wm);
    // dark window row + a white frame line under it
    const band = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.06, 0.5, t.w + 0.06), roofEdge);
    band.position.y = y + t.h - 0.55; g.add(band);
    y += t.h;

    const r = roof(t.w, y);
    y = r.topY;

    if (isTop) {
      // horizontal ridge beam on the flat top (reads as a building, not a cone)
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(r.topW + 0.5, 0.45, 1.1), roofEdge);
      ridge.position.y = y + 0.22; ridge.castShadow = true; g.add(ridge);
      // golden shachihoko (mythical fish ornaments) at each ridge end
      for (const sx of [-1, 1]) {
        const fish = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 4), gold);
        fish.rotation.y = Math.PI / 4;
        fish.rotation.z = sx * 0.4;
        fish.position.set(sx * (r.topW / 2 + 0.1), y + 0.55, 0);
        g.add(fish);
      }
      y += 0.45;
    }
  });
  return g;
}
const castle = makeCastle();
castle.scale.setScalar(0.92);
scene.add(castle);
const CASTLE_RADIUS = 12; // keep the car from driving through it

// Distant snow-capped volcanoes (Fuji + Yotei) as a backdrop. fog:false so
// they read as a clear, faraway horizon rising above the misty treeline.
function makeMountain({ radius, height, color }) {
  const m = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, fog: false });
  // Snow cap uses a different slope + polygonOffset so its faces are never
  // coplanar with the rock cone (which was causing the top to flicker).
  const snow = new THREE.MeshStandardMaterial({
    color: '#f4f7fb', roughness: 1, flatShading: true, fog: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), rock);
  cone.position.y = height / 2; m.add(cone);
  // wider, shorter cap → shallower slope than the rock, sits proud near the top
  const capH = height * 0.5;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.56, capH, 8), snow);
  cap.position.y = height - capH / 2; m.add(cap);
  return m;
}
// Mount Fuji — broad, iconic, back-left (sunk a little so it rises from the horizon)
const fuji = makeMountain({ radius: 95, height: 80, color: '#6f8198' });
fuji.position.set(-205, -7, -205);
scene.add(fuji);
// Mount Yotei (Ezo-Fuji) — back-right
const yotei = makeMountain({ radius: 80, height: 72, color: '#74899c' });
yotei.position.set(215, -7, -185);
scene.add(yotei);

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

function makeSakura(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.26, 2.0, 6),
    new THREE.MeshStandardMaterial({ color: '#5b3a24', roughness: 1 })
  );
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  g.add(trunk);

  const blossom = ['#f6c1d6', '#f7a8c4', '#ffd6e6'];
  for (let i = 0; i < 5; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.75 + Math.random() * 0.45, 0),
      new THREE.MeshStandardMaterial({
        color: blossom[(Math.random() * blossom.length) | 0],
        roughness: 1,
        flatShading: true,
      })
    );
    blob.position.set(
      (Math.random() - 0.5) * 1.6,
      2.0 + Math.random() * 0.9,
      (Math.random() - 0.5) * 1.6
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

// Solid obstacles the car cannot drive through — circle colliders {x, z, r}.
const colliders = [];

// Keep an area clear around every gate so the gateway/approach isn't blocked.
function clearOfGates(x, z, pad) {
  for (const zone of ZONES) {
    if (Math.hypot(x - zone.x, z - zone.z) < pad) return false;
  }
  return true;
}

const SCATTER_COUNT = 150;
let placed = 0, attempts = 0;
while (placed < SCATTER_COUNT && attempts < SCATTER_COUNT * 8) {
  attempts++;
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(34, 150);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (!clearOfGates(x, z, 13)) continue; // don't block gate areas
  let tree, cr;
  const r = Math.random();
  if (r < 0.34) { tree = makeMaple(rand(0.8, 1.5)); cr = 1.1; }
  else if (r < 0.64) { tree = makeSakura(rand(0.85, 1.5)); cr = 1.1; }
  else if (r < 0.86) { tree = makePine(rand(0.9, 1.6)); cr = 0.9; }
  else { tree = makeLantern(); cr = 0.7; }
  tree.position.set(x, 0, z);
  tree.rotation.y = Math.random() * Math.PI * 2;
  scene.add(tree);
  colliders.push({ x, z, r: cr });
  placed++;
}

// Pampas-grass field hint (decorative — car drives over these, no collider)
const grassMat = new THREE.MeshStandardMaterial({ color: '#e8c87a', roughness: 1, flatShading: true });
for (let i = 0; i < 220; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(28, 70);
  const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  if (!clearOfGates(x, z, 12)) continue;
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, rand(1.2, 2.4), 4), grassMat);
  blade.position.set(x, 0.6, z);
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

// Small wooden Japanese hut (minka): wood walls + wide thatched hip roof.
function makeHut() {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#6b4a33', roughness: 1 });
  const beamMat = new THREE.MeshStandardMaterial({ color: '#4a3322', roughness: 1 });
  const thatch = new THREE.MeshStandardMaterial({ color: '#8a7350', roughness: 1, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 1 });

  const walls = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 2.4), woodMat);
  walls.position.y = 0.75; walls.castShadow = true; g.add(walls);
  // corner beams
  for (const [sx, sz] of [[-1.4, 1.2], [1.4, 1.2], [-1.4, -1.2], [1.4, -1.2]]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.5, 0.18), beamMat);
    beam.position.set(sx, 0.75, sz); g.add(beam);
  }
  // wide thatched hip roof (flat-topped frustum + eave lip)
  const eaveW = 4.2;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(eaveW, 0.22, eaveW), thatch);
  lip.position.y = 1.6; lip.castShadow = true; g.add(lip);
  const bottomR = (eaveW / 2) * Math.SQRT2;
  const topR = 0.5 * Math.SQRT2;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, 1.5, 4), thatch);
  roof.rotation.y = Math.PI / 4; roof.position.y = 2.4; roof.castShadow = true; g.add(roof);
  // ridge beam on top
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.3), beamMat);
  ridge.position.y = 3.15; g.add(ridge);
  // doorway + window
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.06), dark);
  door.position.set(0, 0.5, 1.21); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.06), dark);
  win.position.set(-1.0, 0.85, 1.21); g.add(win);
  return g;
}

ZONES.forEach((zone) => {
  const len = Math.hypot(zone.x, zone.z) || 1;
  const ux = zone.x / len, uz = zone.z / len;   // outward from center
  const tx = -uz, tz = ux;                       // tangent (gate width axis)

  const gate = makeTorii(zone.color);
  gate.position.set(zone.x, 0, zone.z);
  gate.lookAt(0, 0, 0);
  scene.add(gate);
  // collide with the two gate pillars (local ±2.5 along the gate's width)
  for (const side of [-1, 1]) {
    colliders.push({ x: zone.x + tx * 2.5 * side, z: zone.z + tz * 2.5 * side, r: 0.55 });
  }

  // lanterns flanking the gate (along the tangent so they line up with it)
  const l1 = makeLantern();
  l1.position.set(zone.x + tx * 3.6, 0, zone.z + tz * 3.6); scene.add(l1);
  const l2 = makeLantern();
  l2.position.set(zone.x - tx * 3.6, 0, zone.z - tz * 3.6); scene.add(l2);
  colliders.push({ x: l1.position.x, z: l1.position.z, r: 0.6 });
  colliders.push({ x: l2.position.x, z: l2.position.z, r: 0.6 });

  const label = makeLabel(zone.title);
  label.position.set(zone.x, 8.5, zone.z);
  scene.add(label);

  // A small village: two huts flanking each gate, set back and facing center.
  for (const side of [-1, 1]) {
    const hut = makeHut();
    const hx = zone.x + tx * 8 * side + ux * 3;
    const hz = zone.z + tz * 8 * side + uz * 3;
    hut.position.set(hx, 0, hz);
    hut.lookAt(0, 1, 0);
    hut.rotation.y += (Math.random() - 0.5) * 0.3;
    scene.add(hut);
    colliders.push({ x: hx, z: hz, r: 1.9 });
  }
});

// ---------------------------------------------------------------------------
// A small farmed plot — a fenced rice paddy with rows of crops + a scarecrow.
// ---------------------------------------------------------------------------
function makeFarm() {
  const g = new THREE.Group();
  const soil = new THREE.MeshStandardMaterial({ color: '#6e4a2a', roughness: 1 });
  const paddy = new THREE.MeshStandardMaterial({ color: '#5f7d49', roughness: 0.7 });
  const cropMat = new THREE.MeshStandardMaterial({ color: '#7cae3a', roughness: 1, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#6b4a33', roughness: 1 });
  const W = 16, D = 12;

  const plot = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), soil);
  plot.position.y = 0.15; plot.receiveShadow = true; g.add(plot);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(W - 1.4, 0.12, D - 1.4), paddy);
  pad.position.y = 0.32; g.add(pad);

  // rows of crops
  for (let rx = -W / 2 + 1.6; rx <= W / 2 - 1.6; rx += 1.4) {
    for (let rz = -D / 2 + 1.4; rz <= D / 2 - 1.4; rz += 1.2) {
      const crop = new THREE.Mesh(new THREE.ConeGeometry(0.18, rand(0.5, 0.8), 5), cropMat);
      crop.position.set(rx + rand(-0.12, 0.12), 0.6, rz + rand(-0.12, 0.12));
      crop.castShadow = true; g.add(crop);
    }
  }

  // fence posts + rails around the plot (also returned as colliders below)
  const postGeo = new THREE.BoxGeometry(0.16, 0.9, 0.16);
  const fencePts = [];
  for (let fx = -W / 2; fx <= W / 2; fx += 2) { fencePts.push([fx, -D / 2]); fencePts.push([fx, D / 2]); }
  for (let fz = -D / 2 + 2; fz <= D / 2 - 2; fz += 2) { fencePts.push([-W / 2, fz]); fencePts.push([W / 2, fz]); }
  for (const [fx, fz] of fencePts) {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(fx, 0.45, fz); post.castShadow = true; g.add(post);
  }

  // scarecrow
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), woodMat);
  pole.position.set(0, 0.85, 0); g.add(pole);
  const arms = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), woodMat);
  arms.position.set(0, 1.25, 0); g.add(arms);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: '#d8c89a' }));
  head.position.set(0, 1.75, 0); g.add(head);

  g.userData.fencePts = fencePts;
  return g;
}
const farm = makeFarm();
const FARM_X = -64, FARM_Z = 58;
farm.position.set(FARM_X, 0, FARM_Z);
scene.add(farm);
// fence colliders so the car drives around the plot, not through the crops
for (const [fx, fz] of farm.userData.fencePts) {
  colliders.push({ x: FARM_X + fx, z: FARM_Z + fz, r: 0.5 });
}

// ---------------------------------------------------------------------------
// Car — stylized white Land Rover Defender + arcade driving
// Front of the vehicle faces +z (direction of travel).
// ---------------------------------------------------------------------------
function makeCar() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#eceeea', roughness: 0.5, metalness: 0.05 });
  const black = new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.8 });
  const trim = new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#2c3c40', roughness: 0.12, metalness: 0.5 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c8c8c8', roughness: 0.35, metalness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: '#a52828', roughness: 0.5, emissive: '#3a0000', emissiveIntensity: 0.35 });
  const amber = new THREE.MeshStandardMaterial({ color: '#e8943a', emissive: '#5a3000', emissiveIntensity: 0.3 });

  // Land Rover Defender: boxy, upright, flat panels. z+ = front.
  // Two-box shape — short flat hood, tall square cabin, flat roof, vertical
  // rear door with the spare wheel, square lamps. Body ~ 4.0 long, 2.0 wide.

  // Lower body tub + black side cladding + sill
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.84, 3.8), white);
  tub.position.y = 1.06; tub.castShadow = true; g.add(tub);
  const clad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 3.5), trim);
  clad.position.y = 0.82; g.add(clad);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.99, 0.14, 3.4), black);
  sill.position.y = 0.62; g.add(sill);

  // Flat hood (lower than the cabin) with the raised centre panel
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 1.55), white);
  hood.position.set(0, 1.55, 1.08); hood.castShadow = true; g.add(hood);
  const hoodPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 1.35), white);
  hoodPanel.position.set(0, 1.65, 1.02); g.add(hoodPanel);

  // Tall upright cabin shell, set behind the hood
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.97, 1.12, 2.55), white);
  cabin.position.set(0, 2.02, -0.42); cabin.castShadow = true; g.add(cabin);

  // Side window band + near-vertical windscreen
  const winSide = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.52, 2.05), glassMat);
  winSide.position.set(0, 2.18, -0.42); g.add(winSide);
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.62, 0.12), glassMat);
  windscreen.position.set(0, 2.2, 0.83); windscreen.rotation.x = -0.1; g.add(windscreen);
  // vertical white pillars splitting the side glass into windows
  for (const sx of [-0.98, 0.98]) {
    for (const sz of [0.8, -0.1, -1.0, -1.65]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 0.12), white);
      pillar.position.set(sx, 2.18, sz); g.add(pillar);
    }
  }
  // signature Defender "Alpine" roof side-windows (small, high, toward the rear)
  for (const sx of [-0.99, 0.99]) {
    const aw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 1.3), glassMat);
    aw.position.set(sx, 2.52, -0.8); g.add(aw);
  }

  // Flat roof + roof rack
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.99, 0.16, 2.62), white);
  roof.position.set(0, 2.62, -0.42); roof.castShadow = true; g.add(roof);
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 2.35), trim);
  rack.position.set(0, 2.74, -0.42); rack.castShadow = true; g.add(rack);
  for (const sx of [-0.82, 0, 0.82]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 2.35), trim);
    rail.position.set(sx, 2.75, -0.42); g.add(rail);
  }

  // Front face: black grille panel + slats + round headlights + bumper
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.66, 0.14), trim);
  front.position.set(0, 1.2, 1.88); g.add(front);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.54, 0.1), black);
  grille.position.set(0, 1.2, 1.94); g.add(grille);
  for (let i = -2; i <= 2; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.12), chrome);
    slat.position.set(i * 0.15, 1.2, 1.96); g.add(slat);
  }
  const headGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.14, 18);
  for (const sx of [-0.66, 0.66]) {
    const ring = new THREE.Mesh(headGeo, chrome);
    ring.rotation.x = Math.PI / 2; ring.position.set(sx, 1.22, 1.92); g.add(ring);
    const bulb = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 18),
      new THREE.MeshStandardMaterial({ color: '#fff6da', emissive: '#ffe6a8', emissiveIntensity: 0.7 })
    );
    bulb.position.set(sx, 1.22, 1.995); g.add(bulb);
  }
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.26, 0.3), trim);
  bumper.position.set(0, 0.74, 1.9); bumper.castShadow = true; g.add(bumper);
  for (const sx of [-0.92, 0.92]) {
    const ind = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), amber);
    ind.position.set(sx, 1.02, 1.955); g.add(ind);
  }

  // --- Rear (the part that should read clearly as a Defender) ---
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.92, 1.18, 0.12), white);
  door.position.set(0, 1.34, -1.92); g.add(door);
  // top-hinged rear window (offset left of the spare)
  const rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.06), glassMat);
  rearWin.position.set(-0.45, 1.72, -1.98); g.add(rearWin);
  // spare wheel mounted off-centre on the door (with bracket)
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.16), trim);
  bracket.position.set(0.42, 1.34, -1.98); g.add(bracket);
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.34, 20), black);
  spare.rotation.x = Math.PI / 2; spare.position.set(0.42, 1.34, -2.12);
  spare.castShadow = true; g.add(spare);
  const spareHub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 8), chrome);
  spareHub.rotation.x = Math.PI / 2; spareHub.position.set(0.42, 1.34, -2.14); g.add(spareHub);
  // square tail lights low on the corners
  for (const sx of [-0.78, 0.78]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.08), red);
    tl.position.set(sx, 0.98, -1.99); g.add(tl);
  }
  // number plate + rear bumper
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.05), new THREE.MeshStandardMaterial({ color: '#dcdcc8' }));
  plate.position.set(-0.45, 0.98, -1.99); g.add(plate);
  const rbump = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.26, 0.3), trim);
  rbump.position.set(0, 0.74, -1.92); rbump.castShadow = true; g.add(rbump);

  // Black wheel arches over each wheel
  for (const sz of [1.25, -1.25]) {
    for (const sx of [-1.0, 1.0]) {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 1.22), trim);
      arch.position.set(sx, 0.82, sz); g.add(arch);
    }
  }

  // --- Wheels: front wheels steer (pivot.rotation.y), all wheels roll ---
  const tyre = new THREE.MeshStandardMaterial({ color: '#131313', roughness: 0.95 });
  const treadMat = new THREE.MeshStandardMaterial({ color: '#070707', roughness: 1 });
  const wheelGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.46, 20);
  const hubGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.5, 10);
  const boltGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6);
  const lugGeo = new THREE.BoxGeometry(0.46, 0.1, 0.14);

  // A wheel whose detail (tread blocks + lug bolts + a spoke) makes its
  // rotation clearly visible when it rolls.
  function buildWheel() {
    const roll = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tyre);
    tire.rotation.z = Math.PI / 2; tire.castShadow = true; roll.add(tire);
    const hub = new THREE.Mesh(hubGeo, chrome);
    hub.rotation.z = Math.PI / 2; roll.add(hub);
    // a bright spoke across the hub — a strong visual spin cue
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.06), trim);
    roll.add(spoke);
    // lug bolts on both faces
    for (const fx of [-0.25, 0.25]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const bolt = new THREE.Mesh(boltGeo, black);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(fx, Math.sin(a) * 0.13, Math.cos(a) * 0.13);
        roll.add(bolt);
      }
    }
    // tread blocks around the circumference
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, treadMat);
      lug.position.set(0, Math.sin(a) * 0.57, Math.cos(a) * 0.57);
      lug.rotation.x = -a;
      roll.add(lug);
    }
    return roll;
  }

  const rollWheels = [];
  const steerWheels = [];
  const offs = [
    { x: -1.0, z: 1.25, front: true }, { x: 1.0, z: 1.25, front: true },
    { x: -1.0, z: -1.25, front: false }, { x: 1.0, z: -1.25, front: false },
  ];
  offs.forEach((o) => {
    const pivot = new THREE.Group();        // steers (yaw) for front wheels
    pivot.position.set(o.x, 0.56, o.z);
    const roll = buildWheel();               // spins (rolls)
    pivot.add(roll);
    g.add(pivot);
    rollWheels.push(roll);
    if (o.front) steerWheels.push(pivot);
  });
  g.userData.rollWheels = rollWheels;
  g.userData.steerWheels = steerWheels;
  return g;
}

const car = makeCar();
scene.add(car);

// carState.y / vy drive the intro "drop from the sky" landing animation.
const carState = { x: 0, z: 30, heading: Math.PI, speed: 0, y: 26, vy: 0 };
let intro = true;
const GRAVITY = 0.05;

// Dev-only inspection hook (stripped from production builds)
if (import.meta.env && import.meta.env.DEV) {
  window.__game = { scene, camera, car, carState, renderer };
}

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

// Drag anywhere on the scene to orbit the camera (e.g. to look at the front).
// camYaw is declared in the driving section; it eases back behind while driving.
let dragging = false, lastDragX = 0;
function dragStart(e) { dragging = true; lastDragX = (e.touches ? e.touches[0] : e).clientX; }
function dragMove(e) {
  if (!dragging) return;
  const x = (e.touches ? e.touches[0] : e).clientX;
  camYaw = THREE.MathUtils.clamp(camYaw - (x - lastDragX) * 0.006, -Math.PI, Math.PI);
  lastDragX = x;
}
function dragEnd() { dragging = false; }
canvas.addEventListener('mousedown', dragStart);
window.addEventListener('mousemove', dragMove);
window.addEventListener('mouseup', dragEnd);
canvas.addEventListener('touchstart', dragStart, { passive: true });
canvas.addEventListener('touchmove', dragMove, { passive: true });
canvas.addEventListener('touchend', dragEnd);

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
// Music toggle (starts on click — required by browser autoplay policy)
// ---------------------------------------------------------------------------
const soundBtn = document.getElementById('sound-btn');
const creditEl = document.getElementById('credit');
soundBtn.addEventListener('click', () => {
  const on = toggleAudio();
  soundBtn.textContent = on ? '🔊 Music' : '🔈 Music';
  soundBtn.classList.toggle('on', on);
  creditEl.classList.toggle('hidden', !on);
});

// ---------------------------------------------------------------------------
// Driving physics + loop  (delta-timed so speed is frame-rate independent)
// ---------------------------------------------------------------------------
const MAX_SPEED = 0.95;     // forward top speed (units per 1/60 s)
const REVERSE_MAX = 0.45;
const ACCEL = 0.03;         // throttle
const FRICTION = 0.985;     // rolling resistance (momentum)
const TURN_GAIN = 0.08;     // heading change per unit steer at full speed
const MAX_STEER = 0.52;     // max front-wheel angle (rad)
const STEER_LERP = 0.18;    // how quickly the wheels turn to target
const WORLD_RADIUS = 156;
const CAR_RADIUS = 1.3;     // for object collisions

let steer = 0;              // current front-wheel angle
let camYaw = 0;            // camera orbit offset (drag to look around)
const clock = new THREE.Clock();

function update() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const f = dt * 60; // 1.0 at 60fps

  // --- intro: the car drops from the sky and bounces to a stop ---
  if (intro) {
    carState.vy -= GRAVITY * f;
    carState.y += carState.vy * f;
    if (carState.y <= 0) {
      carState.y = 0;
      if (Math.abs(carState.vy) > 0.18) carState.vy = -carState.vy * 0.4; // bounce
      else { carState.vy = 0; intro = false; }
    }
    car.position.set(carState.x, carState.y, carState.z);
    car.rotation.y = carState.heading;
    if (!(import.meta.env && import.meta.env.DEV && window.__freezeCam)) {
      const ang = carState.heading;
      const camDist = 13, camHeight = 7;
      const lerp = 1 - Math.pow(1 - 0.08, f);
      camera.position.x += (carState.x - Math.sin(ang) * camDist - camera.position.x) * lerp;
      camera.position.z += (carState.z - Math.cos(ang) * camDist - camera.position.z) * lerp;
      camera.position.y += ((camHeight + carState.y * 0.45) - camera.position.y) * lerp;
      camera.lookAt(carState.x, carState.y + 1.0, carState.z);
    }
    return; // no driving until it lands
  }

  // throttle / brake / reverse
  if (keys.up) carState.speed += ACCEL * f;
  else if (keys.down) carState.speed -= ACCEL * f;
  carState.speed *= Math.pow(FRICTION, f);
  carState.speed = THREE.MathUtils.clamp(carState.speed, -REVERSE_MAX, MAX_SPEED);
  if (Math.abs(carState.speed) < 0.0008) carState.speed = 0;

  // front-wheel steering — eases toward the held direction
  let steerTarget = 0;
  if (keys.left) steerTarget += MAX_STEER;
  if (keys.right) steerTarget -= MAX_STEER;
  steer += (steerTarget - steer) * Math.min(1, STEER_LERP * f);
  car.userData.steerWheels.forEach((p) => { p.rotation.y = steer; });

  // turn the body from the steering (more effect with more speed)
  const speedFactor = THREE.MathUtils.clamp(Math.abs(carState.speed) / MAX_SPEED, 0, 1);
  const dir = carState.speed >= 0 ? 1 : -1;
  carState.heading += steer * TURN_GAIN * speedFactor * dir * f;

  // move
  carState.x += Math.sin(carState.heading) * carState.speed * f;
  carState.z += Math.cos(carState.heading) * carState.speed * f;

  // keep inside the world
  const distFromCenter = Math.hypot(carState.x, carState.z);
  if (distFromCenter > WORLD_RADIUS) {
    carState.x *= WORLD_RADIUS / distFromCenter;
    carState.z *= WORLD_RADIUS / distFromCenter;
    carState.speed *= 0.4;
  }
  // keep out of the central castle
  if (distFromCenter < CASTLE_RADIUS && distFromCenter > 0.001) {
    carState.x *= CASTLE_RADIUS / distFromCenter;
    carState.z *= CASTLE_RADIUS / distFromCenter;
    carState.speed *= 0.3;
  }
  // collide with solid objects (gates, trees, lanterns, huts)
  for (const c of colliders) {
    const dx = carState.x - c.x, dz = carState.z - c.z;
    const d = Math.hypot(dx, dz);
    const minD = c.r + CAR_RADIUS;
    if (d < minD && d > 0.0001) {
      carState.x = c.x + (dx / d) * minD;
      carState.z = c.z + (dz / d) * minD;
      carState.speed *= 0.35; // bump kills most of the momentum
    }
  }

  car.position.set(carState.x, carState.y, carState.z);
  car.rotation.y = carState.heading;

  // spin all wheels
  const spin = carState.speed * 1.5 * f;
  car.userData.rollWheels.forEach((w) => { w.rotation.x += spin; });

  // follow camera (skippable in dev for inspection). camYaw lets the player
  // drag to look around; forward eases it behind, reverse swings it to the
  // front of the car, idle holds wherever the player dragged it.
  if (!(import.meta.env && import.meta.env.DEV && window.__freezeCam)) {
    let camTarget = null;
    if (keys.up) camTarget = 0;
    else if (keys.down) camTarget = Math.PI; // reverse → look at the front
    if (camTarget !== null) {
      let d = camTarget - camYaw;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest angular path
      camYaw += d * Math.min(1, 0.06 * f);
    }
    const ang = carState.heading + camYaw;
    const camDist = 12.5, camHeight = 6.2;
    const targetCamX = carState.x - Math.sin(ang) * camDist;
    const targetCamZ = carState.z - Math.cos(ang) * camDist;
    const lerp = 1 - Math.pow(1 - 0.1, f);
    camera.position.x += (targetCamX - camera.position.x) * lerp;
    camera.position.z += (targetCamZ - camera.position.z) * lerp;
    camera.position.y += (camHeight - camera.position.y) * lerp;
    camera.lookAt(carState.x, 1.4, carState.z);
  }

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
