var R = require('../rstream');
var curry = require('../../fn/curry');

function debounce(wait, s) {
  var immediate;
  if (typeof wait === 'object') {
    immediate = !!wait.immediate;
    wait = wait.wait;
  }
  if (typeof wait !== 'number') {
    throw new TypeError('[R debounce]Invalid options, option "wait" must be a number!');
  }
  var lastVal, timeoutId, isTimeout = true;
  return R.combine(function(s, self) {
    lastVal = s();
    if (isTimeout && immediate) {
      isTimeout = false;
      self(lastVal);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function() {
        self(lastVal);
        isTimeout = true;
      }, wait);
    }
  }, [s]);
}
module.exports = curry(2, debounce);
