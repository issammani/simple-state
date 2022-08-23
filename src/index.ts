type GetterFn<T> = () => T;
type SetterFn<T> = (value: T) => void;
type Observable = <T>(value: T) => [GetterFn<T>, SetterFn<T>];
type EffectCallback = () => any;
type ComputedCallback<T> = () => T;
type Effect = (effectCallback: EffectCallback) => void;
type Computed = <T>(computedCallback: ComputedCallback<T>) => T;

// This global variable is used to get the currently running effect.
// We need this to be able to dynamically track dependencies without needing
// to pass a dependency array to every effect.
let currentEffectFn: EffectCallback | null = null;

export const observable: Observable = <T>(value: T) => {
  // Since we want to notify observers of eventual changes, we need to keep track
  // of the subscribers. We use a set to avoid duplicates.
  const subscribers: Set<(value: T) => void> = new Set();

  // Keep track of the current value internally
  let _value = value;

  const getter = () => {
    // Check if we are calling the getter from within an effect.
    // If so, we need to track the dependency.
    if (currentEffectFn) {
      subscribers.add(currentEffectFn);
    }
    return _value;
  };
  const setter = (newValue: T) => {
    _value = newValue;
    // Notify all subscribers of the change
    subscribers.forEach((callback) => callback(newValue));
  };

  return [getter, setter];
};

// This function is used to run side effects.
// This is equivalent to `useEffect(() => { ... }, [....])`.
// Note that by design we don't need to provide a dependency list.
export const effect: Effect = (effectCallback) => {
  // We set the current effect to be the effect we are currently running
  // Then we call the effect function. This will in turn call the getter.
  // This way we can keep track of the effectCallback as a dependency
  // of the observable values it uses.
  currentEffectFn = effectCallback;
  effectCallback();
  currentEffectFn = null; // Reset the current effect callback function.
};

// A computed is used to describe a value that depends on other computed / observable values.
// At a high level, the computed function is just an effect that returns a value (getter from an observable).
export const computed = <T>(computedCallback: ComputedCallback<T>) => {
  // We create an observable that will keep track of the value,
  // when the effect runs.
  const [_computed, _setComputed] = observable<T | null>(null);

  effect(() => {
    // When the effect runs, we call the computed function.
    // This will in turn call the getter.
    // This way we can keep track of the computedCallback as a dependency
    // of the observable values it uses.
    _setComputed(computedCallback());
  });

  return _computed;
};
