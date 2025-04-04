import * as THREE from 'three';

class Enemy extends THREE.Object3D {
  constructor(model, position, velocity) {
    super();
    this.width = 1;
    this.height = 1;
    this.depth = 1;
    this.velocity = velocity;

    const enemyModel = model.clone();
    enemyModel.position.set(0, -this.height / 2, 0);
    this.add(enemyModel);

    this.position.copy(position);
  }

  update() {
    this.position.add(this.velocity);
  }
}

export default Enemy;