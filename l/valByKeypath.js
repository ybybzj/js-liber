var assert = require('../assert');
var type = require('../type');
var curry = require('../fn/curry');

function _valByKeypath(kpath, o) {
  if (type(kpath) === 'number' && type(o) === 'array') {
    return o[kpath];
  }
  assert(typeof kpath === 'string', 'kpath should be a string!', TypeError);
  kpath = kpath.trim();
  if (kpath.length === 0) return o;
  if(!type.isObject(o)){
    o = Object(o);
  }
  assert(Object(o) === o, 'o should be an object! ', TypeError);
  var paths = kpath.split('.'),
    i = 0;
  if (paths.length === 1) {
    return o[kpath];
  }
  while (i < paths.length) {
    o = o[paths[i]];
    if (Object(o) !== o) break;
    i++;
  }
  if (i < paths.length - 1) return undefined;
  return o;
}

function _updateKeyPath(kpath, o, data, fn) {
  if(!type.isObject(o)){
    o = Object(o);
  }
  assert(type(kpath) === 'string', 'kpath should be a string!', TypeError);
  assert(Object(o) === o, 'o should be an object!', TypeError);
  kpath = kpath.trim();
  if (kpath.length === 0) return;
  var paths = kpath.split('.'),
    i = 0,
    p, _o;
  while (i < paths.length - 1) {
    p = paths[i];
    _o = o[p];
    if (Object(_o) !== _o) {
      if (_o !== undefined) {
        throw new Error('[updateKeyPath] invalid keypath! Value with path "' + paths.slice(0, i + 1).join('.') + '" should be an object, but given: ' + _o);
      } else {
        o[p] = {}; // ensure keypath is valid
      }
    }
    o = o[p];
    i++;
  }
  o[paths[i]] = type(fn) === 'function' ? fn(o[paths[i]], data) : data;
}

function valByKeypath(kpath, o, data, fn) {
  
  if (arguments.length < 3) {
    return _valByKeypath(kpath, o);
  } else {
    return _updateKeyPath(kpath, o, data, fn);
  }
}

module.exports = curry(2, valByKeypath);