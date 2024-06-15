<template>
  <div class="game-container">
    <div v-if="state === 'menu'" class="menu">
      <h1>Space Invaders</h1>
      <p>Choose your ship and press Start Game to play.</p>
      <p>Use the arrow keys or W, A, S, D to move your ship and press Space to shoot.</p>
      <p>Try to reach a score of 10,000!</p>
      <p>High Score: {{ highScore }}</p>
      <div class="nave-selection">
        <button @click="prevNave">←</button>
        <img :src="selectedNave" alt="Nave do jogador" />
        <button @click="nextNave">→</button>
      </div>
      <button @click="startGame">Start Game</button>
    </div>
    <div ref="gameCanvas" v-show="state !== 'menu'" class="game-canvas"></div>
    <div v-if="state === 'gameover'" class="overlay">
      <h1>Game Over</h1>
      <p>Score: {{ score }}</p>
      <button @click="restartGame">Restart</button>
    </div>
    <div v-if="state === 'win'" class="overlay">
      <h1>You Win!</h1>
      <p>Score: {{ score }}</p>
      <button @click="restartGame">Play Again</button>
    </div>
  </div>
</template>

<script>
import * as PIXI from 'pixi.js';
import { nextTick } from 'vue';
import { createApp, createBackground, createPlayer, createEnemies, shootPlayerBullet, shootEnemyBullet, checkCollision, createLives, createScoreText } from '@/logic/GameLogic';

