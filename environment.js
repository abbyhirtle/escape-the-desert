// Abby Hirtle
// SSE 643 Advanced Graphic Interfaces
// April 19th, 2025
// Escape the Desert 3D Endless Runner
// The Environment class handles the logic for
//      the environment objects as well as the road.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.122/build/three.module.js';

export const environment = (() => {

  class DesertObj {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    // randomly generates an environment object from a weighted list
    LoadModel_() {
      const assets = [
        ['tree.png', 20, 9, 2],
        ['skull.png', 7, 2, 2],
        ['scorpion.png', 3, 0.5, 5], 
        ['cactus1.png', 10, 7, 10],
        ['cactus2.png', 10, 5, 10],
        ['cactus3.png', 15, 7, 10],
        ['cactus4.png', 15, 7, 2],
        ['vegitation.png', 15, 3, 20],
      ];
      // randomly selected from weighted list
      const [textureName, scale, offsety] = this.weightedRandomSelector(assets);
      
      // load texture of the given object and apply to a sprite
      const texLoader = new THREE.TextureLoader();
      texLoader.setPath('./textures/');
      texLoader.load(textureName, (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.premultiplyAlpha = true;
    
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        material.color.set(0x302f2f);
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(scale, scale, 1);
    
        // place object in random location, avoiding the road
        const x = Math.random() * 2000;
        const halfWidth = scale * 0.5;
        const roadZMin = -15;
        const roadZMax = 5;

        let z;
        const safeBuffer = 10;
        const maxZ = 1000;
        const minZ = -1000;

        if (Math.random() < 0.5) {
          // left side of the road
          z = Math.random() * ((roadZMin - halfWidth - safeBuffer) - minZ) + minZ;
        } else {
          // right side of the road
          z = Math.random() * (maxZ - (roadZMax + halfWidth + safeBuffer)) + (roadZMax + halfWidth + safeBuffer);
        }
 
        sprite.position.set(x, offsety, z);
    
        this.mesh_ = sprite;
        this.position_ = sprite.position;
        this.scale_ = scale;
    
        this.params_.scene.add(this.mesh_);
      });
    }

    // update location of environment objects to simulate player movement
    Update(timeElapsed, speed) {
      if (!this.mesh_) {
        return;
      }
      this.position_.x -= timeElapsed * speed;
      // reuse object once it goes out of view
      if (this.position_.x < -100) {
        this.position_.x = Math.random() * (3000 - 2000) + 2000;
      }
      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_); 
    }

    // randomly selects from a list of weighted assets
    weightedRandomSelector(assets) {
      const totalWeight = assets.reduce((sum, [, , , weight]) => sum + weight, 0);
      let r = Math.random() * totalWeight;
    
      for (const asset of assets) {
        const weight = asset[3];
        if (r < weight) return asset;
        r -= weight;
      }
    
      return assets[assets.length - 1];
    }

  };

  // handles creation of highway road sign that displays game controls
  class InstructionSign {
    constructor(params, textureName, position) {
      this.params_ = params;
      this.position_ = new THREE.Vector3(...position);
      this.textureName_ = textureName;
      this.sprite_ = null;
      this.LoadTexture_();
    }

    LoadTexture_() {
      // load road sign and apply material to sprite
      const loader = new THREE.TextureLoader();
      loader.setPath('./textures/');
      loader.load(this.textureName_, (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.premultiplyAlpha = true;

        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        material.color.set(0x302f2f);
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(45, 27, 1);
        sprite.position.copy(this.position_);

        this.sprite_ = sprite;
        this.params_.scene.add(this.sprite_);
      });
    }

    Update(timeElapsed, speed) {
      if (!this.sprite_) return;

      this.position_.x -= timeElapsed * speed;

      if (this.position_.x < -100) {
        // remove from scene once it passes the screen
        this.params_.scene.remove(this.sprite_);
        this.sprite_ = null;
      } else {
        this.sprite_.position.copy(this.position_);
      }
    }
  }

  class Environment {
    constructor(params) {
      this.params_ = params;
      this.objs_ = [];
      this.speed_ = 35;
      this.instructionSigns_ = [];
      this.SpawnRoad_();
      this.SpawnObjs_();
      this.SpawnSigns_();
    }

    // create road for player to drive on
    SpawnRoad_() {
      const loader = new THREE.TextureLoader();
      const roadTexture = loader.load('./textures/road.jpg');
      roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
      roadTexture.encoding = THREE.sRGBEncoding;
      roadTexture.repeat.set(1, 1000);
      roadTexture.anisotropy = this.params_.maxAnisotrophy;
      const roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture });
      this.road = new THREE.Mesh(new THREE.PlaneBufferGeometry(20, 10000), roadMaterial);
      this.road.position.y = 0.1;
      this.road.position.z = -5;
      this.road.rotation.x = -Math.PI / 2;
      this.road.rotation.z = Math.PI / 2;
      this.road.receiveShadow = true;

      this.params_.scene.add(this.road);
    }

    SpawnSigns_(){
      const sign1 = new InstructionSign(this.params_, 'sign1.png', [100, 8, -5]);
      const sign2 = new InstructionSign(this.params_, 'sign2.png', [200, 8, -5]);
      this.instructionSigns_.push(sign1);
      this.instructionSigns_.push(sign2);
    }

    // places 75 objects across scene
    SpawnObjs_() {
      for (let i = 0; i < 75; ++i) {
        const obj = new DesertObj(this.params_);

        this.objs_.push(obj);
      }
    }

    // update location of road to simulate player movement
    Update(timeElapsed) {
      this.road.position.x -= timeElapsed * this.speed_;

      for (let c of this.objs_) {
        c.Update(timeElapsed, this.speed_);
      }

      for (let sign of this.instructionSigns_) {
        sign.Update(timeElapsed, this.speed_);
      }

      // reuse road once a large portion goes out of view for infinite play 
      if (this.road.position.x < -100) {
        this.road.position.x += 100;
      }

      // update speed
      if (this.speed_ < 100 && this.road.position.x % 20 == 0){
        this.speed_ += 2;
      }
    }
  }

  return {
    Environment: Environment,
  };
})();
