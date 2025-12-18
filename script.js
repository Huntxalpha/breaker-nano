// Breaker Nano — logique du jeu

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddle
let paddleWidth = 80;
const paddleHeight = 15;
let paddleX = (WIDTH - paddleWidth) / 2;
const paddleY = HEIGHT - paddleHeight - 10;
const paddleSpeed = 5;
let leftPressed = false;
let rightPressed = false;

// Ball
const ballRadius = 8;
let ballX;
let ballY;
let ballDX;
let ballDY;

// Bricks
const brickRowStart = 3;
let rowCount = brickRowStart;
const columnCount = 6;
const brickWidth = 60;
const brickHeight = 20;
const brickPadding = 8;
const brickOffsetTop = 50;
const brickOffsetLeft = (WIDTH - (columnCount * (brickWidth + brickPadding) - brickPadding)) / 2;
let bricks = [];

// Game state
let score = 0;
let level = 1;
let gameState = 'start';

// DOM éléments
const startOverlay = document.getElementById('start-overlay');
const endOverlay = document.getElementById('end-overlay');
const scoreSpan = document.getElementById('score');
const levelSpan = document.getElementById('level');
const finalScoreSpan = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const shareButton = document.getElementById('share-button');

// Initialise les briques
function initBricks() {
  bricks = [];
  for (let r = 0; r < rowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < columnCount; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1 };
    }
  }
}

// Position initiale de la balle et vitesse aléatoire selon le niveau
function resetBall() {
  ballX = WIDTH / 2;
  ballY = HEIGHT - 50;
  const speed = 3 + level * 0.5;
  const angle = Math.random() * (Math.PI / 2) + Math.PI / 4; // 45 à 135 degrés
  ballDX = speed * Math.cos(angle);
  ballDY = -speed * Math.sin(angle);
}

// Commencer le jeu
function startGame() {
  score = 0;
  level = 1;
  rowCount = brickRowStart;
  paddleWidth = 80;
  initBricks();
  resetBall();
  scoreSpan.textContent = '0';
  levelSpan.textContent = '1';
  gameState = 'playing';
  hideOverlay(startOverlay);
  hideOverlay(endOverlay);
  requestAnimationFrame(gameLoop);
}

// Passer au niveau suivant : augmenter la difficulté
function nextLevel() {
  level++;
  levelSpan.textContent = level.toString();
  rowCount++;
  // Rétrécir le paddle progressivement, avec une limite minimum
  if (paddleWidth > 40) {
    paddleWidth -= 8;
  }
  initBricks();
  resetBall();
}

// Afficher l'écran de fin de partie
function endGame() {
  gameState = 'gameover';
  finalScoreSpan.textContent = score.toString();
  showOverlay(endOverlay);
}

// Dessiner les briques visibles
function drawBricks() {
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < columnCount; c++) {
      if (bricks[r][c].status) {
        const brickX = brickOffsetLeft + c * (brickWidth + brickPadding);
        const brickY = brickOffsetTop + r * (brickHeight + brickPadding);
        bricks[r][c].x = brickX;
        bricks[r][c].y = brickY;
        ctx.fillStyle = '#e17055';
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}

// Dessiner le paddle
function drawPaddle() {
  ctx.fillStyle = '#00b894';
  ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
}

// Dessiner la balle
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#6c5ce7';
  ctx.fill();
  ctx.closePath();
}

// Dessiner l'ensemble
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBricks();
  drawPaddle();
  drawBall();
}

// Mettre à jour la position et détecter les collisions
function update() {
  // Mouvement du paddle via les touches
  if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }
  if (rightPressed && paddleX + paddleWidth < WIDTH) {
    paddleX += paddleSpeed;
  }
  // Déplacement de la balle
  ballX += ballDX;
  ballY += ballDY;
  // Collision avec les murs latéraux
  if (ballX + ballRadius > WIDTH || ballX - ballRadius < 0) {
    ballDX = -ballDX;
  }
  // Collision avec le plafond
  if (ballY - ballRadius < 0) {
    ballDY = -ballDY;
  }
  // Collision avec le paddle
  if (
    ballY + ballRadius > paddleY &&
    ballX > paddleX &&
    ballX < paddleX + paddleWidth
  ) {
    ballDY = -ballDY;
    // Modifier légèrement la direction selon l'endroit où la balle frappe le paddle
    const hitPos = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
    ballDX = ballDX + hitPos * 1;
  }
  // Collision bas de l'écran : fin
  if (ballY - ballRadius > HEIGHT) {
    endGame();
  }
  // Collision avec les briques
  let bricksRemaining = 0;
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < columnCount; c++) {
      const b = bricks[r][c];
      if (b.status) {
        bricksRemaining++;
        if (
          ballX > b.x && ballX < b.x + brickWidth &&
          ballY - ballRadius < b.y + brickHeight &&
          ballY + ballRadius > b.y
        ) {
          ballDY = -ballDY;
          b.status = 0;
          score++;
          scoreSpan.textContent = score.toString();
        }
      }
    }
  }
  // Si toutes les briques sont détruites, passer au niveau suivant
  if (bricksRemaining === 0) {
    nextLevel();
  }
}

function gameLoop() {
  if (gameState !== 'playing') return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Fonctions d'overlay
function showOverlay(el) {
  el.style.display = 'flex';
}
function hideOverlay(el) {
  el.style.display = 'none';
}

// Gestion des touches
document.addEventListener('keydown', function(e) {
  if (e.code === 'ArrowLeft') {
    leftPressed = true;
  } else if (e.code === 'ArrowRight') {
    rightPressed = true;
  }
});
document.addEventListener('keyup', function(e) {
  if (e.code === 'ArrowLeft') {
    leftPressed = false;
  } else if (e.code === 'ArrowRight') {
    rightPressed = false;
  }
});

// Contrôles souris pour bureau
canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddleX = mouseX - paddleWidth / 2;
  if (paddleX < 0) paddleX = 0;
  if (paddleX + paddleWidth > WIDTH) paddleX = WIDTH - paddleWidth;
});

// Contrôles tactiles pour mobile
canvas.addEventListener('touchmove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddleX = touchX - paddleWidth / 2;
  if (paddleX < 0) paddleX = 0;
  if (paddleX + paddleWidth > WIDTH) paddleX = WIDTH - paddleWidth;
});

// Partage du score
function shareScore() {
  const url = window.location.href;
  const tweet = `J'ai obtenu un score de ${score} à Breaker Nano ! Essayez-vous à votre tour ici : ${url}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  window.open(shareUrl, '_blank');
}

// Boutons
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
shareButton.addEventListener('click', shareScore);

// Afficher l'écran de démarrage initial
showOverlay(startOverlay);
