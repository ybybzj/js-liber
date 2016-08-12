var R = require('../rstream');
var curry = require('../../fn/curry');
var filter = function(fn, s) {
  return R.combine(function(s, self) {
    if (fn(s())) self(s.val);
  }, [s]);
};
module.exports = curry(2, filter);
