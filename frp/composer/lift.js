var R = require('../rstream');
var slice = require('../../slice');

function lift(f /*streams...*/ ) {
  var streams = slice(arguments, 1);
  var vals = [];
  return R.combine(function() {
    for (var i = 0, l = streams.length; i < l; i++) {
      vals[i] = streams[i]();
    }
    return f.apply(null, vals);
  }, streams);
}
module.exports = lift;
