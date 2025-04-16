// Abby Hirtle
// SSE 643 Advanced Graphic Interfaces
// April 19th, 2025
// Escape the Desert 3D Endless Runner
// The Obstacle class handles the logic for
//      the environment objects as well as the road.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export const obstacle = (() => {

  const START_POS = 100;
  const MIN_SEPARATION_DISTANCE = 20;

  class Obstacle {
    constructor(params) {
      this.position = new THREE.Vector3();
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.collider = new THREE.Box3();
      this.modelType = null;
      this.params_ = params;
      this.LoadModel_();
    }
  
    // creates a tumbleweed objects by applying a custom material to a sprite
    LoadModel_() {
      const loader = new THREE.TextureLoader();
      loader.setPath('./textures/');
      loader.load('tumbleweed.png', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.premultiplyAlpha = true;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true});
      material.color.set(0x302f2f);    
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(6, 4, 2);
      this.mesh = sprite;
      this.modelType = 'tumbleweed'
      this.params_.scene.add(this.mesh);
      });
    }

    // updates position and colliders for an obstacle
    Update() {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.collider.setFromObject(this.mesh);
    }
  }

  // handles random obstacle generation for player to dodge
  class ObstacleManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 35;
      this.barrierProbability_ = 0.0;
      this.params_ = params;
      this.score_ = 0.0;
      this.scoreText_ = '00000';
      this.separationDistance_ = MIN_SEPARATION_DISTANCE;
    }

    GetColliders() {
      return this.objects_;
    }

    // spawns a new obstacle at the given location
    SpawnObj_(scale, offset, loc) {
      let obj = null;
      let prob = Math.random();
      const isBarrier = prob < this.barrierProbability_;
      if (isBarrier){
        // create a one time use barrier
        const loader = new THREE.TextureLoader();
        loader.setPath('./textures/');
        loader.load('barrier.png', (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.premultiplyAlpha = true;
          const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
          material.color.set(0x302f2f);
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(15, 4, 2);
          this.params_.scene.add(sprite);

          obj = {
            mesh: sprite,
            position: new THREE.Vector3(),
            quaternion: new THREE.Quaternion(),
            scale: scale * 0.01,
            modelType: 'barrier',
            collider: new THREE.Box3(),
            Update: function () {
              this.mesh.position.copy(this.position);
              this.mesh.quaternion.copy(this.quaternion);
              this.collider.setFromObject(this.mesh);
            }
          };

      obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
      obj.position.x = START_POS + offset;
      obj.position.y = 1.3;
      obj.position.z = -5;

      this.objects_.push(obj);
    });
      }
        else{
        if (this.unused_.length > 0) {
          obj = this.unused_.pop();
          obj.mesh.visible = true;
        } else {
          obj = new Obstacle(this.params_);
        }

        obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
        obj.position.x = START_POS + offset;
        if (obj.modelType == 'barrier') {
          obj.position.y = 1.3;
          obj.position.z = -5;
        } else {
          obj.position.y = 2.0;
          obj.position.z = loc;
        }
        obj.scale = scale * 0.01;
        this.objects_.push(obj);
      }
    }
    // spawns a new obstacle at a random location
    RandomSpawn_() {
      // find location of closest obstacle
      let closest;
      if (this.objects_.length == 0) {
        closest = MIN_SEPARATION_DISTANCE;
      }
      else{
        closest = this.objects_[this.objects_.length - 1].position.x;
      }

      // randomly select left or right side of road to place obstacle
      if (Math.abs(START_POS - closest) > this.separationDistance_) {
        const selector = Math.random()
        if (selector < 0.5){
          const scaleIndex = Math.round(Math.random() * 1);
          const scales = [1, 0.5];
          const scale = scales[scaleIndex];
          this.SpawnObj_(scale, scale, 0);
        }
        else{
          const scaleIndex = Math.round(Math.random() * 1);
          const scales = [1, 0.5];
          const scale = scales[scaleIndex];
          this.SpawnObj_(scale, scale, -10); 
        }
        // randomly generate next separation distance
        this.separationDistance_ = Math.random() * ((MIN_SEPARATION_DISTANCE * 2) - MIN_SEPARATION_DISTANCE) + MIN_SEPARATION_DISTANCE;
      }
    }

    // updates score and positions of obstacles
    Update(timeElapsed) {
      this.RandomSpawn_();
      this.UpdateColliders_(timeElapsed);
      this.UpdateScore_(timeElapsed);
    }

    // updates score and displays in game window
    UpdateScore_(timeElapsed) {
      this.score_ += timeElapsed * 10.0;

      const scoreText = Math.round(this.score_).toLocaleString(
          'en-US', {minimumIntegerDigits: 5, useGrouping: false});

      if (scoreText == this.scoreText_) {
        return;
      }

      document.getElementById('score-text').innerText = scoreText;

      // update high score if current score exceeds it
      if (this.score_ > this.params_.gameManager.highscore) {
        this.params_.gameManager.highscore = this.score_;
        const highScoreText = Math.round(this.params_.gameManager.highscore).toLocaleString(
            'en-US', {minimumIntegerDigits: 5, useGrouping: false});
        document.getElementById('highscore-text').innerText = `HI ${highScoreText}`;
  }
    }

    // checks for collision between the player and an obstacle
    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];
      if (Math.floor(this.score_) % 75 == 0 && this.speed_ < 100){
        this.speed_ += 1;
        this.barrierProbability_ += 0.0015
      }
      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * this.speed_;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update();
      }

      this.objects_ = visible;
      // reuse tumbleweed only
      this.unused_.push(...invisible.filter(obj => obj.modelType === 'tumbleweed'));
    }
  };

  return {
      ObstacleManager: ObstacleManager,
  };
})();