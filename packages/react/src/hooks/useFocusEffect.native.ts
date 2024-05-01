import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react';

const fakeNavigation = {
  addListener(name: string, cb: () => void) {
    return () => {};
  },
};
let _useNavigation = () => fakeNavigation;

console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
// if they are using expo-router they are more likely wanting to use that implementation
// as react-navigation can often appear in node_modules when not used
import('expo-router')
  .then(router => {
    _useNavigation = router.useNavigation;
    console.log('hi', _useNavigation, router);
  })
  .catch(e => {
    console.log('caught error', e);
    import('@react-navigation/native')
      .then(rn => {
        _useNavigation = rn.useNavigation;
      })
      .catch(() => {});
  });

function useFocusEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  runOnMount = false,
) {
  let navigation: typeof fakeNavigation;
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
