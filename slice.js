module.exports = function slice(args, from, to) {
  switch (arguments.length) {
    case 1:
      return slice(args, 0, args.length);
    case 2:
      return slice(args, from, args.length);
    default:
      var list = [];
      var idx = -1;
      var len = Math.max(0, Math.min(args.length, to) - from);
      while (++idx < len) {
        list[idx] = args[from + idx];
      }
      return list;
  }
};
