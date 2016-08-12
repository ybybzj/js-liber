var Dict = require('../adt/dict');

function memoize(func, hasher) {
  var memo;
  if (hasher == null) {
    hasher = identity;
  }
  memo = new Dict();
  return function() {
    var key;
    key = hasher.apply(this, arguments);
    if (!(memo.has(key))) {
      memo.set(key, func.apply(this, arguments));
    }
    return memo.get(key);
  };
}

function identity(o) {
  return o;
}
module.exports = memoize;
