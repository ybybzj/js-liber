var R = require('../rstream');

function fromPromise(promise) {
  var s = R();

  function onVal(val) {
    s(val);
    s.end(true);
  }
  promise.then(onVal)["catch"](onVal);
  return s;
}
module.exports = fromPromise;
