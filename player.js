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
        // split image of jeep into 4x3 grid for each angle
        texture.repeat.set(1 / 4, 1 / 3); 
        texture.offset.x = 2 / 4;
        texture.offset.y = 1 - 4 / 3;
    
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true});
        material.color.set(0x302f2f);
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(6, 4, 2);
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

    // updates player position based on user input
    Update(timeElapsed) {
      // simulate car "jumping" on key up
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
        if (this.position_.y == 2.0 && this.jumpInProgress_) {
          this.jumpInProgress_ = false;
        }
      }

      // set sweve state based on user input
      if (this.keys_.left && this.swerveState_ === 'idle' && !this.swerveInProgress_ && this.position_.z == 0 && !this.jumpInProgress_) {
        this.swerveState_ = 'swerveLeft';
        this.swerveTimer_ = 0;
        this.swerveInProgress_ = true;
        this.swerveStepDone_ = false; 
      }
      if (this.keys_.right && this.swerveState_ === 'idle' && !this.swerveInProgress_ && this.position_.z == -10 && !this.jumpInProgress_) {
        this.swerveState_ = 'swerveRight';
        this.swerveTimer_ = 0;
        this.swerveInProgress_ = true;
        this.swerveStepDone_ = false; 
      }
    
      if (this.swerveState_ !== 'idle') {
        this.swerveTimer_ += timeElapsed;
    
        switch (this.swerveState_) {
          case 'swerveLeft':
            // update player, headlight, and camera position to veer left 
            // movement 1: swerve left
            if (!this.swerveStepDone_) {
              this.position_.z -= 10;
              this.LoadSwerveTexture('jeep.png', 1 / 4, 2 - 4 / 3);
              this.params_.camera.position.set(-12,5,-10);
              this.params_.camera.lookAt(8,3,-10)
              this.headlight_.position.set(0, 2, -8);
              this.headlight_.target.position.set(50, 2, -40);
              this.swerveStepDone_ = true;
            }
            // movement 2: return to face stright forward
            if (this.swerveTimer_ >= 0.4) {
              this.swerveState_ = 'idle';
              this.LoadSwerveTexture('jeep.png', 2 / 4, 1 - 4 / 3);
              this.headlight_.position.set(0, 2, -10);
              this.headlight_.target.position.set(50, 2, -10);
              this.swerveTimer_ = 0;
              this.swerveInProgress_ = false;
              this.swerveStepDone_ = false;
            }
            break;
     
          case 'swerveRight':
            // update player, headlight, and camera position to veer right 
            // movement 1: swerve right
            if (!this.swerveStepDone_) {
              this.position_.z += 10;
              console.log("RIGHT SWERVE");
              this.LoadSwerveTexture('jeep.png', 3 / 4, 2 - 4 / 3);
              this.params_.camera.position.set(-12,5,0);
              this.params_.camera.lookAt(8,3,0)
              this.headlight_.position.set(-3, 2, -5);
              this.headlight_.target.position.set(50, 2, 30);
              this.swerveStepDone_ = true;
            }
            // movement 2: return to face stright forward
            if (this.swerveTimer_ >= 0.4) {
              this.swerveState_ = 'idle';
              this.LoadSwerveTexture('jeep.png', 2 / 4, 1 - 4 / 3);
              this.headlight_.position.set(0, 2, 0);
              this.headlight_.target.position.set(50, 2, 0);
              this.swerveTimer_ = 0;
              this.swerveInProgress_ = false;
              this.swerveStepDone_ = false;
            }
            break;
        }
      }
    
      this.position_.y = Math.max(this.position_.y, 2.0);
      if (this.mesh_) {
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
        texture.repeat.set(1 / 4, 1 / 3);
        texture.offset.x = x;
        texture.offset.y = y;

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
