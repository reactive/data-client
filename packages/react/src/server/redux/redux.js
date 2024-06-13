// src/utils/formatProdErrorMessage.ts
function formatProdErrorMessage(code) {
  return `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or use the non-minified dev environment for full errors. `;
}

// src/utils/symbol-observable.ts
var $$observable = /* @__PURE__ */ (() =>
  (typeof Symbol === 'function' && Symbol.observable) || '@@observable')();
var symbol_observable_default = $$observable;

// src/utils/actionTypes.ts
var randomString = () =>
  Math.random().toString(36).substring(7).split('').join('.');
var ActionTypes = {
  INIT: `@@redux/INIT${/* @__PURE__ */ randomString()}`,
  REPLACE: `@@redux/REPLACE${/* @__PURE__ */ randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
};
var actionTypes_default = ActionTypes;

// src/utils/isPlainObject.ts
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return (
    Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null
  );
}

// src/utils/kindOf.ts
function miniKindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';
  const type = typeof val;
  switch (type) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'symbol':
    case 'function': {
      return type;
    }
  }
  if (Array.isArray(val)) return 'array';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  const constructorName = ctorName(val);
  switch (constructorName) {
    case 'Symbol':
    case 'Promise':
    case 'WeakMap':
    case 'WeakSet':
    case 'Map':
    case 'Set':
      return constructorName;
  }
  return Object.prototype.toString
    .call(val)
    .slice(8, -1)
    .toLowerCase()
    .replace(/\s/g, '');
}
function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}
function isError(val) {
  return (
    val instanceof Error ||
    (typeof val.message === 'string' &&
      val.constructor &&
      typeof val.constructor.stackTraceLimit === 'number')
  );
}
function isDate(val) {
  if (val instanceof Date) return true;
  return (
    typeof val.toDateString === 'function' &&
    typeof val.getDate === 'function' &&
    typeof val.setDate === 'function'
  );
}
function kindOf(val) {
  let typeOfVal = typeof val;
  if (process.env.NODE_ENV !== 'production') {
    typeOfVal = miniKindOf(val);
  }
  return typeOfVal;
}

// src/createStore.ts
function createStore(reducer, preloadedState, enhancer) {
  if (typeof reducer !== 'function') {
    throw new Error(
      process.env.NODE_ENV === 'production' ?
        formatProdErrorMessage(2)
      : `Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`,
    );
  }
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      process.env.NODE_ENV === 'production' ?
        formatProdErrorMessage(0)
      : 'It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.',
    );
  }
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = void 0;
  }
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(1)
        : `Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`,
      );
    }
    return enhancer(createStore)(reducer, preloadedState);
  }
  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = /* @__PURE__ */ new Map();
  let nextListeners = currentListeners;
  let listenerIdCounter = 0;
  let isDispatching = false;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = /* @__PURE__ */ new Map();
      currentListeners.forEach((listener, key) => {
        nextListeners.set(key, listener);
      });
    }
  }
  function getState() {
    if (isDispatching) {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(3)
        : 'You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.',
      );
    }
    return currentState;
  }
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(4)
        : `Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`,
      );
    }
    if (isDispatching) {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(5)
        : 'You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.',
      );
    }
    let isSubscribed = true;
    ensureCanMutateNextListeners();
    const listenerId = listenerIdCounter++;
    nextListeners.set(listenerId, listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error(
          process.env.NODE_ENV === 'production' ?
            formatProdErrorMessage(6)
          : 'You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.',
        );
      }
      isSubscribed = false;
      ensureCanMutateNextListeners();
      nextListeners.delete(listenerId);
      currentListeners = null;
    };
  }
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(7)
        : `Actions must be plain objects. Instead, the actual type was: '${kindOf(action)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`,
      );
    }
    if (typeof action.type === 'undefined') {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(8)
        : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.',
      );
    }
    if (typeof action.type !== 'string') {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(17)
        : `Action "type" property must be a string. Instead, the actual type was: '${kindOf(action.type)}'. Value was: '${action.type}' (stringified)`,
      );
    }
    if (isDispatching) {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(9)
        : 'Reducers may not dispatch actions.',
      );
    }
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    const listeners = (currentListeners = nextListeners);
    listeners.forEach(listener => {
      listener();
    });
    return action;
  }
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(10)
        : `Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`,
      );
    }
    currentReducer = nextReducer;
    dispatch({
      type: actionTypes_default.REPLACE,
    });
  }
  function observable() {
    const outerSubscribe = subscribe;
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new Error(
            process.env.NODE_ENV === 'production' ?
              formatProdErrorMessage(11)
            : `Expected the observer to be an object. Instead, received: '${kindOf(observer)}'`,
          );
        }
        function observeState() {
          const observerAsObserver = observer;
          if (observerAsObserver.next) {
            observerAsObserver.next(getState());
          }
        }
        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe,
        };
      },
      [symbol_observable_default]() {
        return this;
      },
    };
  }
  dispatch({
    type: actionTypes_default.INIT,
  });
  const store = {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [symbol_observable_default]: observable,
  };
  return store;
}

// src/compose.ts
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args)),
  );
}

// src/applyMiddleware.ts
function applyMiddleware(...middlewares) {
  return createStore2 => (reducer, preloadedState) => {
    const store = createStore2(reducer, preloadedState);
    let dispatch = () => {
      throw new Error(
        process.env.NODE_ENV === 'production' ?
          formatProdErrorMessage(15)
        : 'Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.',
      );
    };
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args),
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);
    return {
      ...store,
      dispatch,
    };
  };
}

// src/utils/isAction.ts
function isAction(action) {
  return (
    isPlainObject(action) && 'type' in action && typeof action.type === 'string'
  );
}
export { applyMiddleware, createStore, isAction, isPlainObject };
