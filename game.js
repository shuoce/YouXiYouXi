import * as THREE from "three";

/* =========================================================
   云水剑歌 · 武侠轻功 Demo
   Three.js 游戏主逻辑
========================================================= */

const $ = (id) => document.getElementById(id);

const ui = {
  loadingScreen: $("loading-screen"),
  loadingProgress: $("loading-progress"),
  loadingText: $("loading-text"),

  startScreen: $("start-screen"),
  controlsScreen: $("controls-screen"),
  gameUI: $("game-ui"),
  pauseScreen: $("pause-screen"),
  gameOverScreen: $("game-over-screen"),

  startButton: $("start-button"),
  controlsButton: $("controls-button"),
  closeControlsButton: $("close-controls-button"),
  backFromControlsButton: $("back-from-controls-button"),

  resumeButton: $("resume-button"),
  restartButton: $("restart-button"),
  quitButton: $("quit-button"),

  gameOverRestartButton: $("game-over-restart-button"),
  gameOverMenuButton: $("game-over-menu-button"),

  pauseButton: $("pause-button"),

  healthFill: $("health-fill"),
  healthValue: $("health-value"),
  energyFill: $("energy-fill"),
  energyValue: $("energy-value"),
  staminaFill: $("stamina-fill"),
  staminaValue: $("stamina-value"),

  movementState: $("movement-state"),
  gameMessage: $("game-message"),

  questProgressText: $("quest-progress-text"),

  targetLock: $("target-lock"),
  targetName: $("target-name"),
  targetHealthFill: $("target-health-fill"),

  finalDefeated: $("final-defeated"),
  finalScore: $("final-score"),
  bestScore: $("best-score"),
  gameOverTitle: $("game-over-title"),
  gameOverDescription: $("game-over-description"),
  gameOverSymbol: $("game-over-symbol"),

  toastContainer: $("toast-container"),
  debugInfo: $("debug-info"),

  attackSkill: $("attack-skill"),
  dodgeSkill: $("dodge-skill"),
  dashSkill: $("dash-skill"),

  mobileJumpButton: $("mobile-jump-button"),
  mobileDashButton: $("mobile-dash-button"),
  mobileAttackButton: $("mobile-attack-button"),

  joystickBase: $("joystick-base"),
  joystickStick: $("joystick-stick")
};

const GAME = {
  width: window.innerWidth,
  height: window.innerHeight,
  state: "loading",
  score: 0,
  defeated: 0,
  questTarget: 3,
  elapsed: 0,
  debug: false
};

const COLORS = {
  ink: 0x16262a,
  darkInk: 0x0b1519,
  jade: 0x4fa994,
  jadeLight: 0x9ee5cc,
  gold: 0xd5aa58,
  goldLight: 0xf0d48a,
  red: 0xc9574e,
  redLight: 0xef8c79,
  blue: 0x6db9c4,
  mist: 0x9dbbb3,
  stone: 0x61726d,
  wood: 0x59483b
};

let renderer;
let scene;
let camera;
let clock;
let worldGroup;
let effectsGroup;

const keys = new Set();
const justPressed = new Set();

const joystick = {
  active: false,
  pointerId: null,
  x: 0,
  y: 0
};

const cameraState = {
  yaw: 0,
  pitch: 0.18,
  distance: 7,
  target: new THREE.Vector3()
};

const particles = [];
const afterimages = [];
const enemies = [];

let player = null;
let targetEnemy = null;
let toastTimeout = null;

/* =========================================================
   初始化
========================================================= */

init();

function init() {
  setupRenderer();
  setupScene();
  setupLights();
  createWorld();
  createPlayer();
  createEnemies();
  setupEvents();
  startLoadingSequence();

  clock = new THREE.Clock();
  animate();
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  $("game-container").appendChild(renderer.domElement);
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7b9b96);
  scene.fog = new THREE.FogExp2(0x789691, 0.012);

  camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  camera.position.set(0, 4, 8);
  camera.lookAt(0, 1, 0);

  worldGroup = new THREE.Group();
  worldGroup.name = "World";
  scene.add(worldGroup);

  effectsGroup = new THREE.Group();
  effectsGroup.name = "Effects";
  scene.add(effectsGroup);
}

function setupLights() {
  const hemiLight = new THREE.HemisphereLight(
    0xdce7d3,
    0x243238,
    2.1
  );

  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffe7ba, 3.2);
  sunLight.position.set(-25, 38, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -70;
  sunLight.shadow.camera.right = 70;
  sunLight.shadow.camera.top = 70;
  sunLight.shadow.camera.bottom = -70;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 130;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x8bc8c1, 1.1);
  rimLight.position.set(35, 16, -30);
  scene.add(rimLight);
}

/* =========================================================
   场景生成
========================================================= */

function createWorld() {
  createGround();
  createRiver();
  createBridge();
  createMountains();
  createTrees();
  createRocks();
  createTrainingPlatforms();
  createMist();
}

function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(150, 150, 1, 1);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x40584e,
    roughness: 1,
    metalness: 0
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  const grassGeometry = new THREE.PlaneGeometry(145, 145, 1, 1);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x526d5b,
    transparent: true,
    opacity: 0.25,
    roughness: 1
  });

  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.012;
  grass.receiveShadow = true;
  worldGroup.add(grass);
}

function createRiver() {
  const riverGeometry = new THREE.PlaneGeometry(17, 120);
  const riverMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c8790,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
    metalness: 0.15
  });

  const river = new THREE.Mesh(riverGeometry, riverMaterial);
  river.rotation.x = -Math.PI / 2;
  river.position.set(-14, 0.035, 0);
  river.receiveShadow = true;
  worldGroup.add(river);

  for (let i = 0; i < 18; i += 1) {
    const waveGeometry = new THREE.PlaneGeometry(
      2.5 + Math.random() * 3,
      0.035
    );

    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ed5ce,
      transparent: true,
      opacity: 0.16
    });

    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(
      -14 + (Math.random() - 0.5) * 13,
      0.06,
      -55 + i * 6 + Math.random() * 2
    );
    wave.rotation.z = Math.random() * Math.PI;
    worldGroup.add(wave);
  }
}

