import { describe, expect, it } from 'vitest';
import { focusCamera, project } from './camera';

const viewport = { width: 1000, height: 600 };

describe('focusCamera', () => {
  it('zooms in on a short line and centres it', () => {
    const camera = focusCamera({ x: 400, y: 280, width: 200, height: 40 }, viewport);
    expect(camera.scale).toBe(1.6);
    expect(project(300, camera)).toBeCloseTo(300); // vertical centre stays centred
  });

  it('never zooms out below 1 for very long lines', () => {
    const camera = focusCamera({ x: 0, y: 0, width: 2000, height: 40 }, viewport);
    expect(camera.scale).toBe(1);
  });

  it('clamps so no empty space appears at the top-left edge', () => {
    const camera = focusCamera({ x: 10, y: 0, width: 100, height: 40 }, viewport);
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  it('clamps so no empty space appears at the bottom-right edge', () => {
    const camera = focusCamera({ x: 900, y: 580, width: 100, height: 20 }, viewport);
    expect(camera.x).toBeCloseTo(viewport.width * (1 - camera.scale));
    expect(camera.y).toBeCloseTo(viewport.height * (1 - camera.scale));
  });
});
