var curry = require('../fn/curry');
var type = require('../type');
var assert = require('../assert');

function each(fn, o) {
  assert(type(fn) === 'function', '[each] first param should a function!', TypeError);
  assert(Object(o) === o, '[each] second param should an object or an array!', TypeError);
  var keys, i, l, k;
  if (type(o) === 'array') {
    o.forEach(fn);
  } else if (type(o) === 'object') {
    keys = Object.keys(o);
    for(i = 0, l= keys.length; i < l; i++){
      k = keys[i];
      fn(o[k], k, o);
    }
  }
}
module.exports = curry(2, each);
