import * as THREE from 'three';
import { CollisionUtils } from '../utils/Utility.js'

export class DeathPlane extends THREE.Object3D {
  constructor({
    width = 30,
    height = 0.1,
    depth = 60,
    position = { x: 0, y: -10, z: 0 },
    color = 0xff0000,
    showWireframe = true,
    opacity = 0.0
  }) {
    super();
    
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    this.position.set(position.x, position.y, position.z);
    
    const planeGeometry = new THREE.PlaneGeometry(width, depth);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide
    });
    
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2; // Rotate to be horizontal
    this.add(plane);
    
    if (showWireframe) {
      const wireframeGeometry = new THREE.EdgesGeometry(planeGeometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: color });
      const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
      plane.add(wireframe);
    }
    
    this.updateSides();
  }
  
  updateSides() {
    this.left = this.position.x - this.width / 2;
    this.right = this.position.x + this.width / 2;
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }
  
  checkCollision(object) {
    this.updateSides();
    
    CollisionUtils.boxCollision({
            box1: this,
            box2: object
          })
  }
  
  toggleWireframe(visible) {
    this.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        child.visible = visible;
      }
    });
  }
  
  updateDimensions(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    
    this.traverse((child) => {
      if (child instanceof THREE.Mesh && !(child instanceof THREE.LineSegments)) {
        child.geometry.dispose();
        child.geometry = new THREE.PlaneGeometry(width, depth);
        
        const wireframe = child.children.find(c => c instanceof THREE.LineSegments);
        if (wireframe) {
          wireframe.geometry.dispose();
          wireframe.geometry = new THREE.EdgesGeometry(child.geometry);
        }
      }
    });
    
    this.updateSides();
  }
}