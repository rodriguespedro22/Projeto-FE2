const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const missesEl = document.getElementById('misses');
const modeEl = document.getElementById('mode');
const toastEl = document.getElementById('toast');

const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');

const state = {
  score: 0,
  misses: 0,
  running: false,
  paused: false,
  spawnTimeout: null,
  activeTargets: new Set(),
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

function updateScoreboard() {
  scoreEl.textContent = state.score;
  missesEl.textContent = state.misses;
}

function setMode(label) {
  modeEl.textContent = label;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 1200);
}

function clearBoard() {
  state.activeTargets.forEach((target) => {
    const timeoutId = Number(target.dataset.timeoutId);
    clearTimeout(timeoutId);
    target.remove();
  });
  state.activeTargets.clear();
}

function getBoardBounds() {
  const { width, height } = board.getBoundingClientRect();
  return { width, height };
}

function getLifetime() {
  const base = 1400;
  const boost = Math.max(0, state.score - state.misses);
  return Math.max(650, base - boost * 6);
}

function spawnTarget() {
  if (!state.running || state.paused) return;

  const target = document.createElement('button');
  target.className = 'target';
  target.type = 'button';
  target.setAttribute('aria-label', 'Clique rápido!');

  const { width, height } = getBoardBounds();
  const size = randomBetween(52, 70);
  const x = randomBetween(0, Math.max(12, width - size));
  const y = randomBetween(0, Math.max(12, height - size));

  target.style.width = `${size}px`;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;

  const lifetime = getLifetime();
  const timeoutId = setTimeout(() => handleMiss(target), lifetime);
  target.dataset.timeoutId = timeoutId;

  const ring = document.createElement('span');
  ring.className = 'sr-only';
  ring.textContent = 'Alvo';
  target.appendChild(ring);

  target.addEventListener('click', () => handleHit(target));

  state.activeTargets.add(target);
  board.appendChild(target);
}

function scheduleNextSpawn() {
  if (!state.running || state.paused) return;
  const delay = randomBetween(450, 900);
  state.spawnTimeout = setTimeout(() => {
    spawnTarget();
    scheduleNextSpawn();
  }, delay);
}

function handleHit(target) {
  if (!state.running || state.paused) return;
  const timeoutId = Number(target.dataset.timeoutId);
  clearTimeout(timeoutId);
  state.score += 1;
  updateScoreboard();
  target.classList.add('hit');
  target.disabled = true;
  showToast('Boa! +1 ponto');

  setTimeout(() => {
    target.remove();
    state.activeTargets.delete(target);
  }, 200);
}

function handleMiss(target) {
  if (!state.running || state.paused) return;
  state.misses += 1;
  updateScoreboard();
  target.classList.add('missed');
  target.disabled = true;
  setTimeout(() => {
    target.remove();
    state.activeTargets.delete(target);
  }, 220);
}

function startGame() {
  state.score = 0;
  state.misses = 0;
  updateScoreboard();
  setMode('Rodando');
  state.running = true;
  state.paused = false;
  clearBoard();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  pauseBtn.textContent = 'Pausar';
  scheduleNextSpawn();
  showToast('Jogo iniciado!');
}

function pauseGame() {
  state.paused = true;
  clearTimeout(state.spawnTimeout);
  clearBoard();
  setMode('Pausado');
  pauseBtn.textContent = 'Continuar';
  showToast('Pausa ativada');
}

function resumeGame() {
  state.paused = false;
  setMode('Rodando');
  pauseBtn.textContent = 'Pausar';
  scheduleNextSpawn();
  showToast('Voltamos!');
}

function resetGame() {
  clearTimeout(state.spawnTimeout);
  state.running = false;
  state.paused = false;
  state.score = 0;
  state.misses = 0;
  clearBoard();
  updateScoreboard();
  setMode('Parado');
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  pauseBtn.textContent = 'Pausar';
  showToast('Jogo resetado');
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
  if (!state.running) return;
  if (state.paused) {
    resumeGame();
  } else {
    pauseGame();
  }
});
resetBtn.addEventListener('click', resetGame);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'r') {
    resetGame();
  }
  if (key === ' ') {
    event.preventDefault();
    if (!state.running) {
      startGame();
    } else if (state.paused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
});

// Inicialização visual
setMode('Parado');
updateScoreboard();

