import { CollisionUtils } from './utils/Utility.js';
import Enemy from './components/Enemy.js';

class GameManager {
  constructor(scene, player, enemies, cloudBackground, deathPlane) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.cloudBackground = cloudBackground;
    this.deathPlane = deathPlane;

    this.frames = 0;
    this.spawnRate = 120;
    this.score = 0;
    this.gameOver = false;
    this.lastScoreUpdateTime = Date.now();
    this.scoreUpdateInterval = 100; // Update score every 100ms
  }

  update(timeElapsed) {
    if (this.gameOver) return;

    // Update background clouds
    this.cloudBackground.update(timeElapsed);

    // Update player
    this.player.update();

    // Update enemies
    this.updateEnemies();

    // Check for collisions
    this.checkCollisions();

    // Update score
    this.updateScore();
  }

  updateEnemies() {
    this.enemies.forEach((enemy) => {
      enemy.update();

      // Remove enemies that move out of bounds
      if (enemy.position.z > 10) {
        this.scene.remove(enemy);
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
      }
    });

    // Spawn new enemies
    if (this.frames % this.spawnRate === 0) {
      this.spawnEnemy();
      if (this.spawnRate > 20) this.spawnRate -= 5; // Gradually increase difficulty
    }

    this.frames++;
  }

  spawnEnemy() {
    const enemy = new Enemy({
      width: 1,
      height: 1,
      depth: 1,
      position: {
        x: (Math.random() - 0.5) * 8, // Random x position
        y: 0,
        z: -20, // Spawn further back
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.05 + Math.random() * 0.02, // Slightly randomize speed
      },
      zAcceleration: true,
    });

    this.scene.add(enemy);
    this.enemies.push(enemy);
  }

  checkCollisions() {
    // Check collision with death plane
    if (CollisionUtils.boxCollision({ box1: this.player, box2: this.deathPlane })) {
      this.handleGameOver('You fell off the map!');
      return;
    }

    // Check collision with enemies
    this.enemies.forEach((enemy) => {
      if (CollisionUtils.boxCollision({ box1: this.player, box2: enemy })) {
        this.handleGameOver('You hit a cactus!');
      }
    });
  }

  updateScore() {
    const currentTime = Date.now();
    if (currentTime - this.lastScoreUpdateTime >= this.scoreUpdateInterval) {
      this.score++;
      this.lastScoreUpdateTime = currentTime;
      document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
  }

  handleGameOver(reason) {
    this.gameOver = true;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('game-over-score').textContent = `Score: ${this.score}`;
    document.getElementById('game-over-reason').textContent = reason;
    document.getElementById('score-display').style.display = 'none';
  }

  restartGame() {
    this.gameOver = false;
    this.score = 0;
    this.frames = 0;
    this.spawnRate = 120;
    this.lastScoreUpdateTime = Date.now();

    // Remove all enemies
    this.enemies.forEach((enemy) => this.scene.remove(enemy));
    this.enemies.length = 0;

    // Reset player
    this.player.reset();

    // Reset UI
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('score-display').style.display = 'block';
  }
}

export default GameManager;