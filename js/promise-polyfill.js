(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}(this, (function () {
  'use strict';

  /**
   * @this {Promise}
   */
  function finallyConstructor(callback) {
    var constructor = this.constructor;
    return this.then(
      function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      },
      function (reason) {
        return constructor.resolve(callback()).then(function () {
          return constructor.reject(reason);
        });
      }
    );
  }

  function allSettled(arr) {
    var P = this;
    return new P(function (resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError(arr + ' is not iterable'));
      }

      var results = arr.map(function () {
        return { status: 'pending' };
      });

      if (arr.length === 0) return resolve([]);
      var remaining = arr.length;

      function processResult(index, result) {
        results[index] = result;
        if (--remaining === 0) {
          resolve(results);
        }
      }

      arr.forEach(function (promise, index) {
        P.resolve(promise)
          .then(function (value) {
            processResult(index, { status: 'fulfilled', value });
          })
          .catch(function (reason) {
            processResult(index, { status: 'rejected', reason });
          });
      });
    });
  }

  function AggregateError(errors, message) {
    this.name = 'AggregateError';
    this.errors = errors;
    this.message = message || '';
  }
  AggregateError.prototype = Object.create(Error.prototype);

  function any(arr) {
    var P = this;
    return new P(function (resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('Promise.any accepts an array'));
      }

      var errors = [];
      var remaining = arr.length;
      if (remaining === 0) {
        return reject(new AggregateError([], 'All promises were rejected'));
      }

      arr.forEach(function (promise) {
        P.resolve(promise)
          .then(resolve)
          .catch(function (error) {
            errors.push(error);
            if (errors.length === remaining) {
              reject(new AggregateError(errors, 'All promises were rejected'));
            }
          });
      });
    });
  }

  function Promise(fn) {
    if (!(this instanceof Promise)) {
      throw new TypeError('Promises must be constructed via new');
    }
    if (typeof fn !== 'function') {
      throw new TypeError('Promise constructor requires a function argument');
    }

    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    try {
      fn(resolve.bind(null, this), reject.bind(null, this));
    } catch (ex) {
      reject(this, ex);
    }
  }

  function resolve(self, value) {
    if (self._state !== 0) return;

    if (value === self) {
      return reject(self, new TypeError('A promise cannot be resolved with itself.'));
    }

    if (value && (typeof value === 'object' || typeof value === 'function')) {
      var then;
      try {
        then = value.then;
      } catch (ex) {
        return reject(self, ex);
      }

      if (typeof then === 'function') {
        return then.call(
          value,
          resolve.bind(null, self),
          reject.bind(null, self)
        );
      }
    }

    self._state = 1;
    self._value = value;
    finale(self);
  }

  function reject(self, value) {
    if (self._state !== 0) return;

    self._state = 2;
    self._value = value;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    self._deferreds.forEach(function (deferred) {
      handle(self, deferred);
    });
    self._deferreds = [];
  }

  function handle(self, deferred) {
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }

    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }

      try {
        resolve(deferred.promise, cb(self._value));
      } catch (ex) {
        reject(deferred.promise, ex);
      }
    });
  }

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new Promise(function () {});

    handle(this, {
      onFulfilled: typeof onFulfilled === 'function' ? onFulfilled : null,
      onRejected: typeof onRejected === 'function' ? onRejected : null,
      promise: prom,
    });

    return prom;
  };

  Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.finally = finallyConstructor;

  Promise.resolve = function (value) {
    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('Promise.all accepts an array'));
      }

      var results = new Array(arr.length);
      var remaining = arr.length;

      if (remaining === 0) return resolve(results);

      function resolver(index) {
        return function (value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        };
      }

      arr.forEach(function (promise, index) {
        Promise.resolve(promise).then(resolver(index), reject);
      });
    });
  };

  Promise.race = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('Promise.race accepts an array'));
      }

      arr.forEach(function (promise) {
        Promise.resolve(promise).then(resolve, reject);
      });
    });
  };

  Promise.allSettled = allSettled;
  Promise.any = any;

  Promise._immediateFn =
    typeof setImmediate === 'function'
      ? function (fn) {
          setImmediate(fn);
        }
      : function (fn) {
          setTimeout(fn, 0);
        };

  Promise._unhandledRejectionFn = function (err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err);
    }
  };

  var globalNS = (function () {
    if (typeof self !== 'undefined') {
      return self;
    }
    if (typeof window !== 'undefined') {
      return window;
    }
    if (typeof global !== 'undefined') {
      return global;
    }
    throw new Error('unable to locate global object');
  })();

  if (typeof globalNS.Promise !== 'function') {
    globalNS.Promise = Promise;
  } else {
    if (!globalNS.Promise.prototype.finally) {
      globalNS.Promise.prototype.finally = finallyConstructor;
