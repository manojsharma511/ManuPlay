export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'action1' | 'action2' | 'pause';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action1: boolean; // e.g. Shoot / Jump / Boost
  action2: boolean; // e.g. Brake / Bomb / Secondary
  pause: boolean;
}

class InputService {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    action1: false,
    action2: false,
    pause: false
  };

  private listeners: Array<(state: InputState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scroll behavior for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
      }
    }

    let updated = false;
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': if (!this.state.up) { this.state.up = true; updated = true; } break;
      case 'ArrowDown': case 'KeyS': if (!this.state.down) { this.state.down = true; updated = true; } break;
      case 'ArrowLeft': case 'KeyA': if (!this.state.left) { this.state.left = true; updated = true; } break;
      case 'ArrowRight': case 'KeyD': if (!this.state.right) { this.state.right = true; updated = true; } break;
      case 'Space': case 'KeyK': case 'KeyJ': if (!this.state.action1) { this.state.action1 = true; updated = true; } break;
      case 'KeyL': case 'ShiftLeft': if (!this.state.action2) { this.state.action2 = true; updated = true; } break;
      case 'KeyP': case 'Escape': if (!this.state.pause) { this.state.pause = true; updated = true; } break;
    }

    if (updated) this.notify();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    let updated = false;
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': if (this.state.up) { this.state.up = false; updated = true; } break;
      case 'ArrowDown': case 'KeyS': if (this.state.down) { this.state.down = false; updated = true; } break;
      case 'ArrowLeft': case 'KeyA': if (this.state.left) { this.state.left = false; updated = true; } break;
      case 'ArrowRight': case 'KeyD': if (this.state.right) { this.state.right = false; updated = true; } break;
      case 'Space': case 'KeyK': case 'KeyJ': if (this.state.action1) { this.state.action1 = false; updated = true; } break;
      case 'KeyL': case 'ShiftLeft': if (this.state.action2) { this.state.action2 = false; updated = true; } break;
      case 'KeyP': case 'Escape': if (this.state.pause) { this.state.pause = false; updated = true; } break;
    }

    if (updated) this.notify();
  };

  // Touch & Virtual Control Setter
  public setVirtualButton(action: ControlAction, active: boolean) {
    if (this.state[action] !== active) {
      this.state[action] = active;
      this.notify();
    }
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public subscribe(fn: (state: InputState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const copy = { ...this.state };
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
      pause: false
    };
    this.notify();
  }
}

export const inputService = new InputService();
