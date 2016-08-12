var R = require('../rstream');
var curry = require('../../fn/curry');

function sequence(interval, seq) {
  var s = R();
  if (seq.length === 0) {
    s.end(true);
  }
  setTimeout(function emit() {
    var val = seq.shift();
    s(val);
    if (seq.length === 0) {
      s.end(true);
    }
    if (!s.end()) {
      setTimeout(emit, interval);
    }
  }, interval);
  return s;
}
module.exports = curry(2, sequence);
