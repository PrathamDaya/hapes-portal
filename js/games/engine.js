export function createEngine(canvas, game, handlers = {}) {
    const context = canvas.getContext('2d');
    const step = 1 / 60;
    let frameId = 0;
    let running = false;
    let paused = true;
    let lastTime = 0;
    let accumulator = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        game.resize?.(width, height);
        game.draw?.(context, width, height, 0);
    }
    function finish(score = game.score || 0) {
        if (!running) return;
        running = false;
        paused = true;
        cancelAnimationFrame(frameId);
        handlers.onGameOver?.(score);
    }
    function tick(timestamp) {
        if (!running) return;
        const delta = Math.min(.1, (timestamp - lastTime) / 1000 || 0);
        lastTime = timestamp;
        if (!paused) {
            accumulator += delta;
            while (accumulator >= step) {
                game.update?.(step, width, height, finish);
                accumulator -= step;
            }
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        game.draw?.(context, width, height, accumulator / step);
        handlers.onFrame?.(game.score || 0);
        frameId = requestAnimationFrame(tick);
    }
    function point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top, event };
    }
    function onPointer(event) {
        if (event.type === 'pointerdown') {
            canvas.setPointerCapture?.(event.pointerId);
            if (navigator.vibrate) navigator.vibrate(8);
        }
        const p = point(event);
        game.pointer?.(event.type, p.x, p.y, width, height, finish);
    }
    function onKey(event) {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key)) event.preventDefault();
        game.key?.(event.key, event.type);
    }
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerup', onPointer);
    canvas.addEventListener('pointercancel', onPointer);
    window.addEventListener('keydown', onKey);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return {
        start() { running = true; paused = false; lastTime = performance.now(); accumulator = 0; frameId = requestAnimationFrame(tick); },
        pause() { paused = true; },
        resume() { if (running) { paused = false; lastTime = performance.now(); } },
        stop() {
            running = false; cancelAnimationFrame(frameId); observer.disconnect();
            canvas.removeEventListener('pointerdown', onPointer);
            canvas.removeEventListener('pointermove', onPointer);
            canvas.removeEventListener('pointerup', onPointer);
            canvas.removeEventListener('pointercancel', onPointer);
            window.removeEventListener('keydown', onKey);
        },
        finish
    };
}

