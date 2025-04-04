import * as THREE from 'three'
import { CollisionUtils } from '../utils/Utility.js'


export class Player extends THREE.Object3D {
  constructor({
    width = 1,
    height = 1,
    depth = 1,
    position = { x: 0, y: 0, z: 0 },
    velocity = { x: 0, y: -0.01, z: 0 }
  }) {
    super();

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.velocity = velocity;
    this.gravity = -0.002;

    this.isJumping = false;
    this.isOnGround = false;

    this.actions = {};
    this.currentAction = null;
    this.animationState = 'idle';

    this.model = new THREE.Object3D();
    this.add(this.model);
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    const wasOnGround = this.isOnGround;

    if (
      CollisionUtils.boxCollision({
        box1: this,
        box2: ground
      })
    ) {
      const friction = 0.5;
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;
      this.isOnGround = true;
    } else {
      this.position.y += this.velocity.y;
      this.isOnGround = false;
    }

    if (!wasOnGround && this.isOnGround && this.isJumping) {
      this.isJumping = false;
      if (keys.a.pressed || keys.d.pressed || keys.s.pressed || keys.w.pressed) {
        this.setAnimation('run');
      } else {
        this.setAnimation('idle');
      }
    }
  }

  update(ground) {
    this.updateSides();
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  setAnimation(name) {
    if (this.animationState === name) return;

    if (!this.actions || !this.mixer) return;

    const newAction = this.actions[name];
    const oldAction = this.currentAction;

    if (newAction === oldAction || !newAction) return;

    if (oldAction) {
      newAction.time = 0;
      newAction.enabled = true;
      newAction.setEffectiveTimeScale(1);
      newAction.setEffectiveWeight(1);
      newAction.crossFadeFrom(oldAction, 0.2, true);
    }

    newAction.play();
    this.currentAction = newAction;
    this.animationState = name;

    if (name === 'jump') {
      this.mixer.addEventListener('finished', (e) => {
        if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
          this.setAnimation('run');
        } else {
          this.setAnimation('idle');
        }
        this.mixer.removeEventListener('finished', arguments.callee);
      });
    }
  }

  loadModel(loader, path, scale, animations) {
    loader.load(path, (fbx) => {
      fbx.scale.set(scale, scale, scale);
      fbx.rotation.y = Math.PI;
      fbx.position.y = -this.height / 2;

      const pinkMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF69B4,
        roughness: 0.6,
        metalness: 0.1
      });

      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = pinkMaterial;
        }
      });

      this.model.add(fbx);

      this.mixer = new THREE.AnimationMixer(fbx);

      this.actions = {
        idle: this.mixer.clipAction(fbx.animations[animations.idle]),
        run: this.mixer.clipAction(fbx.animations[animations.run]),
        jump: this.mixer.clipAction(fbx.animations[animations.jump])
      };

      for (let action in this.actions) {
        this.actions[action].clampWhenFinished = true;
        this.actions[action].setLoop(THREE.LoopRepeat);
      }

      this.actions.jump.setLoop(THREE.LoopOnce);
      this.actions.jump.timeScale = 1.2;

      this.currentAction = this.actions.idle;
      this.currentAction.play();
    });
  }
}