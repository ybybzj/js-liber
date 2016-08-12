var r$ = require('../rstream');
var curry = require('../../fn/curry');
function apply(s1, s2) {
  return r$.combine(function(s1, s2) {
    return s2()(s1());
  },[s1, s2]);
}
module.exports = curry(2, apply);
