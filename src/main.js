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

  // Sloped stone base (4-sided frustum), kept low so the tower dominates.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(7.0, 9.0, 2.6, 4), stone);
  base.rotation.y = Math.PI / 4;
  base.position.y = 1.3;
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

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

const SCATTER_COUNT = 140;
for (let i = 0; i < SCATTER_COUNT; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(34, 150);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  let tree;
  const r = Math.random();
  if (r < 0.34) tree = makeMaple(rand(0.8, 1.5));
  else if (r < 0.64) tree = makeSakura(rand(0.85, 1.5));
  else if (r < 0.86) tree = makePine(rand(0.9, 1.6));
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
  const gate = makeTorii(zone.color);
  gate.position.set(zone.x, 0, zone.z);
  gate.lookAt(0, 0, 0);
  scene.add(gate);

  const l1 = makeLantern(); l1.position.set(zone.x - 3.5, 0, zone.z); scene.add(l1);
  const l2 = makeLantern(); l2.position.set(zone.x + 3.5, 0, zone.z); scene.add(l2);

  const label = makeLabel(zone.title);
  label.position.set(zone.x, 8.5, zone.z);
  scene.add(label);

  // A small village: two huts flanking each gate, set back and facing center.
  const len = Math.hypot(zone.x, zone.z) || 1;
  const ux = zone.x / len, uz = zone.z / len;   // outward from center
  const tx = -uz, tz = ux;                       // tangent
  for (const side of [-1, 1]) {
    const hut = makeHut();
    hut.position.set(
      zone.x + tx * 7 * side + ux * 2.5,
      0,
      zone.z + tz * 7 * side + uz * 2.5
    );
    hut.lookAt(0, 1, 0);
    hut.rotation.y += (Math.random() - 0.5) * 0.3;
    scene.add(hut);
  }
});

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

  // Defender silhouette: short flat hood up front, a tall upright cabin
  // behind it, flat roof, near-vertical windscreen, squared rear.
  // z+ = front. Hood spans roughly z 0.4..1.9; cabin spans z -1.9..0.5.

  // Lower body tub (white) — long and flat
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.78, 3.7), white);
  tub.position.y = 1.0; tub.castShadow = true; g.add(tub);

  // Black sill strip along the bottom of the doors
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.18, 3.5), trim);
  sill.position.y = 0.66; g.add(sill);

  // Flat hood (sits on the front part of the tub, lower than the cabin)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.16, 1.5), white);
  hood.position.set(0, 1.42, 1.15); hood.castShadow = true; g.add(hood);
  // raised center hood panel (Defender detail)
  const hoodPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.3), white);
  hoodPanel.position.set(0, 1.52, 1.1); g.add(hoodPanel);

  // Tall upright cabin shell (white), set behind the hood
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 2.4), white);
  cabin.position.set(0, 1.9, -0.45); cabin.castShadow = true; g.add(cabin);

  // Window band wrapping the cabin (poke out slightly past the white)
  const winSide = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.46, 2.0), glassMat);
  winSide.position.set(0, 2.02, -0.45); g.add(winSide);
  // Near-vertical windscreen at the front face of the cabin
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 0.12), glassMat);
  windscreen.position.set(0, 2.0, 0.78);
  windscreen.rotation.x = -0.12;
  g.add(windscreen);
  // White window pillars to break the glass into windows
  for (const sx of [-0.95, -0.32, 0.32, 0.95]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), white);
    pillar.position.set(sx, 2.02, 0.6); g.add(pillar);
  }
  for (const sz of [0.55, -0.45, -1.45]) {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.5, 0.1), white);
    pl.position.set(0, 2.02, sz);
    // only thin slices act as pillars — keep them narrow in x via scale
    pl.scale.x = 0.06; g.add(pl);
  }

  // Flat roof + roof rack
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.14, 2.46), white);
  roof.position.set(0, 2.45, -0.45); roof.castShadow = true; g.add(roof);
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.1, 2.2), trim);
  rack.position.set(0, 2.57, -0.45); rack.castShadow = true; g.add(rack);
  for (const sx of [-0.8, 0, 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 2.2), trim);
    rail.position.set(sx, 2.58, -0.45); g.add(rail);
  }

  // Front face: black grille panel + two big round headlights + bumper
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.62, 0.12), trim);
  front.position.set(0, 1.15, 1.9); g.add(front);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.1), black);
  grille.position.set(0, 1.15, 1.95); g.add(grille);
  for (let i = -2; i <= 2; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.12), chrome);
    slat.position.set(i * 0.13, 1.15, 1.97); g.add(slat);
  }
  const headGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 18);
  for (const sx of [-0.62, 0.62]) {
    const ring = new THREE.Mesh(headGeo, chrome);
    ring.rotation.x = Math.PI / 2; ring.position.set(sx, 1.18, 1.95); g.add(ring);
    const bulb = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 18),
      new THREE.MeshStandardMaterial({ color: '#fff6da', emissive: '#ffe6a8', emissiveIntensity: 0.7 })
    );
    bulb.position.set(sx, 1.18, 2.02); g.add(bulb);
  }
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.24, 0.26), trim);
  bumper.position.set(0, 0.72, 1.92); bumper.castShadow = true; g.add(bumper);
  // small round front indicators
  for (const sx of [-0.88, 0.88]) {
    const ind = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 12),
      new THREE.MeshStandardMaterial({ color: '#e8943a' })
    );
    ind.position.set(sx, 1.0, 1.97); g.add(ind);
  }

  // Rear: squared tail + spare wheel on the side-hinged door
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 0.1), white);
  tail.position.set(0, 1.3, -1.9); g.add(tail);
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 20), black);
  spare.rotation.x = Math.PI / 2; spare.position.set(0.35, 1.3, -1.98);
  spare.castShadow = true; g.add(spare);
  const spareHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12), chrome);
  spareHub.rotation.x = Math.PI / 2; spareHub.position.set(0.35, 1.3, -1.99); g.add(spareHub);

  // Black wheel arches over each wheel
  for (const sz of [1.2, -1.2]) {
    for (const sx of [-0.99, 0.99]) {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 1.15), trim);
      arch.position.set(sx, 0.78, sz); g.add(arch);
    }
  }

  // Chunky off-road wheels (each a group so it can roll)
  const tyre = new THREE.MeshStandardMaterial({ color: '#131313', roughness: 0.95 });
  const wheelGeo = new THREE.CylinderGeometry(0.54, 0.54, 0.44, 20);
  const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.46, 10);
  const wheels = [];
  const offs = [
    [-1.0, 0.54, 1.2], [1.0, 0.54, 1.2],
    [-1.0, 0.54, -1.2], [1.0, 0.54, -1.2],
  ];
  offs.forEach((o) => {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tyre);
    tire.rotation.z = Math.PI / 2; tire.castShadow = true; wheel.add(tire);
    const hub = new THREE.Mesh(hubGeo, chrome);
    hub.rotation.z = Math.PI / 2; wheel.add(hub);
    wheel.position.set(...o);
    g.add(wheel);
    wheels.push(wheel);
  });
  g.userData.wheels = wheels;
  return g;
}

const car = makeCar();
scene.add(car);

const carState = { x: 0, z: 30, heading: Math.PI, speed: 0 };

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
  // keep out of the central castle
  if (distFromCenter < CASTLE_RADIUS && distFromCenter > 0.001) {
    carState.x *= CASTLE_RADIUS / distFromCenter;
    carState.z *= CASTLE_RADIUS / distFromCenter;
    carState.speed *= 0.3;
  }

  car.position.set(carState.x, 0, carState.z);
  car.rotation.y = carState.heading;

  // spin wheels
  const spin = carState.speed * 1.6;
  car.userData.wheels.forEach((w) => { w.rotation.x += spin; });

  // follow camera (skippable in dev for inspection)
  if (!(import.meta.env && import.meta.env.DEV && window.__freezeCam)) {
    const camDist = 12, camHeight = 6.5;
    const targetCamX = carState.x - Math.sin(carState.heading) * camDist;
    const targetCamZ = carState.z - Math.cos(carState.heading) * camDist;
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.position.y += (camHeight - camera.position.y) * 0.08;
    camera.lookAt(carState.x, 1.2, carState.z);
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
