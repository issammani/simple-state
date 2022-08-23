import { observable, effect } from '../src';

describe('effect test cases', () => {
  it('effect call should run without errors.', () => {
    expect(() => effect(jest.fn())).not.toThrow();
  });

  it('effect callback should run at least once.', () => {
    const callback = jest.fn();
    effect(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('effect callback should be called with correct values when a dependency changes.', () => {
    let valueInsideEffect: number | null = null;

    const [value, setValue] = observable(0);

    const callback = jest.fn(() => {
      valueInsideEffect = value() * 2;
    });

    effect(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(valueInsideEffect).toBe(0);
    setValue(5);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(valueInsideEffect).toBe(10);
    setValue(-3);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(valueInsideEffect).toBe(-6);
  });

  it('effect callback should not be called when a non-dependency changes.', () => {
    const [value1, _] = observable(0);
    const [__, setValue2] = observable(0);

    const callback = jest.fn(() => {
      console.log(value1() * 2);
    });

    effect(callback);
    expect(callback).toHaveBeenCalledTimes(1);

    setValue2(5);
    setValue2(10);
    setValue2(3);

    expect(callback).toHaveBeenCalledTimes(1); // should not be called again
  });
});
