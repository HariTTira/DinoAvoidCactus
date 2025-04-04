import * as THREE from 'three';
import { CollisionUtils } from '../utils/Utility.js';

export class Enemy extends THREE.Object3D {
  constructor({
    width = 1,
    height = 1,
    depth = 1,
    position = { x: 0, y: 0, z: 0 },
    velocity = { x: 0, y: 0, z: 0 },
    zAcceleration = false,
    modelProvider = null,
    showCollisionBox = false
  }) {
    super();
    
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);
    
    this.velocity = velocity;
    this.gravity = -0.002;
    this.zAcceleration = zAcceleration;
    
    this.updateSides();
    
    if (modelProvider && typeof modelProvider === 'function') {
      const model = modelProvider();
      if (model) {
        model.visible = true;
        model.position.y = -this.height / 2;
        this.add(model);
        
        if (showCollisionBox) {
          const boxHelper = new THREE.BoxHelper(model, 0xffff00);
          boxHelper.visible = true;
          this.add(boxHelper);
        }
      }
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
    
    return this.position.z > 20; 
  }
  
  applyGravity(ground) {
    this.velocity.y += this.gravity;
    
    if (CollisionUtils.boxCollision({
      box1: this,
      box2: ground
    })) {
      const friction = 0.5;
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
  
  checkCollision(object) {
    return CollisionUtils.boxCollision({
      box1: this,
      box2: object
    });
  }
  
  toggleCollisionBox(visible) {
    this.traverse((child) => {
      if (child instanceof THREE.BoxHelper) {
        child.visible = visible;
      }
    });
  }
}