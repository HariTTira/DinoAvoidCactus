import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { CloudBackground } from '../background.js';
import { Player } from './components/Player.js'

// Get UI elements
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');
const gameOverScore = document.getElementById('game-over-score');
const gameOverReason = document.getElementById('game-over-reason');;

// Create Audio object for jump sound
const jumpSound = new Audio('./resources/SFX/Jump.mp3');
// Create Audio object for 100 point sound
const pointSound = new Audio('./resources/SFX/Point.wav');

// Create scene with blue fog for depth perception
const scene = new THREE.Scene()
const cloudBackground = new CloudBackground(scene);
const createGradientTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  
  // Create gradient
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0077ff'); // Top color - blue
  gradient.addColorStop(0.5, '#80b0ff'); // Mid color - lighter blue
  gradient.addColorStop(1, '#ffffff'); // Bottom color - almost white
  
  // Fill with gradient
  context.fillStyle = gradient;
  context.fillRect(0, 0, 2, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// Set the background to use our gradient texture
scene.background = createGradientTexture();

// Optional: You can add a distant plane to enhance the horizon effect
const horizonPlaneGeometry = new THREE.PlaneGeometry(2000, 1000);
const horizonPlaneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide
});

const horizonPlane = new THREE.Mesh(horizonPlaneGeometry, horizonPlaneMaterial);
horizonPlane.position.set(0, -150, -2000);
horizonPlane.rotation.x = Math.PI / 2; // Rotate to be horizontal
scene.add(horizonPlane);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1, 10) // Position camera for better view

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// Controls setup - limit for gameplay
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1 // Don't allow camera below ground
controls.minDistance = 5
controls.maxDistance = 15
controls.target.set(0, 0, 0) // Center the controls

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = '#00ff00',
    velocity = {
      x: 0,
      y: 0,
      z: 0
    },
    position = {
      x: 0,
      y: 0,
      z: 0
    },
    zAcceleration = false
  }) {
    // Use MeshPhongMaterial instead of MeshStandardMaterial for better performance
    const material = new THREE.MeshPhongMaterial({ color })
    const geometry = new THREE.BoxGeometry(width, height, depth)
    super(geometry, material)

    this.width = width
    this.height = height
    this.depth = depth

    this.position.set(position.x, position.y, position.z)

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

    this.velocity = velocity
    this.gravity = -0.002

    this.zAcceleration = zAcceleration
  }

  updateSides() {
    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2
  }

  update(ground) {
    this.updateSides()

    if (this.zAcceleration) this.velocity.z += 0.0003

    this.position.x += this.velocity.x
    this.position.z += this.velocity.z

    this.applyGravity(ground)
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity

    // this is where we hit the ground
    if (
      boxCollision({
        box1: this,
        box2: ground
      })
    ) {
      const friction = 0.5
      this.velocity.y *= friction
      this.velocity.y = -this.velocity.y
    } else this.position.y += this.velocity.y
  }
}

function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
  const zCollision = box1.front >= box2.back && box1.back <= box2.front
  return xCollision && yCollision && zCollision
}

// Instantiate the player
const player = new Player({
  width: 1,
  height: 1,
  depth: 1,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: -0.01, z: 0 }
});

scene.add(player);

// Load the dinosaur model
const loader = new FBXLoader(); 
player.loadModel(loader, './resources/Dinosaurs/FBX/Velociraptor.fbx', 0.0025, {
  idle: 1,
  run: 2,
  jump: 0
});

// Ground - SMALLER SIZE
const ground = new Box({
  width: 10,  // Reduced from 30
  height: 0.5,
  depth: 90,  // Reduced from 50
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
// Load road texture
const roadTexture = textureLoader.load('./resources/Textures/DirtRoad.jpg', function(texture) {
  // Enable texture repeating
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2); // Repeat the texture horizontally and vertically
  
  // Update ground material with the texture
  ground.material = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF, // White base color to not tint the texture
    map: texture,  // Apply the texture
    shininess: 10
  });
  
  // Make sure the texture is applied to all sides of the box
  ground.material.needsUpdate = true;
});