function createBridge() {
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-14, 0.7, 1);

  const bridgeMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.wood,
    roughness: 0.85
  });

  for (let i = -4; i <= 4; i += 1) {
    const plankGeometry = new THREE.BoxGeometry(2.4, 0.22, 1.15);
    const plank = new THREE.Mesh(plankGeometry, bridgeMaterial);
    plank.position.set(i * 0.82, Math.sin(i * 0.35) * 0.15, 0);
    plank.rotation.z = Math.sin(i * 0.35) * 0.035;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
  }

  const ropeMaterial = new THREE.MeshStandardMaterial({
    color: 0x392e25,
    roughness: 1
  });

  for (const side of [-1, 1]) {
    const ropeGeometry = new THREE.CylinderGeometry(0.055, 0.055, 8, 8);
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 1.25, side * 0.63);
    rope.castShadow = true;
    bridgeGroup.add(rope);

    for (let i = -4; i <= 4; i += 1) {
      const postGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.8, 8);
      const post = new THREE.Mesh(postGeometry, ropeMaterial);
      post.position.set(i * 0.82, 0.45, side * 0.63);
      post.castShadow = true;
      bridgeGroup.add(post);
    }
  }

  worldGroup.add(bridgeGroup);
}

function createMountains() {
  const mountainMaterial = new THREE.MeshStandardMaterial({
    color: 0x38514d,
    roughness: 1,
    flatShading: true
  });

  const distantMaterial = new THREE.MeshStandardMaterial({
    color: 0x536f6a,
    roughness: 1,
    flatShading: true,
    transparent: true,
    opacity: 0.78
  });

  const mountains = [
    [-48, 13, -38, 25, 23],
    [-27, 9, -43, 17, 17],
    [26, 12, -43, 22, 20],
    [48, 15, -28, 28, 27],
    [47, 10, 25, 18, 18],
    [-48, 13, 31, 25, 25]
  ];

  mountains.forEach(([x, y, z, radius, height], index) => {
    const geometry = new THREE.ConeGeometry(radius, height, 8);
    const mountain = new THREE.Mesh(
      geometry,
      index % 2 === 0 ? mountainMaterial : distantMaterial
    );

    mountain.position.set(x, y / 2, z);
    mountain.rotation.y = Math.random() * Math.PI;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    worldGroup.add(mountain);
  });
}

function createTrees() {
  const treePositions = [
    [-31, 0, -23, 1.1],
    [-38, 0, -8, 1.4],
    [-33, 0, 17, 0.9],
    [-25, 0, 31, 1.4],
    [20, 0, -30, 1.2],
    [31, 0, -14, 1.5],
    [34, 0, 12, 1.1],
    [26, 0, 31, 1.6],
    [7, 0, 39, 1.3],
    [-5, 0, -39, 1.2],
    [42, 0, 38, 1.4]
  ];

  treePositions.forEach(([x, y, z, scale]) => {
    const tree = createTree(scale);
    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    worldGroup.add(tree);
  });
}

function createTree(scale = 1) {
  const group = new THREE.Group();
  group.name = "Tree";

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3d32,
    roughness: 1
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x2e5b50,
    roughness: 1,
    flatShading: true
  });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.42, 3.2, 7),
    trunkMaterial
  );

  trunk.position.y = 1.6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const foliage = [
    [0, 3.3, 0, 1.7],
    [-0.6, 4.35, 0.1, 1.25],
    [0.55, 4.45, -0.05, 1.2],
    [0, 5.35, 0.05, 0.9]
  ];

  foliage.forEach(([x, y, z, radius]) => {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      leafMaterial
    );

    crown.position.set(x, y, z);
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);
  });

  group.scale.setScalar(scale);
  return group;
}

function createRocks() {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.stone,
    roughness: 1,
    flatShading: true
  });

  const positions = [
    [-8, 0, -15, 2.2, 1.1],
    [8, 0, -23, 2.7, 1.4],
    [16, 0, 7, 2.1, 1.2],
    [-4, 0, 24, 3.2, 1.5],
    [27, 0, -1, 1.8, 1],
    [-29, 0, 5, 2.3, 1.2],
    [7, 0, 19, 1.4, 0.8]
  ];

  positions.forEach(([x, y, z, radius, height]) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(radius, 0),
      rockMaterial
    );

    rock.position.set(x, y + height / 2, z);
    rock.scale.y = height / radius;
    rock.rotation.set(
      Math.random(),
      Math.random() * Math.PI,
      Math.random()
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    worldGroup.add(rock);
  });
}

function createTrainingPlatforms() {
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e796e,
    roughness: 0.95
  });

  const platforms = [
    [-2, 0.8, -12, 4.5, 1.4],
    [14, 1.3, -3, 3.5, 1.7],
    [3, 0.6, 14, 4, 1.1]
  ];

  platforms.forEach(([x, y, z, width, height]) => {
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, width * 0.65),
      platformMaterial
    );

    platform.position.set(x, y, z);
    platform.rotation.y = Math.random() * 0.4;
    platform.castShadow = true;
    platform.receiveShadow = true;
    worldGroup.add(platform);
  });
}

function createMist() {
  const mistMaterial = new THREE.MeshBasicMaterial({
    color: 0xb6d3c7,
    transparent: true,
    opacity: 0.06,
    depthWrite: false
  });

  for (let i = 0; i < 12; i += 1) {
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(3 + Math.random() * 4, 12, 8),
      mistMaterial.clone()
    );

    mist.position.set(
      -20 + Math.random() * 40,
      1.5 + Math.random() * 4,
      -25 + Math.random() * 50
    );

    mist.scale.x = 2 + Math.random() * 2;
    mist.scale.z = 0.6 + Math.random();
    mist.userData.baseX = mist.position.x;
    mist.userData.phase = Math.random() * Math.PI * 2;
    mist.userData.speed = 0.15 + Math.random() * 0.25;

    worldGroup.add(mist);
  }
}

/* =========================================================
   玩家
========================================================= */

