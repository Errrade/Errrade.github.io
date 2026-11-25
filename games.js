// Dot Rush: tap the dot before it moves. Score as many hits as possible in 30 seconds.
(() => {
  const DURATION = 30000;
  const BEST_KEY = "dotRushBest";

  const board = document.getElementById("dr-board");
  if (!board) return;
  const target = document.getElementById("dr-target");
  const overlay = document.getElementById("dr-overlay");
  const message = document.getElementById("dr-message");
  const startBtn = document.getElementById("dr-start");
  const scoreEl = document.getElementById("dr-score");
  const timeEl = document.getElementById("dr-time");
  const bestEl = document.getElementById("dr-best");

  let score = 0;
  let misses = 0;
  let startedAt = 0;
  let movedAt = 0;
  let running = false;
  let frame = 0;

  const readBest = () => {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
  };
  const writeBest = (value) => {
    try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage unavailable */ }
  };
  bestEl.textContent = readBest();

  // 0 at the start, 1 at the end of the round.
  const progress = (now) => Math.min((now - startedAt) / DURATION, 1);

  function placeTarget(now) {
    const size = Math.round(64 - 28 * progress(now)); // 64px -> 36px
    const rect = board.getBoundingClientRect();
    const pad = size / 2 + 6;
    const x = pad + Math.random() * Math.max(rect.width - pad * 2, 0);
    const y = pad + Math.random() * Math.max(rect.height - pad * 2, 0);
    target.style.width = target.style.height = `${size}px`;
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    // Restart the pop-in animation.
    target.style.animation = "none";
    void target.offsetWidth;
    target.style.animation = "";
    movedAt = now;
  }

  function tick(now) {
    if (!running) return;
    const left = Math.max(DURATION - (now - startedAt), 0);
    timeEl.textContent = (left / 1000).toFixed(1);
    if (left === 0) return finish();

    // The dot jumps away on its own: every 1.3s at the start, 0.65s at the end.
    const stay = 1300 - 650 * progress(now);
    if (now - movedAt > stay) placeTarget(now);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    score = 0;
    misses = 0;
    scoreEl.textContent = "0";
    overlay.hidden = true;
    board.scrollIntoView({ block: "center", behavior: "smooth" });
    target.hidden = false;
    running = true;
    startedAt = performance.now();
    placeTarget(startedAt);
    target.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  }

  function finish() {
    running = false;
    cancelAnimationFrame(frame);
    target.hidden = true;
    timeEl.textContent = "0.0";

    const taps = score + misses;
    const accuracy = taps ? Math.round((score / taps) * 100) : 0;
    const best = readBest();
    let text = `Score ${score} · Accuracy ${accuracy}%`;
    if (score > best) {
      writeBest(score);
      bestEl.textContent = score;
      text += " · New best!";
    }
    message.textContent = text;
    startBtn.textContent = "Play again";
    overlay.hidden = false;
    startBtn.focus({ preventScroll: true });
  }

  function hit() {
    if (!running) return;
    score += 1;
    scoreEl.textContent = score;
    placeTarget(performance.now());
  }

  // pointerdown reacts on touch without waiting for the click delay.
  target.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    hit();
  });
  // Keyboard: Enter/Space fires a click with detail 0.
  target.addEventListener("click", (event) => {
    if (event.detail === 0) hit();
  });

  board.addEventListener("pointerdown", (event) => {
    if (!running || event.target === target) return;
    misses += 1;
    board.classList.remove("shake");
    void board.offsetWidth;
    board.classList.add("shake");
  });

  startBtn.addEventListener("click", start);
})();