const visualGroundGeometry = new THREE.PlaneGeometry(200, 100);
const visualGroundMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xE3C184,
  side: THREE.DoubleSide
});

const visualGround = new THREE.Mesh(visualGroundGeometry, visualGroundMaterial);
visualGround.rotation.x = Math.PI / 2; // Rotate to be horizontal
visualGround.position.set(0, -1.99, 0); // Position it just above the collision ground
visualGround.receiveShadow = true;

// Add both to the scene
scene.add(visualGround);

// Add a death plane below the ground
const deathPlaneGeometry = new THREE.PlaneGeometry(30, 60);
const deathPlaneMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xff0000,
  transparent: true,
  opacity: 0.0, // Completely invisible
  side: THREE.DoubleSide
});

const deathPlane = new THREE.Mesh(deathPlaneGeometry, deathPlaneMaterial);
deathPlane.position.set(0, -10, 0); // Position it well below the ground
deathPlane.rotation.x = Math.PI / 2; // Rotate to be horizontal

// Add collision properties to the death plane
deathPlane.width = 30;
deathPlane.height = 0.1; // Thin height for collision detection
deathPlane.depth = 60;
deathPlane.left = deathPlane.position.x - deathPlane.width / 2;
deathPlane.right = deathPlane.position.x + deathPlane.width / 2;
deathPlane.bottom = deathPlane.position.y - deathPlane.height / 2;
deathPlane.top = deathPlane.position.y + deathPlane.height / 2;
deathPlane.front = deathPlane.position.z + deathPlane.depth / 2;
deathPlane.back = deathPlane.position.z - deathPlane.depth / 2;
deathPlane.updateSides = function() {
  this.left = this.position.x - this.width / 2;
  this.right = this.position.x + this.width / 2;
  this.bottom = this.position.y - this.height / 2;
  this.top = this.position.y + this.height / 2;
  this.front = this.position.z + this.depth / 2;
  this.back = this.position.z - this.depth / 2;
};

// Add a wireframe outline to make the death plane visible
const wireframeGeometry = new THREE.EdgesGeometry(deathPlaneGeometry);
const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

deathPlane.add(wireframe);
scene.add(deathPlane);

// Add strong directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

// Add ambient light for overall illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

// Input controls
const keys = {
  a: { pressed: false },
  d: { pressed: false },
  s: { pressed: false },
  w: { pressed: false }
}

// Update the keydown event listener to handle jump animation
window.addEventListener('keydown', (event) => {
  // Game is active, process normal controls
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

        // Play jump sound effect
        jumpSound.currentTime = 0 // Reset sound to beginning
        jumpSound.play().catch(e => console.error("Error playing jump sound:", e))
      }
      break
  }
})

// Update the keyup event listener
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
  
  // If no movement keys are pressed and not jumping, go back to idle
  if (!keys.a.pressed && !keys.d.pressed && !keys.s.pressed && !keys.w.pressed && !player.isJumping) {
    player.setAnimation('idle',keys)
  }
})

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Cactus enemy implementation
let cactiModels = []; // To store the loaded cactus models

// Load the cactus models
const fbxLoader = new FBXLoader();
fbxLoader.setPath('./resources/DesertPack/FBX/');

// Load all three cactus models
const cactiToLoad = ['Cactus2.fbx', 'Cactus3.fbx'];
let loadedCount = 0;

cactiToLoad.forEach(cactusFile => {
  fbxLoader.load(cactusFile, (fbx) => {
    fbx.scale.setScalar(0.01); // Scale down the model
    
    // Apply materials and shadows
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Apply a green material to make it more cactus-like
        child.material = new THREE.MeshPhongMaterial({
          color: 0x2e8b57, // Sea green color
          shininess: 0
        });
      }
    });
    
    // Store the model
    cactiModels.push(fbx);
    loadedCount++;
    
    // Clone the model for better performance
    fbx.visible = false; // Hide the original model
    scene.add(fbx); // Add to scene but keep invisible
  });
});

