import { observable } from '../src';

describe('observable test cases', () => {
  it('observable call should run without errors.', () => {
    expect(() => observable('')).not.toThrow();
  });

  it('observable returned value should match initial value passed.', () => {
    const [primitive] = observable('John');
    const [array] = observable([1, 2, 3, 4]);
    const [object] = observable({ a: 1, b: 2 });
    expect(primitive()).toBe('John');
    expect(array()).toEqual([1, 2, 3, 4]);
    expect(object()).toEqual({ a: 1, b: 2 });
  });

  it('calling setter updates the value correctly.', () => {
    const [primitive, setPrimitive] = observable('John');
    const [array, setArray] = observable([1, 2, 3, 4]);
    const [object, setObject] = observable({ a: 1, b: 2 });

    expect(primitive()).toBe('John');
    setPrimitive('Jane');
    expect(primitive()).toBe('Jane');

    expect(array()).toEqual([1, 2, 3, 4]);
    setArray([1, 2, 3, 5]);
    expect(array()).toEqual([1, 2, 3, 5]);

    expect(object()).toEqual({ a: 1, b: 2 });
    setObject({ a: 1, b: 4 });
    expect(object()).toEqual({ a: 1, b: 4 });
  });
});