function createPlayer() {
  const root = new THREE.Group();
  root.name = "Player";
  root.position.set(4, 0, 8);

  const model = new THREE.Group();
  model.name = "PlayerPlaceholderModel";
  root.add(model);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x263f43,
    roughness: 0.72,
    metalness: 0.08
  });

  const clothMaterial = new THREE.MeshStandardMaterial({
    color: 0x172b31,
    roughness: 0.9
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd3a58b,
    roughness: 0.9
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.gold,
    roughness: 0.45,
    metalness: 0.5
  });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.9, 6, 12),
    bodyMaterial
  );

  body.position.y = 1.08;
  body.castShadow = true;
  body.receiveShadow = true;
  model.add(body);

  const robe = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 1.2, 6),
    clothMaterial
  );

  robe.position.y = 0.72;
  robe.rotation.y = Math.PI / 6;
  robe.castShadow = true;
  model.add(robe);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 8),
    skinMaterial
  );

  head.position.y = 1.95;
  head.castShadow = true;
  model.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0x13181a,
      roughness: 0.8
    })
  );

  hair.position.set(0, 2.12, -0.02);
  hair.scale.set(1.03, 0.7, 1.03);
  hair.castShadow = true;
  model.add(hair);

  const sash = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.045, 6, 24),
    goldMaterial
  );

  sash.rotation.x = Math.PI / 2;
  sash.position.y = 1.02;
  model.add(sash);

  const sword = new THREE.Group();
  sword.name = "Sword";
  sword.position.set(0.52, 1.05, 0.08);
  sword.rotation.z = -0.35;

  const sheath = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.09, 1.35, 8),
    new THREE.MeshStandardMaterial({
      color: 0x101b20,
      roughness: 0.5,
      metalness: 0.45
    })
  );

  sheath.rotation.z = Math.PI / 2;
  sheath.position.x = 0.28;
  sheath.castShadow = true;
  sword.add(sheath);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.38, 8),
    goldMaterial
  );

  handle.rotation.z = Math.PI / 2;
  handle.position.x = -0.62;
  handle.castShadow = true;
  sword.add(handle);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.34, 0.08),
    goldMaterial
  );

  guard.position.x = -0.42;
  guard.castShadow = true;
  sword.add(guard);

  model.add(sword);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 24),
    new THREE.MeshBasicMaterial({
      color: 0x071014,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    })
  );

  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  root.add(shadow);

  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.018, 6, 32),
    new THREE.MeshBasicMaterial({
      color: COLORS.jade,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    })
  );

  aura.rotation.x = Math.PI / 2;
  aura.position.y = 0.06;
  aura.visible = false;
  root.add(aura);

  player = {
    root,
    model,
    sword,
    aura,

    velocity: new THREE.Vector3(),
    dashDirection: new THREE.Vector3(),
    dodgeDirection: new THREE.Vector3(),

    maxHealth: 100,
    health: 100,
    maxEnergy: 100,
    energy: 100,
    maxStamina: 100,
    stamina: 100,

    onGround: true,
    coyoteTime: 0,
    dashTime: 0,
    dashCooldown: 0,
    dodgeTime: 0,
    dodgeCooldown: 0,
    attackTime: 0,
    attackElapsed: 0,
    attackCooldown: 0,
    attackHitDone: false,
    comboStep: 0,

    invulnerable: 0,
    hurtTime: 0,
    hitFlash: 0,
    target: null,

    state: "idle",
    walkTime: 0,
    lastMoveDirection: new THREE.Vector3(0, 0, -1)
  };

  worldGroup.add(root);
}

/* =========================================================
   敌人
========================================================= */

function createEnemies() {
  const positions = [
    [-2, 0, -8],
    [13, 0, -8],
    [10, 0, 13]
  ];

  positions.forEach((position, index) => {
    const enemy = createEnemy(index + 1);
    enemy.root.position.set(...position);
    enemies.push(enemy);
    worldGroup.add(enemy.root);
  });
}

function createEnemy(id) {
  const root = new THREE.Group();
  root.name = `Enemy_${id}`;

  const model = new THREE.Group();
  root.add(model);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x542f32,
    roughness: 0.82
  });

  const armorMaterial = new THREE.MeshStandardMaterial({
    color: 0x272a2a,
    roughness: 0.62,
    metalness: 0.22
  });

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xa87561,
    roughness: 0.92
  });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.44, 0.82, 6, 10),
    bodyMaterial
  );

  body.position.y = 1.03;
  body.castShadow = true;
  model.add(body);

  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.34, 0.48),
    armorMaterial
  );

  shoulder.position.y = 1.42;
  shoulder.castShadow = true;
  model.add(shoulder);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 10, 8),
    skinMaterial
  );

  head.position.y = 1.9;
  head.castShadow = true;
  model.add(head);

  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.22, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x14191c,
      roughness: 0.7
    })
  );

  mask.position.set(0, 1.9, -0.28);
  mask.castShadow = true;
  model.add(mask);

  const weapon = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.35, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x9b9d8d,
      roughness: 0.32,
      metalness: 0.72
    })
  );

  weapon.position.set(0.65, 1.1, -0.1);
  weapon.rotation.z = -0.35;
  weapon.castShadow = true;
  model.add(weapon);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 20),
    new THREE.MeshBasicMaterial({
      color: 0x071014,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    })
  );

  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  root.add(shadow);

  const warningRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.025, 6, 24),
    new THREE.MeshBasicMaterial({
      color: COLORS.red,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    })
  );

  warningRing.rotation.x = Math.PI / 2;
  warningRing.position.y = 0.05;
  warningRing.visible = false;
  root.add(warningRing);

  return {
    id,
    root,
    model,
    body,
    weapon,
    warningRing,

    maxHealth: 80,
    health: 80,
    alive: true,
    attackCooldown: 0.8 + Math.random(),
    attackTime: 0,
    attackHitDone: false,
    hitFlash: 0,
    hurtTime: 0,
    walkTime: Math.random() * 10,
    state: "idle",
    spawnPosition: new THREE.Vector3(),
    targetDistance: 0
  };
}

/* =========================================================
   输入
========================================================= */