// Modify the enemy class to use cactus models
class Enemy extends THREE.Object3D {
  constructor({
    width,
    height,
    depth,
    position = {
      x: 0,
      y: 0,
      z: 0
    },
    velocity = {
      x: 0,
      y: 0,
      z: 0
    },
    zAcceleration = false
  }) {
    super();
    
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    this.position.set(position.x, position.y, position.z);
    
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
    
    this.velocity = velocity;
    this.gravity = -0.002;
    
    this.zAcceleration = zAcceleration;
    
    // Add a random cactus model to this enemy
    if (cactiModels.length > 0) {
      const randomIndex = Math.floor(Math.random() * cactiModels.length);
      const cactusModel = cactiModels[randomIndex].clone();
      cactusModel.visible = true;
      
      // Position the model at the center of the collision box
      cactusModel.position.y = -this.height / 2;
      
      // Add the model to this enemy object
      this.add(cactusModel);
      const cactusBoxHelper = new THREE.BoxHelper(cactusModel, 0xffff00);  // Yellow color for collision box
      cactusBoxHelper.visible = true;  // Make it visible
      this.add(cactusBoxHelper); 
    }
  }
  
  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }
  
  update(ground) {
    this.updateSides();
    
    if (this.zAcceleration) this.velocity.z += 0.0003;
    
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
    
    this.applyGravity(ground);
  }
  
  applyGravity(ground) {
    this.velocity.y += this.gravity;
    
    if (
      boxCollision({
        box1: this,
        box2: ground
      })
    ) {
      const friction = 0.5;
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;
    } else this.position.y += this.velocity.y;
  }
}

// Function to handle game over
function handleGameOver(reason) {
  // Update game over screen
  gameOverScore.textContent = `Score: ${score}`;
  gameOverReason.textContent = reason;
  
  // Show game over screen
  gameOverScreen.style.display = 'flex';
  document.getElementById('score-display').style.display = 'none';
  
  // Set game state
  gameOver = true;
}

