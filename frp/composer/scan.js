var R = require('../rstream');
var curry = require('../../fn/curry');

function scan(f, acc, s) {
  var ns = R.combine(function(s) {
    return (acc = f(acc, s()));
  }, [s]);
  if (!ns.hasVal) ns(acc);
  return ns;
}
module.exports = curry(3, scan);
