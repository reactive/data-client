import { styled } from '@linaria/react';
import { useRef, useEffect } from 'react';

const LoadingBar = ({
  duration,
  loading,
}: {
  duration?: number;
  loading?: boolean;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const delay = 50;

  useEffect(() => {
    if (!loading) return;
    const node = barRef.current;

    let animation: Animation;
    const timeoutId = setTimeout(() => {
      if (!node) return;
      animation = node.animate(
        [
          {
            transform: `translateX(${-100}%)`,
          },
          {
            transform: `translateX(${-50}%)`,
            offset: 0.3,
          },
          {
            transform: `translateX(${0}%)`,
            easing: 'ease-out',
          },
        ],
        {
          duration: duration,
          iterations: 1,
          easing: 'ease-out',
          fill: 'forwards',
        },
      );
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (animation) animation.cancel();
    };
  }, [duration, loading]);

  return (
    <LoadingBarContainer>
      <LoadingBarInner
        style={{
          transform: `translateX(${-100}%)`,
        }}
        ref={barRef}
      ></LoadingBarInner>
    </LoadingBarContainer>
  );
};
LoadingBar.defaults = {
  duration: 200,
  loading: false,
};

export default LoadingBar;

const LoadingBarContainer = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 3px;
  z-index: 200;
`;

const LoadingBarInner = styled.div`
  position: absolute;
  top: 0;
  left: -10px;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #facc15 0%, #fb923c 50%, #f87171 100%);
  transform-origin: left center;
  box-shadow: 0px -3px 10px 5px rgba(239, 68, 68, 0.6);
`;
