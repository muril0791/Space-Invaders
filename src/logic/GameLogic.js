import * as PIXI from "pixi.js";

// Cria a aplicação PIXI
export function createApp() {
  return new PIXI.Application({ width: 800, height: 600 });
}

// Cria o background
export function createBackground() {
  const bgTexture = PIXI.Texture.from("/images/background.png");
  const bg = new PIXI.Sprite(bgTexture);
  bg.width = 800;
  bg.height = 600;
  return bg;
}

// Cria a nave do jogador
export function createPlayer(selectedNave) {
  const playerTexture = PIXI.Texture.from(selectedNave);
  const player = new PIXI.Sprite(playerTexture);
  player.anchor.set(0.5);
  player.x = 400;
  player.y = 550;
  return player;
}

// Cria os inimigos
export function createEnemies() {
  const alienTypes = [
    "/images/alien1.png",
    "/images/alien2.png",
    "/images/alien3.png",
    "/images/alien4.png",
    "/images/alien5.png",
  ];
  const enemies = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 11; col++) {
      const enemy = PIXI.Sprite.from(alienTypes[row]);
      enemy.anchor.set(0.5);
      enemy.x = 50 + col * 60;
      enemy.y = 50 + row * 60;
      enemies.push({ sprite: enemy, type: row + 1 });
    }
  }
  return enemies;
}

// Dispara um tiro da nave do jogador
export function shootPlayerBullet(player) {
  const bullet = PIXI.Sprite.from("/images/bullet.png");
  bullet.anchor.set(0.5);
  bullet.x = player.x;
  bullet.y = player.y - 20;
  return bullet;
}

// Dispara um tiro de um inimigo
export function shootEnemyBullet(enemy) {
  if (!enemy) return null; // Verifica se o inimigo existe
  const bullet = PIXI.Sprite.from("/images/enemy-bullet.png");
  bullet.anchor.set(0.5);
  bullet.x = enemy.x;
  bullet.y = enemy.y + 20;
  return bullet;
}

// Verifica colisão entre dois sprites
export function checkCollision(sprite1, sprite2) {
  const bounds1 = sprite1.getBounds();
  const bounds2 = sprite2.getBounds();
  return (
    bounds1.x < bounds2.x + bounds2.width &&
    bounds1.x + bounds1.width > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height &&
    bounds1.y + bounds1.height > bounds2.y
  );
}

// Cria os ícones de vida
export function createLives(lives) {
  const hearts = [];
  for (let i = 0; i < lives; i++) {
    const heart = PIXI.Sprite.from("/images/heart.png");
    heart.x = 20 + i * 40;
    heart.y = 20;
    hearts.push(heart);
  }
  return hearts;
}

// Cria o texto da pontuação
export function createScoreText() {
  const style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 24,
    fill: "#ffffff",
  });
  const scoreText = new PIXI.Text("Score: 0", style);
  scoreText.x = 600;
  scoreText.y = 20;
  return scoreText;
}
