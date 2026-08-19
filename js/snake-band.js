/* ============================================================
   The band under the hero: a snake that plays itself.
   Replaces the old scrolling word marquee — same black strip,
   no text. Click or tap the band to move the pellet; nothing
   else here is interactive, and none of it is keyboard-reachable.
   ============================================================ */

(function(){
  const band = document.querySelector('.snake-band');
  const canvas = document.getElementById('snake-canvas');
  if (!band || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const ROWS = 4;              // short strip: four rows keeps the cells chunky and still leaves room to turn
  const START_LEN = 4;
  const GROW = 2;              // segments gained per pellet — enough that the growth reads
  const MAX_LEN = 22;          // capped so the snake can never box itself in
  const STEP_MS = 110;         // ~9 moves a second — reads as the old arcade pace
  const POP_STEPS = 3;         // how long the swell after eating lasts
  const COLORS = {
    body: '#F0EBE6',           // --bone
    food: '#F5693C',           // --orange
    grid: 'rgba(240,235,230,.09)'
  };

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let cell = 14, cols = 0, offX = 0, offY = 0;
  let snake = [], dir = {x:1, y:0}, food = null, pop = 0, pending = 0;
  let last = 0, wait = 0, frame = null, onScreen = true;

  function reset(){
    const w = band.clientWidth, h = band.clientHeight;
    if (!w || !h) return false;

    cell = Math.max(9, Math.floor(h / ROWS));
    cols = Math.max(8, Math.floor(w / cell));
    offX = Math.round((w - cols * cell) / 2);
    offY = Math.round((h - ROWS * cell) / 2);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const row = Math.floor(ROWS / 2);
    snake = [];
    for (let i = START_LEN - 1; i >= 0; i--) snake.push({ x: i, y: row });
    dir = { x:1, y:0 };
    pop = 0; pending = 0;
    placeFood();
    return true;
  }

  const occupied = (x, y) => snake.some(s => s.x === x && s.y === y);
  const inside = (x, y) => x >= 0 && y >= 0 && x < cols && y < ROWS;

  function placeFood(){
    const free = [];
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < ROWS; y++)
        if (!occupied(x, y)) free.push({x, y});
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  /* Breadth-first search from the head to the food. The strip is tiny
     (a few hundred cells), so a full search every step is cheaper than
     any cleverness — and it never walks into its own tail. */
  function nextStep(){
    if (!food) return null;
    const head = snake[0];
    const seen = new Set([head.x + ',' + head.y]);
    const queue = [{ x: head.x, y: head.y, first: null }];
    const moves = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

    while (queue.length) {
      const at = queue.shift();
      for (const m of moves) {
        const x = at.x + m.x, y = at.y + m.y, key = x + ',' + y;
        if (!inside(x, y) || seen.has(key)) continue;
        // the tail cell frees up as the snake advances, so it is walkable
        const isTail = snake.length && x === snake[snake.length - 1].x && y === snake[snake.length - 1].y;
        if (occupied(x, y) && !isTail) continue;
        const first = at.first || m;
        if (x === food.x && y === food.y) return first;
        seen.add(key);
        queue.push({ x, y, first });
      }
    }
    // no route: keep moving on any square that is still free
    for (const m of moves) {
      const x = head.x + m.x, y = head.y + m.y;
      if (inside(x, y) && !occupied(x, y)) return m;
    }
    return null;
  }

  function advance(){
    const move = nextStep();
    if (!move) { reset(); return; }   // boxed in — start the run over
    dir = move;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    snake.unshift(head);

    const ate = food && head.x === food.x && head.y === food.y;
    if (ate) {
      // holding the tail for a step is what makes the snake longer; one
      // step is banked here and the rest are owed, so a pellet is worth GROW
      pending += GROW - 1;
      pop = POP_STEPS;
      placeFood();
    } else if (pending > 0) {
      pending--;
    } else {
      snake.pop();
    }
    if (pop > 0 && !ate) pop--;
    while (snake.length > MAX_LEN) snake.pop();
  }

  function draw(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const px = (v, off) => off + v * cell;
    const base = Math.max(1, Math.round(cell * 0.12));
    const pad = pop > 0 ? Math.max(0, base - 2) : base;   // less padding = fatter squares

    ctx.fillStyle = COLORS.grid;
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(px(x, offX) + cell / 2 - 1, px(y, offY) + cell / 2 - 1, 2, 2);

    if (food) {
      ctx.fillStyle = COLORS.food;
      ctx.fillRect(px(food.x, offX) + base, px(food.y, offY) + base, cell - base * 2, cell - base * 2);
    }

    // head solid, tail fading out — gives the run a direction to read
    snake.forEach((s, i) => {
      ctx.globalAlpha = Math.max(0.35, 1 - (i / (snake.length + 3)));
      ctx.fillStyle = COLORS.body;
      ctx.fillRect(px(s.x, offX) + pad, px(s.y, offY) + pad, cell - pad * 2, cell - pad * 2);
    });
    ctx.globalAlpha = 1;
  }

  function loop(now){
    frame = requestAnimationFrame(loop);
    if (!last) last = now;
    wait += now - last;
    last = now;
    if (wait < STEP_MS) return;
    wait = 0;
    advance();
    draw();
  }

  function play(){
    if (frame || still.matches || !onScreen || document.hidden) return;
    last = 0; wait = 0;
    frame = requestAnimationFrame(loop);
  }
  function stop(){
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  function start(){
    stop();
    if (!reset()) return;
    draw();                       // reduced motion still gets one static frame
    play();
  }

  /* click or tap drops the pellet where you pointed — the snake simply
     re-routes to it on the next step */
  band.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - offX) / cell);
    const y = Math.floor((e.clientY - r.top - offY) / cell);
    if (inside(x, y) && !occupied(x, y)) food = { x, y };
    else placeFood();
    draw();
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 200);
  });

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
  still.addEventListener('change', start);

  // a band scrolled past is not worth animating
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      onScreen ? play() : stop();
    }, { threshold: 0 }).observe(band);
  }

  start();
})();
