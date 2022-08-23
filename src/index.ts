type GetterFn<T> = () => T;
type SetterFn<T> = (value: T) => void;
type Observable = <T>(value: T) => [GetterFn<T>, SetterFn<T>];

export const observable: Observable = <T>(value: T) => {
  let _value = value;
  const getter = () => _value;
  const setter = (newValue: T) => {
    _value = newValue;
  };
  return [getter, setter];
};

// TODO: add these as tests later
const [primitive, setPrimitive] = observable<string>('John');
const [object, setObject] = observable<{ name: string; age: number }>({
  name: 'John',
  age: 30,
});
const [array, setArray] = observable<number[]>([10, 20, 30]);

console.log(primitive());
console.log(object());
console.log(array());

setPrimitive('Jane');
setObject({ name: 'Jane', age: 31 });
setArray([40, 50, 60]);

console.log(primitive());
console.log(object());
console.log(array());
