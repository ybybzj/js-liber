```
 ---------------- 
< frp is awsome! >
 ---------------- 
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```       
                       
# Reactive Stream (flyd fork)

A modular, KISS, functional reactive programming library for JavaScript.

[Original Document](https://github.com/paldepind/flyd/blob/master/README.md)

# Table of contents

* [Introduction](#introduction)
* [Features](#features)
* [Examples](#examples)
* [Tutorial](#tutorial)
* [API](#api)
* [Modules](#modules)
* [Misc](#misc)

## Introduction

FRP(Functional Reactive Programing)：
  * 用来取代传统的观察者模式及事件响应回调模式
  * 它具有高组合性，可以模块化事件驱动的相关逻辑
  * 有别于传统的处理方式：构建出来的程序是被动的响应发生的事件流，或者一串数据流
  * 它能对程序的状态量管理地更高效
  * 实际上在最初使用观察者模式或者事件监听模式处理问题后，最终都会归到使用FRP的方式来从根本上解决问题

以上是比较正式的frp介绍，实际开发中我们不需要死扣概念，能拿它解决问题就达到目的了。大概总结一下，frp能够优雅地处理复杂事件驱动应用场景，能够模块化，可以像Promise一样有高组合能力，为处理事件模型提供了一个通用的抽象类型。

现阶段的流行js的frp库都比较大，不太适合移动前端开发，[flyd](https://github.com/paldepind/flyd)是为数不多的比较小巧，实现也比较易懂的一个(同时性能也不低)。

它的核心代码提拱有限的接口，很容易掌握，同时在理解核心概念之后对其扩展功能也相对较容易。

这里的实现去掉了原有库里的一些函数式变成标准的支持，把一些依赖换成我们自己库里已有的依赖，添加了一些工具方法，便于调试，同时开发了一些常用工具模块配合核心库使用。

## Features

__Main features__

* __Simple but powerful__. Less is more! Flyd provides combinable observable
  streams as the basic building block. This minimal core is less than 200 SLOC
  which makes the library transparent – end users can realistically get a full
  understanding of how the library works.
* __More functional in style__. Flyd is more functional than existing FRP
  libraries. Instead of methods it gives you curried functions with arguments
  in the order suitable for partial application. This gives more expressive
  power and modularity.
* __Modularity__. The core of the Flyd is powerful and documented. This makes
  it easy for users of the library to create new FRP abstractions if existing ones
  do not exist. This in turn makes it viable to capture more patterns than
  otherwise because they can exist as separate modules. [List of existing modules](#modules).

__Other features__

* [Elegant support for promises](#using-promises-for-asynchronous-operations).
* [Atomic updates](#atomic-updates).

## Examples

待更新

## Tutorial

This is not general introduction to functional reactive programming. For that take
a look at [The introduction to Reactive Programming you've been
missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) and/or [this Elm
tutorial](http://elm-lang.org/learn/Using-Signals.elm) if you are comfortable
with reading Haskell-like code.

This is not a demonstration of how you would write code with Flyd on a day to
day basis. For that take a look at the [examples](#examples).

This tutorial will however introduce you to the minimal but powerful core that
Flyd provides and show you how it can be used to build FRP abstractions.

### Creating streams

Flyd gives you streams as the building block for creating reactive dataflows.
They serve the same purpose as what other FRP libraries call Signals, Observables,
Properties and EventEmitters.

The function `stream` creates a representation of a value that changes
over time. The resulting stream is a function. At first sight it works a bit
like a getter-setter:

这里的`stream`是frp核心模块暴露出的唯一接口，其本身是一个function，以下介绍的其他接口都使用它作为全局对象绑在其身上，比如`combine`方法实际指的是`stream.combine`.

```javascript
// Create a stream with initial value 5.
var number = stream(5);
// Get the current value of the stream.
console.log(number()); // logs 5
// Update the value of the stream.
console.log(number(7));
// The stream now returns the new value.
console.log(number()); // logs 7
```

Top level streams, that is streams without dependencies, should typically
depend on the external world, like user input or fetched data.

Since streams are just functions you can easily plug them in whenever a
function is expected.

```javascript
var clicks = stream();
document.getElementById('button').addEventListener('click', clicks);
var messages = stream();
webSocket.onmessage = messages;
```

Clicks events will now flow down the `clicks` stream and WebSockets messages
down the `messages` stream.

### Dependent streams

Streams can depend on other streams. Use `var combined = combine(combineFn, [a, b, c, ...])`.
The `combineFn` function will be called as `(a, b, c, ..., self, changed) => v`,
where `a, b, c, ...` is a spread of each dependency, `self` is a reference to the
combine stream itself, and `changed` is an array of streams that were atomically
updated.

Flyd automatically updates the stream whenever a dependency changes.  This
means that the `sum` function below will be called whenever `x` and `y`
changes.  You can think of dependent stream as streams that automatically
listens to or subscribes to their dependencies.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
// Create a stream that depends on the two previous streams
// and with its value given by the two added together.
var sum = combine(function(x, y) {
  return x() + y();
}, [x, y]);
// `sum` is automatically recalculated whenever the streams it depends on changes.
x(12);
console.log(sum()); // logs 18
y(8);
console.log(sum()); // logs 20
```

Naturally, a stream with dependencies can depend on other streams with dependencies.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
var squareX = combine(function(x) {
  return x() * x();
}, [x]);
var squareXPlusY = combine(function(y, squareX) {
  return y() + squareX();
}, [y, squareX]);
console.log(squareXPlusY()); // logs 22
x(2);
console.log(squareXPlusY()); // logs 10
```

The body of a dependent stream is called with the spread of: each dependency, itself, and a list
of the dependencies that have changed since its last invocation (due to [atomic
updates](#atomic-updates) several streams could have changed).

```javascript
// Create two streams of numbers
var x = stream(1);
var y = stream(2);
var sum = combine(function(x, y, self, changed) {
  // The stream can read from itself
  console.log('Last sum was ' + self());
  // On the initial call no streams has changed and `changed` will be []
  changed.map(function(s) {
    var changedName = (s === y ? 'y' : 'x');
    console.log(changedName + ' changed to ' + s());
  });
  return x() + y();
}, [x, y]);
```

*Note* Returning `undefined` in the `combineFn` will not trigger an update
to the stream. To trigger on undefined, update directly:
```
combine((_, self, changed) => { self(undefined); }, [depStream]);
```

### Using callback APIs for asynchronous operations

Instead of returning a value a stream can update itself by calling itself. This
is handy when working with APIs that takes callbacks.

```javascript
var urls = stream('/something.json');
var responses = combine(function(urls, self) {
  makeRequest(urls(), self);
}, [urls]);
combine(function(responses) {
  console.log('Received response!');
  console.log(responses());
}, [responses]);
```

Note that the stream that logs the responses from the server should only be called
after an actual response has been received (otherwise `responses()` would return
`undefined`). Fortunately a stream's body will not be called before all of its declared
streams has received a value (this behaviour can be circumvented with
[immediate](#flydimmediatestream)).

### Using promises for asynchronous operations

Flyd has inbuilt support for promises. Similarly to how a promise can never be
resolved with a promise, a promise can never flow down a stream. Instead the
fulfilled value of the promise will be sent down the stream.

由于原始库没有对promise的error做处理，这里加上的对promise的error也捕获的逻辑，所以以下的例子中如果
responses又错误发生，错误也会作为事件值传给`on`方法的handleri, 所以处理promise的值时需要注意区分。

```javascript
var urls = stream('/something.json');
var responses = stream(requestPromise(urls()));
on(function(responses) {
  console.log('Received response!');
  console.log(responses());
}, responses);
```

### Mapping over a stream

You've now seen most of the basic building block which Flyd provides. Let's see
what we can do with them. Let's write a function that takes a function and a
stream and returns a new stream with the function applied to every value
emitted by the stream. In short, a `map` function.

```javascript
var mapStream = function(f, s) {
  return combine(function(s) {
    return f(s());
  }, [s]);
};
```

We simply create a new stream dependent on the first stream. We declare
the stream as a dependency so that our stream won't return values before
the original stream produces its first value.



### Scanning a stream

Lets try something else: a scan function for accumulating a stream! It could
look like this:

```javascript
var scanStream = function(f, acc, s) {
  return combine(function(s) {
    acc = f(acc, s());
    return acc;
  }, [s]);
};
```

Our scan function takes an accumulator function, an initial value and a stream.
Every time the original stream emits a value we pass it to the accumulator
function along with the accumulated value.



### Stream endings

When you create a stream with `stream` it will have an `end` property
which is also a stream. That is an _end stream_:

```javascript
var s = stream();
console.log(isStream(s.end)); // logs `true`
```

You can end a stream by pushing `true` into its end stream:

```javascript
var s = stream();
s.end(true); // this ends `s`
```

When you create a dependent stream its end stream will initially depend on all
the end streams of its dependencies:

```javascript
var n1 = stream();
var n2 = stream();
var sum = combine(function(n1, n2) {
  return n1() + n2();
}, [n1, n2]);
```

`sum.end` now depends on `n1.end` and `n2.end`. This means that whenever one of
the `sum`s dependencies end `sum` will end as well.

You can change what a stream's end stream depends on with `endsOn`:

```javascript
var number = stream(2);
var killer = stream();
var square = endsOn(merge(number.end, killer), combine(function(number) {
  return number() * number();
}, [number]));
```

Now `square` will end if either `number` ends or if `killer` emits a value.

The fact that a stream's ending is itself a stream is a very powerful concept.
It means that we can use the full expressiveness of Flyd to control when a stream
ends. 


### Fin

You're done! To learn more check out the [API](#api), the [examples](#examples)
and the source of the [modules](#modules).

## API

## static methods

### Stream()

Creates a new top level stream.

__Signature__

`a -> Stream a`

__Example__
```javascript
var n = stream(1); // Stream with initial value `1`
var s = stream(); // Stream with no initial value
```

### combine(body, dependencies)

Creates a new dependent stream.

__Signature__

`(...Stream * -> Stream b -> b) -> [Stream *] -> Stream b`

__Example__
```javascript
var n1 = stream(0);
var n2 = stream(0);
var max = combine(function(n1, n2, self, changed) {
  return n1() > n2() ? n1() : n2();
}, [n1, n2]);
```

### isStream(stream)

Returns `true` if the supplied argument is a Flyd stream and `false` otherwise.

__Signature__

`* -> Boolean`

__Example__

```javascript
var s = stream(1);
var n = 1;
isStream(s); //=> true
isStream(n); //=> false
```

### immediate(stream)

By default the body of a dependent stream is only called when all the streams
upon which it depends has a value. `immediate` can circumvent this behaviour.
It immediately invokes the body of a dependent stream.

__Signature__

`Stream a -> Stream a`

__Example__

```javascript
var s = stream();
var hasItems = immediate(combine(function(s) {
  return s() !== undefined && s().length > 0;
}, [s]);
console.log(hasItems()); // logs `false`. Had `immediate` not been
                         // used `hasItems()` would've returned `undefined`
s([1]);
console.log(hasItems()); // logs `true`.
s([]);
console.log(hasItems()); // logs `false`.
```

### endsOn(endStream, s)

Changes which `endsStream` should trigger the ending of `s`.

__Signature__

`Stream a -> Stream b -> Stream b`

__Example__

```javascript
var n = stream(1);
var killer = stream();
// `double` ends when `n` ends or when `killer` emits any value
var double = endsOn(merge(n.end, killer), combine(function(n) {
  return 2 * n();
}, [n]);
```


### on(fn, s)

Similar to `map` except that the returned stream is empty. Use `on` for doing
side effects in reaction to stream changes. Use the returned stream only if you
need to manually end it.

__Signature__

`(a -> result) -> Stream a -> Stream undefined`

__Example__
```javascript
var numbers = stream(0);
on(function(n) { console.log('numbers changed to', n); }, numbers);
```

## instance methods

### stream()

Returns the last value of the stream.

__Signature__

`a`

__Example__

```javascript
var names = stream('Turing');
names(); // 'Turing'
```

### stream(val)

Pushes a value down the stream.

__Signature__

`a -> Stream a`

__Example__

```javascript
names('Bohr');
names(); // 'Bohr'
```

### stream.end

A stream that emits `true` when the stream ends. If `true` is pushed down the
stream the parent stream ends.

### stream.on(fn)

Listen to stream events

__Signature__: `(a -> result) -> Stream a -> Stream undefined`
 
 __Example__
```javascript
var n = stream();
n.on(console.log.bind(console));
n(1);
//1
```


### stream.log(msg)

Print log info according to stream events, including end event

__Signature__

Called bound to `Stream (a)`: `m -> undefined`

__Example__
```javascript
var n = stream(1);
n.log();
//1
```

### Modules

从其他的源构建事件流(build r$)：
  * [from/promise] 从promise实例构建一个事件流
  * [from/sequence] 从数组构建一个事件流，可以指定事件发生的时间间隔

从其他事件流构建新的事件流(compose r$):
  * [composer/apply]
  * [composer/debounce]
  * [composer/throttle]
  * [composer/filter]
  * [composer/flatmap]
  * [composer/lift]
  * [composer/map]
  * [composer/merge]
  * [composer/scan]
  * [composer/switchlatest]


## Misc

### Atomic updates

Consider the following example:

```javascript
var a = stream(1);
var b = combine(function(a) { return a() * 2; }, [a]);
var c = combine(function(a) { return a() + 4; }, [a]);
var d = combine(function(b, c, self, ch) {
  result.push(b() + c());
}, [b, c]);
```

The dependency graph looks like this.

```
    a
  /   \
 b     c
  \   /
    d
```

Now, when a value flows down `a`, both `b` and `c` will change because they
depend on `a`. If you merely consider streams as being event emitters you'd expect `d`
to be updated twice. Because `a` triggers `b` triggers `d` after which `a` also
triggers `c` which _again_ triggers `d`.

But Flyd handles such cases optimally. Since only one value entered the
system `d` will only be updated once with the changed values of `b` and `c`.

Flyd guarantees that when a single value enters the system every stream will
only be updated once, along with their dependencies in their most recent state.

This avoids superfluous updates of your streams and intermediate states when
several streams change at the same time.

Flyd implements atomic updates with a _O(n)_ topological sort where _n_
is number of streams that directly or indirectly depends on the updated
stream.