// Abby Hirtle
// SSE 643 Advanced Graphic Interfaces
// April 19th, 2025
// Escape the Desert 3D Endless Runner
// The gameManager class is the main driver for
//     the Escape the Desert 3D Endless Runner game
//     using Three.js where a player must stay alive 
//     for as long as possible by dodging obstacles
//     on the road.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import {player} from './player.js';
import {obstacle} from './obstacle.js';
import {environment} from './environment.js';

class gameManager {
  constructor() {
    this.speed = 25;
    this.highscore = 0;
    this.Initialize_();
    this.maxAnisotrophy = null;
    this._gameStarted = false;
    window.addEventListener('keydown', (e) => this.OnKeyDown_(e));
  }

  // sets up the intial scene including renderer, camera, environment, and objects
  Initialize_() {
    // setup renderer
    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 2.2;
    this.threejs_.shadowMap.enabled = true;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
    this.threejs_.toneMapping = THREE.ACESFilmicToneMapping;
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.maxAnisotrophy = this.threejs_.capabilities.getMaxAnisotropy(); 
    document.getElementById('container').appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);

    // setup camera
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 20000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(-12, 5,0);
    this.camera_.lookAt(8, 3, 0);

    this.scene_ = new THREE.Scene();

    // add dim lighting for a night setting
    const moonlight = new THREE.DirectionalLight(0xaaaaee, 0.05);
    moonlight.position.set(-30, 100, -10);
    moonlight.castShadow = true;
    this.scene_.add(moonlight);
 
    // load night sky
    const skybox = new THREE.CubeTextureLoader().load([
        './textures/sky/xpos.png', './textures/sky/xneg.png', 
        './textures/sky/ypos.png', './textures/sky/yneg.png',
        './textures/sky/zpos.png', './textures/sky/zneg.png',
    ]);
    this.scene_.background = skybox;

    // load ground
    var groundTexture = new THREE.TextureLoader().load( './textures/sand.jpg' );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 10000 / 4, 10000 / 4 );
    groundTexture.encoding = THREE.sRGBEncoding;
    var groundMaterial = new THREE.MeshStandardMaterial( { map: groundTexture } );
    var ground = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    this.scene_.add(ground);

    // intialize player, obstacles, and environment
    this.obstacle_ = new obstacle.ObstacleManager({scene: this.scene_, gameManager: this});
    this.player_ = new player.Player({scene: this.scene_, obstacle: this.obstacle_, camera: this.camera_});
    this.background_ = new environment.Environment({scene: this.scene_, maxAnisotrophy: this.maxAnisotrophy});

    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.Animate_();
    this.OnWindowResize_();
  }

  // checks for enter press to begin/restart game
  OnKeyDown_(e) {
    if((e.code == 'Enter')){
      if(!this._gameStarted) {
        this.OnStart_();
      }
      else if (this._gameStarted && this.gameOver_) {
        this.OnRestart_();
      }
    }
  }

  // resets the game on restart
  OnRestart_() {
    playGameMusic();
    document.getElementById('game-over').classList.remove('active');
    this.gameOver_ = false;
    this.ResetScene_(); 
  }

  // starts the game on space
  OnStart_() {
    playGameMusic();
    document.getElementById('game-menu').style.display = 'none';
    this._gameStarted = true;
  }

  // resizes contents with the window
  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  // handles updating the window as the game runs
  Animate_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.Animate_();

      this.Step_((t - this.previousRAF_) / 1000.0);
      this.threejs_.render(this.scene_, this.camera_);
      this.previousRAF_ = t;
    });
  }

  // resets the scene back to its orginal state
  ResetScene_() {
    this.scene_.clear();
    const skybox = new THREE.CubeTextureLoader().load([
      './textures/sky/xpos.png', './textures/sky/xneg.png',
      './textures/sky/ypos.png', './textures/sky/yneg.png',
      './textures/sky/zpos.png', './textures/sky/zneg.png',
    ]);
    this.scene_.background = skybox;
  
    var groundTexture = new THREE.TextureLoader().load('./textures/sand.jpg');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10000 / 4, 10000 / 4);
    groundTexture.encoding = THREE.sRGBEncoding;
    var groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000), groundMaterial);
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    this.scene_.add(ground);

    this.camera_.position.set(-12, 5, 0);
    this.camera_.lookAt(8, 3, 0);
    const moonlight = new THREE.DirectionalLight(0xaaaaee, 0.05);
    moonlight.position.set(-30, 100, -10); 
    moonlight.castShadow = true;
    this.scene_.add(moonlight);
  
    this.maxAnisotrophy = this.threejs_.capabilities.getMaxAnisotropy();
    this.obstacle_ = new obstacle.ObstacleManager({scene: this.scene_, gameManager: this});
    this.player_ = new player.Player({scene: this.scene_, obstacle: this.obstacle_, camera: this.camera_});
    this.background_ = new environment.Environment({scene: this.scene_, maxAnisotrophy: this.maxAnisotrophy});
  
  }

  // updates player, environment, and obstacles while game runs
  Step_(timeElapsed) {
    if (this.gameOver_ || !this._gameStarted) {
      return;
    }

    this.player_.Update(timeElapsed);
    this.obstacle_.Update(timeElapsed);
    this.background_.Update(timeElapsed);

    if (this.player_.gameOver && !this.gameOver_) {
      this.gameOver_ = true;
      playGameOverMusic();
      document.getElementById('game-over').classList.toggle('active');
    }
  }
}

// pull audio location from HTML file
const startMusic = document.getElementById('start-music');
const gameMusic = document.getElementById('game-music');
const endMusic = document.getElementById('end-music');

// helper functions for playing audio files
function playStartMusic() {
  stopAllMusic();
  startMusic.play();
}

function playGameMusic() {
  stopAllMusic();
  gameMusic.play();
}

function playGameOverMusic() {
  stopAllMusic();
  endMusic.play();
}

function stopAllMusic() {
  [startMusic, gameMusic, endMusic].forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new gameManager();

  // play start music once user clicks on window
  const startButton = document.getElementById('game-menu');
  startButton.addEventListener('click', () => { playStartMusic(); }, { once: true }); 
});

// toggles music audio on and off
let musicMuted = false;

document.getElementById('toggle-music').addEventListener('click', () => {
  musicMuted = !musicMuted;

  const toggleBtn = document.getElementById('toggle-music');
  toggleBtn.textContent = musicMuted ? '🔇' : '🔊';

  [startMusic, gameMusic, endMusic].forEach(audio => {
    audio.muted = musicMuted;
  });
});