var extend = require('../extend');
var slice = require('../slice');
var assert = require('../assert');
var type = require('../type');

var defaultOptions = {
  promiseCntr: Promise,
  callbackStyle: 'node' // node(default)|normal
};
var Dict = require('../adt/dict');
var fnsMap = new Dict();

function pfy(opts) {
  opts = extend({}, defaultOptions, opts);

  function $pfy(cb, ctx) {
    var pfyFn = fnsMap.get(cb);
    if (typeof pfyFn === 'function') {
      return pfyFn;
    }

    pfyFn = function() {
      var args = slice(arguments);
      var that = ctx || this;
      return new opts.promiseCntr(function(resolve, reject) {
        cb.apply(that, args.concat(function(err) {
          var results;
          if (opts.callbackStyle === 'node') {
            if (err) {
              return reject(err);
            } else {
              results = slice(arguments, 1);
            }
          } else {
            results = slice(arguments);
          }

          return results.length > 1 ? resolve(results) : resolve(results[0]);
        }));
      });
    };

    fnsMap.set(cb, pfyFn);
    return pfyFn;
  }

  $pfy.obj = function(obj, keys) {
    assert(Object(obj) === obj, '[fn/pfy.obj] invalid argument! should be an object, given: ' + obj);

    function needPfy(obj, key) {
      if (!type.isFunction(obj[key])) {
        return false;
      }
      return type.isArray(keys) && keys.length ?
        (keys.indexOf(key) !== -1 ? true : false) :
        true;
    }
    return Object.keys(obj).reduce(function(result, key) {
      if (needPfy(obj, key)) {
        result[key] = $pfy(obj[key], obj);
      }

      return result;
    }, {});
  };
  return $pfy;
}


module.exports = pfy;
