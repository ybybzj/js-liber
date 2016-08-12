var R = require('../rstream');
function $dropRepeats(s){
  var prevVal = {};
  return R.combine(function(s, self){
    if(s.val !== prevVal){
      self(s.val);
      prevVal = s.val;
    }

  }, [s]);
}
module.exports = $dropRepeats;
