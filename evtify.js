var type = require('./type');
var assert = require('./assert');
var extend = require('./extend');
var slice = Array.prototype.slice;

function isEmpty(o) {
  if (o == null) {
    return true;
  }
  if (type(o) === 'string') {
    return o.trim().length === 0;
  }
  if (type(o) === 'array') {
    return o.length === 0;
  }
  if (type(o) === 'object') {
    return Object.keys(o).length === 0;
  }
  return false;
}
/**
 * simple event handling system:
 * {
 *  //event's format :'event.sub.subsub'
 *  on:   function(event, callback, [context]){...},
 *  //  when context is missing, removes all
 *  //  callbacks with that callback function. If `callback` is null,
 *  //  removes all callbacks for the event. If `event` is null, removes
 *  //  all  bound  callbacks for all events. when off 'event'.
 *  off:  function(event, [callback], [context]){...},
 *  once: function(event, callback, [context]){...},
 *  //when emit 'event:sub:subsub', any callbacks on this event path, like 'event' or 'event:sub' or "event:sub:subsub"'s callbacks  will be  invoked
 *  emit: function(event, [args...]){...}
 * }
 *
 * one event hanlder is consists of a callback and a context, and it can only be identified by these two combined together.
 * one event handler can only be registered once for a specific event , if there is a duplicate registration the handler is just
 * ignored.
 */
/*-----------------------private-----------------------------*/
var eventSpliter = /\s+/;
var _makeEvtHandler = function(handler, context) {
  assert(type(handler) === 'function', '[evtify]handler must be a function!');
  return [handler, context];
};
var _invokeEvtHandler = function(evtHandler, args) {
  evtHandler[0].apply(evtHandler[1], args);
};
//register handler for single event
var _registerHandler = function(eventMap, event, callback, context) {
  eventMap[event] = eventMap[event] || [];
  if (!eventMap[event].some(function(handler) {
      return handler[0] === callback && handler[1] === context;
    })) {
    eventMap[event].push(_makeEvtHandler(callback, context));
  }
};
var _removeHandler = function(eventMap, event, callback, context) {
  if (isEmpty(eventMap[event])) {
    return;
  }
  if (callback === undefined) {
    delete eventMap[event];
    return;
  }
  eventMap[event] = eventMap[event].filter(function(handler) {
    return handler[0] !== callback || (context === void 0 ? false : handler[1] !== context);
  });
  if (isEmpty(eventMap[event])) {
    delete eventMap[event];
  }
};

var _emitHandler = function(eventMap, event, args) {
  assert(/^(?:[\w\.]+)(?:\:[\w\.]+)*$/.test(event), "[evtify]The format of event str '" + event + "' is invalid!");
  var paths = event.split(':'),
    evtHandlers = [],
    i = 0,
    handlers;
  while (i < paths.length) {
    handlers = eventMap[paths.slice(0, ++i).join(':')];
    if (!isEmpty(handlers)) evtHandlers.push(handlers);
  }
  evtHandlers.forEach(function(handlers) {
    handlers.forEach(function(handler) {
      _invokeEvtHandler(handler, args);
    });
  });
};
/*-----------------------public-----------------------------*/
var on = function(event, callback, context) {
  assert(type(event) === 'string' && !isEmpty(event), '[evtify on]event must be a non empty string!');
  assert(type(callback) === 'function', '[evtify on]handler must be a function!');
  var events = event.trim().split(eventSpliter),
    eventMap = this._eventMap = this._eventMap || {};
  //default context is the eventified obj itself
  context = context || this;
  events.forEach(function(evt) {
    _registerHandler(eventMap, evt, callback, context);
  });
  return this;
};
var once = function(event, callback, context) {
  var self = this;
  this.on(event, function onceCallback() {
    callback.apply(this, arguments);
    self.off(event, onceCallback, this);
  }, context);
  return this;
};
var off = function(event, callback, context) {
  if (arguments.length === 0) {
    delete this._eventMap;
    return this;
  }
  if (isEmpty(this._eventMap) || type(event) !== 'string') {
    return this;
  }

  var events = event.trim().split(eventSpliter),
    eventMap = this._eventMap;
  events.forEach(function(evt) {
    _removeHandler(eventMap, evt, callback, context);
  });
  return this;
};
var emit = function(event) {
  if (isEmpty(this._eventMap) || type(event) !== 'string') {
    return this;
  }
  var events = event.trim().split(eventSpliter),
    eventMap = this._eventMap,
    args = slice.call(arguments, 1);
  events.forEach(function(evt) {
    _emitHandler(eventMap, evt, args);
  });
  return this;
};
var evtifyMixin = {
  on: on,
  once: once,
  off: off,
  emit: emit
};

function evtify(o) {
  if (type(o) === 'object') {
    return extend(o, evtifyMixin);
  } else if (type(o) === 'function') {
    var orgProto = o.prototype;
    o.prototype = Object.create(evtifyMixin);
    extend(o.prototype, orgProto);
    return o;
  } else {
    throw new TypeError('[evtify] invalid target to be evtified!');
  }
}
module.exports = evtify;
