import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { CloudBackground } from './components/CloudBackground.js';
import { Player } from './components/Player.js'
import { Box } from './components/Box.js'
import { DeathPlane } from './components/DeathPlane.js';
import { CollisionUtils } from './utils/Utility.js';
import { Enemy } from './components/Enemy.js';

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');
const gameOverScore = document.getElementById('game-over-score');
const gameOverReason = document.getElementById('game-over-reason');

const jumpSound = new Audio('./resources/SFX/Jump.mp3');
const pointSound = new Audio('./resources/SFX/Point.wav');

const scene = new THREE.Scene()
const cloudBackground = new CloudBackground(scene);
const createGradientTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0077ff'); 
  gradient.addColorStop(0.5, '#80b0ff');
  gradient.addColorStop(1, '#ffffff'); 
  context.fillStyle = gradient;
  context.fillRect(0, 0, 2, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

scene.background = createGradientTexture();

const horizonPlaneGeometry = new THREE.PlaneGeometry(2000, 1000);
const horizonPlaneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide
});

const horizonPlane = new THREE.Mesh(horizonPlaneGeometry, horizonPlaneMaterial);
horizonPlane.position.set(0, -150, -2000);
horizonPlane.rotation.x = Math.PI / 2; 
scene.add(horizonPlane);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1 
controls.minDistance = 5
controls.maxDistance = 15
controls.target.set(0, 0, 0)

const player = new Player({
  width: 1,
  height: 1,
  depth: 1,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: -0.01, z: 0 }
});

scene.add(player);

const loader = new FBXLoader(); 
player.loadModel(loader, './resources/Dinosaurs/FBX/Velociraptor.fbx', 0.0025, {
  idle: 1,
  run: 2,
  jump: 0
});

const ground = new Box({
  width: 10, 
  height: 0.5,
  depth: 90,
  color: '#333333',
  position: {
    x: 0,
    y: -2,
    z: 0
  }
})
ground.receiveShadow = true
scene.add(ground)

const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('./resources/Textures/DirtRoad.jpg', function(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2); 
  
  ground.material = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    map: texture,
    shininess: 10
  });
  
  ground.material.needsUpdate = true;
});

const visualGroundGeometry = new THREE.PlaneGeometry(200, 100);
const visualGroundMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xE3C184,
  side: THREE.DoubleSide
});

const visualGround = new THREE.Mesh(visualGroundGeometry, visualGroundMaterial);
visualGround.rotation.x = Math.PI / 2; 
visualGround.position.set(0, -1.99, 0);
visualGround.receiveShadow = true;

scene.add(visualGround);

const deathPlane = new DeathPlane({
  width: 300,
  height: 0.1,
  depth: 600,
  position: { x: 0, y: -10, z: 0 },
  color: 0xff0000,
  showWireframe: false,
  opacity: 0.0
});
scene.add(deathPlane);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  s: { pressed: false },
  w: { pressed: false }
}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = true
      if (!player.isJumping) player.setAnimation('run',keys)
      break
    case 'KeyD':
      keys.d.pressed = true
      if (!player.isJumping) player.setAnimation('run',keys)
      break
    case 'KeyS':
      keys.s.pressed = true
      if (!player.isJumping) player.setAnimation('run',keys)
      break
    case 'KeyW':
      keys.w.pressed = true
      if (!player.isJumping) player.setAnimation('run',keys)
      break
    case 'Space':
      if (player.isOnGround && !player.isJumping) {
        player.velocity.y += 0.08
        player.position.y += player.velocity.y
        player.isJumping = true
        player.isOnGround = false
        player.setAnimation('jump', keys)

        jumpSound.currentTime = 0 
        jumpSound.play().catch(e => console.error("Error playing jump sound:", e))
      }
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyW':
      keys.w.pressed = false
      break
  }
  
  if (!keys.a.pressed && !keys.d.pressed && !keys.s.pressed && !keys.w.pressed && !player.isJumping) {
    player.setAnimation('idle',keys)
  }
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let cactiModels = []; 

const fbxLoader = new FBXLoader();
fbxLoader.setPath('./resources/DesertPack/FBX/');

const cactiToLoad = ['Cactus2.fbx', 'Cactus3.fbx'];
let loadedCount = 0;

cactiToLoad.forEach(cactusFile => {
  fbxLoader.load(cactusFile, (fbx) => {
    fbx.scale.setScalar(0.01);
    
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshPhongMaterial({
          color: 0x2e8b57, 
          shininess: 0
        });
      }
    });
    
    cactiModels.push(fbx);
    loadedCount++;
    
    fbx.visible = false; 
    scene.add(fbx);
  });
});