function setupEvents() {
  window.addEventListener("resize", onResize);

  window.addEventListener("keydown", (event) => {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        event.code
      )
    ) {
      event.preventDefault();
    }

    if (!keys.has(event.code)) {
      justPressed.add(event.code);
    }

    keys.add(event.code);

    if (event.code === "Escape") {
      if (GAME.state === "playing") {
        pauseGame();
      } else if (GAME.state === "paused") {
        resumeGame();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (GAME.state !== "playing") {
      return;
    }

    if (event.button === 0) {
      triggerAttack();
    }

    if (event.button === 2) {
      triggerDodge();
    }

    if (renderer.domElement.requestPointerLock) {
      renderer.domElement.requestPointerLock();
    }
  });

  document.addEventListener("mousemove", (event) => {
    if (GAME.state !== "playing") {
      return;
    }

    if (document.pointerLockElement === renderer.domElement) {
      cameraState.yaw -= event.movementX * 0.002;
      cameraState.pitch -= event.movementY * 0.0014;
      cameraState.pitch = THREE.MathUtils.clamp(
        cameraState.pitch,
        -0.32,
        0.5
      );
    }
  });

  ui.startButton.addEventListener("click", beginGame);
  ui.controlsButton.addEventListener("click", showControls);
  ui.closeControlsButton.addEventListener("click", hideControls);
  ui.backFromControlsButton.addEventListener("click", hideControls);

  ui.pauseButton.addEventListener("click", pauseGame);
  ui.resumeButton.addEventListener("click", resumeGame);
  ui.restartButton.addEventListener("click", beginGame);
  ui.quitButton.addEventListener("click", returnToMenu);

  ui.gameOverRestartButton.addEventListener("click", beginGame);
  ui.gameOverMenuButton.addEventListener("click", returnToMenu);

  ui.attackSkill.addEventListener("click", triggerAttack);
  ui.dodgeSkill.addEventListener("click", triggerDodge);
  ui.dashSkill.addEventListener("click", triggerDash);

  ui.mobileJumpButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    triggerJump();
  });

  ui.mobileDashButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    triggerDash();
  });

  ui.mobileAttackButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    triggerAttack();
  });

  setupJoystick();
}

function setupJoystick() {
  ui.joystickBase.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    joystick.active = true;
    joystick.pointerId = event.pointerId;
    ui.joystickBase.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });

  ui.joystickBase.addEventListener("pointermove", (event) => {
    if (!joystick.active || event.pointerId !== joystick.pointerId) {
      return;
    }

    event.preventDefault();
    updateJoystick(event);
  });

  const endJoystick = (event) => {
    if (event.pointerId !== joystick.pointerId) {
      return;
    }

    joystick.active = false;
    joystick.pointerId = null;
    joystick.x = 0;
    joystick.y = 0;
    ui.joystickStick.style.transform = "translate(0, 0)";
  };

  ui.joystickBase.addEventListener("pointerup", endJoystick);
  ui.joystickBase.addEventListener("pointercancel", endJoystick);
}

function updateJoystick(event) {
  const rect = ui.joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width * 0.28;

  let x = event.clientX - centerX;
  let y = event.clientY - centerY;

  const distance = Math.hypot(x, y);

  if (distance > maxDistance) {
    x = (x / distance) * maxDistance;
    y = (y / distance) * maxDistance;
  }

  joystick.x = x / maxDistance;
  joystick.y = y / maxDistance;
  ui.joystickStick.style.transform = `translate(${x}px, ${y}px)`;
}

/* =========================================================
   游戏流程
========================================================= */

function startLoadingSequence() {
  let progress = 0;

  const loadingTimer = window.setInterval(() => {
    progress += Math.random() * 18 + 8;
    progress = Math.min(progress, 100);

    ui.loadingProgress.style.width = `${progress}%`;

    if (progress < 35) {
      ui.loadingText.textContent = "正在铺开山河……";
    } else if (progress < 70) {
      ui.loadingText.textContent = "正在调息运功……";
    } else if (progress < 100) {
      ui.loadingText.textContent = "正在磨砺剑意……";
    } else {
      ui.loadingText.textContent = "江湖已至。";
      window.clearInterval(loadingTimer);

      window.setTimeout(() => {
        ui.loadingScreen.classList.add("fade-out");
        GAME.state = "menu";
        showOnly(ui.startScreen);
      }, 500);
    }
  }, 160);
}

function beginGame() {
  GAME.state = "playing";
  GAME.score = 0;
  GAME.defeated = 0;
  GAME.elapsed = 0;

  resetPlayer();
  resetEnemies();

  ui.gameOverScreen.classList.add("hidden");
  ui.pauseScreen.classList.add("hidden");
  ui.controlsScreen.classList.add("hidden");
  ui.startScreen.classList.add("hidden");
  ui.gameUI.classList.remove("hidden");

  showToast("试炼开始", "success");
  showGameMessage("峡谷试剑");

  if (renderer.domElement.requestPointerLock) {
    renderer.domElement.requestPointerLock();
  }
}

