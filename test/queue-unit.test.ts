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
  beforeEach(() => jest.useFakeTimers({ legacyFakeTimers: true }));
  afterEach(() => jest.useRealTimers());

  const flushPromises = async () => {
    return new Promise((resolve) => setImmediate(resolve));
  };

  const advanceTime = async (by: number) => {
    await flushPromises();

    jest.advanceTimersByTime(by);

    return flushPromises();
  };

  it('creates an empty queue', async () => {
    expect(Queue.empty()).toHaveLength(0);

    expect(Queue.of([])).toHaveLength(0);
  })

  it('runs a single task', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    const queue = Queue.of([delayedValueTask(42, 100, {
      resolved,
      rejected,
      canceled,
    })]);

    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
    expect(resolved).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
    expect(resolved).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
    expect(resolved).toHaveBeenCalledWith(42);

    expect(queue).toHaveLength(0);
  });

  it('runs tasks in order', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('cancels the running task on shift', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    queue.shift();

    await flushPromises();

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('cancels the next running task on shift', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(100);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    queue.shift();

    await flushPromises();

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalled();
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs a task pushed while another is running', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(49);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('runs a task pushed onto an empty queue', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);

    expect(queue).toHaveLength(0);

    await advanceTime(50);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);

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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('runs an unshifted task before the remaining tasks', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('runs an unshifted task after the head is canceled', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('keeps one of two equal tasks', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not unshift a duplicate of a queued task', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not push a duplicate of a queued task', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(49);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(299);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('runs tasks pushed after shift and clear', async () => {
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

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    queue.shift();
    queue.clear();

    await flushPromises();

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

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

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(199);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(canceled1).toHaveBeenCalled();
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);

    expect(queue).toHaveLength(0);
  });

  it('runs tasks that are already settled', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const canceled4 = jest.fn();
    const rejected4 = jest.fn();
    const resolved4 = jest.fn();

    const queue = Queue.of([
      { invoke: () => Task.resolved(42).matchTap({ resolved: resolved1, rejected: rejected1, canceled: canceled1 }) },
      { invoke: () => Task.rejected<number>(new Error('failed')).matchTap({ resolved: resolved2, rejected: rejected2, canceled: canceled2 }) },
      { invoke: () => Task.canceled<number>().matchTap({ resolved: resolved3, rejected: rejected3, canceled: canceled3 }) },
      delayedValueTask(81, 20, {
        resolved: resolved4,
        rejected: rejected4,
        canceled: canceled4,
      }),
    ]);

    await advanceTime(1);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledWith(expect.any(Error));
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(1);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(resolved4).toHaveBeenCalledTimes(0);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(19);

    expect(resolved4).toHaveBeenCalledWith(81);
    expect(rejected4).toHaveBeenCalledTimes(0);
    expect(canceled4).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('resumes after a task that settles while waiting', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const early = Task.timeout(10).map(() => 42);

    await advanceTime(10);

    const queue = Queue.empty();

    queue.push(
      { invoke: () => early.matchTap({ resolved: resolved1, rejected: rejected1, canceled: canceled1 }) },
      delayedValueTask(64, 100, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    );

    await advanceTime(1);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(99);

    expect(resolved2).toHaveBeenCalledWith(64);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('resumes after a settled task between two running tasks', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 50, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      { invoke: () => Task.resolved(64).matchTap({ resolved: resolved2, rejected: rejected2, canceled: canceled2 }) },
      delayedValueTask(81, 50, {
        resolved: resolved3,
        rejected: rejected3,
        canceled: canceled3,
      }),
    ]);

    await advanceTime(49);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(1);
    await advanceTime(0);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(50);

    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not start a task shifted before it starts', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    const queue = Queue.of([delayedValueTask(42, 100, {
      resolved,
      rejected,
      canceled,
    })]);

    queue.shift();

    await advanceTime(100);

    expect(resolved).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
    expect(canceled).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('starts the next task when the head is shifted before it starts', async () => {
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
      delayedValueTask(64, 50, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    queue.shift();

    await advanceTime(49);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('cancels the running task on clear', async () => {
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
      delayedValueTask(64, 100, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    await advanceTime(50);

    expect(queue).toHaveLength(2);

    queue.clear();

    await flushPromises();

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(200);

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not push a duplicate of the running task', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.empty(comparator);

    queue.push(delayedValueTask(42, 100, {
      resolved: resolved1,
      rejected: rejected1,
      canceled: canceled1,
    }));

    await advanceTime(50);

    expect(queue).toHaveLength(1);

    queue.push(delayedValueTask(42, 100, {
      resolved: resolved2,
      rejected: rejected2,
      canceled: canceled2,
    }));

    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(50);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(100);

    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs tasks when nothing compares equal', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 30, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 30, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ], () => false);

    expect(queue).toHaveLength(2);

    await advanceTime(30);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(30);

    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('continues after invoke throws', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();
    const reported: unknown[] = [];
    const originalReportError = globalThis.reportError;

    globalThis.reportError = (error: unknown) => {
      reported.push(error);
    };

    try {
      const queue = Queue.of([
        { invoke: () => { throw new Error('invoke failed'); } },
        delayedValueTask(64, 20, {
          resolved,
          rejected,
          canceled,
        }),
      ]);

      await advanceTime(20);

      expect(reported).toEqual([expect.objectContaining({ message: 'invoke failed' })]);
      expect(resolved).toHaveBeenCalledWith(64);
      expect(rejected).toHaveBeenCalledTimes(0);
      expect(canceled).toHaveBeenCalledTimes(0);

      expect(queue).toHaveLength(0);
    } finally {
      globalThis.reportError = originalReportError;
    }
  });

  it('continues after a rejected task', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const error = new Error('failed');

    const queue = Queue.of([
      {
        invoke: () => Task.timeout(50).map(() => {
          throw error;
        }).matchTap({
          resolved: resolved1,
          rejected: rejected1,
          canceled: canceled1,
        }),
      },
      delayedValueTask(64, 20, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    await advanceTime(49);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);
    await advanceTime(0);

    expect(rejected1).toHaveBeenCalledWith(error);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(20);

    expect(resolved2).toHaveBeenCalledWith(64);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('drops tasks cleared before they start', async () => {
    const started = jest.fn();
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    const queue = Queue.empty();

    queue.push({
      invoke: () => {
        started();

        return Task.timeout(100).map(() => 42).matchTap({
          resolved,
          rejected,
          canceled,
        });
      },
    });

    queue.clear();

    expect(queue).toHaveLength(0);

    await advanceTime(100);

    expect(started).toHaveBeenCalledTimes(0);
    expect(resolved).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
    expect(canceled).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('drops the next task when shifted before it starts', async () => {
    const started1 = jest.fn();
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const started2 = jest.fn();
    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const started3 = jest.fn();
    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.of([
      {
        invoke: () => {
          started1();

          return Task.timeout(50).map(() => 42).matchTap({
            resolved: resolved1,
            rejected: rejected1,
            canceled: canceled1,
          });
        },
      },
      {
        invoke: () => {
          started2();

          return Task.timeout(50).map(() => 64).matchTap({
            resolved: resolved2,
            rejected: rejected2,
            canceled: canceled2,
          });
        },
      },
      {
        invoke: () => {
          started3();

          return Task.timeout(50).map(() => 81).matchTap({
            resolved: resolved3,
            rejected: rejected3,
            canceled: canceled3,
          });
        },
      },
    ]);

    await advanceTime(49);

    expect(started1).toHaveBeenCalledTimes(1);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(started3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(3);

    await advanceTime(1);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(started3).toHaveBeenCalledTimes(0);

    queue.shift();

    await advanceTime(0);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(started3).toHaveBeenCalledTimes(1);

    expect(queue).toHaveLength(1);

    await advanceTime(50);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('drops two heads when shifted twice before they start', async () => {
    const started1 = jest.fn();
    const resolved1 = jest.fn();

    const started2 = jest.fn();
    const resolved2 = jest.fn();

    const started3 = jest.fn();
    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.of([
      {
        invoke: () => {
          started1();

          return Task.timeout(30).map(() => 42).matchTap({
            resolved: resolved1,
            rejected: jest.fn(),
            canceled: jest.fn(),
          });
        },
      },
      {
        invoke: () => {
          started2();

          return Task.timeout(30).map(() => 64).matchTap({
            resolved: resolved2,
            rejected: jest.fn(),
            canceled: jest.fn(),
          });
        },
      },
      {
        invoke: () => {
          started3();

          return Task.timeout(30).map(() => 81).matchTap({
            resolved: resolved3,
            rejected: rejected3,
            canceled: canceled3,
          });
        },
      },
    ]);

    queue.shift();
    queue.shift();

    expect(started1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(started3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(29);

    expect(started1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(started3).toHaveBeenCalledTimes(1);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(1);

    expect(started1).toHaveBeenCalledTimes(0);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs only the task pushed after clear', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const started2 = jest.fn();
    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.of([
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      {
        invoke: () => {
          started2();

          return Task.timeout(100).map(() => 64).matchTap({
            resolved: resolved2,
            rejected: rejected2,
            canceled: canceled2,
          });
        },
      },
    ]);

    await advanceTime(50);

    expect(queue).toHaveLength(2);

    queue.clear();

    queue.push(delayedValueTask(81, 30, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    await flushPromises();

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(30);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(rejected3).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not unshift a duplicate of the running task', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.empty(comparator);

    queue.push(
      delayedValueTask(42, 100, {
        resolved: resolved1,
        rejected: rejected1,
        canceled: canceled1,
      }),
      delayedValueTask(64, 20, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    );

    await advanceTime(50);

    expect(queue).toHaveLength(2);

    queue.unshift(delayedValueTask(42, 100, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(50);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(20);

    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs tasks queued from the resolved callback', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.empty(comparator);

    queue.push({
      value: 42,
      invoke: () => Task.timeout(50).map(() => 42).matchTap({
        resolved: () => {
          resolved1(42);

          queue.push(
            delayedValueTask(42, 20, {
              resolved: resolved2,
              rejected: rejected2,
              canceled: canceled2,
            }),
            delayedValueTask(64, 20, {
              resolved: resolved3,
              rejected: rejected3,
              canceled: canceled3,
            }),
          );
        },
        rejected: rejected1,
        canceled: canceled1,
      }),
    });

    await advanceTime(49);

    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(queue).toHaveLength(1);

    await advanceTime(1);
    await advanceTime(0);

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(20);

    expect(resolved2).toHaveBeenCalledWith(42);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(0);
    await advanceTime(20);

    expect(resolved3).toHaveBeenCalledWith(64);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not overlap a task pushed from invoke', async () => {
    const events: string[] = [];

    const queue = Queue.empty();

    const inner = {
      invoke: () => {
        events.push('inner');

        return Task.timeout(10).map(() => 64).matchTap({
          resolved: () => events.push('inner-done'),
          rejected: () => events.push('inner-rejected'),
          canceled: () => events.push('inner-canceled'),
        });
      },
    };

    queue.push({
      invoke: () => {
        events.push('outer');

        queue.push(inner);

        events.push(`after-push:${queue.length}`);

        return Task.timeout(30).map(() => 42).matchTap({
          resolved: () => events.push('outer-done'),
          rejected: () => events.push('outer-rejected'),
          canceled: () => events.push('outer-canceled'),
        });
      },
    });

    await advanceTime(30);
    await advanceTime(0);
    await advanceTime(10);

    expect(events).toEqual([
      'outer',
      'after-push:1',
      'outer-done',
      'inner',
      'inner-done',
    ]);

    expect(queue).toHaveLength(0);
  });

  it('runs a task pushed after invoke throws', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();
    const reported: unknown[] = [];
    const originalReportError = globalThis.reportError;

    globalThis.reportError = (error: unknown) => {
      reported.push(error);
    };

    try {
      const queue = Queue.empty();

      queue.push({
        invoke: () => {
          throw new Error('invoke failed');
        },
      });

      await advanceTime(0);

      expect(reported).toEqual([expect.objectContaining({ message: 'invoke failed' })]);
      expect(queue).toHaveLength(0);

      queue.push(delayedValueTask(64, 20, {
        resolved,
        rejected,
        canceled,
      }));

      await advanceTime(20);

      expect(resolved).toHaveBeenCalledWith(64);
      expect(rejected).toHaveBeenCalledTimes(0);
      expect(canceled).toHaveBeenCalledTimes(0);

      expect(queue).toHaveLength(0);
    } finally {
      globalThis.reportError = originalReportError;
    }
  });

  it('runs the next task after one that settles on a microtask', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.of([
      {
        invoke: () => Task.fromPromise(Promise.resolve(42)).matchTap({
          resolved: resolved1,
          rejected: rejected1,
          canceled: canceled1,
        }),
      },
      delayedValueTask(64, 20, {
        resolved: resolved2,
        rejected: rejected2,
        canceled: canceled2,
      }),
    ]);

    await advanceTime(1);
    await flushPromises();

    expect(resolved1).toHaveBeenCalledWith(42);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(canceled1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(20);

    expect(resolved2).toHaveBeenCalledWith(64);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs an unshifted duplicate of the pending head', async () => {
    const canceledOld = jest.fn();
    const rejectedOld = jest.fn();
    const resolvedOld = jest.fn();

    const canceledNew = jest.fn();
    const rejectedNew = jest.fn();
    const resolvedNew = jest.fn();

    const canceledTail = jest.fn();
    const rejectedTail = jest.fn();
    const resolvedTail = jest.fn();

    const queue = Queue.of([
      delayedValueTask(81, 100, {
        resolved: resolvedOld,
        rejected: rejectedOld,
        canceled: canceledOld,
      }),
      delayedValueTask(64, 50, {
        resolved: resolvedTail,
        rejected: rejectedTail,
        canceled: canceledTail,
      }),
    ], comparator);

    queue.unshift(delayedValueTask(81, 100, {
      resolved: resolvedNew,
      rejected: rejectedNew,
      canceled: canceledNew,
    }));

    expect(queue).toHaveLength(2);

    await advanceTime(99);

    expect(resolvedOld).toHaveBeenCalledTimes(0);
    expect(canceledOld).toHaveBeenCalledTimes(0);
    expect(rejectedOld).toHaveBeenCalledTimes(0);
    expect(resolvedNew).toHaveBeenCalledTimes(0);
    expect(canceledNew).toHaveBeenCalledTimes(0);
    expect(rejectedNew).toHaveBeenCalledTimes(0);
    expect(resolvedTail).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(2);

    await advanceTime(1);

    expect(resolvedNew).toHaveBeenCalledWith(81);
    expect(canceledNew).toHaveBeenCalledTimes(0);
    expect(rejectedNew).toHaveBeenCalledTimes(0);
    expect(resolvedOld).toHaveBeenCalledTimes(0);
    expect(canceledOld).toHaveBeenCalledTimes(0);
    expect(rejectedOld).toHaveBeenCalledTimes(0);
    expect(resolvedTail).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(50);

    expect(resolvedTail).toHaveBeenCalledWith(64);
    expect(canceledTail).toHaveBeenCalledTimes(0);
    expect(rejectedTail).toHaveBeenCalledTimes(0);
    expect(resolvedOld).toHaveBeenCalledTimes(0);
    expect(resolvedNew).toHaveBeenCalledWith(81);

    expect(queue).toHaveLength(0);
  });

  it('cancels a task cleared from its own invoke', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const started2 = jest.fn();
    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.empty();

    queue.push({
      invoke: () => {
        queue.clear();

        return Task.timeout(50).map(() => 42).matchTap({
          resolved: resolved1,
          rejected: rejected1,
          canceled: canceled1,
        });
      },
    }, {
      invoke: () => {
        started2();

        return Task.timeout(20).map(() => 64).matchTap({
          resolved: resolved2,
          rejected: rejected2,
          canceled: canceled2,
        });
      },
    });

    await advanceTime(0);

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(50);

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('cancels a task shifted from its own invoke and runs the next one', async () => {
    const canceled1 = jest.fn();
    const rejected1 = jest.fn();
    const resolved1 = jest.fn();

    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const queue = Queue.empty();

    queue.push({
      invoke: () => {
        queue.shift();

        return Task.timeout(30).map(() => 42).matchTap({
          resolved: resolved1,
          rejected: rejected1,
          canceled: canceled1,
        });
      },
    }, delayedValueTask(64, 20, {
      resolved: resolved2,
      rejected: rejected2,
      canceled: canceled2,
    }));

    await advanceTime(0);

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(rejected1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(20);

    expect(canceled1).toHaveBeenCalledTimes(1);
    expect(resolved1).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledWith(64);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('does not run a task pushed again from its own invoke', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    let runs = 0;

    const queue = Queue.empty();

    const task = {
      invoke: () => {
        runs += 1;

        if (runs === 1) queue.push(task);

        return Task.timeout(20).map(() => 42).matchTap({
          resolved,
          rejected,
          canceled,
        });
      },
    };

    queue.push(task);

    await advanceTime(20);
    await advanceTime(0);

    expect(runs).toBe(1);
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(resolved).toHaveBeenCalledWith(42);
    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(20);

    expect(runs).toBe(1);
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('drops the next task when shift is called from the resolved callback', async () => {
    const started2 = jest.fn();
    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const queue = Queue.empty();

    queue.push({
      invoke: () => Task.timeout(10).matchTap({
        resolved: () => {
          queue.shift();
        },
        rejected: jest.fn(),
        canceled: jest.fn(),
      }),
    }, {
      invoke: () => {
        started2();

        return Task.timeout(10).map(() => 64).matchTap({
          resolved: resolved2,
          rejected: rejected2,
          canceled: canceled2,
        });
      },
    }, delayedValueTask(81, 10, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    await advanceTime(10);
    await advanceTime(0);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(10);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('drops the next task when shift is called from the rejected callback', async () => {
    const started2 = jest.fn();
    const canceled2 = jest.fn();
    const rejected2 = jest.fn();
    const resolved2 = jest.fn();

    const canceled3 = jest.fn();
    const rejected3 = jest.fn();
    const resolved3 = jest.fn();

    const error = new Error('failed');

    const queue = Queue.empty();

    queue.push({
      invoke: () => Task.timeout(10).map(() => {
        throw error;
      }).matchTap({
        resolved: jest.fn(),
        rejected: () => {
          queue.shift();
        },
        canceled: jest.fn(),
      }),
    }, {
      invoke: () => {
        started2();

        return Task.timeout(10).map(() => 64).matchTap({
          resolved: resolved2,
          rejected: rejected2,
          canceled: canceled2,
        });
      },
    }, delayedValueTask(81, 10, {
      resolved: resolved3,
      rejected: rejected3,
      canceled: canceled3,
    }));

    await advanceTime(10);
    await advanceTime(0);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(canceled2).toHaveBeenCalledTimes(0);
    expect(rejected2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(1);

    await advanceTime(10);

    expect(started2).toHaveBeenCalledTimes(0);
    expect(resolved2).toHaveBeenCalledTimes(0);
    expect(resolved3).toHaveBeenCalledWith(81);
    expect(canceled3).toHaveBeenCalledTimes(0);
    expect(rejected3).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);
  });

  it('runs a settled task once when it pushes itself', async () => {
    const canceled = jest.fn();
    const rejected = jest.fn();
    const resolved = jest.fn();

    let runs = 0;

    const queue = Queue.empty();

    const task = {
      invoke: () => {
        runs += 1;

        if (runs === 1) queue.push(task);

        return Task.resolved(42).matchTap({
          resolved,
          rejected,
          canceled,
        });
      },
    };

    queue.push(task);

    await advanceTime(1);

    expect(runs).toBe(1);
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(resolved).toHaveBeenCalledWith(42);
    expect(canceled).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);

    expect(queue).toHaveLength(0);

    await advanceTime(1);

    expect(runs).toBe(1);
    expect(resolved).toHaveBeenCalledTimes(1);

    expect(queue).toHaveLength(0);
  });

  it('runs each settled task once when they enqueue each other', async () => {
    const runs: string[] = [];

    const queue = Queue.empty();

    const first = {
      invoke: () => {
        runs.push('first');

        if (runs.filter((run) => run === 'first').length === 1) queue.push(second);

        return Task.resolved('first');
      },
    };

    const second = {
      invoke: () => {
        runs.push('second');

        if (runs.filter((run) => run === 'second').length === 1) queue.push(first);

        return Task.resolved('second');
      },
    };

    queue.push(first);

    await advanceTime(1);

    expect(runs).toEqual(['first', 'second']);

    expect(queue).toHaveLength(0);

    await advanceTime(1);

    expect(runs).toEqual(['first', 'second']);

    expect(queue).toHaveLength(0);
  });
});
