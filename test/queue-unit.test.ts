import 'regenerator-runtime/runtime';
import { Task } from 't-tasks';

import { Queue } from '../';

const delayedValueTask = <R>(value: R, delay: number, match: Parameters<Task<R>['matchTap']>[0]) => ({
  value,
  invoke: () => Task.timeout(delay).map(() => value).matchTap(match),
});

const comparator = (a: ReturnType<typeof delayedValueTask>, b: ReturnType<typeof delayedValueTask>) => (
  a.value === b.value
);

describe('Queue', () => {
  beforeEach(() => jest.useFakeTimers('legacy'));
  afterEach(() => jest.useRealTimers());

  const flushPromises = async () => {
    return new Promise((resolve) => setImmediate(resolve));
  };

  const advanceTime = async (by: number) => {
    jest.advanceTimersByTime(by);

    return flushPromises();
  };

  it('is constructed', async () => {
    expect(Queue.empty()).toHaveLength(0);

    expect(Queue.of([])).toHaveLength(0);
  })

  it('is functional', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    const queue = Queue.of([delayedValueTask(42, 100, {
      resolved,
      rejected,
      canceled,
    })]);

    expect(canceled).not.toBeCalled();
    expect(rejected).not.toBeCalled();
    expect(resolved).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled).not.toBeCalled();
    expect(rejected).not.toBeCalled();
    expect(resolved).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled).not.toBeCalled();
    expect(rejected).not.toBeCalled();
    expect(resolved).toBeCalledWith(42);

    expect(queue).toHaveLength(0);
  });

  it('is queued', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('is cancelable 1', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    queue.shift();

    await flushPromises();

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('is cancelable 2', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(100);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    queue.shift();

    await flushPromises();

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(0);
  });

  it('is pushable 1', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(50);

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    queue.push(delayedValueTask(64, 200, {
      resolved: resolved2,
      rejected: rejected2,
      canceled: canceled2,
    }));

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(49);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('is pushable 2', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);

    expect(queue).toHaveLength(0);

    await advanceTime(50);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);

    expect(queue).toHaveLength(0);

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    queue.push(delayedValueTask(64, 200, {
      resolved: resolved2,
      rejected: rejected2,
      canceled: canceled2,
    }));

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('is unshiftable 1', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask<number>(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    queue.unshift(delayedValueTask(81, 300, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('is unshiftable 2', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask<number>(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    queue.shift();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    queue.unshift(delayedValueTask(81, 300, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    await flushPromises();

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('is unique 1', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(42, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ], comparator);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(0);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(0);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(0);
  });

  it('is unique 2', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled4 = jest.fn();
    const rejected4 = jest.fn();
    const resolved4 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask<number>(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
      delayedValueTask<number>(81, 300, {
        resolved: resolved4,
        rejected: rejected4,
        canceled: canceled4,
      }),
    ], comparator);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(50);

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    queue.unshift(delayedValueTask(81, 300, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).toBeCalledWith(81);
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(0);
  });

  it('is unique 3', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled4 = jest.fn();
    const rejected4 = jest.fn();
    const resolved4 = jest.fn();

    const queue = Queue.of([
      delayedValueTask<number>(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask<number>(81, 300, {
        resolved: resolved4,
        rejected: rejected4,
        canceled: canceled4,
      }),
      delayedValueTask<number>(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ], comparator);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(50);

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    queue.push(delayedValueTask(81, 300, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).toBeCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);
    expect(canceled3).not.toBeCalled();
    expect(rejected3).not.toBeCalled();
    expect(resolved3).not.toBeCalled();
    expect(canceled4).not.toBeCalled();
    expect(rejected4).not.toBeCalled();
    expect(resolved4).toBeCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('is clearable', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    expect(canceled1).not.toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    queue.shift();
    queue.clear();

    await flushPromises();

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(0);

    queue.push(
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 200, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    );

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).not.toBeCalled();
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).not.toBeCalled();

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toBeCalled();
    expect(rejected1).not.toBeCalled();
    expect(resolved1).toBeCalledWith(42);
    expect(canceled2).not.toBeCalled();
    expect(rejected2).not.toBeCalled();
    expect(resolved2).toBeCalledWith(64);

    expect(queue).toHaveLength(0);
  });
});