function pauseGame() {
  if (GAME.state !== "playing") {
    return;
  }

  GAME.state = "paused";
  ui.pauseScreen.classList.remove("hidden");

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

function resumeGame() {
  if (GAME.state !== "paused") {
    return;
  }

  GAME.state = "playing";
  ui.pauseScreen.classList.add("hidden");
  clock.getDelta();

  if (renderer.domElement.requestPointerLock) {
    renderer.domElement.requestPointerLock();
  }
}

function returnToMenu() {
  GAME.state = "menu";

  ui.gameUI.classList.add("hidden");
  ui.pauseScreen.classList.add("hidden");
  ui.gameOverScreen.classList.add("hidden");
  ui.controlsScreen.classList.add("hidden");
  ui.startScreen.classList.remove("hidden");

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

function showControls() {
  ui.controlsScreen.classList.remove("hidden");
}

function hideControls() {
  ui.controlsScreen.classList.add("hidden");
}

function showOnly(element) {
  [
    ui.startScreen,
    ui.controlsScreen,
    ui.gameUI,
    ui.pauseScreen,
    ui.gameOverScreen
  ].forEach((item) => {
    if (item === element) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

function showGameOver(victory) {
  GAME.state = "gameover";

  const best = Math.max(
    GAME.score,
    Number(localStorage.getItem("wuxia-best-score") || 0)
  );

  localStorage.setItem("wuxia-best-score", String(best));

  ui.finalDefeated.textContent = String(GAME.defeated);
  ui.finalScore.textContent = String(GAME.score);
  ui.bestScore.textContent = String(best);

  if (victory) {
    ui.gameOverSymbol.textContent = "乾";
    ui.gameOverTitle.textContent = "试剑成功";
    ui.gameOverDescription.textContent = "剑意已成，江湖路还很长";
  } else {
    ui.gameOverSymbol.textContent = "坎";
    ui.gameOverTitle.textContent = "试炼结束";
    ui.gameOverDescription.textContent = "胜负乃兵家常事，再战便是";
  }

  ui.gameOverScreen.classList.remove("hidden");

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

/* =========================================================
   重置状态
========================================================= */

function resetPlayer() {
  player.root.position.set(4, 0, 8);
  player.root.rotation.y = 0;
  player.velocity.set(0, 0, 0);
  player.dashDirection.set(0, 0, 0);
  player.dodgeDirection.set(0, 0, 0);

  player.health = player.maxHealth;
  player.energy = player.maxEnergy;
  player.stamina = player.maxStamina;

  player.onGround = true;
  player.coyoteTime = 0;
  player.dashTime = 0;
  player.dashCooldown = 0;
  player.dodgeTime = 0;
  player.dodgeCooldown = 0;
  player.attackTime = 0;
  player.attackElapsed = 0;
  player.attackCooldown = 0;
  player.attackHitDone = false;
  player.comboStep = 0;
  player.invulnerable = 0;
  player.hurtTime = 0;
  player.hitFlash = 0;
  player.target = null;
  player.state = "idle";
  player.model.visible = true;
  player.aura.visible = false;

  cameraState.yaw = 0;
  cameraState.pitch = 0.18;
  cameraState.target.copy(player.root.position);
  targetEnemy = null;
}

function resetEnemies() {
  const positions = [
    [-2, 0, -8],
    [13, 0, -8],
    [10, 0, 13]
  ];

  enemies.forEach((enemy, index) => {
    enemy.root.position.set(...positions[index]);
    enemy.root.rotation.y = 0;
    enemy.health = enemy.maxHealth;
    enemy.alive = true;
    enemy.attackCooldown = 0.8 + Math.random();
    enemy.attackTime = 0;
    enemy.attackHitDone = false;
    enemy.hitFlash = 0;
    enemy.hurtTime = 0;
    enemy.state = "idle";
    enemy.model.visible = true;
    enemy.warningRing.visible = false;
    enemy.body.material.color.setHex(0x542f32);
  });
}

/* =========================================================
   玩家输入行为
========================================================= */

function triggerJump() {
  if (GAME.state !== "playing" || !player) {
    return;
  }

  if (player.onGround || player.coyoteTime > 0) {
    player.velocity.y = 8.7;
    player.onGround = false;
    player.coyoteTime = 0;
    player.state = "jump";
    spawnParticles(player.root.position, COLORS.jadeLight, 8);
  }
}

function triggerDash() {
  if (GAME.state !== "playing" || !player) {
    return;
  }

  if (
    player.dashCooldown > 0 ||
    player.dashTime > 0 ||
    player.stamina < 25
  ) {
    return;
  }

  const direction = getMoveDirection();

  if (direction.lengthSq() < 0.01) {
    direction.copy(getCameraForward());
  }

  direction.y = 0;
  direction.normalize();

  player.stamina -= 25;
  player.dashDirection.copy(direction);
  player.dashTime = 0.24;
  player.dashCooldown = 0.5;
  player.invulnerable = Math.max(player.invulnerable, 0.26);
  player.aura.visible = true;
  player.state = "dash";

  createDashEffect();
  createAfterimage();
  spawnParticles(player.root.position, COLORS.jadeLight, 15);
}

function triggerDodge() {
  if (GAME.state !== "playing" || !player) {
    return;
  }

  if (
    player.dodgeCooldown > 0 ||
    player.dodgeTime > 0 ||
    player.stamina < 18
  ) {
    return;
  }

  const direction = getMoveDirection();

  if (direction.lengthSq() < 0.01) {
    direction.copy(getCameraForward());
  }

  direction.y = 0;
  direction.normalize();

  player.stamina -= 18;
  player.dodgeDirection.copy(direction);
  player.dodgeTime = 0.2;
  player.dodgeCooldown = 0.45;
  player.invulnerable = Math.max(player.invulnerable, 0.24);
  player.state = "dodge";
}

function triggerAttack() {
  if (GAME.state !== "playing" || !player) {
    return;
  }

  if (
    player.attackCooldown > 0 ||
    player.dashTime > 0 ||
    player.dodgeTime > 0 ||
    player.hurtTime > 0
  ) {
    return;
  }

  player.attackTime = 0.42;
  player.attackElapsed = 0;
  player.attackCooldown = 0.25;
  player.attackHitDone = false;
  player.comboStep = (player.comboStep % 3) + 1;
  player.state = "attack";
}

/* =========================================================
   玩家更新
========================================================= */

function updatePlayer(dt) {
  const p = player;

  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.hurtTime = Math.max(0, p.hurtTime - dt);
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.coyoteTime = Math.max(0, p.coyoteTime - dt);

  if (justPressed.has("Space")) {
    triggerJump();
  }

  if (justPressed.has("KeyE")) {
    triggerDash();
  }

  if (justPressed.has("KeyK")) {
    triggerDodge();
  }

  if (justPressed.has("KeyJ")) {
    triggerAttack();
  }

  if (justPressed.has("Tab")) {
    toggleTargetLock();
  }

  if (p.attackTime > 0) {
    updatePlayerAttack(dt);
  }

  if (p.dashTime > 0) {
    updatePlayerDash(dt);
  } else if (p.dodgeTime > 0) {
    updatePlayerDodge(dt);
  } else if (p.attackTime <= 0 && p.hurtTime <= 0) {
    updatePlayerMovement(dt);
  } else {
    applyGravity(dt);
  }

  updatePlayerAnimation(dt);
  clampPlayerToWorld();
}

function updatePlayerMovement(dt) {
  const p = player;
  const direction = getMoveDirection();
  const hasInput = direction.lengthSq() > 0.001;
  const sprinting =
    keys.has("ShiftLeft") ||
    keys.has("ShiftRight") ||
    keys.has("Shift");

  let speed = sprinting ? 7.4 : 4.3;

  if (hasInput && sprinting && p.stamina > 0) {
    p.stamina = Math.max(0, p.stamina - 16 * dt);
  } else if (!sprinting || !hasInput) {
    p.stamina = Math.min(p.maxStamina, p.stamina + 21 * dt);
  }

  if (sprinting && p.stamina <= 0) {
    speed = 4.3;
  }

  if (hasInput) {
    p.lastMoveDirection.lerp(direction, 0.35);
    p.lastMoveDirection.normalize();

    const acceleration = p.onGround ? 13 : 7;
    p.velocity.x = THREE.MathUtils.damp(
      p.velocity.x,
      direction.x * speed,
      acceleration,
      dt
    );

    p.velocity.z = THREE.MathUtils.damp(
      p.velocity.z,
      direction.z * speed,
      acceleration,
      dt
    );

    const desiredRotation = Math.atan2(direction.x, direction.z);
    p.root.rotation.y = approachAngle(
      p.root.rotation.y,
      desiredRotation,
      dt * 10
    );

    p.state = sprinting && p.stamina > 0 ? "run" : "walk";
    p.walkTime += dt * (sprinting ? 12 : 8);
  } else {
    p.velocity.x = THREE.MathUtils.damp(
      p.velocity.x,
      0,
      p.onGround ? 16 : 3,
      dt
    );

    p.velocity.z = THREE.MathUtils.damp(
      p.velocity.z,
      0,
      p.onGround ? 16 : 3,
      dt
    );

    if (p.onGround) {
      p.state = "idle";
    }
  }

  applyGravity(dt);
  p.root.position.addScaledVector(p.velocity, dt);

  if (p.root.position.y <= 0) {
    if (!p.onGround && p.velocity.y < -4) {
      spawnParticles(p.root.position, COLORS.mist, 6);
    }

    p.root.position.y = 0;
    p.velocity.y = 0;
    p.onGround = true;
  }
}

function updatePlayerDash(dt) {
  const p = player;

  p.dashTime -= dt;
  p.root.position.addScaledVector(p.dashDirection, 19 * dt);
  p.root.position.y += Math.sin((0.24 - p.dashTime) * 12) * 0.06;

  p.root.rotation.y = approachAngle(
    p.root.rotation.y,
    Math.atan2(p.dashDirection.x, p.dashDirection.z),
    dt * 14
  );

  if (Math.random() < 0.85) {
    createAfterimage();
  }

  if (p.dashTime <= 0) {
    p.dashTime = 0;
    p.aura.visible = false;
    p.state = p.onGround ? "idle" : "fall";
  }
}

function updatePlayerDodge(dt) {
  const p = player;

  p.dodgeTime -= dt;
  p.root.position.addScaledVector(p.dodgeDirection, 11 * dt);
  p.root.rotation.y = approachAngle(
    p.root.rotation.y,
    Math.atan2(p.dodgeDirection.x, p.dodgeDirection.z),
    dt * 14
  );

  if (p.dodgeTime <= 0) {
    p.dodgeTime = 0;
    p.state = p.onGround ? "idle" : "fall";
  }
}

function updatePlayerAttack(dt) {
  const p = player;

  p.attackTime -= dt;
  p.attackElapsed += dt;

  const attackProgress = 1 - p.attackTime / 0.42;
  const swordAngle = Math.sin(attackProgress * Math.PI) * 1.9;

  p.sword.rotation.y = swordAngle;
  p.sword.rotation.z = -0.35 - swordAngle * 0.2;

  if (!p.attackHitDone && p.attackElapsed >= 0.13) {
    p.attackHitDone = true;
    performPlayerAttack();
  }

  if (p.attackTime <= 0) {
    p.attackTime = 0;
    p.sword.rotation.y = 0;
    p.sword.rotation.z = -0.35;
    p.state = p.onGround ? "idle" : "fall";
  }
}

function applyGravity(dt) {
  if (!player.onGround) {
    player.velocity.y -= 22 * dt;
    player.state = player.velocity.y > 0 ? "jump" : "fall";
  }
}

function updatePlayerAnimation(dt) {
  const p = player;
  const model = p.model;

  if (p.hitFlash > 0) {
    model.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissive.setHex(0x8e302e);
        child.material.emissiveIntensity = 0.7;
      }
    });
  } else {
    model.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissive.setHex(0x000000);
        child.material.emissiveIntensity = 0;
      }
    });
  }

  const moving =
    p.state === "walk" ||
    p.state === "run" ||
    p.state === "jump" ||
    p.state === "fall";

  if (moving && p.attackTime <= 0) {
    model.position.y = Math.sin(p.walkTime) * 0.045;
    model.rotation.z = Math.sin(p.walkTime * 0.5) * 0.025;
  } else if (p.state === "dash" || p.state === "dodge") {
    model.position.y = 0.05;
    model.rotation.z = -0.12;
  } else {
    model.position.y = THREE.MathUtils.damp(
      model.position.y,
      0,
      10,
      dt
    );

    model.rotation.z = THREE.MathUtils.damp(
      model.rotation.z,
      0,
      10,
      dt
    );
  }

  if (p.aura.visible) {
    p.aura.rotation.z += dt * 7;
    p.aura.scale.setScalar(1 + Math.sin(GAME.elapsed * 18) * 0.08);
  }
}

