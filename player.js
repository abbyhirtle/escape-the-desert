// Abby Hirtle
// SSE 643 Advanced Graphic Interfaces
// April 19th, 2025
// Escape the Desert 3D Endless Runner
// The Player class handles the logic for
//      the car that the player must maneuver
//      around obstacles. 

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export const player = (() => {

  class Player {
    constructor(params) {
      this.position_ = new THREE.Vector3(0, 2, 0);
      this.playerBox_ = new THREE.Box3();
      this.swerveStepDone_ = false;
      this.swerveState_ = 'idle';
      this.swerveTimer_ = 0; 
      this.swerveDuration_ = 1; 
      this.params_ = params;
      this.velocity_ = 0.0;
      this.targetZ_ = 0.0;
      this.LoadModel_();
      this.InitInput_();
    }
    
    // creates a jeep object by applying an image of a jeep to a sprite
    LoadModel_() {
      const loader = new THREE.TextureLoader();
      loader.setPath('./textures/');
      loader.load('jeep.png', (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.premultiplyAlpha = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true});
        material.color.set(0x302f2f);
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(5, 3, 2);
        this.mesh_ = sprite;
        this.mesh_.position.set(0,0,0)
        this.params_.scene.add(this.mesh_);
      });
      const headlight = new THREE.SpotLight(0xffffff, 8, 200, Math.PI / 16, 0.1, 2);
      headlight.position.set(0, 2, 0);
      this.headlight_ = headlight;
      this.headlight_.target.position.set(50, 2, 0);
      this.params_.scene.add(this.headlight_);
      this.params_.scene.add(this.headlight_.target);
    }

    // add listener for user input
    InitInput_() {
      this.keys_ = {
        space: false,
      };
      this.oldKeys = { ...this.keys_ };
    
      window.addEventListener('keydown', this.OnKeyChange_.bind(this, true));
      window.addEventListener('keyup', this.OnKeyChange_.bind(this, false));
    }
    
    // checks for user input from arrow keys
    OnKeyChange_(isDown, event) {
      if (event.code == 'ArrowUp' || event.code == 'KeyW') {
        this.keys_.up = isDown;
      }
      if (event.code == 'ArrowLeft' || event.code == 'KeyA') {
        this.keys_.left = isDown;
      }
      if (event.code == 'ArrowRight' || event.code == 'KeyD') {
        this.keys_.right = isDown;
      }
    }

    // checks for collisions between player and obstacles
    CheckCollisions_() {
      const colliders = this.params_.obstacle.GetColliders();

      this.playerBox_.setFromObject(this.mesh_);

      for (let c of colliders) {
        const cur = c.collider;

        if (cur.intersectsBox(this.playerBox_)) {
          this.gameOver = true;
        }
      }
    }

    Update(timeElapsed) {
      // simulate car "jumping" on user input
      if (this.keys_.up && this.position_.y == 2.0 && !this.swerveInProgress_) {
        this.jumpInProgress_ = true;
        this.velocity_ = 30;
      }
      if (this.jumpInProgress_) {
        const acceleration = -75 * timeElapsed;
    
        this.position_.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.headlight_.position.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.position_.y = Math.max(this.position_.y, 2.0);
        this.headlight_.position.y = Math.max(this.position_.y, 2.0);
        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
    
        if (this.mesh_) {
          this.mesh_.position.copy(this.position_);
          this.CheckCollisions_();
        }
        if (this.position_.y <= 2.01 && this.jumpInProgress_) { 
          this.position_.y = 2.0;
          this.jumpInProgress_ = false;
        }
      }
      
      this.swerveSpeed_ = 5.0;

      // set target location based on user input
      if (this.keys_.left && !this.jumpInProgress_ && this.position_.z > -10) {
        this.swerveState_ = 'swerveLeft';
        this.targetZ_ = Math.max(this.position_.z - 10, -10); 
        this.swerveInProgress_ = true;
      } else if (this.keys_.right && !this.jumpInProgress_ && this.position_.z < 0) {
        this.swerveState_ = 'swerveRight';
        this.targetZ_ = Math.min(this.position_.z + 10, 0); 
        this.swerveInProgress_ = true;
      }
    
      // Check for completion of the swerve
      if (this.swerveInProgress_ && Math.abs(this.position_.z - this.targetZ_) < 2) {
        this.swerveState_ = 'idle';
        this.swerveInProgress_ = false;
      }
    
      // gradually swerve to target location
      this.position_.y = Math.max(this.position_.y, 2.0);
      if (this.mesh_) {
        const zDiff = this.targetZ_ - this.position_.z;
        if (Math.abs(zDiff) > 0.01) {
          this.position_.z += zDiff * timeElapsed * this.swerveSpeed_;
          this.params_.camera.position.z = this.position_.z;
          this.params_.camera.lookAt(8, 3, this.position_.z);
          this.headlight_.position.z = this.position_.z;
          this.headlight_.target.position.set(50, 2, this.position_.z);
        } else {
          this.position_.z = this.targetZ_;
          this.params_.camera.position.z = this.targetZ_;
          this.params_.camera.lookAt(8, 3, this.targetZ_);
          this.headlight_.position.z = this.targetZ_;
          this.headlight_.target.position.set(50, 2, this.targetZ_);
        }
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();
      }
    }

    // updates player texture so vehicle appears to be perceived from a new angle
    LoadSwerveTexture(textureName, x, y) {
      const loader = new THREE.TextureLoader();
      loader.setPath('./textures/');
      loader.load(textureName, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.premultiplyAlpha = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true});
        material.color.set(0x302f2f);
        this.mesh_.material = material; 
      });
    }
  };

  return {
      Player: Player,
  };
})();
