// Ghostlight Heist — keyboard input with edge detection (pressed this frame).

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.down.add(e.code);
        this.pressed.add(e.code);
      }
    };
    this.onKeyUp = (e) => {
      this.down.delete(e.code);
    };
    this.onBlur = () => {
      this.down.clear();
    };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  isDown(code) {
    return this.down.has(code);
  }

  // True once, on the frame the key went down.
  wasPressed(code) {
    return this.pressed.has(code);
  }

  // Call at the end of each frame.
  endFrame() {
    this.pressed.clear();
  }
}