function clampPlayerToWorld() {
  player.root.position.x = THREE.MathUtils.clamp(
    player.root.position.x,
    -43,
    43
  );

  player.root.position.z = THREE.MathUtils.clamp(
    player.root.position.z,
    -43,
    43
  );
}

/* =========================================================
   战斗
========================================================= */

function performPlayerAttack() {
  const p = player;
  const attackRange = 3.15;
  const attackDamage = 22 + p.comboStep * 5;

  let hitSomething = false;

  enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }

    const offset = enemy.root.position.clone().sub(p.root.position);
    offset.y = 0;

    const distance = offset.length();

    if (distance > attackRange) {
      return;
    }

    offset.normalize();

    const forward = new THREE.Vector3(
      Math.sin(p.root.rotation.y),
      0,
      Math.cos(p.root.rotation.y)
    );

    if (forward.dot(offset) < -0.55) {
      return;
    }

    damageEnemy(enemy, attackDamage);
    hitSomething = true;
  });

  if (hitSomething) {
    showGameMessage(`第${p.comboStep}式`);
    spawnParticles(
      p.root.position
        .clone()
        .add(
          new THREE.Vector3(
            Math.sin(p.root.rotation.y),
            1.1,
            Math.cos(p.root.rotation.y)
          ).multiplyScalar(1.5)
        ),
      COLORS.goldLight,
      12
    );
  }
}

