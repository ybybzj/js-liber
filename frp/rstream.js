/**
 *
 *                  _____ _           _    __            _
 *                 |  ___| |_   _  __| |  / _| ___  _ __| | __
 *                 | |_  | | | | |/ _` | | |_ / _ \| '__| |/ /
 *                 |  _| | | |_| | (_| | |  _| (_) | |  |   <
 *                 |_|   |_|\__, |\__,_| |_|  \___/|_|  |_|\_\
 *                          |___/
 *
 *  credits to: https://github.com/paldepind/flyd
 */

var curry = require('../fn/curry');
var slice = require('../slice');
// Utility
function isFunction(o){
  return !!(o && o.constructor && o.call && o.apply);
}

function trueFn(){
  return true;
}

function bindFn(fn){
  return function(){
    var s = this,
      args = slice(arguments);
    return fn.apply(null, args.concat(s));
  };
}

// Globals
var toUpdate = [];
var inStream;
var order = [];
var orderNextIdx = -1;
var flushing = false;

var streamMixins = {
  on: bindFn(_on),
  log: bindFn(log)
};
/*------------ API ---------*/
/**
 * Creates a new stream
 *
 * __Signature__: `a -> Stream a`
 *
 * @name stream
 * @param {*} initialValue - (Optional) the initial value of the stream
 * @return {stream} the stream
 *
 * @example
 * var n = stream(1); // Stream with initial value `1`
 * var s = stream(); // Stream with no initial value
 */
function stream(initialValue){
  var endStream = createDependentStream([], trueFn);
  var s = createStream();
  s.end = endStream;
  s.fnArgs = [];
  endStream.listeners.push(s);
  if(arguments.length > 0) {
    s(initialValue);
  }
  return s;
}

/**
 * Create a new dependent stream
 *
 * __Signature__: `(...Stream * -> Stream b -> b) -> [Stream *] -> Stream b`
 *
 * @name combine
 * @param {Function} fn - the function used to combine the streams
 * @param {Array<stream>} dependencies - the streams that this one depends on
 * @return {stream} the dependent stream
 *
 * @example
 * var n1 = stream(0);
 * var n2 = stream(0);
 * var max = combine(function(n1, n2, self, changed) {
 *   return n1() > n2() ? n1() : n2();
 * }, [n1, n2]);
 */
var combine = curry(2, _combine);
function _combine(fn, streams){
  var s, deps, depEndStreams;
  var i, l = streams,  ds;

  var endStream = createDependentStream([], trueFn);
  deps = [];
  depEndStreams = [];
  for(i = 0, l = streams.length; i < l; i++){
    ds = streams[i];
    if(ds !== undefined){
      deps.push(ds);
      if(ds.end !== undefined){
        depEndStreams.push(ds.end);
      }
    }
  }
  s = createDependentStream(deps, fn);
  s.depsChanged = [];
  s.fnArgs = s.deps.concat([s, s.depsChanged]);
  s.end = endStream;
  endStream.listeners.push(s);
  addListeners(depEndStreams, endStream);
  endStream.deps = depEndStreams;
  updateStream(s);
  return s;
}

/**
 * Returns `true` if the supplied argument is a Flyd stream and `false` otherwise.
 *
 * __Signature__: `* -> Boolean`
 *
 * @name isStream
 * @param {*} value - the value to test
 * @return {Boolean} `true` if is a Flyd streamn, `false` otherwise
 *
 * @example
 * var s = stream(1);
 * var n = 1;
 * isStream(s); //=> true
 * isStream(n); //=> false
 */

function isStream(s){
  return isFunction(s) && s._$type$_ === 'r$';
}

/**
 * Invokes the body (the function to calculate the value) of a dependent stream
 *
 * By default the body of a dependent stream is only called when all the streams
 * upon which it depends has a value. `immediate` can circumvent this behaviour.
 * It immediately invokes the body of a dependent stream.
 *
 * __Signature__: `Stream a -> Stream a`
 *
 * @name immediate
 * @param {stream} stream - the dependent stream
 * @return {stream} the same stream
 *
 * @example
 * var s = stream();
 * var hasItems = immediate(combine(function(s) {
 *   return s() !== undefined && s().length > 0;
 * }, [s]);
 * console.log(hasItems()); // logs `false`. Had `immediate` not been
 *                          // used `hasItems()` would've returned `undefined`
 * s([1]);
 * console.log(hasItems()); // logs `true`.
 * s([]);
 * console.log(hasItems()); // logs `false`.
 */
