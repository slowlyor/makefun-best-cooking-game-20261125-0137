// input.js — keyboard and mouse, kept as a plain snapshot the loop reads.
// Movement keys are WASD or arrows; E (or Space) interacts; Q bins the item
// in hand; Enter starts; R restarts. Clicking a nearby station interacts too.

export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    interactHeld: false, interactPressed: false,
    dropPressed: false, enterPressed: false, restartPressed: false,
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
  };

  const keyMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    const dir = keyMap[event.code];
    if (dir) input[dir] = true;
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interactPressed = true;
      input.interactHeld = true;
    }
    if (event.code === 'KeyQ' && !event.repeat) input.dropPressed = true;
    if (event.code === 'Enter' && !event.repeat) input.enterPressed = true;
    if (event.code === 'KeyR' && !event.repeat) input.restartPressed = true;
  });

  window.addEventListener('keyup', (event) => {
    const dir = keyMap[event.code];
    if (dir) input[dir] = false;
    if (event.code === 'KeyE' || event.code === 'Space') input.interactHeld = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouse.clickY = (event.clientY - rect.top) * (canvas.height / rect.height);
    input.mouse.clicked = true;
  });

  return input;
}

// Edge-triggered flags are consumed once per frame by the loop.
export function endFrame(input) {
  input.interactPressed = false;
  input.dropPressed = false;
  input.enterPressed = false;
  input.restartPressed = false;
  input.mouse.clicked = false;
}
