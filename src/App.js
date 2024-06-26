import * as PIXI from "pixi.js";
import { nextTick } from "vue";
import {
  createApp,
  createBackground,
  createPlayer,
  createEnemies,
  shootPlayerBullet,
  shootEnemyBullet,
  checkCollision,
} from "@/logic/GameLogic";

export default {
  data() {
    return {
      state: "menu",
      naves: ["/images/ship1.png", "/images/ship2.png", "/images/ship3.png"],
      currentNaveIndex: 0,
      app: null,
      player: null,
      enemies: [],
      bullets: [],
      enemyBullets: [],
      score: 0,
      highScore: localStorage.getItem("highScore") || 0,
      lives: 3,
      keys: {},
      scoreText: null,
      livesText: null,
    };
  },
  computed: {
    selectedNave() {
      return this.naves[this.currentNaveIndex];
    },
  },
  methods: {
    prevNave() {
      this.currentNaveIndex =
        (this.currentNaveIndex - 1 + this.naves.length) % this.naves.length;
    },
    nextNave() {
      this.currentNaveIndex = (this.currentNaveIndex + 1) % this.naves.length;
    },
    async startGame() {
      this.state = "game";
      this.lives = 3;
      this.score = 0;
      await nextTick();
      this.initGame();
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
      this.app.ticker.add(this.gameLoop);
    },
    restartGame() {
      this.state = "menu";
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
        this.$refs.gameCanvas.innerHTML = "";
        this.$refs.gameCanvas.appendChild(this.app.view);
      } else {
        console.error("gameCanvas or app.view is not available.");
      }

      const bg = createBackground();
      this.app.stage.addChild(bg);

      this.player = createPlayer(this.selectedNave);
      this.app.stage.addChild(this.player);

      this.enemies = createEnemies();
      this.enemies.forEach(({ sprite }) => this.app.stage.addChild(sprite));

      this.scoreText = new PIXI.Text(`Score: ${this.score}`, {
        fontFamily: "Press Start 2P",
        fontSize: 24,
        fill: "#ffffff",
        align: "left",
      });
      this.scoreText.position.set(20, 20);
      this.app.stage.addChild(this.scoreText);

      this.livesText = new PIXI.Text(`Lives: ${this.lives}`, {
        fontFamily: "Press Start 2P",
        fontSize: 24,
        fill: "#ffffff",
        align: "left",
      });
      this.livesText.position.set(20, 50);
      this.app.stage.addChild(this.livesText);
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
      if (event.code === "Space") {
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
      if (this.lives <= 0) {
        this.gameOver();
      }
      if (this.score >= 50000) {
        this.win();
      }
      if (Math.random() < 0.01) {
        const enemy =
          this.enemies[Math.floor(Math.random() * this.enemies.length)].sprite;
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
      if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
        this.player.x = Math.max(this.player.x - 5, this.player.width / 2);
      }
      if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
        this.player.x = Math.min(
          this.player.x + 5,
          this.app.view.width - this.player.width / 2
        );
      }
      if (this.keys["ArrowUp"] || this.keys["KeyW"]) {
        this.player.y = Math.max(this.player.y - 5, this.player.height / 2);
      }
      if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
        this.player.y = Math.min(
          this.player.y + 5,
          this.app.view.height - this.player.height / 2
        );
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
            this.updateScore();
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
        enemy.x = 135 + col * 60;
        enemy.y = 135 + row * 60;
        this.enemies.push({ sprite: enemy, type: row + 1 });
        this.app.stage.addChild(enemy);
      }
    },
    updateScore() {
      this.scoreText.text = `Score: ${this.score}`;
    },
    updateLives() {
      this.livesText.text = `Lives: ${this.lives}`;
    },
    gameOver() {
      this.app.ticker.stop();
      this.state = "gameover";
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem("highScore", this.highScore);
      }
    },
    win() {
      this.app.ticker.stop();
      this.state = "win";
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem("highScore", this.highScore);
      }
    },
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.app) {
      this.destroyApp();
    }
  },
};
