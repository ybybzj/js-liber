var slice = require('../slice');
var assertFn = function assertFn(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Function is expected here! But given: ' + fn);
  }
};
var merge = function merge() {
  var fns = slice(arguments);
  fns.forEach(assertFn);
  if (fns.length === 1) return fns[0];
  return function merged() {
    var args = slice(arguments),
      i = 0,
      l = fns.length,
      fn;
    for (; i < l; i++) {
      fn = fns[i];
      fn.apply(this, args);
    }
  };
};

module.exports = merge;