function immediate(s){
  if(s.depsMet === false){
    s.depsMet = true;
    updateStream(s);
  }

  return s;
}

/**
 * Changes which `endsStream` should trigger the ending of `s`.
 *
 * __Signature__: `Stream a -> Stream b -> Stream b`
 *
 * @name endsOn
 * @param {stream} endStream - the stream to trigger the ending
 * @param {stream} stream - the stream to be ended by the endStream
 * @param {stream} the stream modified to be ended by endStream
 *
 * @example
 * var n = stream(1);
 * var killer = stream();
 * // `double` ends when `n` ends or when `killer` emits any value
 * var double = endsOn(merge(n.end, killer), combine(function(n) {
 *   return 2 * n();
 * }, [n]);
*/

function endsOn(endS, s){
  detachDeps(s.end);
  endS.listeners.push(s.end);
  s.end.deps.push(endS);
  return s;
}

/**
 * Get a human readable view of a stream
 * @name stream.toString
 * @return {String} the stream string representation
 */
function streamToString() {
  return 'stream(' + this.val + ')';
}

/**
 * Listen to stream events
 *
 * Use `on` for doing side effects in reaction to stream changes.
 * Use the returned stream only if you need to manually end it.
 *
 * __Signature__: `(a -> result) -> Stream a -> Stream undefined`
 *
 * @name on
 * @param {Function} cb - the callback
 * @param {stream} stream - the stream
 * @return {stream} an empty stream (can be ended)
 */
var on = curry(2, _on);
function _on(f, s){
  _combine(function(s){ f(s.val); }, [s]);
  return s;
}

/**
 * Print log info according to stream events, including end event
 * __Signature__: `(s, Stream a) -> undefined`
 *
 * @name log
 * @param {String} msg - the prepend message
 * @param {stream} stream - the stream
 * @return {undefined}
 */

function log(msg, s){
  if(arguments.length === 1){
    s = msg;
    msg = null;
  }

  _combine(function(){
    console.log((msg ? msg + ' - ' : '') + s.toString());
  }, [s]);
  _combine(function(){
    console.log((msg ? msg + ' - ' : '') + 'stream<End>');
  }, [s.end]);
  return s;
}

stream.isStream = isStream;
stream.combine = combine;
stream.on = on;
stream.log = log;
stream.immediate = immediate;
stream.endsOn = endsOn;
//must be called before any stream creation
stream.mixin = function(name, fn){
  if(typeof name === 'object'){
    Object.keys(name).forEach(function(k){
      stream.mixin(k, name[k]);
    });
    return;
  }

  streamMixins[name] = fn;
};

module.exports = stream;
/*---------------------- Private ---------------------*/




/**
 * @private
 * Create a stream with no dependencies and no value
 * @return {Function} a reactive stream
 */
function createStream(){
  var mixinKeys = Object.keys(streamMixins);

  function s(n){
    if(arguments.length === 0) {
      return s.val;
    }
    updateStreamValue(s, n);
    return s;
  }

  s._$type$_ = 'r$';
  s.hasVal = false;
  s.val = undefined;
  s.vals = [];
  s.listeners = [];
  s.queued = false;
  s.end = undefined;
  s.toString = streamToString;

  if(mixinKeys.length){
    mixinKeys.forEach(function(name){
      s[name] = streamMixins[name];
    });
  }
  return s;
}

/**
 * @private
 * Create a dependent stream
 * @param {Array<stream>} dependencies - an array of the streams
 * @param {Function} fn - the function used to calculate the new stream value
 * from the dependencies
 * @return {stream} the created stream
 */
function createDependentStream(deps, fn){
  var s = createStream();
  s.fn = fn;
  s.deps = deps;
  s.depsMet = false;
  s.depsChanged = deps.length > 0 ? []: undefined;
  s.shouldUpdate = false;
  addListeners(deps, s);
  return s;
}

/**
 * @private
 * Check if all the dependencies have values
 * @param {stream} stream - the stream to check depencencies from
 * @return {Boolean} `true` if all dependencies have vales, `false` otherwise
 */

function initialDepsNotMet(stream){
  stream.depsMet = stream.deps.every(function(s){
    return s.hasVal;
  });

  return !stream.depsMet;
}

