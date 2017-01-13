var type = require('./type');
var curry = require('./fn/curry');
var slice = require('./slice');

function patternCheck(pattern, target, path) {

  if (type.isFunction(pattern)) {
    return pattern._$preset$_ ? checkPresetFn(pattern, target, path) : checkFunction(pattern, target, path);
  }

  if (type.isArray(pattern)) {
    return checkArray(pattern, target, path);
  }

  if (type.isObject(pattern)) {
    return checkObject(pattern, target, path);
  }

  if (type.isRegExp(pattern)) {
    return checkRegexp(pattern, target, path);
  }


  return checkExact(pattern, target, path);
}

function checkArray(pattern, arr, path) {
  var err = patternCheck(type.isArray, arr, path);
  if (err.isValid === false) {
    return err;
  }
  var patternLen = pattern.length;

  switch (patternLen) {
    case 0:
      return arr.length === 0 ? ok(arr) : error(path, arr, 'empty array');
    case 1:
      var itemPattern = pattern[0];
      var i = 0,
        l = arr.length;
      for (; i < l; i++) {
        err = patternCheck(itemPattern, arr[i], concatPath(path, i));
        if (err.isValid === false) {
          return err;
        }
      }
      return ok(arr);
    default:
      if(patternLen !== arr.length){
        return error(path, arr, '['+pattern.map(stringifyPattern).join(',')+']');
      }
      var j = 0;
      for(; j < patternLen; j++){
        err = patternCheck(pattern[j], arr[j], concatPath(path, j));
        if(err.isValid === false){
          return err;
        }
      }
      return ok(arr);
  }

}

function checkObject(pattern, obj, path) {
  var err = patternCheck(type.isObject, obj, path);
  if (err.isValid === false) {
    return err;
  }

  var patternKeys = Object.keys(pattern),
    i, l, key;
  for (i = 0, l = patternKeys.length; i < l; i++) {
    key = patternKeys[i];

    err = patternCheck(pattern[key], obj[key], concatPath(path, key));
    if (err.isValid === false) {
      return err;
    }
  }
  return ok(obj);
}

function checkPresetFn(pattern, o, path) {
  return pattern(o, path);
}

function checkFunction(pattern, o, path) {
  return pattern(o) ? ok(o) : error(path, o, stringifyPattern(pattern));
}

function checkExact(pattern, o, path) {
  return pattern === o ? ok(o) : error(path, o, stringifyPattern(pattern));
}

function checkRegexp(pattern, o, path) {
  if (!type.isString(o)) {
    return error(path, o, stringifyPattern(pattern));
  }
  var m = o.match(pattern);
  if (!m) {
    return error(path, o, stringifyPattern(pattern));
  }

  return ok(m);
}

function ok(val) {
  return {
    isValid: true,
    value: val
  };
}

function error(kpaths, received, patternStr) {
  kpaths = kpaths || [];
  var err = {
    isValid: false,
    received: received,
    expected: patternStr
  };
  if (kpaths.length > 0) {
    err.path = kpaths.join('.');
  }

  return err;
}

function not(pattern) {
  var patternInfo = 'not(' + stringifyPattern(pattern) + ')';

  function checker_not(o, path) {
    var checkRes = patternCheck(pattern, path);
    return checkRes.isValid ? error(path, o, patternInfo) : ok(o);
  }

  checker_not._$patternInfo$_ = patternInfo;
  checker_not._$preset$_ = true;
  return checker_not;
}

function or() {
  var patterns = slice(arguments);
  var patternInfo = 'or(' + patterns.map(stringifyPattern).join(',') + ')';

  function checker_or(o, path) {
    var i, l = patterns.length,
      pattern, checkRes;
    for (i = 0; i < l; i++) {
      pattern = patterns[i];
      checkRes = patternCheck(pattern, o, path);
      if (checkRes.isValid) {
        return ok(checkRes.value);
      }
    }
    return error(path, o, patternInfo);
  }
  checker_or._$patternInfo$_ = patternInfo;
  checker_or._$preset$_ = true;
  return checker_or;

}

function and() {
  var patterns = slice(arguments);
  var patternInfo = 'and(' + patterns.map(stringifyPattern).join(',') + ')';

  function checker_and(o, path) {
    var i, l = patterns.length,
      pattern, checkRes;
    for (i = 0; i < l; i++) {
      pattern = patterns[i];
      checkRes = patternCheck(pattern, o, path);
      if (checkRes.isValid === false) {
        return error(path, o, patternInfo);
      }
    }
    return ok(checkRes.value);
  }
  checker_and._$patternInfo$_ = patternInfo;
  checker_and._$preset$_ = true;
  return checker_and;
}

var _patternCheck = curry(2, patternCheck);
_patternCheck.or = or;
_patternCheck.and = and;
_patternCheck.not = not;

module.exports = _patternCheck;

//helpers
function concatPath(paths, p) {
  paths = type.isArray(paths) ? paths : paths != null ? [paths] : [];
  return paths.concat(p);
}

var typeCheckerNames = ['String', 'Function', 'Array', 'Undefined', 'Null', 'NaN', 'Object', 'RegExp', 'Arguments', 'Number', 'Boolean', 'Any'];

function stringifyPattern(p) {
  var idx = typeCheckerNames.map(function(name) {
    return type['is' + name];
  }).indexOf(p);
  if (idx > -1) {
    return typeCheckerNames[idx].toLowerCase();
  }
  switch (type(p)) {
    case 'function':
      return p._$patternInfo$_ || p.name || p.toString();
    case 'regexp':
      return (new RegExp(p)).toString();
    case 'array':
      return '['+p.map(stringifyPattern).join(',')+']';
    case 'object':
      return JSON.stringify(Object.keys(p).reduce(function(m, k){
        m[k] = stringifyPattern(p[k]);
        return m;
      }, {}));
    default:
      return 'val(' + p + ')';
  }
}

//test
// if(require.main === module){
// var pattern = {
//   a: or({a1: type.isBoolean}, [and(type.isNumber, function greaterThan4(n){return n > 4;}), type.isString]),
//   b: {
//     c: /a*b/
//   }
// };

// var t = {
//   a: {
//     a1: true
//   },
//   b: {
//     c: '2'
//   }
// };
// console.log(patternCheck(pattern, t));

// }

