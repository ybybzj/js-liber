var R = require('../rstream');
var curry = require('../../fn/curry');

function throttle(wait, s) {
  var leading, trailing;
  if (typeof wait === 'object') {
    leading = wait.leading == null ? true : !!wait.leading;
    trailing = wait.trailing == null ? true : !!wait.trailing;
    wait = wait.wait;
  }
  if (typeof wait !== 'number') {
    throw new TypeError('[R throttle]Invalid options, option "wait" must be a number!');
  }
  var lastVal = [],
    selfEnd$ = R(),
    isFirst = true;
  var throttle$ = R.combine(function(s, self) {
    lastVal.push(s());
    if (isFirst) {
      isFirst = false;
      if (leading) {
        self(lastVal.pop());
      }
      setTimeout(function checkLastVal() {
        self(lastVal.pop());
        lastVal.length = 0;

        if (!s.end()) {
          setTimeout(checkLastVal, wait);
        } else {
          selfEnd$(true);
        }
      }, wait);
    }
  }, [s]);
  if(trailing){
    R.endsOn(selfEnd$, throttle$);
  }
  return throttle$;
}
module.exports = curry(2, throttle);
