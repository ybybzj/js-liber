var type = require('../type');
var patternCheck = require('./_patternCheck');
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
  if (!patternCheck(validMatchers, matchers)) {
    throw new Error('[match]:Invalid matchers! Given: ' + matchers);
  }
  var i = 0,
    l = matchers.length,
    mapper, checkResult, matchedIdx = -1;
  for (; i < l; i++) {
    checkResult = matchers[i][0](target);

    if (!!checkResult) {
      matchedIdx = i;
      break;
    }
  }
  if (matchedIdx === -1) {
    throw new Error('[match]: No matched pattern is found! Given: ' + target);
  }
  mapper = matchers[matchedIdx][1];
  return type('function', mapper) ?
    mapper.apply(null, [].concat(target, checkResult)) : mapper;
}

match.when = when;

module.exports = match;





//make a checker out of patterns,
//will pass if all patterns are matched
function when( /*pattern1, pattern2*/ ) {
  var patterns = [].slice.call(arguments);
  if (patterns.length === 0) {
    return function() {
      return true;
    };
  }
  return function _checker(target) {
    return patterns.reduce(function(m, p) {
      return m && patternCheck(p, target);
    }, true);
  };
}

//make a checker out of patterns,
//will pass if all any one of patterns is matched
when.or = function _when_or( /*pattern1, pattern2*/ ) {
  var patterns = [].slice.call(arguments);

  if (patterns.length === 0) {
    return function() {
      return true;
    };
  }

  return function _checker_or(target) {
    var i = 0,
      l = patterns.length,
      checkResult;
    for (; i < l; i++) {
      checkResult = patternCheck(patterns[i], target);
      if (!!checkResult) {
        return checkResult;
      }
    }
    return false;
  };
};



function validMatchers(matchers) {
  if (!type('array', matchers)) {
    return false;
  }

  return matchers.every(function(matcher) {
    return patternCheck([type.isFunction], matcher);
  });
}
