const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const playButton = document.querySelector('#play-button');
const scoreLabel = document.querySelector('#score');
const livesLabel = document.querySelector('#lives');
const statusLabel = document.querySelector('#status');
const overlayKicker = document.querySelector('#overlay-kicker');
const overlayTitle = document.querySelector('#overlay-title');
const overlayCopy = document.querySelector('#overlay-copy');
const buttonLabel = document.querySelector('#button-label');
const levelLabel = document.querySelector('.level-stamp strong');
const levelStamp = document.querySelector('.level-stamp');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const MAX_LEVEL = 5;
const paddle = { x: WIDTH / 2 - 54, y: HEIGHT - 38, width: 108, height: 40, speed: 500 };
const ball = { x: WIDTH / 2, y: paddle.y - 20, radius: 13, dx: 205, dy: -325, speed: 385 };
const brickSettings = { width: 70, height: 19, gap: 10, top: 55 };
const keys = new Set();
let bricks = [];
let score = 0;
let lives = 3;
let level = 1;
let state = 'ready';
let previousFrame = 0;

function makeBricks() {
  bricks = [];
  const columns = level + 5;
  const rows = level + 1;
  const totalWidth = columns * brickSettings.width + (columns - 1) * brickSettings.gap;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      bricks.push({
        x: left + column * (brickSettings.width + brickSettings.gap),
        y: brickSettings.top + row * (brickSettings.height + brickSettings.gap),
        width: brickSettings.width,
        height: brickSettings.height,
        row,
      });
    }
  }
}

function drawBackground() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#fffaf1';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = 'rgba(125, 102, 83, 0.08)';
  for (let x = 20; x < WIDTH; x += 24) {
    for (let y = 16; y < HEIGHT; y += 24) {
      context.fillRect(x, y, 1.5, 1.5);
    }
  }
}

function drawBricks() {
  const shades = ['#fa7cab', '#f45b91', '#ee4c85', '#f76c9b', '#e94c81'];
  for (const brick of bricks) {
    context.fillStyle = shades[brick.row % shades.length];
    context.fillRect(brick.x, brick.y, brick.width, brick.height);
    context.fillStyle = 'rgba(255, 255, 255, 0.32)';
    context.fillRect(brick.x + 3, brick.y + 3, brick.width - 6, 2);
    context.fillStyle = 'rgba(131, 30, 65, 0.14)';
    context.fillRect(brick.x, brick.y + brick.height - 2, brick.width, 2);
  }
}

function drawPaddle() {
  context.fillStyle = '#29211f';
  context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  context.fillStyle = '#ffda52';
  context.fillRect(paddle.x + 5, paddle.y + 5, paddle.width - 10, 3);
}

function drawSmiley() {
  context.save();
  context.translate(ball.x, ball.y);
  context.fillStyle = '#ffda52';
  context.beginPath();
  context.arc(0, 0, ball.radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#29211f';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(0, 0, ball.radius - 0.5, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#29211f';
  context.beginPath();
  context.arc(-4, -3, 1.2, 0, Math.PI * 2);
  context.arc(4, -3, 1.2, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(0, 1, 5.5, 0.2, Math.PI - 0.2);
  context.stroke();
  context.restore();
}

function render() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawSmiley();
}

function updateHud() {
  scoreLabel.textContent = String(score).padStart(4, '0');
  livesLabel.textContent = `${'● '.repeat(lives).trim()}${'○ '.repeat(3 - lives)}`.trim();
  livesLabel.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'}`);
  levelLabel.textContent = String(level).padStart(2, '0');
  levelStamp.setAttribute('aria-label', `Level ${level}`);
}

function setState(nextState) {
  state = nextState;
  overlay.classList.toggle('is-hidden', state === 'playing');
  if (state === 'ready') {
    statusLabel.textContent = 'READY WHEN YOU ARE';
    overlayKicker.textContent = 'A LITTLE JOY, A LOT OF BRICKS';
    overlayTitle.innerHTML = 'Ready to<br>break things?';
    overlayCopy.textContent = 'Keep that smile in the air. Clear each board to reach the next level.';
    buttonLabel.textContent = 'Start game';
  } else if (state === 'level-complete') {
    statusLabel.textContent = `LEVEL ${level} CLEAR`;
    overlayKicker.textContent = 'ON TO THE NEXT ONE';
    overlayTitle.innerHTML = `Level ${level}<br>cleared!`;
    overlayCopy.textContent = `Level ${level + 1} has ${level + 2} rows and ${level + 6} bricks across.`;
    buttonLabel.textContent = 'Next level';
  } else if (state === 'won') {
    statusLabel.textContent = 'ALL CLEAR!';
    overlayKicker.textContent = 'THE BRICKS NEVER STOOD A CHANCE';
    overlayTitle.innerHTML = 'Look at you,<br>smashing it!';
    overlayCopy.textContent = `You cleared all ${MAX_LEVEL} levels with ${score} points. Fancy another round?`;
    buttonLabel.textContent = 'Replay';
  } else if (state === 'lost') {
    statusLabel.textContent = 'ROUND OVER';
    overlayKicker.textContent = 'THAT SMILE HAD A GOOD RUN';
    overlayTitle.innerHTML = 'One more<br>round?';
    overlayCopy.textContent = `You reached level ${level} and scored ${score} points. The bricks will be right here.`;
    buttonLabel.textContent = 'Replay';
  } else {
    statusLabel.textContent = 'SMILE IN PLAY';
  }
}

function resetGame() {
  score = 0;
  lives = 3;
  level = 1;
  resetBall();
  makeBricks();
  updateHud();
  setState('playing');
}

function resetBall() {
  paddle.x = WIDTH / 2 - paddle.width / 2;
  ball.speed = 385 + (level - 1) * 15;
  ball.dx = 205;
  ball.dy = -Math.sqrt(ball.speed ** 2 - ball.dx ** 2);
  ball.x = WIDTH / 2;
  ball.y = paddle.y - ball.radius - 2;
}

function startNextLevel() {
  level += 1;
  resetBall();
  makeBricks();
  updateHud();
  setState('playing');
}

function movePaddleTo(x) {
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, x - paddle.width / 2));
}

