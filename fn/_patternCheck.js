var type = require('../type');

function patternCheck(pattern, target) {

  if (type.isFunction(pattern)) {
    return checkFunction(pattern, target);
  }

  if (type.isArray(pattern)) {
    return checkArray(pattern, target);
  }

  if (type.isObject(pattern)) {
    return checkObject(pattern, target);
  }

  if (type.isRegExp(pattern)) {
    return checkRegexp(pattern, target);
  }


  return checkExact(pattern, target);
}

function checkArray(pattern, arr) {
  if (!type.isArray(arr)) {
    return false;
  }
  return pattern.every(function(p, i) {
    return patternCheck(p, arr[i]);
  });
}

function checkObject(pattern, obj) {
  if (!type.isObject(obj)) {
    return false;
  }

  return Object.keys(pattern).every(function(key) {
    return (key in obj) && patternCheck(pattern[key], obj[key]);
  });
}

function checkFunction(pattern, o) {
  return pattern(o);
}

function checkExact(pattern, o) {
  return pattern === o;
}

function checkRegexp(pattern, o) {
  if (!type.isString(o)) {
    return false;
  }
  var m = o.match(pattern);
  if (!m) {
    return false;
  }
  return m;
}

module.exports = patternCheck;
