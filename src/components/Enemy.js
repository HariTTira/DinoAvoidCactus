import * as THREE from 'three';
import { CollisionUtils } from '../utils/Utility.js'

export class Enemy extends THREE.Object3D {
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
      CollisionUtils.boxCollision({
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
