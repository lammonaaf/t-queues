import { Task, TaskFunction } from 't-tasks';

export type Invokable<T> = { invoke: TaskFunction<[], T> };

export interface Queue<T extends Invokable<any>> {
  push(...tasks: T[]): number;
  unshift(...tasks: T[]): number;

  shift(): void;
  clear(): void;

  readonly length: number;
}

export namespace Queue {
  export function empty<T extends Invokable<any>>(comparator?: (a: T, b: T) => boolean): Queue<T> {
    return new QueueClass<T>(comparator);
  }

  export function of<T extends Invokable<any>>(tasks: T[], comparator?: (a: T, b: T) => boolean): Queue<T> {
    const queue = new QueueClass<T>(comparator);

    queue.push(...tasks);

    return queue;
  }
}

const monitored = <T>(value: T, handler: (c: T, v: T) => T) => new Proxy<{ value: T }>({ value }, {
  set: (t, p, v, r) => {
    const c = Reflect.get(t, p, r);
    const V = handler(c, v);
    return Reflect.set(t, p, V, r)
  },
});

const debounced = (handler: () => void) => {
  let handle: NodeJS.Timeout;

  return () => {
    clearTimeout(handle);

    handle = setTimeout(handler, 0);
  }
}

const reportError = (error: unknown) => {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
}

class QueueClass<T extends Invokable<any>> implements Queue<T> {
  private current: T | null = null;

  private generation = new Set<T>();

  private observer = debounced(() => this.observe());

  private _task = monitored<Task<any> | null>(null, (_, c) => {
    this.observer();

    return c;
  });
  private _queue = monitored<T[]>([], (p, c) => {
    this.observer();

    const filtered = c.filter((a, index, rest) => {
      if (this.generation.has(a) && !p.includes(a)) return false;

      if (this.current && !this.task?.resolved() && this.comparator(a, this.current)) return false;

      const first = rest.findIndex((b) => this.comparator(a, b));

      return first < 0 || index === first;
    });

    return filtered;
  });

  observe() {
    this.generation.clear();

    try {
      while (this.task === null && this.queue.length > 0) {
        this._load();
      }
    } finally {
      this.generation.clear();
    }
  }

  get task(): Task<any> | null {
    return this._task.value;
  }

  get queue(): T[] {
    return this._queue.value;
  }

  get length(): number {
    return this.queue.length + (this.task ? 1 : 0);
  }

  constructor(private comparator: (a: T, b: T) => boolean = (a, b) => a === b) {}

  _shift() {
    const [first, ...rest] = this.queue;

    this._queue.value = rest;

    return first;
  }

  _load() {
    const first = this._shift();

    if (!first) return;

    this.current = first;
    this.generation.add(first);

    let running: Task<any>;
    try {
      running = first.invoke();
    } catch (error) {
      if (this.current === first) this.current = null;

      reportError(error);
      return;
    }

    if (this.current !== first) {
      if (!running.resolved()) running.cancel();

      return;
    }

    if (running.resolved()) {
      this.current = null;

      return;
    }

    const onDone = () => {
      if (this._task.value !== running) return;

      this.current = null;
      this._task.value = null;
    };

    this._task.value = running;
    running.matchTap({
      resolved: onDone,
      rejected: onDone,
      canceled: onDone,
    });
  }

  _push(__tasks: T[]) {
    this._queue.value = [...this.queue, ...__tasks];
  }

  _unshift(__tasks: T[]) {
    this._queue.value = [...__tasks, ...this.queue];
  }

  push(...__tasks: T[]) {
    this._push(__tasks);

    return this.length;
  }

  unshift(...__tasks: T[]) {
    this._unshift(__tasks);

    return this.length;
  }

  shift() {
    if (this.task && !this.task.resolved()) this.task.cancel();
    else if (!this.task && this.current) this.current = null;
    else if (this.queue.length > 0) this._shift();
  }

  clear() {
    const running = this.task;

    this._queue.value = [];
    this.current = null;

    if (running) this._task.value = null;

    running?.cancel();
  }
}
