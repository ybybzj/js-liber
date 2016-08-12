var R = require('../rstream');
var merge = require('./merge');

function switchlatest(s) {
  var inner;
  return R.combine(function(s, self) {
    inner = s();
    R.endsOn(merge([s, inner.end]), R.combine(function(inner) {
      self(inner());
    }, [inner]));
  }, [s]);
}
module.exports = switchlatest;
