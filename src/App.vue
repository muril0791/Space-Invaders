<template>
  <div class="game-container">
    <div v-if="state === 'menu'" class="menu">
      <h1>Space Invaders</h1>
      <p>Choose your ship and press Start Game to play.</p>
      <p>Use the arrow keys or W, A, S, D to move your ship and press Space to shoot.</p>
      <p>Try to reach a score of 50,000!</p>
      <p>High Score: {{ highScore }}</p>
      <div class="nave-selection">
        <button @click="prevNave">←</button>
        <img :src="selectedNave" alt="Nave do jogador" />
        <button @click="nextNave">→</button>
      </div>
      <button class="startButton" @click="startGame">Start Game</button>
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

<script src="./App.js"></script>
<style src="./App.css"></style>
