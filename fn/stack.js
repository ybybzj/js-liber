var type = require('../type');
var slice = require('../slice');
var assert = require('../assert');
var flatten = require('../l/flatten');

function endStack() {
  console.log.apply(console, ['stack end: '].concat(slice(arguments)));
}

function composeBase( /*..., next, input*/ ) {
  var argsObj = _extractArgs(arguments, ['*contexts', 'next', 'input']);
  argsObj.next(argsObj.input);
}

function makeStack( /*context...*/ ) {
  var contexts = slice(arguments);
  return function $makeStack() {
    var layers = slice(arguments),
      stack = composeStack.apply(null, layers);
    return function $stack(input) {
      return stack.apply(null, contexts.concat([endStack, input]));
    };
  };
}

function composeStack( /*fn...*/ ) {
  if (arguments.length == 1) {
    var args = arguments[0];
    if (type(args) === 'array') {
      return composeStack.apply(null, args);
    } else {
      return args;
    }
  }

  var stack = composeBase;
  flatten(slice(arguments), true).reverse().forEach(function(layer) {
    var child = stack;
    stack = function( /*..., next, input*/ ) {
      var argsObj, contexts, next, input, args;
      try {
        argsObj = _extractArgs(arguments, ['*contexts', 'next', 'input']);
        contexts = argsObj.contexts;
        next = argsObj.next;
        input = argsObj.input;
        args = contexts.concat([function(nextInput) {
          child.apply(null, contexts.concat([next, nextInput]));
        }, input]);

        layer.apply(null, args);
      } catch (err) {
        makeStack.onError(err);
      }
    };
  });
  return stack;
}

makeStack.onError = function(error) {
  console.log(error);
};

makeStack.compose = composeStack;

module.exports = makeStack;

//helper
/**
 * extract args from arguments according to patterns
 * @param  {[type]} args     arguments
 * @param  {[type]} patterns is an array of string. 
 *                           like: ['*arr', 'a', 'b'], ['a', '*arr', 'b'],
 *                           or ['a', 'b', '*arr']
 *                           can only have one '*..' like pattern 
 * @return {[type]}          [description]
 */
function _extractArgs(args, patterns) {
  args = slice(args);
  var hasSpreadOccured = false,
    spreadPattern, leadingPatterns = [],
    tailPatterns = [],
    result = {};
  patterns.forEach(function(pattern) {
    if (pattern.indexOf('*') === 0) {
      assert(hasSpreadOccured === false, '[_extractArgs] can only have one pattern start with "*"!');
      hasSpreadOccured = true;
      spreadPattern = pattern.slice(1);
      return;
    }
    if (hasSpreadOccured) tailPatterns.push(pattern);
    else leadingPatterns.push(pattern);
  });
  if (leadingPatterns.length) {
    leadingPatterns.forEach(function(p) {
      result[p] = args.shift();
    });
  }
  if (tailPatterns.length) {
    tailPatterns.reverse().forEach(function(p) {
      result[p] = args.pop();
    });
  }
  if (spreadPattern) {
    result[spreadPattern] = args;
  }
  return result;
}