// Function to start the game
function startGame() {
  // Hide start screen
  startScreen.style.display = 'none';
  
  // Show score display
  scoreDisplay.style.display = 'block';
  
  // Reset game state
  gameOver = false;
  score = 0;
  frames = 0;
  spawnRate = 120;
  lastScoreUpdateTime = getCurrentTime();
  updateScoreDisplay();
  
  // Reset player position and velocity
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  // Reset animation if it exists
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

// Game state
const enemies = []
let frames = 0
let spawnRate = 120
let gameOver = false
let score = 0;
let scoreDisplay = document.getElementById('score-display');
let lastScoreUpdateTime = 0
const scoreUpdateInterval = 100 // Update score every 100ms

// Function to update the score display
function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}`;
}

// Get the current time in milliseconds
function getCurrentTime() {
  return new Date().getTime()
}

// Function to restart the game
function restartGame() {
  // Hide game over screen
  gameOverScreen.style.display = 'none';
  
  // Show score display
  scoreDisplay.style.display = 'block';
  
  // Reset game state
  gameOver = false;
  score = 0;
  frames = 0;
  spawnRate = 120;
  lastScoreUpdateTime = getCurrentTime();
  updateScoreDisplay();
  
  // Remove all existing enemies
  enemies.forEach(enemy => {
    scene.remove(enemy);
  });
  enemies.length = 0;
  
  // Reset player position and velocity
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  // Reset animation if it exists
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

// Function to return to main menu
function returnToMenu() {
  // Hide game over screen
  gameOverScreen.style.display = 'none';
  
  // Show start screen
  startScreen.style.display = 'flex';
  
  // Remove all existing enemies
  enemies.forEach(enemy => {
    scene.remove(enemy);
  });
  enemies.length = 0;
  
  // Reset player position and velocity
  player.position.set(0, 0, 0);
  player.velocity.x = 0;
  player.velocity.y = -0.01;
  player.velocity.z = 0;
  player.rotation.y = 0;
  player.isJumping = false;
  player.isOnGround = false;
  
  // Reset animation if it exists
  if (player.mixer) {
    player.setAnimation('idle',keys);
  }
}

// Add event listeners for UI buttons
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
menuButton.addEventListener('click', returnToMenu);

// Animation loop
function animate() {
  const animationId = requestAnimationFrame(animate)
  
  // Update controls
  controls.update()
  if (player.velocity.y == 0.08){
  console.log(`Position Y: ${player.position.y}, Velocity Y: ${player.velocity.y}`);
  }
  // Update animation mixer if it exists
  if (player && player.mixer) {
    player.mixer.update(0.01); // Update animation with fixed time step
  }
  if (cloudBackground) {
    cloudBackground.update(0.016);
}
  // Render scene
  renderer.render(scene, camera)
  
  if (gameOver) return

  // Update death plane sides
  deathPlane.updateSides();

  // Update score based on time survived
  const currentTime = getCurrentTime()
  if (currentTime - lastScoreUpdateTime >= scoreUpdateInterval) {
    if (score % 100 == 0 && score > 0) {
      // Play jump sound effect
      pointSound.currentTime = 0 // Reset sound to beginning
      pointSound.play().catch(e => console.error("Error playing point sound:", e))
    }
    score += 1 // Increase score by 1 point every 100ms
    updateScoreDisplay()
    lastScoreUpdateTime = currentTime
  }

  // Player movement
  player.velocity.x = 0
  player.velocity.z = 0
  
  // Only allow movement control if not in jumping animation
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
      player.rotation.y = -Math.PI / 2 // Turn right
    }
  }

  if (keys.s.pressed) {
    player.velocity.z = 0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = Math.PI // Face forward
    }
  } else if (keys.w.pressed) {
    player.velocity.z = -0.05
    if (!player.isJumping) {
      player.setAnimation('run',keys)
      player.rotation.y = 0 // Face backward
    }
  }
  
  // If no keys are pressed and not jumping, play idle animation
  if (!keys.a.pressed && !keys.d.pressed && !keys.s.pressed && !keys.w.pressed && !player.isJumping) {
    player.setAnimation('idle',keys)
  }

  // Update player
  player.update(ground, keys)
  player.updateSides()
  
  // Check for collision with death plane
  if (
    boxCollision({
      box1: player,
      box2: deathPlane
    })
  ) {
    handleGameOver("You fell off the map!");
    return;
  }

  // Update enemies
  enemies.forEach((enemy) => {
    enemy.update(ground)
    if (
      boxCollision({
        box1: player,
        box2: enemy
      })
    ) {
      handleGameOver("You hit a cactus!");
    }
  })
    
  // Spawn enemies - using cactus models
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 5;

    // Make sure we've loaded at least one cactus model
    if (cactiModels.length > 0) {
      const enemy = new Enemy({
        width: 1,
        height: 1, // Make the cacti taller for collision
        depth: 1,
        position: {
          x: (Math.random() - 0.5) * 8, // Reduced spawn area width
          y: 0,
          z: -20 // Spawn further back
        },
        velocity: {
          x: 0,
          y: 0,
          z: 0.05 + Math.random() * 0.02 // Slightly randomize speed
        },
        zAcceleration: true
      });
      
      scene.add(enemy);
      enemies.push(enemy);
    }
  }

  frames++
}

// Initialize the score display and start time before the game begins
updateScoreDisplay()
lastScoreUpdateTime = getCurrentTime()

gameOver = true

// Start the game
animate()