export default {
  data() {
    return {
      state: 'menu',
      naves: [
        '/images/ship1.png',
        '/images/ship2.png',
        '/images/ship3.png',
      ],
      currentNaveIndex: 0,
      app: null,
      player: null,
      enemies: [],
      bullets: [],
      enemyBullets: [],
      score: 0,
      highScore: localStorage.getItem('highScore') || 0,
      lives: 3,
      keys: {},
      scoreText: null,
    };
  },
  computed: {
    selectedNave() {
      return this.naves[this.currentNaveIndex];
    },
  },
  methods: {
    prevNave() {
      this.currentNaveIndex = (this.currentNaveIndex - 1 + this.naves.length) % this.naves.length;
    },
    nextNave() {
      this.currentNaveIndex = (this.currentNaveIndex + 1) % this.naves.length;
    },
    async startGame() {
      this.state = 'game';
      this.lives = 3;
      this.score = 0;
      await nextTick();
      this.initGame();
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      this.app.ticker.add(this.gameLoop);
    },
    restartGame() {
      this.state = 'menu';
      this.lives = 3;
      this.score = 0;
      if (this.app) {
        this.destroyApp();
      }
      this.resetGame();
    },
    initGame() {
      if (this.app) {
        this.destroyApp();
      }
      this.app = createApp();
      if (this.$refs.gameCanvas && this.app.view) {
        this.$refs.gameCanvas.innerHTML = ''; // Limpa o canvas anterior
        this.$refs.gameCanvas.appendChild(this.app.view);
      } else {
        console.error('gameCanvas or app.view is not available.');
      }

      const bg = createBackground();
      this.app.stage.addChild(bg);

      this.player = createPlayer(this.selectedNave);
      this.app.stage.addChild(this.player);

      this.enemies = createEnemies();
      this.enemies.forEach(({ sprite }) => this.app.stage.addChild(sprite));

      this.scoreText = createScoreText();
      this.app.stage.addChild(this.scoreText);

      this.updateLives();
    },
    destroyApp() {
      if (this.app) {
        this.app.stop();
        this.app.stage.removeChildren();
        this.app.renderer.plugins.interaction.destroy();
        this.app.renderer.destroy(true);
        this.app = null;
      }
    },
    resetGame() {
      this.enemies = [];
      this.bullets = [];
      this.enemyBullets = [];
      this.keys = {};
    },
    handleKeyDown(event) {
      this.keys[event.code] = true;
      if (event.code === 'Space') {
        const bullet = shootPlayerBullet(this.player);
        this.app.stage.addChild(bullet);
        this.bullets.push(bullet);
      }
    },
    handleKeyUp(event) {
      this.keys[event.code] = false;
    },
    gameLoop() {
      this.updatePlayerMovement();
      this.updateBullets();
      this.updateEnemyBullets();
      this.checkCollisions();
      this.respawnEnemies();
      this.updateScore();
      if (this.lives <= 0) {
        this.gameOver();
      }
      if (this.score >= 10000) {
        this.win();
      }
      if (Math.random() < 0.01) {
        const enemy = this.enemies[Math.floor(Math.random() * this.enemies.length)].sprite;
        if (enemy) {
          const bullet = shootEnemyBullet(enemy);
          if (bullet) {
            this.app.stage.addChild(bullet);
            this.enemyBullets.push(bullet);
          }
        }
      }
    },
    updatePlayerMovement() {
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
        this.player.x = Math.max(this.player.x - 5, this.player.width / 2);
      }
      if (this.keys['ArrowRight'] || this.keys['KeyD']) {
        this.player.x = Math.min(this.player.x + 5, this.app.view.width - this.player.width / 2);
      }
      if (this.keys['ArrowUp'] || this.keys['KeyW']) {
        this.player.y = Math.max(this.player.y - 5, this.player.height / 2);
      }
      if (this.keys['ArrowDown'] || this.keys['KeyS']) {
        this.player.y = Math.min(this.player.y + 5, this.app.view.height - this.player.height / 2);
      }
    },
    updateBullets() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        bullet.y -= 5;
        if (bullet.y < 0) {
          this.app.stage.removeChild(bullet);
          this.bullets.splice(i, 1);
        }
      }
    },
    updateEnemyBullets() {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        bullet.y += 5;
        if (bullet.y > this.app.view.height) {
          this.app.stage.removeChild(bullet);
          this.enemyBullets.splice(i, 1);
        } else if (checkCollision(bullet, this.player)) {
          this.app.stage.removeChild(bullet);
          this.enemyBullets.splice(i, 1);
          this.lives -= 1;
          this.updateLives();
        }
      }
    },
    checkCollisions() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (checkCollision(bullet, enemy.sprite)) {
            this.app.stage.removeChild(bullet);
            this.app.stage.removeChild(enemy.sprite);
            this.bullets.splice(i, 1);
            this.enemies.splice(j, 1);
            switch (enemy.type) {
              case 1:
                this.score += 10;
                break;
              case 2:
                this.score += 50;
                break;
              case 3:
                this.score += 100;
                break;
              case 4:
                this.score += 250;
                break;
              case 5:
                this.score += 400;
                break;
            }
            break;
          }
        }
      }
    },
    respawnEnemies() {
      while (this.enemies.length < 55) {
        const row = Math.floor(Math.random() * 5);
        const col = Math.floor(Math.random() * 11);
        const enemy = PIXI.Sprite.from(`/images/alien${row + 1}.png`);
        enemy.anchor.set(0.5);
        enemy.x = 50 + col * 60;
        enemy.y = 50 + row * 60;
        this.enemies.push({ sprite: enemy, type: row + 1 });
        this.app.stage.addChild(enemy);
      }
    },
    updateScore() {
      this.scoreText.text = `Score: ${this.score}`;
    },
    updateLives() {
      this.app.stage.children = this.app.stage.children.filter(child => !child.texture || child.texture.baseTexture.imageUrl !== '/images/heart.png');
      const hearts = createLives(this.lives);
      hearts.forEach(heart => this.app.stage.addChild(heart));
    },
    gameOver() {
      this.app.ticker.stop();
      this.state = 'gameover';
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('highScore', this.highScore);
      }
    },
    win() {
      this.app.ticker.stop();
      this.state = 'win';
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('highScore', this.highScore);
      }
    },
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.app) {
      this.destroyApp();
    }
  },
};
</script>

<style scoped>
.game-container {
  background-color: black;
  color: white;
  font-family: 'Press Start 2P', cursive;
}

.game-canvas {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  position: relative;
  border: 2px solid #00ff00;
  background-color: black;
}

.menu {
  text-align: center;
  margin-top: 50px;
  color: #00ff00;
}

.nave-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.nave-selection button {
  background-color: #333;
  color: #00ff00;
  border: none;
  padding: 10px;
  cursor: pointer;
  font-size: 18px;
  margin: 0 20px;
}

.nave-selection button:hover {
  background-color: #555;
}

img {
  width: 100px;
  height: auto;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  color: #00ff00;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', cursive;
}

.overlay h1 {
  font-size: 48px;
  margin-bottom: 20px;
}

.overlay button {
  background-color: #333;
  color: #00ff00;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 18px;
}

.overlay button:hover {
  background-color: #555;
}
</style>