/**
 * @private
 * Update a dependent stream using its dependencies in an atomic way
 * @param {stream} stream - the stream to update
 */
function updateStream(s) {
  if((s.depsMet !== true && initialDepsNotMet(s)) ||
    (s.end !== undefined && s.end.val === true)
    ) {
      return true;
    }

  if(inStream !== undefined){
    toUpdate.push(s);
    return;
  }

  inStream = s;

  if(s.depsChanged) s.fnArgs[s.fnArgs.length - 1] = s.depsChanged;

  var returnVal;
  try{
    returnVal = s.fn.apply(s.fn, s.fnArgs);
  }catch(err){
    returnVal = err;
  }

  if(returnVal !== undefined){
    s(returnVal);
  }

  inStream = undefined;
  if(s.depsChanged !== undefined){
    s.depsChanged = [];
  }

  s.shouldUpdate = false;

  if(flushing === false) {
    flushUpdate();
  }
}

/**
 * @private
 * Update the dependencies of a stream
 * @param {stream} stream
 */
function updateDeps(s){
  var i, l, o, lsr;
  var listeners = s.listeners;
  for(i = 0, l = listeners.length; i < l; i++){
    lsr = listeners[i];
    if(lsr.end === s){
      endStream(lsr);
    } else {
      if(lsr.depsChanged !== undefined){
        lsr.depsChanged.push(s);
      }
      lsr.shouldUpdate = true;
      depsInQueue(lsr);
    }
  }

  for(; orderNextIdx >= 0; --orderNextIdx){
    o = order[orderNextIdx];
    if(o.shouldUpdate === true){
      updateStream(o);
    }
    o.queued = false;
  }
}

/**
 * @private
 * Add stream dependencies to the global `order` queue.
 * @param {stream} stream
 * @see updateDeps
 */
function depsInQueue(s){
  var i, l;
  var listeners = s.listeners;

  if(s.queued === false){
    s.queued = true;
    for(i = 0, l = listeners.length; i < l; i++){
      depsInQueue(listeners[i]);
    }
    order[++orderNextIdx] = s;
  }
}

/**
 * @private
 */
function flushUpdate(){
  flushing = true;
  while(toUpdate.length > 0){
    var s = toUpdate.shift();
    if(s.vals.length > 0){
      s.val = s.vals.shift();
    }
    updateDeps(s);
  }
  flushing = false;
}

/**
 * @private
 * Push down a value into a stream
 * @param {stream} stream
 * @param {*} value
 */
function updateStreamValue(s, n){
  if(n !== undefined && n !== null && isFunction(n.then)){
    n.then(s)['catch'](s);
    return;
  }
  s.val = n;
  s.hasVal = true;
  if(inStream === undefined){
    flushing = true;
    updateDeps(s);
    if(toUpdate.length > 0){
      flushUpdate();
    }else{
      flushing = false;
    }
  } else if(inStream === s){
    markListeners(s, s.listeners);
  } else {
    s.vals.push(n);
    toUpdate.push(s);
  }
}

/**
 * @private
 */

function markListeners(s, listeners){
  var i, l = listeners.length, lsr;
  for(i = 0; i < l; i++){
    lsr = listeners[i];
    if(lsr.end !== s){
      if(lsr.depsChanged !== undefined){
        lsr.depsChanged.push(s);
      }

      lsr.shouldUpdate = true;
    } else {
      endStream(lsr);
    }
  }
}

/**
 * @private
 * Add dependencies to a stream
 * @param {Array<stream>} dependencies
 * @param {stream} stream
 */

function addListeners(deps, s){
  deps.forEach(function(dep){
    dep.listeners.push(s);
  });
}

/**
 * @private
 * Removes an stream from a dependency array
 * @param {stream} stream
 * @param {Array<stream>} dependencies
 */
function removeListener(s, listeners){
  var idx = listeners.indexOf(s);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length -= 1;
}

/**
 * @private
 * Detach a stream from its dependencies
 * @param {stream} stream
 */
function detachDeps(s){
  s.deps.forEach(function(dep){
    removeListener(s, dep.listeners);
  });
  s.deps.length = 0;
}

/**
 * @private
 * Ends a stream
 */
function endStream(s){
  if(s.deps !== undefined){
    detachDeps(s);
  }

  if(s.end !== undefined){
    detachDeps(s.end);
  }
}
