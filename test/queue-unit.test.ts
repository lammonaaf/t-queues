import 'regenerator-runtime/runtime';

import { Maybe } from 't-tasks';

import { queue } from '../';

describe('queue', () => {
  it('queue', () => {
    expect(Maybe.isNothing(queue)).toBeTruthy();
    expect(queue.isNothing()).toBeTruthy();
  });
});
