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
  animation: FakeAnimation;
}[] = [];
type FakeAnimation = Partial<Omit<Animation, 'playState'>> & {
  playState: AnimationPlayState;
};
beforeEach(() => {
  animations.length = 0;
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
  jest
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockReturnValue(PARENT_WIDTH);
  HTMLElement.prototype.animate = function (keyframes: any) {
    const animation: FakeAnimation = {
      playState: 'running',
      currentTime: null,
      cancel: jest.fn(() => {
        animation.playState = 'idle';
      }),
      onfinish: null,
    };
    animations.push({ el: this, keyframes, animation });
    return animation as unknown as Animation;
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

it('leaves on its own when no group slides it out', () => {
  const { rerender } = render(<Reveal show>alone</Reveal>);
  rerender(<Reveal show={false}>alone</Reveal>);
  expect(screen.queryByText('alone')).toBeNull();
});

it('leaves on its own when the group ignores the change', () => {
  function Mismatched({ show }: { show: boolean }) {
    return (
      <MotionGroup layoutDependency="constant">
        <Reveal show={show}>panel</Reveal>
      </MotionGroup>
    );
  }
  const { rerender } = render(<Mismatched show />);
  rerender(<Mismatched show={false} />);
  expect(screen.queryByText('panel')).toBeNull();
});

it('reverses with the momentum it had mid-flight', () => {
  const { rerender } = render(<Drawer open={false} />);
  rerender(<Drawer open />);
  const panel = screen.getByText('panel');
  const enter = animations.find(({ el }) => el === panel);
  // 100ms into sliding in (moving towards the start)
  (enter as any).animation.currentTime = 100;
  rerender(<Drawer open={false} />);
  const exit = animations.at(-1);
  expect(exit?.el).toBe(panel);
  const x = (i: number) => parseFloat(exit?.keyframes[i].translate as string);
  // keeps moving the way it was going before turning around
  expect(x(1)).toBeLessThan(x(0));
  expect(x(exit!.keyframes.length - 1)).toBe(PARENT_WIDTH);
});

it('slides along a column container vertically', () => {
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
  function Column({ open }: { open: boolean }) {
    return (
      <div style={{ flexDirection: 'column' }}>
        <Drawer open={open} />
      </div>
    );
  }
  const { rerender, container } = render(<Column open={false} />);
  (container.firstChild as HTMLElement).style.display = 'flex';
  rerender(<Column open />);
  const panel = screen.getByText('panel');
  const enter = animations.find(({ el }) => el === panel);
  expect(enter?.keyframes[0].translate).toBe('0px 200px');
});

it('lands in place without Web Animations', () => {
  delete (HTMLElement.prototype as any).animate;
  const { rerender } = render(<Drawer open />);
  rerender(<Drawer open={false} />);
  expect(screen.queryByText('panel')).toBeNull();
});

it('does not slide in members that only move', () => {
  function Late({ open }: { open: boolean }) {
    return (
      <MotionGroup layoutDependency={open}>{open && <Handle />}</MotionGroup>
    );
  }
  const { rerender } = render(<Late open={false} />);
  rerender(<Late open />);
  expect(animations).toEqual([]);
});

it('keeps an exiting element pinned through further changes', () => {
  function Steps({ step }: { step: number }) {
    return (
      <MotionGroup layoutDependency={step}>
        <Reveal show={step === 0}>panel</Reveal>
      </MotionGroup>
    );
  }
  const { rerender } = render(<Steps step={0} />);
  rerender(<Steps step={1} />);
  rerender(<Steps step={2} />);
  const panel = screen.getByText('panel');
  expect(panel.style.position).toBe('absolute');
  rerender(<Steps step={0} />);
  expect(panel.style.position).toBe('');
});

it('keeps its own class alongside the one it is given', () => {
  render(
    <Reveal show className="panel">
      styled
    </Reveal>,
  );
  expect(screen.getByText('styled').className).toBe('motion-reveal panel');
});

it.each([
  ['a reversed row', { flexDirection: 'row-reverse' }],
  ['a right-to-left row', { direction: 'rtl' }],
] as const)('slides toward the start in %s', (_, style) => {
  function Reversed({ open }: { open: boolean }) {
    return (
      <div style={style}>
        <Drawer open={open} />
      </div>
    );
  }
  const { rerender } = render(<Reversed open={false} />);
  rerender(<Reversed open />);
  const panel = screen.getByText('panel');
  const enter = animations.find(({ el }) => el === panel);
  // offsetLeft is 0 in jsdom, so it starts one width (100px) past the start
  expect(enter?.keyframes[0].translate).toBe('-100px 0px');
});

it('stops glides in flight when reduced motion turns on', () => {
  const { rerender } = render(<Drawer open={false} />);
  rerender(<Drawer open />);
  const enter = animations.find(({ el }) => el === screen.getByText('panel'));
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  rerender(<Drawer open={false} />);
  expect(enter?.animation.cancel).toHaveBeenCalled();
  delete (window as any).matchMedia;
});
