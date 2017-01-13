var type = require('../type');
var checker = require('../checker');
/**
 *
 *  usage:
 *
 *  match([
 *    [when(pattern1, pattern2), mapping[Value| Function]],
 *    ...
 *    
 *  ])(target[ANY])
 *
 *  pattern could be Array or Object scheme or Predicate Function
 *
 *  @param [[PatternChecker, Mapping]]  pattern match branch, a two items array
 *  @param ANY                          target to be matched
 *  @return Mapping Value               if no pattern matches the target, a error will be thrown
 */
function match(matchers, target) {
  if (arguments.length < 2) {
    return function(target) {
      return match(matchers, target);
    };
  }
  if (!checker(validMatchers, matchers).isValid) {
    throw new Error('[match]:Invalid matchers! Given: ' + matchers);
  }
  var i = 0,
    l = matchers.length,
    mapper, checkResult, matchedIdx = -1;
  for (; i < l; i++) {
    checkResult = matchers[i][0](target);

    if (checkResult.isValid) {
      matchedIdx = i;
      break;
    }
  }
  if (matchedIdx === -1) {
    throw new Error('[match]: No matched pattern is found! Given: ' + target);
  }
  mapper = matchers[matchedIdx][1];
  return type('function', mapper) ?
    mapper.apply(null, [].concat(target, checkResult.value)) : mapper;
}

match.when = when;

module.exports = match;





//make a checker out of patterns,
//will pass if all patterns are matched
function when( /*pattern1, pattern2*/ ) {
  var patterns = [].slice.call(arguments);
  if (patterns.length === 0) {
    return function Any() {
      return true;
    };
  }
  return checker.and.apply(null, patterns);
}

//make a checker out of patterns,
//will pass if all any one of patterns is matched
when.or = function _when_or( /*pattern1, pattern2*/ ) {
  var patterns = [].slice.call(arguments);

  if (patterns.length === 0) {
    return function Any() {
      return true;
    };
  }

  return checker.or.apply(null, patterns);
};



function validMatchers(matchers) {
  if (!type('array', matchers)) {
    return false;
  }

  return matchers.every(function(matcher) {
    return checker([type.isFunction], matcher).isValid;
  });
}
