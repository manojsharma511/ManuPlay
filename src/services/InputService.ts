export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'action1' | 'action2' | 'pause' | 'boost' | 'brake';

export interface JoystickVector {
  x: number; // -1.0 to 1.0
  y: number; // -1.0 to 1.0
  active: boolean;
  angle: number; // radians
  distance: number; // 0.0 to 1.0
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action1: boolean; // Shoot / Jump / Main Action
  action2: boolean; // Brake / Secondary / Ability
  boost: boolean;
  brake: boolean;
  pause: boolean;
  joystick: JoystickVector;
  swipeUp: boolean;
  swipeDown: boolean;
  swipeLeft: boolean;
  swipeRight: boolean;
}

class InputService {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    action1: false,
    action2: false,
    boost: false,
    brake: false,
    pause: false,
    joystick: { x: 0, y: 0, active: false, angle: 0, distance: 0 },
    swipeUp: false,
    swipeDown: false,
    swipeLeft: false,
    swipeRight: false
  };

  private listeners: Array<(state: InputState) => void> = [];
  private touchStartPos: { x: number; y: number; time: number } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      
      // Global swipe gesture detection
      window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
      }
    }

    let updated = false;
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':
        if (!this.state.up) { this.state.up = true; updated = true; }
        break;
      case 'ArrowDown': case 'KeyS':
        if (!this.state.down) { this.state.down = true; updated = true; }
        break;
      case 'ArrowLeft': case 'KeyA':
        if (!this.state.left) { this.state.left = true; updated = true; }
        break;
      case 'ArrowRight': case 'KeyD':
        if (!this.state.right) { this.state.right = true; updated = true; }
        break;
      case 'Space': case 'KeyK': case 'KeyJ':
        if (!this.state.action1) { this.state.action1 = true; updated = true; }
        break;
      case 'KeyL': case 'ShiftLeft':
        if (!this.state.action2) { this.state.action2 = true; updated = true; }
        break;
      case 'KeyE': case 'KeyB':
        if (!this.state.boost) { this.state.boost = true; updated = true; }
        break;
      case 'KeyP': case 'Escape':
        if (!this.state.pause) { this.state.pause = true; updated = true; }
        break;
    }

    if (updated) this.notify();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    let updated = false;
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':
        if (this.state.up) { this.state.up = false; updated = true; }
        break;
      case 'ArrowDown': case 'KeyS':
        if (this.state.down) { this.state.down = false; updated = true; }
        break;
      case 'ArrowLeft': case 'KeyA':
        if (this.state.left) { this.state.left = false; updated = true; }
        break;
      case 'ArrowRight': case 'KeyD':
        if (this.state.right) { this.state.right = false; updated = true; }
        break;
      case 'Space': case 'KeyK': case 'KeyJ':
        if (this.state.action1) { this.state.action1 = false; updated = true; }
        break;
      case 'KeyL': case 'ShiftLeft':
        if (this.state.action2) { this.state.action2 = false; updated = true; }
        break;
      case 'KeyE': case 'KeyB':
        if (this.state.boost) { this.state.boost = false; updated = true; }
        break;
      case 'KeyP': case 'Escape':
        if (this.state.pause) { this.state.pause = false; updated = true; }
        break;
    }

    if (updated) this.notify();
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchStartPos = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.touchStartPos) return;
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartPos.x;
      const dy = touch.clientY - this.touchStartPos.y;
      const dt = Date.now() - this.touchStartPos.time;

      if (dt < 400 && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) this.triggerSwipe('swipeRight');
          else this.triggerSwipe('swipeLeft');
        } else {
          if (dy > 0) this.triggerSwipe('swipeDown');
          else this.triggerSwipe('swipeUp');
        }
      }
    }
    this.touchStartPos = null;
  };

  private triggerSwipe(direction: 'swipeUp' | 'swipeDown' | 'swipeLeft' | 'swipeRight') {
    this.state[direction] = true;
    this.notify();
    setTimeout(() => {
      this.state[direction] = false;
      this.notify();
    }, 100);
  }

  // Virtual Control Setters
  public setVirtualButton(action: ControlAction, active: boolean) {
    if (action === 'boost') {
      this.state.boost = active;
    } else if (action === 'brake') {
      this.state.brake = active;
    } else if (action in this.state) {
      (this.state as any)[action] = active;
    }
    this.notify();
  }

  public setJoystickVector(x: number, y: number, active: boolean) {
    const angle = Math.atan2(y, x);
    const distance = Math.min(1.0, Math.hypot(x, y));

    this.state.joystick = { x, y, active, angle, distance };
    // Map joystick vector to directional flags for fallback
    this.state.left = active && x < -0.3;
    this.state.right = active && x > 0.3;
    this.state.up = active && y < -0.3;
    this.state.down = active && y > 0.3;

    this.notify();
  }

  public getState(): InputState {
    return { ...this.state, joystick: { ...this.state.joystick } };
  }

  public subscribe(fn: (state: InputState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const copy = { ...this.state, joystick: { ...this.state.joystick } };
    this.listeners.forEach(fn => fn(copy));
  }

  public reset() {
    this.state = {
      up: false,
      down: false,
      left: false,
      right: false,
      action1: false,
      action2: false,
      boost: false,
      brake: false,
      pause: false,
      joystick: { x: 0, y: 0, active: false, angle: 0, distance: 0 },
      swipeUp: false,
      swipeDown: false,
      swipeLeft: false,
      swipeRight: false
    };
    this.notify();
  }
}

export const inputService = new InputService();