function damageEnemy(enemy, amount) {
  if (!enemy.alive) {
    return;
  }

  enemy.health = Math.max(0, enemy.health - amount);
  enemy.hitFlash = 0.16;
  enemy.hurtTime = 0.2;

  const knockback = enemy.root.position
    .clone()
    .sub(player.root.position);

  knockback.y = 0;

  if (knockback.lengthSq() > 0.001) {
    knockback.normalize();
    enemy.root.position.addScaledVector(knockback, 0.25);
  }

  spawnParticles(enemy.root.position.clone().add(new THREE.Vector3(0, 1, 0)), COLORS.redLight, 8);

  if (enemy.health <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  enemy.alive = false;
  enemy.state = "dead";
  enemy.warningRing.visible = false;
  enemy.model.visible = false;

  GAME.defeated += 1;
  GAME.score += 100;

  spawnParticles(
    enemy.root.position.clone().add(new THREE.Vector3(0, 1, 0)),
    COLORS.goldLight,
    22
  );

  showToast("击败山匪，获得 100 分", "success");

  if (targetEnemy === enemy) {
    targetEnemy = null;
    player.target = null;
  }

  if (GAME.defeated >= GAME.questTarget) {
    window.setTimeout(() => {
      if (GAME.state === "playing") {
        showGameOver(true);
      }
    }, 700);
  }
}

function damagePlayer(amount) {
  const p = player;

  if (p.invulnerable > 0 || p.hurtTime > 0) {
    return;
  }

  p.health = Math.max(0, p.health - amount);
  p.invulnerable = 0.6;
  p.hurtTime = 0.32;
  p.hitFlash = 0.16;
  p.state = "hurt";

  p.velocity.y = 3.5;

  showToast(`受到 ${amount} 点伤害`, "warning");
  spawnParticles(
    p.root.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
    COLORS.redLight,
    12
  );

  if (p.health <= 0) {
    showGameOver(false);
  }
}

function toggleTargetLock() {
  if (targetEnemy && targetEnemy.alive) {
    targetEnemy = null;
    player.target = null;
    return;
  }

  let nearest = null;
  let nearestDistance = Infinity;

  enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }

    const distance = player.root.position.distanceTo(enemy.root.position);

    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  });

  targetEnemy = nearest;
  player.target = nearest;
}

/* =========================================================
   敌人更新
========================================================= */

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.hurtTime = Math.max(0, enemy.hurtTime - dt);
    enemy.walkTime += dt * 7;

    if (enemy.attackTime > 0) {
      updateEnemyAttack(enemy, dt);
      return;
    }

    const offset = player.root.position.clone().sub(enemy.root.position);
    offset.y = 0;

    const distance = offset.length();
    enemy.targetDistance = distance;

    if (distance < 12) {
      enemy.warningRing.visible = true;
      enemy.warningRing.rotation.z += dt * 2;

      if (distance > 2.1 && enemy.hurtTime <= 0) {
        offset.normalize();

        enemy.root.position.addScaledVector(offset, dt * 1.7);
        enemy.root.rotation.y = approachAngle(
          enemy.root.rotation.y,
          Math.atan2(offset.x, offset.z),
          dt * 5
        );

        enemy.state = "run";
        enemy.model.position.y = Math.sin(enemy.walkTime) * 0.035;
      } else if (distance <= 2.35 && enemy.attackCooldown <= 0) {
        startEnemyAttack(enemy);
      } else {
        enemy.state = "idle";
        enemy.model.position.y = THREE.MathUtils.damp(
          enemy.model.position.y,
          0,
          10,
          dt
        );
      }
    } else {
      enemy.warningRing.visible = false;
      enemy.state = "idle";
      enemy.model.position.y = THREE.MathUtils.damp(
        enemy.model.position.y,
        0,
        10,
        dt
      );
    }

    if (enemy.hitFlash > 0) {
      enemy.body.material.color.setHex(0xb64b4b);
    } else {
      enemy.body.material.color.setHex(0x542f32);
    }
  });
}

function startEnemyAttack(enemy) {
  enemy.attackTime = 0.62;
  enemy.attackHitDone = false;
  enemy.attackCooldown = 1.25 + Math.random() * 0.5;
  enemy.state = "attack";
}

function updateEnemyAttack(enemy, dt) {
  enemy.attackTime -= dt;

  const progress = 1 - enemy.attackTime / 0.62;
  const weaponAngle = Math.sin(progress * Math.PI) * 1.5;

  enemy.weapon.rotation.x = weaponAngle;

  const toPlayer = player.root.position.clone().sub(enemy.root.position);
  toPlayer.y = 0;

  if (toPlayer.lengthSq() > 0.001) {
    enemy.root.rotation.y = approachAngle(
      enemy.root.rotation.y,
      Math.atan2(toPlayer.x, toPlayer.z),
      dt * 8
    );
  }

  if (!enemy.attackHitDone && progress >= 0.46) {
    enemy.attackHitDone = true;

    if (
      enemy.root.position.distanceTo(player.root.position) < 2.8
    ) {
      damagePlayer(12);
    }
  }

  if (enemy.attackTime <= 0) {
    enemy.attackTime = 0;
    enemy.weapon.rotation.x = 0;
    enemy.state = "idle";
  }
}

/* =========================================================
   相机
========================================================= */

function updateCamera(dt) {
  const p = player.root.position;

  const cameraOffset = new THREE.Vector3(
    Math.sin(cameraState.yaw) * cameraState.distance,
    2.7 + cameraState.pitch * 4.4,
    Math.cos(cameraState.yaw) * cameraState.distance
  );

  const desiredPosition = p.clone()
    .add(new THREE.Vector3(0, 1.2, 0))
    .add(cameraOffset);

  const followSpeed = player.dashTime > 0 ? 11 : 7;

  camera.position.x = THREE.MathUtils.damp(
    camera.position.x,
    desiredPosition.x,
    followSpeed,
    dt
  );

  camera.position.y = THREE.MathUtils.damp(
    camera.position.y,
    desiredPosition.y,
    followSpeed,
    dt
  );

  camera.position.z = THREE.MathUtils.damp(
    camera.position.z,
    desiredPosition.z,
    followSpeed,
    dt
  );

  const lookTarget = p.clone().add(new THREE.Vector3(0, 1.15, 0));

  if (targetEnemy && targetEnemy.alive) {
    const enemyTarget = targetEnemy.root.position
      .clone()
      .add(new THREE.Vector3(0, 1, 0));

    lookTarget.lerp(enemyTarget, 0.18);
  }

  camera.lookAt(lookTarget);
}

function getCameraForward() {
  return new THREE.Vector3(
    -Math.sin(cameraState.yaw),
    0,
    -Math.cos(cameraState.yaw)
  ).normalize();
}

function getMoveDirection() {
  const x =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);

  const z =
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);

  const inputX = x || joystick.x;
  const inputZ = z || joystick.y;

  if (Math.abs(inputX) < 0.01 && Math.abs(inputZ) < 0.01) {
    return new THREE.Vector3();
  }

  const forward = getCameraForward();
  const right = new THREE.Vector3(
    Math.cos(cameraState.yaw),
    0,
    -Math.sin(cameraState.yaw)
  );

  return right
    .multiplyScalar(inputX)
    .add(forward.multiplyScalar(-inputZ))
    .normalize();
}

/* =========================================================
   特效
========================================================= */

