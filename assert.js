function assert(condition, msg, error) {
  if (!condition) {
    if (msg instanceof Error) {
      throw msg;
    } else if (arguments.length > 2) {
      throw new error(msg);
    } else {
      throw new Error(msg);
    }
  }
}

module.exports = assert;
