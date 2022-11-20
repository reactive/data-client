import type { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react';

const fakeNavigation = { addListener(name: string) {} } as any;
let _useNavigation: typeof useNavigation = () => fakeNavigation;
import('@react-navigation/native').then(rn => {
  _useNavigation = rn.useNavigation;
});

function useFocusEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  runOnMount = false,
) {
  let navigation: NavigationProp<ReactNavigation.RootParamList>;
  // if we aren't in react-navigation context, just ignore focus events
  try {
    navigation = _useNavigation();
  } catch {
    navigation = fakeNavigation;
  }
  const firstRenderRef = useRef(true);
  useEffect(() => {
    let onCancel: ReturnType<EffectCallback>;
    const unsubscribe = navigation.addListener('focus', () => {
      // don't run on first render - only refocuses
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
      } else {
        if (onCancel) onCancel();
        onCancel = effect();
      }
    });
    if (runOnMount) {
      onCancel = effect();
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (onCancel) onCancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
export default useFocusEffect;