function createDashEffect() {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.06, 8, 32),
    new THREE.MeshBasicMaterial({
      color: COLORS.jadeLight,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.copy(player.root.position);
  ring.position.y = 0.15;
  effectsGroup.add(ring);

  particles.push({
    mesh: ring,
    life: 0.42,
    maxLife: 0.42,
    velocity: new THREE.Vector3(),
    type: "ring"
  });
}

function createAfterimage() {
  const ghost = player.model.clone();

  ghost.position.copy(player.root.position);
  ghost.rotation.copy(player.root.rotation);
  ghost.scale.copy(player.model.scale);

  ghost.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.opacity = 0.22;
    child.material.depthWrite = false;
    child.material.color.multiplyScalar(0.65);
  });

  effectsGroup.add(ghost);

  afterimages.push({
    mesh: ghost,
    life: 0.28,
    maxLife: 0.28
  });
}

function spawnParticles(position, color, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const size = 0.035 + Math.random() * 0.07;

    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 4),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );

    particle.position.copy(position);
    particle.position.y += Math.random() * 1.2;

    effectsGroup.add(particle);

    particles.push({
      mesh: particle,
      life: 0.35 + Math.random() * 0.45,
      maxLife: 0.8,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        1 + Math.random() * 4,
        (Math.random() - 0.5) * 4
      ),
      type: "particle"
    });
  }
}

function updateEffects(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const effect = particles[i];

    effect.life -= dt;

    if (effect.type === "particle") {
      effect.velocity.y -= 7 * dt;
      effect.mesh.position.addScaledVector(effect.velocity, dt);
      effect.mesh.scale.multiplyScalar(1 - dt * 0.8);
      effect.mesh.material.opacity = Math.max(
        0,
        effect.life / effect.maxLife
      );
    }

    if (effect.type === "ring") {
      effect.mesh.scale.multiplyScalar(1 + dt * 5);
      effect.mesh.material.opacity = Math.max(
        0,
        effect.life / effect.maxLife
      );
    }

    if (effect.life <= 0) {
      effectsGroup.remove(effect.mesh);
      disposeObject(effect.mesh);
      particles.splice(i, 1);
    }
  }

  for (let i = afterimages.length - 1; i >= 0; i -= 1) {
    const afterimage = afterimages[i];
    afterimage.life -= dt;

    afterimage.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = Math.max(
          0,
          0.22 * (afterimage.life / afterimage.maxLife)
        );
      }
    });

    if (afterimage.life <= 0) {
      effectsGroup.remove(afterimage.mesh);
      disposeObject(afterimage.mesh);
      afterimages.splice(i, 1);
    }
  }

  worldGroup.children.forEach((child) => {
    if (
      child.name === "Tree" ||
      child.geometry?.type === "SphereGeometry"
    ) {
      if (child.userData && child.userData.baseX !== undefined) {
        child.position.x =
          child.userData.baseX +
          Math.sin(GAME.elapsed * child.userData.speed + child.userData.phase) *
            0.7;
      }
    }
  });
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => material.dispose());
    }
  });
}

/* =========================================================
   UI
========================================================= */

function updateUI() {
  const p = player;

  setBar(ui.healthFill, p.health / p.maxHealth);
  setBar(ui.energyFill, p.energy / p.maxEnergy);
  setBar(ui.staminaFill, p.stamina / p.maxStamina);

  ui.healthValue.textContent = `${Math.ceil(p.health)} / ${p.maxHealth}`;
  ui.energyValue.textContent = `${Math.ceil(p.energy)} / ${p.maxEnergy}`;
  ui.staminaValue.textContent = `${Math.ceil(p.stamina)} / ${p.maxStamina}`;

  ui.questProgressText.textContent = `${GAME.defeated} / ${GAME.questTarget}`;

  ui.movementState.textContent = getMovementStateText();

  if (targetEnemy && targetEnemy.alive) {
    ui.targetLock.classList.remove("hidden");
    ui.targetName.textContent = "峡谷山匪";
    setBar(
      ui.targetHealthFill,
      targetEnemy.health / targetEnemy.maxHealth
    );
  } else {
    ui.targetLock.classList.add("hidden");
  }

  if (GAME.debug) {
    ui.debugInfo.classList.remove("hidden");
    ui.debugInfo.textContent = [
      `FPS: ${Math.round(1 / Math.max(clock.getDelta(), 0.001))}`,
      `状态: ${p.state}`,
      `位置: ${p.root.position.x.toFixed(1)}, ${p.root.position.z.toFixed(1)}`,
      `敌人: ${GAME.defeated}/${GAME.questTarget}`
    ].join("\n");
  }
}

function setBar(element, ratio) {
  element.style.width = `${THREE.MathUtils.clamp(ratio, 0, 1) * 100}%`;
}

function getMovementStateText() {
  switch (player.state) {
    case "walk":
      return "踏雪无痕";
    case "run":
      return "御风而行";
    case "jump":
      return "凌空起势";
    case "fall":
      return "云中落影";
    case "dash":
      return "轻功·流云";
    case "dodge":
      return "移形换影";
    case "attack":
      return `剑式·${player.comboStep}`;
    case "hurt":
      return "气息紊乱";
    default:
      return "闲庭信步";
  }
}

function showGameMessage(message) {
  ui.gameMessage.textContent = message;
  ui.gameMessage.classList.remove("show");

  void ui.gameMessage.offsetWidth;
  ui.gameMessage.classList.add("show");
}

function showToast(message, type = "") {
  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);

  toastTimeout = window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";

    window.setTimeout(() => {
      toast.remove();
    }, 250);
  }, 1900);
}

/* =========================================================
   工具函数
========================================================= */

function approachAngle(current, target, amount) {
  let difference = target - current;

  while (difference > Math.PI) {
    difference -= Math.PI * 2;
  }

  while (difference < -Math.PI) {
    difference += Math.PI * 2;
  }

  return current + THREE.MathUtils.clamp(
    difference,
    -amount,
    amount
  );
}

function onResize() {
  GAME.width = window.innerWidth;
  GAME.height = window.innerHeight;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =========================================================
   主循环
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  GAME.elapsed += dt;

  if (GAME.state === "playing") {
    updatePlayer(dt);
    updateEnemies(dt);
    updateCamera(dt);
    updateEffects(dt);
    updateUI();
  } else {
    updateEffects(dt * 0.35);
  }

  renderer.render(scene, camera);

  justPressed.clear();
}
