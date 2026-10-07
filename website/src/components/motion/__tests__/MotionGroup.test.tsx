/// <reference types="jest" />

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { MotionGroup, Reveal, useLayoutMotion } from '..';

// jsdom has no layout or Web Animations: give every box a size and record
// the animations started
const PARENT_WIDTH = 300;
const animations: {
  el: Element;
  keyframes: Keyframe[];
  animation: Partial<Animation>;
}[] = [];
beforeEach(() => {
  animations.length = 0;
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
  jest
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockReturnValue(PARENT_WIDTH);
  HTMLElement.prototype.animate = function (keyframes: any) {
    const animation: Partial<Animation> = {
      playState: 'running',
      currentTime: 0,
      cancel: jest.fn(),
      onfinish: null,
    };
    animations.push({ el: this, keyframes, animation });
    return animation as Animation;
  };
});
afterEach(() => {
  jest.restoreAllMocks();
  delete (HTMLElement.prototype as any).animate;
});

function Handle() {
  return <div data-testid="handle" ref={useLayoutMotion()} />;
}
function Drawer({ open, label = 'panel' }: { open: boolean; label?: string }) {
  return (
    <MotionGroup layoutDependency={open}>
      <Handle />
      <Reveal show={open}>{label}</Reveal>
    </MotionGroup>
  );
}

it('does not animate what is there on first render', () => {
  render(<Drawer open />);
  expect(screen.getByText('panel')).toBeTruthy();
  expect(animations).toEqual([]);
});

it('slides a revealed element in from the end of its container', () => {
  const { rerender } = render(<Drawer open={false} />);
  rerender(<Drawer open />);
  const panel = screen.getByText('panel');
  const enter = animations.find(({ el }) => el === panel);
  expect(enter?.keyframes[0].translate).toBe(`${PARENT_WIDTH}px 0px`);
  expect(enter?.keyframes.at(-1)?.translate).toBe('0px 0px');
});

it('keeps an exiting element, with its last content, until it slides out', () => {
  const { rerender } = render(<Drawer open label="first" />);
  rerender(<Drawer open={false} label="second" />);
  const exit = animations.find(({ el }) => el.textContent === 'first');
  expect(exit?.keyframes.at(-1)?.translate).toBe(`${PARENT_WIDTH}px 0px`);
  expect((exit?.el as HTMLElement).style.position).toBe('absolute');

  act(() => (exit?.animation.onfinish as any)());
  expect(screen.queryByText('first')).toBeNull();
});

it('turns around mid-exit instead of remounting', () => {
  const { rerender } = render(<Drawer open />);
  rerender(<Drawer open={false} />);
  const panel = screen.getByText('panel');
  rerender(<Drawer open />);
  expect(screen.getByText('panel')).toBe(panel);
  expect(panel.style.position).toBe('');
});

it('only measures when layoutDependency changes', () => {
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  const { rerender } = render(<Drawer open label="a" />);
  rerender(<Drawer open label="b" />);
  expect(rect).not.toHaveBeenCalled();
});

it('lands in place when the user prefers reduced motion', () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  const { rerender } = render(<Drawer open />);
  rerender(<Drawer open={false} />);
  expect(animations).toEqual([]);
  expect(screen.queryByText('panel')).toBeNull();
  delete (window as any).matchMedia;
});
