var R = require('../rstream');
function merge(ss) {
  var s1 = ss[0], s2 = ss[1];
  var s = R.immediate(R.combine(function(s1, s2, self, changed) {
    if(changed[0]){
      self(changed[0]());
    }else{
      return s1.hasVal ? s1() : s2();
    }
  }, [s1, s2]));
  R.endsOn(R.combine(function() {
    return true;
  }, [s1.end, s2.end]), s);
  return s;
}
module.exports = merge;