function update(delta) {
  if (keys.has('ArrowLeft') || keys.has('a')) paddle.x -= paddle.speed * delta;
  if (keys.has('ArrowRight') || keys.has('d')) paddle.x += paddle.speed * delta;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));

  const previousY = ball.y;
  ball.x += ball.dx * delta;
  ball.y += ball.dy * delta;

  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
  } else if (ball.x + ball.radius > WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.dx = -Math.abs(ball.dx);
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.dy = Math.abs(ball.dy);
  }

  if (ball.dy > 0 && previousY + ball.radius <= paddle.y && ball.y + ball.radius >= paddle.y && ball.x >= paddle.x - ball.radius && ball.x <= paddle.x + paddle.width + ball.radius) {
    const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = hitPosition * 1.08;
    ball.speed = Math.min(ball.speed + 3, 520);
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
    ball.y = paddle.y - ball.radius;
  }

  const hitIndex = bricks.findIndex((brick) => {
    const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    return (ball.x - nearestX) ** 2 + (ball.y - nearestY) ** 2 < ball.radius ** 2;
  });

  if (hitIndex !== -1) {
    const [brick] = bricks.splice(hitIndex, 1);
    const hitFromSide = ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brick.width;
    if (hitFromSide && (previousY < brick.y || previousY > brick.y + brick.height)) ball.dy *= -1;
    else ball.dx *= -1;
    score += 10;
    updateHud();
    if (bricks.length === 0) setState(level === MAX_LEVEL ? 'won' : 'level-complete');
  }

  if (ball.y - ball.radius > HEIGHT) {
    lives -= 1;
    updateHud();
    if (lives === 0) {
      setState('lost');
    } else {
      resetBall();
    }
  }
}

function frame(timestamp) {
  const delta = Math.min((timestamp - previousFrame) / 1000 || 0, 0.025);
  previousFrame = timestamp;
  if (state === 'playing') update(delta);
  render();
  requestAnimationFrame(frame);
}

playButton.addEventListener('click', () => {
  if (state === 'level-complete') startNextLevel();
  else resetGame();
});

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(key)) event.preventDefault();
  keys.add(key);
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

canvas.addEventListener('pointermove', (event) => {
  if (state !== 'playing') return;
  const bounds = canvas.getBoundingClientRect();
  movePaddleTo((event.clientX - bounds.left) * (WIDTH / bounds.width));
});

canvas.addEventListener('pointerdown', (event) => {
  if (state !== 'playing') return;
  canvas.setPointerCapture(event.pointerId);
  const bounds = canvas.getBoundingClientRect();
  movePaddleTo((event.clientX - bounds.left) * (WIDTH / bounds.width));
});

makeBricks();
updateHud();
setState('ready');
requestAnimationFrame(frame);