function handleGameOver(reason) {
  gameOverScore.textContent = `Score: ${score}`;
  gameOverReason.textContent = reason;
  
  gameOverScreen.style.display = 'flex';
  document.getElementById('score-display').style.display = 'none';
  
  gameOver = true;
}

function startGame() {
  startScreen.style.display = 'none';
  
  scoreDisplay.style.display = 'block';
  
  gameOver = false;
  score = 0;
  frames = 0;
  spawnRate = 120;
  lastScoreUpdateTime = getCurrentTime();
  updateScoreDisplay();
  
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

const enemies = []
let frames = 0
let spawnRate = 120
let gameOver = false
let score = 0;
let scoreDisplay = document.getElementById('score-display');
let lastScoreUpdateTime = 0
const scoreUpdateInterval = 100

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}`;
}

function getCurrentTime() {
  return new Date().getTime()
}

function restartGame() {
  gameOverScreen.style.display = 'none';
  
  scoreDisplay.style.display = 'block';
  
  gameOver = false;
  score = 0;
  frames = 0;
  spawnRate = 120;
  lastScoreUpdateTime = getCurrentTime();
  updateScoreDisplay();
  
  enemies.forEach(enemy => {
    scene.remove(enemy);
  });
  enemies.length = 0;
  
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

function returnToMenu() {
  gameOverScreen.style.display = 'none';
  
  startScreen.style.display = 'flex';
  
  enemies.forEach(enemy => {
    scene.remove(enemy);
  });
  enemies.length = 0;
  
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
menuButton.addEventListener('click', returnToMenu);

function animate() {
  const animationId = requestAnimationFrame(animate)
  controls.update()
  if (player && player.mixer) { player.mixer.update(0.01);}
  if (cloudBackground) { cloudBackground.update(0.016); }
  renderer.render(scene, camera)
  
  if (gameOver) return

  deathPlane.updateSides();

  const currentTime = getCurrentTime()
  if (currentTime - lastScoreUpdateTime >= scoreUpdateInterval) {
    if (score % 100 == 0 && score > 0) {
      pointSound.currentTime = 0 
      pointSound.play().catch(e => console.error("Error playing point sound:", e))
    }
    score += 1 
    updateScoreDisplay()
    lastScoreUpdateTime = currentTime
  }

  player.velocity.x = 0
  player.velocity.z = 0
  
  if (keys.a.pressed) {
    player.velocity.x = -0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = Math.PI / 2
    }
  } else if (keys.d.pressed) {
    player.velocity.x = 0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = -Math.PI / 2 
    }
  }

  if (keys.s.pressed) {
    player.velocity.z = 0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = Math.PI
    }
  } else if (keys.w.pressed) {
    player.velocity.z = -0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = 0 
    }
  }
  
  if (!keys.a.pressed && !keys.d.pressed && !keys.s.pressed && !keys.w.pressed && !player.isJumping) {
    player.setAnimation('idle', keys)
  }

  player.update(ground, keys)
  player.updateSides()
  
  if (
    CollisionUtils.boxCollision({
      box1: player,
      box2: deathPlane
    })
  ) {
    handleGameOver("You fell off the map!");
    return;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const shouldRemove = enemy.update(ground);
    
    if (enemy.checkCollision(player)) {
      handleGameOver("You hit a cactus!");
      break;
    }
    
    if (shouldRemove) {
      scene.remove(enemy);
      enemies.splice(i, 1);
    }
  }
    
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 5;
  
    if (cactiModels.length > 0) {
      const getCactusModel = () => {
        const randomIndex = Math.floor(Math.random() * cactiModels.length);
        return cactiModels[randomIndex].clone();
      };
      
      const enemy = new Enemy({
        width: 1,
        height: 1,
        depth: 1,
        position: {
          x: (Math.random() - 0.5) * 8,
          y: 0,
          z: -20
        },
        velocity: {
          x: 0,
          y: 0,
          z: 0.05 + Math.random() * 0.02
        },
        zAcceleration: true,
        modelProvider: getCactusModel,
        showCollisionBox: false 
      });
      
      scene.add(enemy);
      enemies.push(enemy);
    }
  }

  frames++
}

updateScoreDisplay()
lastScoreUpdateTime = getCurrentTime()

gameOver = true

animate()