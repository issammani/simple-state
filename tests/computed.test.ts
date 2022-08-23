import { observable, computed } from '../src';

describe('computed test cases', () => {
  it('computed call should run without errors.', () => {
    expect(() => computed(jest.fn())).not.toThrow();
  });

  it('computed callback should run at least once.', () => {
    const callback = jest.fn().mockReturnValueOnce(10);
    const computedValue = computed(callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(computedValue()).toBe(10);
  });

  it('computed callback should be called / return correct values when a dependency changes.', () => {
    const [value, setValue] = observable(0);

    const callback = jest.fn(() => {
      return value() * 2;
    });

    const computedValue = computed(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(computedValue()).toBe(0);
    setValue(5);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(computedValue()).toBe(10);
    setValue(-3);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(computedValue()).toBe(-6);
  });

  it('computed callback should not be called when a non-dependency changes.', () => {
    const [value1, _] = observable(0);
    const [__, setValue2] = observable(0);

    const callback = jest.fn(() => {
      return value1() * 2;
    });

    const computedValue = computed(callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(computedValue()).toBe(0);

    setValue2(5);
    setValue2(10);
    setValue2(3);

    expect(callback).toHaveBeenCalledTimes(1); // should not be called again
    expect(computedValue()).toBe(0); // should not be changed
  });
});
