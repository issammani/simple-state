type GetterFn<T> = () => T;
type SetterFn<T> = (value: T) => void;
type Observable = <T>(value: T) => [GetterFn<T>, SetterFn<T>];
type EffectCallback = () => any;
type Effect = (effectCallback: EffectCallback) => void;

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

export const effect: Effect = (effectCallback) => {
  // We set the current effect to be the effect we are currently running
  // Then we call the effect function. This will in turn call the getter.
  // This way we can keep track of the effectCallback as a dependency
  // of the observable values it uses.
  currentEffectFn = effectCallback;
  effectCallback();
  currentEffectFn = null; // Reset the current effect callback function.
};

// TODO: add these as tests later
const [primitive, setPrimitive] = observable<string>('John');
console.log(primitive()); // John

// This effect will run at least once.
effect(() => {
  // This console.log should be called on each state change !
  console.log('From effect --- ', primitive());
});

setPrimitive('Jane'); // Should trigger the effect
setPrimitive('Bob'); // Should not trigger the effect
