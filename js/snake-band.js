/* ============================================================
   The band under the hero: a snake that plays itself.
   Replaces the old scrolling word marquee — same black strip,
   no text. It is decorative only, so the band is aria-hidden
   and nothing here is reachable by keyboard.
   ============================================================ */

(function(){
  const band = document.querySelector('.snake-band');
  const canvas = document.getElementById('snake-canvas');
  if (!band || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const ROWS = 4;              // short strip: four rows keeps the cells chunky and still leaves room to turn
  const MAX_LEN = 14;          // capped so the snake can never box itself in
  const STEP_MS = 110;         // ~9 moves a second — reads as the old arcade pace
  const COLORS = {
    body: '#F0EBE6',           // --bone
    food: '#F5693C',           // --orange
    grid: 'rgba(240,235,230,.09)'
  };

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let cell = 14, cols = 0, snake = [], dir = {x:1, y:0}, food = null;
  let last = 0, wait = 0, frame = null, onScreen = true;

  function reset(){
    const w = band.clientWidth, h = band.clientHeight;
    if (!w || !h) return false;

    cell = Math.max(9, Math.floor(h / ROWS));
    cols = Math.max(8, Math.floor(w / cell));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const row = Math.floor(ROWS / 2);
    snake = [4,3,2,1,0].map(x => ({ x, y: row }));
    dir = { x:1, y:0 };
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

    if (food && head.x === food.x && head.y === food.y) {
      if (snake.length > MAX_LEN) snake.pop();
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const offX = Math.round((w - cols * cell) / 2);
    const offY = Math.round((h - ROWS * cell) / 2);
    const px = (v, off) => off + v * cell;
    const pad = Math.max(1, Math.round(cell * 0.12));

    ctx.fillStyle = COLORS.grid;
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(px(x, offX) + cell / 2 - 1, px(y, offY) + cell / 2 - 1, 2, 2);

    if (food) {
      ctx.fillStyle = COLORS.food;
      ctx.fillRect(px(food.x, offX) + pad, px(food.y, offY) + pad, cell - pad * 2, cell - pad * 2);
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
