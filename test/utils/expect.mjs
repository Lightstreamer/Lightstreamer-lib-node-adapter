import assert from 'node:assert';

export function expect(max = 1) {
  let _resolve = null;
  const finished = new Promise(resolve => {
    _resolve = resolve
  })
  return {
    done() {
      if (!--max) _resolve()
    },
    equal(exp, act) {
      return assert.equal(act, exp);
    },
    finished
  }
}