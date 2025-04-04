import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MathUtils } from '../utils/Utility.js';

class BackgroundCloud {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = 1.0;
    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.setPath('../../resources/Clouds/GLTF/'); //prob
    const cloudNumber = MathUtils.randInt(1, 2);

    loader.load(`Cloud${cloudNumber}.glb`, (glb) => {
      this.mesh = glb.scene;
      this.scene.add(this.mesh);

      this.initializeProperties();
      this.applyMaterialSettings();
      this.updateTransform();
    });
  }

  initializeProperties() {
    this.position.set(
      MathUtils.randRange(0, 2000),
      MathUtils.randRange(100, 200),
      MathUtils.randRange(500, -1000)
    );
    this.scale = MathUtils.randRange(10, 20);
    this.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      MathUtils.randRange(0, 360) * Math.PI / 180
    );
  }

  applyMaterialSettings() {
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeBoundingBox();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material) {
            material.specular = new THREE.Color(0x000000);
            material.emissive = new THREE.Color(0xCCCCCC);
          }
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  update(timeElapsed) {
    if (!this.mesh) return;

    this.position.x -= timeElapsed * 10;
    if (this.position.x < -100) {
      this.position.x = MathUtils.randRange(2000, 3000);
    }
    this.updateTransform();
  }

  updateTransform() {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
    }
  }
}

class CloudBackground {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.spawnClouds();
  }

  spawnClouds() {
    for (let i = 0; i < 15; ++i) {
      this.clouds.push(new BackgroundCloud(this.scene));
    }
  }

  update(timeElapsed) {
    this.clouds.forEach((cloud) => cloud.update(timeElapsed));
  }
}

export default CloudBackground;