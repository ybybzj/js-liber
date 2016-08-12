var getHash = require('../getHash');
var slice = require('../slice');
var placeholder = getHash({
  placeholder: 'curry'
});

function curry(arity, fn) {
  switch (arguments.length) {
    case 0:
      return function(fn) {
        return curry(fn);
      };
    case 1:
      if (typeof arity === 'function') {
        return curry(-1, arity);
      } else {
        return function(fn) {
          return curry(arity, fn);
        };
      }
  }
  if (typeof arity !== 'number') {
    throw new TypeError('[curry] first argument should be a number! given: ' + arity);
  }
  if (typeof fn !== 'function') {
    throw new TypeError('[curry] second argument should be a function! given: ' + fn);
  }
  arity = arity > -1 ? arity : fn.length;
  if (arity === 0) return fn;
  return function curried() {
    var n = arguments.length;
    var shortfall = arity - n;
    var idx = n;
    while (--idx >= 0) {
      if (arguments[idx] === placeholder) {
        shortfall += 1;
      }
    }
    if (shortfall <= 0) {
      return fn.apply(this, arguments);
    } else {
      var initialArgs = slice(arguments);
      return curry(shortfall, function() {
        var currentArgs = slice(arguments);
        var combinedArgs = [];
        var idx = -1;
        while (++idx < n) {
          var val = initialArgs[idx];
          combinedArgs[idx] = val === placeholder ? currentArgs.shift() : val;
        }
        return fn.apply(this, combinedArgs.concat(currentArgs));
      });
    }
  };
}
curry.$ = placeholder;
module.exports = curry;
