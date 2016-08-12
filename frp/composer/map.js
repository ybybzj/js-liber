var R = require('../rstream');
var curry = require('../../fn/curry');
var type = require('../../type');
function map(f, s) {
  if(type.isArray(s)){
    return s.map(function(_s){
      return map(f, _s);
    });
  }
  return R.combine(function(s, self) {
    self(f(s.val));
  }, [s]);
}
module.exports = curry(2, map);
