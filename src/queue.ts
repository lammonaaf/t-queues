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

class QueueClass<T extends Invokable<any>> implements Queue<T> {
  private observer = debounced(() => this.observe());

  private _task = monitored<Task<any> | null>(null, (_, c) => {
    this.observer();

    return c;
  });
  private _queue = monitored<T[]>([], (p, c) => {
    this.observer();

    const filtered = c.filter((a, index, rest) => index <= rest.findIndex((b) => this.comparator(a, b)));

    return filtered.length === p.length && filtered.every((a, index) => this.comparator(a, p[index])) ? p : filtered;
  });

  observe() {
    if (this.task === null && this.queue.length > 0) {
      this._load();
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

    const onDone = () => this._task.value = null;

    this._task.value = first.invoke().matchTap({
      resolved: onDone,
      rejected: onDone,
      canceled: onDone,
    });
  }

  _cancel() {
    this.task?.cancel();
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
    this._cancel();
  }

  clear() {
    this._queue.value = [];
  }
}
