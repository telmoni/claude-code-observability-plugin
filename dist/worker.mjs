var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/version.js
var VERSION;
var init_version = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/version.js"() {
    "use strict";
    VERSION = "1.9.1";
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/internal/semver.js
function _makeCompatibilityCheck(ownVersion) {
  const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  const rejectedVersions = /* @__PURE__ */ new Set();
  const myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return () => false;
  }
  const ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v) {
    rejectedVersions.add(v);
    return false;
  }
  function _accept(v) {
    acceptedVersions.add(v);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    const globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    const globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
var re, isCompatible;
var init_semver = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/internal/semver.js"() {
    "use strict";
    init_version();
    re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
    isCompatible = _makeCompatibilityCheck(VERSION);
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
function registerGlobal(type, instance, diag2, allowOverride = false) {
  var _a;
  const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
    version: VERSION
  };
  if (!allowOverride && api[type]) {
    const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION) {
    const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${VERSION}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag2.debug(`@opentelemetry/api: Registered a global for ${type} v${VERSION}.`);
  return true;
}
function getGlobal(type) {
  var _a, _b;
  const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag2) {
  diag2.debug(`@opentelemetry/api: Unregistering a global for ${type} v${VERSION}.`);
  const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}
var major, GLOBAL_OPENTELEMETRY_API_KEY, _global;
var init_global_utils = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js"() {
    "use strict";
    init_version();
    init_semver();
    major = VERSION.split(".")[0];
    GLOBAL_OPENTELEMETRY_API_KEY = /* @__PURE__ */ Symbol.for(`opentelemetry.js.api.${major}`);
    _global = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
function logProxy(funcName, namespace, args) {
  const logger = getGlobal("diag");
  if (!logger) {
    return;
  }
  return logger[funcName](namespace, ...args);
}
var DiagComponentLogger;
var init_ComponentLogger = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js"() {
    "use strict";
    init_global_utils();
    DiagComponentLogger = class {
      constructor(props) {
        this._namespace = props.namespace || "DiagComponentLogger";
      }
      debug(...args) {
        return logProxy("debug", this._namespace, args);
      }
      error(...args) {
        return logProxy("error", this._namespace, args);
      }
      info(...args) {
        return logProxy("info", this._namespace, args);
      }
      warn(...args) {
        return logProxy("warn", this._namespace, args);
      }
      verbose(...args) {
        return logProxy("verbose", this._namespace, args);
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/types.js
var DiagLogLevel;
var init_types = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/types.js"() {
    "use strict";
    (function(DiagLogLevel2) {
      DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
      DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
      DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
      DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
      DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
      DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
      DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
    })(DiagLogLevel || (DiagLogLevel = {}));
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger = logger || {};
  function _filterFunc(funcName, theLevel) {
    const theFunc = logger[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}
var init_logLevelLogger = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js"() {
    "use strict";
    init_types();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/diag.js
var API_NAME, DiagAPI;
var init_diag = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/diag.js"() {
    "use strict";
    init_ComponentLogger();
    init_logLevelLogger();
    init_types();
    init_global_utils();
    API_NAME = "diag";
    DiagAPI = class _DiagAPI {
      /** Get the singleton instance of the DiagAPI API */
      static instance() {
        if (!this._instance) {
          this._instance = new _DiagAPI();
        }
        return this._instance;
      }
      /**
       * Private internal constructor
       * @private
       */
      constructor() {
        function _logProxy(funcName) {
          return function(...args) {
            const logger = getGlobal("diag");
            if (!logger)
              return;
            return logger[funcName](...args);
          };
        }
        const self2 = this;
        const setLogger = (logger, optionsOrLogLevel = { logLevel: DiagLogLevel.INFO }) => {
          var _a, _b, _c;
          if (logger === self2) {
            const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
            self2.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
            return false;
          }
          if (typeof optionsOrLogLevel === "number") {
            optionsOrLogLevel = {
              logLevel: optionsOrLogLevel
            };
          }
          const oldLogger = getGlobal("diag");
          const newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger);
          if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
            const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
            oldLogger.warn(`Current logger will be overwritten from ${stack}`);
            newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
          }
          return registerGlobal("diag", newLogger, self2, true);
        };
        self2.setLogger = setLogger;
        self2.disable = () => {
          unregisterGlobal(API_NAME, self2);
        };
        self2.createComponentLogger = (options) => {
          return new DiagComponentLogger(options);
        };
        self2.verbose = _logProxy("verbose");
        self2.debug = _logProxy("debug");
        self2.info = _logProxy("info");
        self2.warn = _logProxy("warn");
        self2.error = _logProxy("error");
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context/context.js
function createContextKey(description) {
  return Symbol.for(description);
}
var BaseContext, ROOT_CONTEXT;
var init_context = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context/context.js"() {
    "use strict";
    BaseContext = class _BaseContext {
      /**
       * Construct a new context which inherits values from an optional parent context.
       *
       * @param parentContext a context from which to inherit values
       */
      constructor(parentContext) {
        const self2 = this;
        self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
        self2.getValue = (key) => self2._currentContext.get(key);
        self2.setValue = (key, value) => {
          const context2 = new _BaseContext(self2._currentContext);
          context2._currentContext.set(key, value);
          return context2;
        };
        self2.deleteValue = (key) => {
          const context2 = new _BaseContext(self2._currentContext);
          context2._currentContext.delete(key);
          return context2;
        };
      }
    };
    ROOT_CONTEXT = new BaseContext();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js
function createNoopMeter() {
  return NOOP_METER;
}
var NoopMeter, NoopMetric, NoopCounterMetric, NoopUpDownCounterMetric, NoopGaugeMetric, NoopHistogramMetric, NoopObservableMetric, NoopObservableCounterMetric, NoopObservableGaugeMetric, NoopObservableUpDownCounterMetric, NOOP_METER, NOOP_COUNTER_METRIC, NOOP_GAUGE_METRIC, NOOP_HISTOGRAM_METRIC, NOOP_UP_DOWN_COUNTER_METRIC, NOOP_OBSERVABLE_COUNTER_METRIC, NOOP_OBSERVABLE_GAUGE_METRIC, NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
var init_NoopMeter = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js"() {
    "use strict";
    NoopMeter = class {
      constructor() {
      }
      /**
       * @see {@link Meter.createGauge}
       */
      createGauge(_name, _options) {
        return NOOP_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createHistogram}
       */
      createHistogram(_name, _options) {
        return NOOP_HISTOGRAM_METRIC;
      }
      /**
       * @see {@link Meter.createCounter}
       */
      createCounter(_name, _options) {
        return NOOP_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createUpDownCounter}
       */
      createUpDownCounter(_name, _options) {
        return NOOP_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableGauge}
       */
      createObservableGauge(_name, _options) {
        return NOOP_OBSERVABLE_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createObservableCounter}
       */
      createObservableCounter(_name, _options) {
        return NOOP_OBSERVABLE_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableUpDownCounter}
       */
      createObservableUpDownCounter(_name, _options) {
        return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.addBatchObservableCallback}
       */
      addBatchObservableCallback(_callback, _observables) {
      }
      /**
       * @see {@link Meter.removeBatchObservableCallback}
       */
      removeBatchObservableCallback(_callback) {
      }
    };
    NoopMetric = class {
    };
    NoopCounterMetric = class extends NoopMetric {
      add(_value, _attributes) {
      }
    };
    NoopUpDownCounterMetric = class extends NoopMetric {
      add(_value, _attributes) {
      }
    };
    NoopGaugeMetric = class extends NoopMetric {
      record(_value, _attributes) {
      }
    };
    NoopHistogramMetric = class extends NoopMetric {
      record(_value, _attributes) {
      }
    };
    NoopObservableMetric = class {
      addCallback(_callback) {
      }
      removeCallback(_callback) {
      }
    };
    NoopObservableCounterMetric = class extends NoopObservableMetric {
    };
    NoopObservableGaugeMetric = class extends NoopObservableMetric {
    };
    NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {
    };
    NOOP_METER = new NoopMeter();
    NOOP_COUNTER_METRIC = new NoopCounterMetric();
    NOOP_GAUGE_METRIC = new NoopGaugeMetric();
    NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
    NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
    NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
    NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
    NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var NoopContextManager;
var init_NoopContextManager = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js"() {
    "use strict";
    init_context();
    NoopContextManager = class {
      active() {
        return ROOT_CONTEXT;
      }
      with(_context, fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      bind(_context, target) {
        return target;
      }
      enable() {
        return this;
      }
      disable() {
        return this;
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/context.js
var API_NAME2, NOOP_CONTEXT_MANAGER, ContextAPI;
var init_context2 = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/context.js"() {
    "use strict";
    init_NoopContextManager();
    init_global_utils();
    init_diag();
    API_NAME2 = "context";
    NOOP_CONTEXT_MANAGER = new NoopContextManager();
    ContextAPI = class _ContextAPI {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
      }
      /** Get the singleton instance of the Context API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _ContextAPI();
        }
        return this._instance;
      }
      /**
       * Set the current context manager.
       *
       * @returns true if the context manager was successfully registered, else false
       */
      setGlobalContextManager(contextManager) {
        return registerGlobal(API_NAME2, contextManager, DiagAPI.instance());
      }
      /**
       * Get the currently active context
       */
      active() {
        return this._getContextManager().active();
      }
      /**
       * Execute a function with an active context
       *
       * @param context context to be active during function execution
       * @param fn function to execute in a context
       * @param thisArg optional receiver to be used for calling fn
       * @param args optional arguments forwarded to fn
       */
      with(context2, fn, thisArg, ...args) {
        return this._getContextManager().with(context2, fn, thisArg, ...args);
      }
      /**
       * Bind a context to a target function or event emitter
       *
       * @param context context to bind to the event emitter or function. Defaults to the currently active context
       * @param target function or event emitter to bind
       */
      bind(context2, target) {
        return this._getContextManager().bind(context2, target);
      }
      _getContextManager() {
        return getGlobal(API_NAME2) || NOOP_CONTEXT_MANAGER;
      }
      /** Disable and remove the global context manager */
      disable() {
        this._getContextManager().disable();
        unregisterGlobal(API_NAME2, DiagAPI.instance());
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
var TraceFlags;
var init_trace_flags = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js"() {
    "use strict";
    (function(TraceFlags2) {
      TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
      TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
    })(TraceFlags || (TraceFlags = {}));
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js
var INVALID_SPANID, INVALID_TRACEID, INVALID_SPAN_CONTEXT;
var init_invalid_span_constants = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js"() {
    "use strict";
    init_trace_flags();
    INVALID_SPANID = "0000000000000000";
    INVALID_TRACEID = "00000000000000000000000000000000";
    INVALID_SPAN_CONTEXT = {
      traceId: INVALID_TRACEID,
      spanId: INVALID_SPANID,
      traceFlags: TraceFlags.NONE
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
var NonRecordingSpan;
var init_NonRecordingSpan = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js"() {
    "use strict";
    init_invalid_span_constants();
    NonRecordingSpan = class {
      constructor(spanContext = INVALID_SPAN_CONTEXT) {
        this._spanContext = spanContext;
      }
      // Returns a SpanContext.
      spanContext() {
        return this._spanContext;
      }
      // By default does nothing
      setAttribute(_key, _value) {
        return this;
      }
      // By default does nothing
      setAttributes(_attributes) {
        return this;
      }
      // By default does nothing
      addEvent(_name, _attributes) {
        return this;
      }
      addLink(_link) {
        return this;
      }
      addLinks(_links) {
        return this;
      }
      // By default does nothing
      setStatus(_status) {
        return this;
      }
      // By default does nothing
      updateName(_name) {
        return this;
      }
      // By default does nothing
      end(_endTime) {
      }
      // isRecording always returns false for NonRecordingSpan.
      isRecording() {
        return false;
      }
      // By default does nothing
      recordException(_exception, _time) {
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
function getSpan(context2) {
  return context2.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context2, span) {
  return context2.setValue(SPAN_KEY, span);
}
function deleteSpan(context2) {
  return context2.deleteValue(SPAN_KEY);
}
function setSpanContext(context2, spanContext) {
  return setSpan(context2, new NonRecordingSpan(spanContext));
}
function getSpanContext(context2) {
  var _a;
  return (_a = getSpan(context2)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
var SPAN_KEY;
var init_context_utils = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js"() {
    "use strict";
    init_context();
    init_NonRecordingSpan();
    init_context2();
    SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
function isValidHex(id, length) {
  if (typeof id !== "string" || id.length !== length)
    return false;
  let r = 0;
  for (let i = 0; i < id.length; i += 4) {
    r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
  }
  return r === length;
}
function isValidTraceId(traceId2) {
  return isValidHex(traceId2, 32) && traceId2 !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return isValidHex(spanId, 16) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}
var isHex;
var init_spancontext_utils = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js"() {
    "use strict";
    init_invalid_span_constants();
    init_NonRecordingSpan();
    isHex = new Uint8Array([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1
    ]);
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
function isSpanContext(spanContext) {
  return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
}
var contextApi, NoopTracer;
var init_NoopTracer = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js"() {
    "use strict";
    init_context2();
    init_context_utils();
    init_NonRecordingSpan();
    init_spancontext_utils();
    contextApi = ContextAPI.getInstance();
    NoopTracer = class {
      // startSpan starts a noop span.
      startSpan(name, options, context2 = contextApi.active()) {
        const root = Boolean(options === null || options === void 0 ? void 0 : options.root);
        if (root) {
          return new NonRecordingSpan();
        }
        const parentFromContext = context2 && getSpanContext(context2);
        if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
          return new NonRecordingSpan(parentFromContext);
        } else {
          return new NonRecordingSpan();
        }
      }
      startActiveSpan(name, arg2, arg3, arg4) {
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) {
          return;
        } else if (arguments.length === 2) {
          fn = arg2;
        } else if (arguments.length === 3) {
          opts = arg2;
          fn = arg3;
        } else {
          opts = arg2;
          ctx = arg3;
          fn = arg4;
        }
        const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = setSpan(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, void 0, span);
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER, ProxyTracer;
var init_ProxyTracer = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js"() {
    "use strict";
    init_NoopTracer();
    NOOP_TRACER = new NoopTracer();
    ProxyTracer = class {
      constructor(provider, name, version, options) {
        this._provider = provider;
        this.name = name;
        this.version = version;
        this.options = options;
      }
      startSpan(name, options, context2) {
        return this._getTracer().startSpan(name, options, context2);
      }
      startActiveSpan(_name, _options, _context, _fn) {
        const tracer = this._getTracer();
        return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
      }
      /**
       * Try to get a tracer from the proxy tracer provider.
       * If the proxy tracer provider has no delegate, return a noop tracer.
       */
      _getTracer() {
        if (this._delegate) {
          return this._delegate;
        }
        const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer) {
          return NOOP_TRACER;
        }
        this._delegate = tracer;
        return this._delegate;
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
var NoopTracerProvider;
var init_NoopTracerProvider = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js"() {
    "use strict";
    init_NoopTracer();
    NoopTracerProvider = class {
      getTracer(_name, _version, _options) {
        return new NoopTracer();
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER, ProxyTracerProvider;
var init_ProxyTracerProvider = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js"() {
    "use strict";
    init_ProxyTracer();
    init_NoopTracerProvider();
    NOOP_TRACER_PROVIDER = new NoopTracerProvider();
    ProxyTracerProvider = class {
      /**
       * Get a {@link ProxyTracer}
       */
      getTracer(name, version, options) {
        var _a;
        return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer(this, name, version, options);
      }
      getDelegate() {
        var _a;
        return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
      }
      /**
       * Set the delegate tracer provider
       */
      setDelegate(delegate) {
        this._delegate = delegate;
      }
      getDelegateTracer(name, version, options) {
        var _a;
        return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js
var SamplingDecision;
var init_SamplingResult = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js"() {
    "use strict";
    (function(SamplingDecision3) {
      SamplingDecision3[SamplingDecision3["NOT_RECORD"] = 0] = "NOT_RECORD";
      SamplingDecision3[SamplingDecision3["RECORD"] = 1] = "RECORD";
      SamplingDecision3[SamplingDecision3["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
    })(SamplingDecision || (SamplingDecision = {}));
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js
var SpanKind;
var init_span_kind = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js"() {
    "use strict";
    (function(SpanKind2) {
      SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
      SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
      SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
      SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
      SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
    })(SpanKind || (SpanKind = {}));
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/status.js
var SpanStatusCode;
var init_status = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace/status.js"() {
    "use strict";
    (function(SpanStatusCode2) {
      SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
      SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
      SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
    })(SpanStatusCode || (SpanStatusCode = {}));
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context-api.js
var context;
var init_context_api = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/context-api.js"() {
    "use strict";
    init_context2();
    context = ContextAPI.getInstance();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag-api.js
var diag;
var init_diag_api = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/diag-api.js"() {
    "use strict";
    init_diag();
    diag = DiagAPI.instance();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME3, TraceAPI;
var init_trace = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/api/trace.js"() {
    "use strict";
    init_global_utils();
    init_ProxyTracerProvider();
    init_spancontext_utils();
    init_context_utils();
    init_diag();
    API_NAME3 = "trace";
    TraceAPI = class _TraceAPI {
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
        this._proxyTracerProvider = new ProxyTracerProvider();
        this.wrapSpanContext = wrapSpanContext;
        this.isSpanContextValid = isSpanContextValid;
        this.deleteSpan = deleteSpan;
        this.getSpan = getSpan;
        this.getActiveSpan = getActiveSpan;
        this.getSpanContext = getSpanContext;
        this.setSpan = setSpan;
        this.setSpanContext = setSpanContext;
      }
      /** Get the singleton instance of the Trace API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _TraceAPI();
        }
        return this._instance;
      }
      /**
       * Set the current global tracer.
       *
       * @returns true if the tracer provider was successfully registered, else false
       */
      setGlobalTracerProvider(provider) {
        const success = registerGlobal(API_NAME3, this._proxyTracerProvider, DiagAPI.instance());
        if (success) {
          this._proxyTracerProvider.setDelegate(provider);
        }
        return success;
      }
      /**
       * Returns the global tracer provider.
       */
      getTracerProvider() {
        return getGlobal(API_NAME3) || this._proxyTracerProvider;
      }
      /**
       * Returns a tracer from the global tracer provider.
       */
      getTracer(name, version) {
        return this.getTracerProvider().getTracer(name, version);
      }
      /** Remove the global tracer provider */
      disable() {
        unregisterGlobal(API_NAME3, DiagAPI.instance());
        this._proxyTracerProvider = new ProxyTracerProvider();
      }
    };
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace-api.js
var trace;
var init_trace_api = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/trace-api.js"() {
    "use strict";
    init_trace();
    trace = TraceAPI.getInstance();
  }
});

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/index.js
var init_esm = __esm({
  "../telmoni/sdk/typescript/node_modules/@opentelemetry/api/build/esm/index.js"() {
    "use strict";
    init_context();
    init_NoopMeter();
    init_SamplingResult();
    init_span_kind();
    init_status();
    init_trace_flags();
    init_spancontext_utils();
    init_invalid_span_constants();
    init_context_api();
    init_diag_api();
    init_trace_api();
  }
});

// src/worker.ts
import { readdirSync as readdirSync2, statSync as statSync5 } from "fs";
import { join as join5 } from "path";
import { setTimeout as sleep2 } from "timers/promises";

// src/log.ts
import { appendFileSync, renameSync, statSync } from "fs";
var LIMIT = 1 << 20;
var Log = class {
  constructor(path) {
    this.path = path;
  }
  path;
  line(session, event, text) {
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
    try {
      if (size(this.path) > LIMIT) renameSync(this.path, `${this.path}.1`);
      appendFileSync(this.path, `${stamp} ${session.slice(0, 8)} ${event} ${text}
`, {
        mode: 384
      });
    } catch {
    }
  }
};
function size(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

// src/payload.ts
import { homedir } from "os";
import { join as join2 } from "path";

// src/transcript.ts
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync as statSync2
} from "fs";
import { join, parse, sep } from "path";

// src/text.ts
function pairAt(text, index) {
  const high = text.charCodeAt(index);
  const low = text.charCodeAt(index + 1);
  return high >= 55296 && high <= 56319 && low >= 56320 && low <= 57343;
}
function cut(text, max) {
  let end = 0;
  for (let count2 = 0; count2 < max && end < text.length; count2++) {
    end += pairAt(text, end) ? 2 : 1;
  }
  return text.slice(0, end);
}
function within(text, max) {
  return text.length <= max || cut(text, max).length === text.length;
}

// src/names.ts
var MODEL_MAX = 128;
var TOOL_MAX = 145;
var PLAIN_TOOL = /^[\w.:@+-]+$/;
var PLAIN_KIND = /^[\w.:-]{1,64}$/;
var CONTROL = /[\x00-\x1f\x7f-\x9f]/;
var PATH = /^(?:[/\\]|~(?:[/\\]|$)|\.{1,2}[/\\]|[A-Za-z]:[/\\]|file:)/i;
var WEIGHTS = /[/\\]([^/\\]+\.(?:gguf|ggml|bin|safetensors|llamafile))$/i;
function model(value) {
  const name = value.trim();
  if (!name || CONTROL.test(name)) return "unknown";
  const weights = WEIGHTS.exec(name);
  if (weights) return cut(weights[1], MODEL_MAX);
  if (PATH.test(name)) return "unknown";
  return cut(name, MODEL_MAX);
}
function tool(value) {
  return PLAIN_TOOL.test(value) ? value.slice(0, TOOL_MAX) : "unknown";
}
function kind(value) {
  return typeof value === "string" && PLAIN_KIND.test(value) ? value : void 0;
}

// src/transcript.ts
var INTERRUPTED = "[Request interrupted by user";
var INTERRUPTED_TOOL = "[Request interrupted by user for tool use]";
var NOTIFICATION = "<task-notification>";
var NOT_A_PROMPT = ["<local-command-stdout>", "<local-command-caveat>", "<system-reminder>"];
var TAG_SKILL = "telmoni-observability:tag";
var TAG_COMMAND = `<command-name>/${TAG_SKILL}</command-name>`;
var HEAD = 64;
var TAG_LOOK = 256;
var NOT_A_PERSONS = ["isMeta", "isCompactSummary", "turnCompanion", "isSidechain"];
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmpty(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}
function says(value) {
  return typeof value === "string" && /\S/.test(value);
}
function truthy(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}
var UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
var Row = class {
  constructor(offset, data) {
    this.offset = offset;
    this.data = data;
  }
  offset;
  data;
  get type() {
    return typeof this.data.type === "string" ? this.data.type : void 0;
  }
  get message() {
    return isObject(this.data.message) ? this.data.message : void 0;
  }
  get role() {
    const role = this.message?.role;
    return typeof role === "string" ? role : void 0;
  }
  get timestamp() {
    return parseTimestamp(this.data.timestamp);
  }
  get uuid() {
    return nonEmpty(this.data.uuid);
  }
  get sessionId() {
    return nonEmpty(this.data.sessionId);
  }
  get version() {
    return nonEmpty(this.data.version);
  }
  /** The folder Claude Code wrote the row in: its tags file's, never kept or sent. */
  get cwd() {
    return nonEmpty(this.data.cwd);
  }
};
function readRows(path, start) {
  const restarted = statSync2(path).size < start;
  if (restarted) start = 0;
  const chunk = readFrom(path, start);
  const rows = [];
  let position = start;
  for (let from = 0; ; ) {
    const newline = chunk.indexOf(10, from);
    if (newline < 0) break;
    const line = chunk.subarray(from, newline);
    const offset = position;
    position += line.length + 1;
    from = newline + 1;
    let data;
    try {
      data = JSON.parse(UTF8.decode(line));
    } catch {
      continue;
    }
    if (isObject(data)) rows.push(new Row(offset, data));
  }
  return { rows, end: position, restarted };
}
function readFrom(path, start) {
  const fd = openSync(path, "r");
  try {
    const chunks = [];
    for (let position = start; ; ) {
      const buffer = Buffer.allocUnsafe(1 << 20);
      const read3 = readSync(fd, buffer, 0, buffer.length, position);
      if (read3 === 0) break;
      chunks.push(buffer.subarray(0, read3));
      position += read3;
    }
    return Buffer.concat(chunks);
  } finally {
    closeSync(fd);
  }
}
var ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?)?(?:[Zz]|([+-])(\d{2})(?::?(\d{2}))?)?$/;
var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function parseTimestamp(value) {
  if (typeof value !== "string") return void 0;
  const found = ISO.exec(value);
  if (found === null) return void 0;
  const [year, month, day, hour, minute, second, , , zoneHour, zoneMinute] = found.slice(1).map((part) => Number(part ?? 0));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = month === 2 && leap ? 29 : DAYS[month - 1];
  if (year < 1 || days === void 0 || day < 1 || day > days) return void 0;
  if (hour > 23 || minute > 59 || second > 59 || zoneHour > 23 || zoneMinute > 59) {
    return void 0;
  }
  const when2 = /* @__PURE__ */ new Date(0);
  when2.setUTCFullYear(year, month - 1, day);
  when2.setUTCHours(hour, minute, second, Number((found[7] ?? "").padEnd(3, "0").slice(0, 3)));
  const offset = (found[8] === "-" ? -1 : 1) * (zoneHour * 60 + zoneMinute);
  return new Date(when2.getTime() - offset * 6e4);
}
function content(row) {
  return row.message?.content;
}
function textOf(row) {
  const given = content(row);
  if (typeof given === "string") return given;
  if (Array.isArray(given)) {
    for (const block of given) {
      if (isObject(block) && block.type === "text" && says(block.text)) return block.text;
    }
  }
  return "";
}
function blockTypes(row) {
  const given = content(row);
  if (!Array.isArray(given)) return /* @__PURE__ */ new Set();
  return new Set(
    given.flatMap(
      (block) => isObject(block) && typeof block.type === "string" ? [block.type] : []
    )
  );
}
function originKind(row) {
  const origin = row.data.origin;
  return isObject(origin) && typeof origin.kind === "string" ? origin.kind : void 0;
}
function opening(text, max) {
  const start = text.search(/\S/);
  return start < 0 ? "" : cut(text.slice(start, start + 2 * max), max);
}
function head(row) {
  return opening(textOf(row), HEAD);
}
function toolResults(row) {
  const given = content(row);
  if (!Array.isArray(given)) return [];
  const toolUse = row.data.toolUseResult;
  const interrupted = isObject(toolUse) && toolUse.interrupted === true;
  const results = [];
  for (const block of given) {
    if (isObject(block) && block.type === "tool_result") {
      const toolUseId = nonEmpty(block.tool_use_id);
      if (toolUseId !== void 0) {
        results.push({ toolUseId, isError: block.is_error === true, interrupted });
      }
    }
  }
  return results;
}
function isPrompt(row) {
  if (row.type !== "user" || row.role !== "user") return false;
  if (NOT_A_PERSONS.some((flag) => truthy(row.data[flag]))) return false;
  if (toolResults(row).length > 0) return false;
  const first = head(row);
  if ([INTERRUPTED, NOTIFICATION, ...NOT_A_PROMPT].some((marker) => first.startsWith(marker))) {
    return false;
  }
  return first !== "" || originKind(row) === "human" || blockTypes(row).has("image");
}
function tagCommand(row) {
  if (row.type !== "user") return void 0;
  const text = textOf(row);
  const markers = opening(text, TAG_LOOK);
  if (!markers.startsWith("<command-name>") && !markers.startsWith("<command-message>")) {
    return void 0;
  }
  if (!markers.includes(TAG_COMMAND)) return void 0;
  const start = text.indexOf("<command-args>");
  const end = start < 0 ? -1 : text.indexOf("</command-args>", start);
  return start >= 0 && start < end ? text.slice(start + "<command-args>".length, end) : "";
}
function interruption(row) {
  if (row.type !== "user" || row.role !== "user") return void 0;
  const first = head(row);
  if (first.startsWith(INTERRUPTED_TOOL)) return "tool";
  if (first.startsWith(INTERRUPTED)) return "turn";
  return void 0;
}
function notificationToolUseId(row) {
  if (row.type !== "user") return void 0;
  if (originKind(row) !== "task-notification" && !head(row).startsWith(NOTIFICATION)) {
    return void 0;
  }
  const text = textOf(row);
  const start = text.indexOf("<tool-use-id>");
  const end = start >= 0 ? text.indexOf("</tool-use-id>", start + 13) : -1;
  if (start < 0 || end < 0) return void 0;
  return text.slice(start + 13, end).trim() || void 0;
}
function handbackAgent(row) {
  const origin = row.data.origin;
  if (row.type !== "user" || !isObject(origin) || origin.kind !== "peer") return void 0;
  return origin.handback === true ? nonEmpty(origin.from) : void 0;
}
function asyncAgent(row) {
  const toolUse = row.data.toolUseResult;
  if (!isObject(toolUse)) return void 0;
  const launched = toolUse.status === "async_launched" || toolUse.status === "teammate_spawned";
  if (!launched && toolUse.isAsync !== true) return void 0;
  return typeof toolUse.agentId === "string" ? toolUse.agentId : "";
}
function isCompactSummary(row) {
  return row.type === "user" && row.data.isCompactSummary === true;
}
function stopBlocked(row) {
  const attachment = row.type === "attachment" ? row.data.attachment : void 0;
  return isObject(attachment) && attachment.type === "hook_blocking_error" && attachment.hookEvent === "Stop";
}
function endedTurn(row) {
  const reason = row.message?.stop_reason;
  return typeof reason === "string" && reason !== "tool_use" && reason !== "pause_turn";
}
function messageId(row) {
  return nonEmpty(row.message?.id);
}
function model2(row) {
  const value = nonEmpty(row.message?.model);
  return value === void 0 ? void 0 : model(value);
}
function usage(row) {
  const raw2 = row.message?.usage;
  if (!isObject(raw2)) return void 0;
  let write;
  if (isObject(raw2.cache_creation)) {
    const parts = Object.values(raw2.cache_creation).flatMap((value) => count(value) ?? []);
    write = parts.length > 0 ? parts.reduce((sum, value) => sum + value, 0) : void 0;
  }
  write ??= count(raw2.cache_creation_input_tokens);
  const uncached = count(raw2.input_tokens);
  const read3 = count(raw2.cache_read_input_tokens);
  const counted = [uncached, read3, write].filter((n) => n !== void 0);
  return {
    input: counted.length > 0 ? counted.reduce((sum, value) => sum + value, 0) : void 0,
    output: count(raw2.output_tokens),
    cacheRead: read3,
    cacheWrite: write
  };
}
function count(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : void 0;
}
function errorKind(value) {
  return typeof value === "string" && value !== "" && within(value, 64) && !value.includes(" ") ? value : void 0;
}
function apiError(row) {
  if (row.data.isApiErrorMessage !== true) return void 0;
  return errorKind(row.data.error) ?? "ApiError";
}
function toolUses(row) {
  const given = content(row);
  if (!Array.isArray(given)) return [];
  const uses = [];
  for (const block of given) {
    if (!isObject(block) || block.type !== "tool_use") continue;
    const toolUseId = nonEmpty(block.id);
    const name = block.name;
    if (toolUseId === void 0 || typeof name !== "string") continue;
    const input = isObject(block.input) ? block.input : {};
    const agent = name === "Agent" || name === "Task";
    const tagged = name === "Skill" && input.skill === TAG_SKILL;
    uses.push({
      toolUseId,
      name: tool(name),
      skill: name === "Skill" ? kind(input.skill) : void 0,
      subagentType: agent ? kind(input.subagent_type) : void 0,
      background: agent && input.run_in_background === true,
      tags: tagged && typeof input.args === "string" ? input.args : void 0
    });
  }
  return uses;
}
function subagentsDir(transcriptPath) {
  const { dir, name } = parse(transcriptPath);
  return join(dir, name, "subagents");
}
function discoverSubagents(transcriptPath) {
  const folder = subagentsDir(transcriptPath);
  const found = /* @__PURE__ */ new Map();
  let listed2;
  try {
    if (!statSync2(folder).isDirectory()) return found;
    listed2 = readdirSync(folder, { recursive: true, encoding: "utf8" });
  } catch {
    return found;
  }
  const metas = listed2.filter((name) => name.endsWith(".meta.json")).sort(byParts);
  for (const name of metas) {
    const metaPath = join(folder, name);
    let meta;
    try {
      meta = JSON.parse(UTF8.decode(readFileSync(metaPath)));
    } catch {
      continue;
    }
    const toolUseId = isObject(meta) ? nonEmpty(meta.toolUseId) : void 0;
    if (!isObject(meta) || toolUseId === void 0) continue;
    const rowsPath = `${metaPath.slice(0, -".meta.json".length)}.jsonl`;
    if (!existsSync(rowsPath)) continue;
    found.set(toolUseId, {
      toolUseId,
      agentType: kind(meta.agentType),
      finished: typeof meta.finished === "boolean" ? meta.finished : void 0,
      path: rowsPath
    });
  }
  return found;
}
function byParts(a, b) {
  const left = a.split(sep);
  const right = b.split(sep);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return left.length - right.length;
}
function promptParts(row) {
  let given = content(row);
  if (typeof given === "string") given = [{ type: "text", text: given }];
  const parts = [];
  for (const block of Array.isArray(given) ? given : []) {
    if (!isObject(block)) continue;
    const source = block.source;
    if (block.type === "text" && says(block.text)) {
      parts.push({ type: "text", content: block.text });
    } else if (block.type === "image" && isObject(source) && source.type === "base64" && says(source.data)) {
      const image = { type: "blob", modality: "image", content: source.data };
      if (says(source.media_type)) image.mime_type = source.media_type;
      parts.push(image);
    }
  }
  return parts;
}
function summaryParts(row) {
  return promptParts(row).filter((part) => part.type === "text");
}
function replyParts(row) {
  const given = content(row);
  const parts = [];
  for (const block of Array.isArray(given) ? given : []) {
    if (!isObject(block)) continue;
    if (block.type === "thinking" && says(block.thinking)) {
      parts.push({ type: "reasoning", content: block.thinking });
    } else if (block.type === "text" && says(block.text)) {
      parts.push({ type: "text", content: block.text });
    } else if (block.type === "tool_use" && says(block.id) && typeof block.name === "string") {
      const call = { type: "tool_call", id: block.id, name: block.name };
      if (Object.hasOwn(block, "input")) call.arguments = block.input;
      parts.push(call);
    }
  }
  return parts;
}
function toolOutputs(row) {
  const given = content(row);
  const outputs = /* @__PURE__ */ new Map();
  for (const block of Array.isArray(given) ? given : []) {
    if (isObject(block) && block.type === "tool_result") {
      const output = block.content;
      if (says(block.tool_use_id) && (typeof output === "string" || Array.isArray(output))) {
        outputs.set(block.tool_use_id, output);
      }
    }
  }
  return outputs;
}
function subagentTask(input) {
  const task = isObject(input) ? input.prompt : void 0;
  return says(task) ? task : void 0;
}

// src/payload.ts
function fromJson(data) {
  if (!isObject(data)) throw new TypeError("the payload is not an object");
  const { sessionId, transcriptPath, event, error, busy } = data;
  if (typeof sessionId !== "string" || typeof transcriptPath !== "string") {
    throw new TypeError("the payload names no session or transcript");
  }
  return {
    sessionId,
    transcriptPath,
    event: String(event),
    error: typeof error === "string" ? error : void 0,
    busy: busy === true
  };
}

// src/record.ts
import { createHash } from "crypto";

// src/tags.ts
import {
  closeSync as closeSync2,
  constants,
  fstatSync,
  lstatSync,
  openSync as openSync2,
  readSync as readSync2
} from "fs";
import { dirname, isAbsolute, join as join3 } from "path";
var FILE = ".telmoni-tags.json";
var FILE_MAX = 64 * 1024;
var TAGS_MAX = 32;
var VALUE_MAX = 256;
var KEY = /^[A-Za-z0-9_.-]{1,64}$/;
var CONTROL2 = /[\x00-\x1f\x7f-\x9f]/;
var RESERVED = "skills";
var NOFOLLOW = constants.O_NOFOLLOW ?? 0;
var NONBLOCK = constants.O_NONBLOCK ?? 0;
var UTF82 = new TextDecoder("utf-8", { fatal: true });
function problem(key, value = "") {
  if (typeof key !== "string" || !KEY.test(key)) {
    return "tag dropped: its key is not 1 to 64 letters, digits, _ . or -";
  }
  if (key === RESERVED) return "tag dropped: skills is the plugin's own";
  if (typeof value !== "string" || !within(value, VALUE_MAX) || CONTROL2.test(value) || !value.isWellFormed()) {
    return "tag dropped: its value is not text of at most 256 characters";
  }
  return void 0;
}
function asked(given, commands, note) {
  const kept2 = new Map(given);
  for (const command of commands) {
    for (const token of command.split(/\s+/)) {
      if (token === "") continue;
      const equals = token.indexOf("=");
      const key = equals < 0 ? token : token.slice(0, equals);
      const value = equals < 0 ? "" : token.slice(equals + 1);
      const why = equals < 0 ? "tag dropped: not key=value" : problem(key, value);
      if (why !== void 0) note(why);
      else if (value) kept2.set(key, value);
      else kept2.delete(key);
    }
  }
  return kept2;
}
function ofTurn(asked2, folder, note) {
  const tags = new Map(asked2);
  for (const [key, value] of fromFile(folder, note)) {
    if (!tags.has(key)) tags.set(key, value);
  }
  return tags;
}
function fromFile(folder, note) {
  if (!folder || !isAbsolute(folder)) return /* @__PURE__ */ new Map();
  for (let place = folder; ; place = dirname(place)) {
    const path = join3(place, FILE);
    let found;
    try {
      found = lstatSync(path);
    } catch (fault) {
      const code = fault.code;
      if (code !== "ENOENT" && code !== "ENOTDIR") {
        note("tags file not read: unreadable");
        return /* @__PURE__ */ new Map();
      }
      if (dirname(place) === place) return /* @__PURE__ */ new Map();
      continue;
    }
    return found.isFile() ? read(path, note) : refused(note);
  }
}
function read(path, note) {
  let fd;
  try {
    fd = openSync2(path, constants.O_RDONLY | NOFOLLOW | NONBLOCK);
  } catch (fault) {
    if (fault.code === "ELOOP") return refused(note);
    note("tags file not read: unreadable");
    return /* @__PURE__ */ new Map();
  }
  let raw2;
  try {
    if (!fstatSync(fd).isFile()) return refused(note);
    raw2 = readUpTo(fd, FILE_MAX + 1);
  } catch {
    note("tags file not read: unreadable");
    return /* @__PURE__ */ new Map();
  } finally {
    closeSync2(fd);
  }
  if (raw2.length > FILE_MAX) {
    note("tags file not read: past 64 KiB");
    return /* @__PURE__ */ new Map();
  }
  let data;
  try {
    data = JSON.parse(UTF82.decode(raw2));
  } catch {
    data = void 0;
  }
  if (!isObject(data)) {
    note("tags file not read: not a JSON object");
    return /* @__PURE__ */ new Map();
  }
  const tags = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(data)) {
    const why = problem(key, value);
    if (why !== void 0) note(why);
    else tags.set(key, value);
  }
  return tags;
}
function readUpTo(fd, max) {
  const buffer = Buffer.alloc(max);
  let filled2 = 0;
  while (filled2 < max) {
    const read3 = readSync2(fd, buffer, filled2, max - filled2, null);
    if (read3 === 0) break;
    filled2 += read3;
  }
  return buffer.subarray(0, filled2);
}
function refused(note) {
  note("tags file not read: not a plain file");
  return /* @__PURE__ */ new Map();
}
function kept(given) {
  if (!isObject(given)) return /* @__PURE__ */ new Map();
  return new Map(
    Object.entries(given).slice(0, TAGS_MAX).filter((entry) => {
      const [key, value] = entry;
      return typeof value === "string" && value !== "" && problem(key, value) === void 0;
    })
  );
}

// src/turns.ts
function later(a, b) {
  return b > a ? b : a;
}
var Turn = class {
  constructor(offset, promptUuid, start, end, version) {
    this.offset = offset;
    this.promptUuid = promptUuid;
    this.start = start;
    this.end = end;
    this.version = version;
  }
  offset;
  promptUuid;
  start;
  end;
  version;
  modelCalls = [];
  toolCalls = [];
  compactions = [];
  endedByInterruption = false;
  // Begun by a `Stop` hook that blocked, not by a prompt.
  continued = false;
  // Whether the last reply ended the model's turn.
  repliedLast = false;
  open = true;
  nextOffset = 0;
  // Whether the conversation is read, the developer's switch, and the prompt as it was.
  content = false;
  prompt;
  // The tags asked for in the turn, each command's `key=value` words in order, and the folder
  // it started in, whose tags file is read for its tags alone.
  asked = [];
  folder;
  toolsById = /* @__PURE__ */ new Map();
  #modelsById = /* @__PURE__ */ new Map();
  // The calls the last result row answered: a refusal's marker right after names them.
  #answered = [];
  // Whether the last row taken was a reply: an interruption right after cuts it short.
  #replied = false;
  // The tool results since the last model call, the next one's input.
  #given = [];
  // Kept once a model call follows: at the turn's end, one would depend on when the hook ran.
  #compacting = [];
  /** Take one row of the turn; gives the time the next row follows from. */
  feed(row, last) {
    const when2 = row.timestamp ?? last;
    if (row.type === "assistant" && row.role === "assistant") {
      this.#reply(row, last, when2);
      return when2;
    }
    if (row.type === "user") {
      const results = toolResults(row);
      if (results.length > 0) {
        this.#results(row, results, when2);
        return when2;
      }
      const kind2 = interruption(row);
      if (kind2 !== void 0) {
        if (kind2 === "tool") {
          for (const tool2 of this.#answered) {
            tool2.cancelled = true;
            tool2.errorType = void 0;
          }
        } else if (this.#replied && this.modelCalls.length > 0) {
          this.modelCalls.at(-1).cancelled = true;
        }
        this.#replied = false;
        this.endedByInterruption = true;
        this.#later(when2);
        return when2;
      }
    }
    return last;
  }
  #reply(row, last, when2) {
    const key = messageId(row) ?? `row:${row.offset}`;
    let call = this.#modelsById.get(key);
    if (call === void 0) {
      call = {
        model: model2(row) ?? "unknown",
        start: last,
        end: when2,
        usage: usage(row),
        errorType: void 0,
        cancelled: false,
        input: this.#input(),
        output: void 0
      };
      this.#modelsById.set(key, call);
      this.modelCalls.push(call);
      this.compactions.push(...this.#compacting);
      this.#compacting = [];
    } else {
      call.end = later(call.end, when2);
      call.usage = usage(row) ?? call.usage;
    }
    const kind2 = apiError(row);
    if (kind2 !== void 0) call.errorType = kind2;
    const said = this.content ? replyParts(row) : [];
    if (said.length > 0) call.output = [...call.output ?? [], ...said];
    const inputs = /* @__PURE__ */ new Map();
    for (const part of said) if (part.type === "tool_call") inputs.set(part.id, part.arguments);
    for (const use of toolUses(row)) {
      if (use.tags !== void 0) this.asked.push(use.tags);
      const tool2 = {
        toolUseId: use.toolUseId,
        name: use.name,
        start: when2,
        end: void 0,
        errorType: void 0,
        cancelled: false,
        skill: use.skill,
        subagentType: use.subagentType,
        background: use.background,
        agentId: void 0,
        notified: false,
        replied: false,
        arguments: inputs.get(use.toolUseId),
        result: void 0
      };
      this.toolsById.set(use.toolUseId, tool2);
      this.toolCalls.push(tool2);
    }
    this.#answered = [];
    this.#replied = true;
    this.repliedLast = endedTurn(row);
    this.endedByInterruption = false;
    this.#later(when2);
  }
  #results(row, results, when2) {
    const agent = asyncAgent(row);
    const outputs = this.content ? toolOutputs(row) : /* @__PURE__ */ new Map();
    const answered2 = [];
    for (const result of results) {
      const tool2 = this.toolsById.get(result.toolUseId);
      if (tool2 === void 0) continue;
      tool2.end = when2;
      tool2.cancelled = result.interrupted;
      tool2.errorType = result.isError && !result.interrupted ? "ToolError" : void 0;
      tool2.result = outputs.get(result.toolUseId);
      if (tool2.result !== void 0) {
        this.#given.push({ type: "tool_call_response", id: tool2.toolUseId, response: tool2.result });
      }
      if (agent !== void 0) {
        tool2.background = true;
        tool2.agentId = agent;
      }
      answered2.push(tool2);
    }
    this.#answered = answered2;
    this.#replied = false;
    this.#later(when2);
  }
  /** What a new model call was given: the prompt to the turn's first, and to each after the tool results since the one before. */
  #input() {
    const given = this.#given;
    this.#given = [];
    if (this.modelCalls.length === 0) {
      return this.prompt?.length ? [{ role: "user", parts: this.prompt }] : void 0;
    }
    return given.length > 0 ? [{ role: "tool", parts: given }] : void 0;
  }
  /**
   * Take a compaction's summary row: a step from the event before it, once a model call follows;
   * the turn's end waits on that call.
   */
  compacted(row, last) {
    const when2 = row.timestamp ?? last;
    const summary = this.content ? summaryParts(row) : void 0;
    this.#compacting.push({ start: last, end: when2, summary });
    return when2;
  }
  #later(when2) {
    if (when2 > this.end) this.end = when2;
  }
};
function assemble(rows, sessionId, end, content2 = false) {
  const turns = [];
  let current;
  let last = /* @__PURE__ */ new Date();
  const tools = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (row.sessionId !== void 0 && row.sessionId !== sessionId) continue;
    const continued = stopBlocked(row);
    if (continued || isPrompt(row)) {
      if (current !== void 0) {
        current.open = false;
        current.nextOffset = row.offset;
        turns.push(current);
      }
      const when2 = row.timestamp ?? last;
      current = new Turn(row.offset, row.uuid ?? `offset:${row.offset}`, when2, when2, row.version);
      current.continued = continued;
      current.content = content2;
      current.prompt = content2 ? promptParts(row) : void 0;
      current.folder = row.cwd;
      const command = tagCommand(row);
      if (command !== void 0) current.asked.push(command);
      last = when2;
      continue;
    }
    if (current !== void 0) {
      last = isCompactSummary(row) ? current.compacted(row, last) : current.feed(row, last);
      for (const [id, tool2] of current.toolsById) tools.set(id, tool2);
    }
    notice(row, tools);
  }
  if (current !== void 0) {
    current.nextOffset = end;
    turns.push(current);
  }
  return turns;
}
function notice(row, tools) {
  if (row.type === "assistant") {
    for (const tool3 of tools.values()) {
      if (tool3.notified) tool3.replied = true;
    }
    return;
  }
  let named = notificationToolUseId(row);
  const agentId = named === void 0 ? handbackAgent(row) : void 0;
  if (agentId !== void 0) {
    named = [...tools].find(([, tool3]) => tool3.agentId === agentId)?.[0];
  }
  const tool2 = named ? tools.get(named) : void 0;
  if (tool2 !== void 0 && !tool2.notified) {
    tool2.notified = true;
    tool2.replied = false;
  }
}
function collect(rows, content2 = false, task) {
  const first = rows.find((row) => row.timestamp !== void 0)?.timestamp;
  if (first === void 0) return { models: [], tools: [], ended: void 0 };
  const work2 = new Turn(0, "", first, first);
  work2.content = content2;
  work2.prompt = task;
  let last = first;
  for (const row of rows) last = work2.feed(row, last);
  return { models: work2.modelCalls, tools: work2.toolCalls, ended: work2.end };
}
function isComplete(turn, event, busy, subagents) {
  if (event === "SessionEnd") return true;
  for (const tool2 of turn.toolCalls) {
    if (tool2.background && !(tool2.notified && tool2.replied)) return false;
    if (subagents.get(tool2.toolUseId)?.finished === false) return false;
  }
  const ended = turn.repliedLast || turn.endedByInterruption;
  if (event === "Stop" && turn.open && turn.continued && !ended) return false;
  return !(turn.open && busy);
}
function errorType(turn, event, payloadError) {
  const lastCall = turn.modelCalls.at(-1);
  if (lastCall?.errorType) return lastCall.errorType;
  if (turn.open && event === "StopFailure") return payloadError || "unknown";
  return void 0;
}

// src/record.ts
var AGENT = "claude-code";
var NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
var NAMESPACE = uuid5(NAMESPACE_URL, "https://telmoni.com/claude-observability-plugin");
var TAG_MAX = 256;
var STEP_DEPTH_MAX = 16;
function uuid5(namespace, name) {
  const bytes = createHash("sha1").update(Buffer.from(namespace.replaceAll("-", ""), "hex")).update(name, "utf8").digest().subarray(0, 16);
  bytes[6] = bytes[6] & 15 | 80;
  bytes[8] = bytes[8] & 63 | 128;
  return bytes.toString("hex");
}
function traceId(sessionId, promptUuid) {
  return uuid5(NAMESPACE, `${sessionId}:${promptUuid}`);
}
function build(turn, options) {
  const { sessionId, event, payloadError, subagents = /* @__PURE__ */ new Map(), read: read3 = () => [] } = options;
  const { provider = "anthropic", tags = /* @__PURE__ */ new Map(), note = () => {
  } } = options;
  const calls = turn.modelCalls.map((call) => model3(call, provider));
  calls.push(...turn.compactions.map(compaction));
  const skills = [];
  const expanded = /* @__PURE__ */ new Set();
  const expand = (tool2, end, depth) => {
    const known = subagents.get(tool2.toolUseId);
    if (known === void 0 || depth > STEP_DEPTH_MAX || expanded.has(tool2.toolUseId)) {
      return plainTool(tool2, end);
    }
    expanded.add(tool2.toolUseId);
    return step(tool2, known, read3(known), provider, turn.content, expand, depth);
  };
  for (const tool2 of turn.toolCalls) {
    if (tool2.skill && !skills.includes(tool2.skill)) skills.push(tool2.skill);
    calls.push(expand(tool2, turn.end, 1));
  }
  byStart(calls);
  const made = {
    trace_id: traceId(sessionId, turn.promptUuid),
    agent: AGENT,
    start: iso(turn.start),
    end: iso(turn.end),
    session_id: sessionId,
    release: turn.version ?? null,
    tags: traceTags(skills, tags, note),
    error_type: errorType(turn, event, payloadError) ?? null,
    cancelled: turn.endedByInterruption,
    calls
  };
  if (turn.prompt?.length) made.input_messages = message("user", turn.prompt);
  const last = turn.modelCalls.at(-1)?.output;
  if (last?.length) made.output_messages = message("assistant", last);
  return made;
}
function message(role, parts) {
  return [{ role, parts }];
}
function traceTags(skills, given, note) {
  const tags = /* @__PURE__ */ new Map();
  if (skills.length > 0) tags.set("skills", joinSkills(skills));
  for (const [key, value] of given) {
    if (tags.size === TAGS_MAX) {
      note("tags past 32 dropped");
      break;
    }
    tags.set(key, value);
  }
  return Object.fromEntries(tags);
}
function joinSkills(names2) {
  let joined = names2.join(",");
  while (joined.length > TAG_MAX && joined.includes(",")) {
    joined = joined.slice(0, joined.lastIndexOf(","));
  }
  return joined.slice(0, TAG_MAX);
}
function byStart(calls) {
  calls.sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
}
function model3(call, provider) {
  const usage2 = call.usage;
  const made = {
    kind: "model",
    model: call.model,
    provider,
    start: iso(call.start),
    end: iso(latest(call.end, call.start)),
    usage: usage2 === void 0 ? null : {
      input: usage2.input ?? null,
      output: usage2.output ?? null,
      cache_read: usage2.cacheRead ?? null,
      cache_write: usage2.cacheWrite ?? null
    },
    error_type: call.errorType ?? null,
    cancelled: call.cancelled
  };
  if (call.input?.length) made.input_messages = call.input;
  if (call.output?.length) made.output_messages = message("assistant", call.output);
  return made;
}
function compaction(compacted) {
  const made = {
    kind: "step",
    name: "compaction",
    start: iso(compacted.start),
    end: iso(latest(compacted.end, compacted.start)),
    error_type: null,
    cancelled: false
  };
  if (compacted.summary?.length) made.output_messages = message("assistant", compacted.summary);
  return made;
}
function plainTool(tool2, turnEnd) {
  const end = tool2.end ?? turnEnd;
  const made = {
    kind: "tool",
    name: tool2.name,
    start: iso(tool2.start),
    end: iso(latest(end, tool2.start)),
    error_type: tool2.errorType ?? null,
    // A call never answered was stopped with the turn.
    cancelled: tool2.cancelled || tool2.end === void 0
  };
  if (tool2.arguments != null) made.arguments = tool2.arguments;
  if (tool2.result != null) made.result = tool2.result;
  return made;
}
function step(tool2, known, rows, provider, content2, expand, depth) {
  const task = subagentTask(tool2.arguments);
  const asked2 = task ? [{ type: "text", content: task }] : void 0;
  const { models, tools, ended } = collect(rows, content2, asked2);
  const end = [tool2.end, ended].reduce(
    (latestSoFar, when2) => when2 !== void 0 ? latest(latestSoFar, when2) : latestSoFar,
    tool2.start
  );
  const inner = models.map((call) => model3(call, provider));
  inner.push(...tools.map((call) => expand(call, end, depth + 1)));
  byStart(inner);
  const kind2 = tool2.subagentType ?? known.agentType;
  const made = {
    kind: "step",
    name: kind2 ? `subagent ${kind2}` : "subagent",
    start: iso(tool2.start),
    end: iso(latest(end, tool2.start)),
    error_type: tool2.errorType ?? null,
    cancelled: tool2.cancelled || tool2.end === void 0,
    calls: inner
  };
  if (asked2) made.input_messages = message("user", asked2);
  const answer = models.at(-1)?.output;
  if (answer?.length) made.output_messages = message("assistant", answer);
  return made;
}
function latest(a, b) {
  return b > a ? b : a;
}
function iso(when2) {
  return when2.toISOString();
}

// ../telmoni/sdk/typescript/dist/index.mjs
init_esm();
import { BlockList, isIPv4, isIPv6 } from "net";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js
init_esm();
var SUPPRESS_TRACING_KEY = createContextKey("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function isTracingSuppressed(context2) {
  return context2.getValue(SUPPRESS_TRACING_KEY) === true;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/common/attributes.js
init_esm();
function sanitizeAttributes(attributes) {
  const out = {};
  if (typeof attributes !== "object" || attributes == null) {
    return out;
  }
  for (const key in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, key)) {
      continue;
    }
    if (!isAttributeKey(key)) {
      diag.warn(`Invalid attribute key: ${key}`);
      continue;
    }
    const val = attributes[key];
    if (!isAttributeValue(val)) {
      diag.warn(`Invalid attribute value set for key: ${key}`);
      continue;
    }
    if (Array.isArray(val)) {
      out[key] = val.slice();
    } else {
      out[key] = val;
    }
  }
  return out;
}
function isAttributeKey(key) {
  return typeof key === "string" && key !== "";
}
function isAttributeValue(val) {
  if (val == null) {
    return true;
  }
  if (Array.isArray(val)) {
    return isHomogeneousAttributeValueArray(val);
  }
  return isValidPrimitiveAttributeValueType(typeof val);
}
function isHomogeneousAttributeValueArray(arr) {
  let type;
  for (const element of arr) {
    if (element == null)
      continue;
    const elementType = typeof element;
    if (elementType === type) {
      continue;
    }
    if (!type) {
      if (isValidPrimitiveAttributeValueType(elementType)) {
        type = elementType;
        continue;
      }
      return false;
    }
    return false;
  }
  return true;
}
function isValidPrimitiveAttributeValueType(valType) {
  switch (valType) {
    case "number":
    case "boolean":
    case "string":
      return true;
  }
  return false;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/common/logging-error-handler.js
init_esm();
function loggingErrorHandler() {
  return (ex) => {
    diag.error(stringifyException(ex));
  };
}
function stringifyException(ex) {
  if (typeof ex === "string") {
    return ex;
  } else {
    return JSON.stringify(flattenException(ex));
  }
}
function flattenException(ex) {
  const result = {};
  let current = ex;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach((propertyName) => {
      if (result[propertyName])
        return;
      const value = current[propertyName];
      if (value) {
        result[propertyName] = String(value);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return result;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js
var delegateHandler = loggingErrorHandler();
function globalErrorHandler(ex) {
  try {
    delegateHandler(ex);
  } catch {
  }
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/platform/node/environment.js
init_esm();
import { inspect } from "util";
function getNumberFromEnv(key) {
  const raw2 = process.env[key];
  if (raw2 == null || raw2.trim() === "") {
    return void 0;
  }
  const value = Number(raw2);
  if (isNaN(value)) {
    diag.warn(`Unknown value ${inspect(raw2)} for ${key}, expected a number, using defaults`);
    return void 0;
  }
  return value;
}
function getStringFromEnv(key) {
  const raw2 = process.env[key];
  if (raw2 == null || raw2.trim() === "") {
    return void 0;
  }
  return raw2;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/version.js
var VERSION2 = "2.12.0";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/semantic-conventions/build/esm/stable_attributes.js
var ATTR_EXCEPTION_MESSAGE = "exception.message";
var ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
var ATTR_EXCEPTION_TYPE = "exception.type";
var ATTR_SERVICE_NAME = "service.name";
var ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
var TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
var ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
var ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/semconv.js
var ATTR_PROCESS_RUNTIME_NAME = "process.runtime.name";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/platform/node/sdk-info.js
var SDK_INFO = {
  [ATTR_TELEMETRY_SDK_NAME]: "opentelemetry",
  [ATTR_PROCESS_RUNTIME_NAME]: "node",
  [ATTR_TELEMETRY_SDK_LANGUAGE]: TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS,
  [ATTR_TELEMETRY_SDK_VERSION]: VERSION2
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/platform/node/index.js
var otperformance = performance;

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/common/time.js
var NANOSECOND_DIGITS = 9;
var NANOSECOND_DIGITS_IN_MILLIS = 6;
var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
function millisToHrTime(epochMillis) {
  const epochSeconds = epochMillis / 1e3;
  const seconds = Math.trunc(epochSeconds);
  const nanos2 = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS);
  return [seconds, nanos2];
}
function hrTime(performanceNow) {
  const timeOrigin = millisToHrTime(otperformance.timeOrigin);
  const now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now());
  return addHrTimes(timeOrigin, now);
}
function hrTimeDuration(startTime, endTime) {
  let seconds = endTime[0] - startTime[0];
  let nanos2 = endTime[1] - startTime[1];
  if (nanos2 < 0) {
    seconds -= 1;
    nanos2 += SECOND_TO_NANOSECONDS;
  }
  return [seconds, nanos2];
}
function isTimeInputHrTime(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function isTimeInput(value) {
  return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
function addHrTimes(time1, time2) {
  const out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS) {
    out[1] -= SECOND_TO_NANOSECONDS;
    out[0] += 1;
  }
  return out;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/utils/lodash.merge.js
var objectTag = "[object Object]";
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
var objectCtorString = funcToString.call(Object);
var getPrototypeOf = Object.getPrototypeOf;
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
var nativeObjectToString = objectProto.toString;
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
    return false;
  }
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function getRawTag(value) {
  const isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  let unmasked = false;
  try {
    value[symToStringTag] = void 0;
    unmasked = true;
  } catch {
  }
  const result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
function objectToString(value) {
  return nativeObjectToString.call(value);
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/core/build/esm/utils/merge.js
var MAX_LEVEL = 20;
function merge(...args) {
  let result = args.shift();
  const objects = /* @__PURE__ */ new WeakMap();
  while (args.length > 0) {
    result = mergeTwoObjects(result, args.shift(), 0, objects);
  }
  return result;
}
function takeValue(value) {
  if (isArray(value)) {
    return value.slice();
  }
  return value;
}
function mergeTwoObjects(one, two, level = 0, objects) {
  let result;
  if (level > MAX_LEVEL) {
    return void 0;
  }
  level++;
  if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
    result = takeValue(two);
  } else if (isArray(one)) {
    result = one.slice();
    if (isArray(two)) {
      for (let i = 0, j = two.length; i < j; i++) {
        result.push(takeValue(two[i]));
      }
    } else if (isObject2(two)) {
      const keys = Object.keys(two);
      for (let i = 0, j = keys.length; i < j; i++) {
        const key = keys[i];
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }
        result[key] = takeValue(two[key]);
      }
    }
  } else if (isObject2(one)) {
    if (isObject2(two)) {
      if (!shouldMerge(one, two)) {
        return two;
      }
      result = Object.assign({}, one);
      const keys = Object.keys(two);
      for (let i = 0, j = keys.length; i < j; i++) {
        const key = keys[i];
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }
        const twoValue = two[key];
        if (isPrimitive(twoValue)) {
          if (typeof twoValue === "undefined") {
            delete result[key];
          } else {
            result[key] = twoValue;
          }
        } else {
          const obj1 = result[key];
          const obj2 = twoValue;
          if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
            delete result[key];
          } else {
            if (isObject2(obj1) && isObject2(obj2)) {
              const arr1 = objects.get(obj1) || [];
              const arr2 = objects.get(obj2) || [];
              arr1.push({ obj: one, key });
              arr2.push({ obj: two, key });
              objects.set(obj1, arr1);
              objects.set(obj2, arr2);
            }
            result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
          }
        }
      }
    } else {
      result = two;
    }
  }
  return result;
}
function wasObjectReferenced(obj, key, objects) {
  const arr = objects.get(obj[key]) || [];
  for (let i = 0, j = arr.length; i < j; i++) {
    const info = arr[i];
    if (info.key === key && info.obj === obj) {
      return true;
    }
  }
  return false;
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject2(value) {
  return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
  if (!isPlainObject(one) || !isPlainObject(two)) {
    return false;
  }
  return true;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/resources/build/esm/default-service-name.js
var serviceName;
function defaultServiceName() {
  if (serviceName === void 0) {
    try {
      const argv0 = globalThis.process.argv0;
      serviceName = argv0 ? `unknown_service:${argv0}` : "unknown_service";
    } catch {
      serviceName = "unknown_service";
    }
  }
  return serviceName;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/resources/build/esm/utils.js
var isPromiseLike = (val) => {
  return val !== null && typeof val === "object" && typeof val.then === "function";
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js
var ResourceImpl = class _ResourceImpl {
  _rawAttributes;
  _asyncAttributesPending = false;
  _schemaUrl;
  _memoizedAttributes;
  static FromAttributeList(attributes, options) {
    const res = new _ResourceImpl({}, options);
    res._rawAttributes = guardedRawAttributes(attributes);
    res._asyncAttributesPending = attributes.filter(([_, val]) => isPromiseLike(val)).length > 0;
    return res;
  }
  constructor(resource, options) {
    const attributes = resource.attributes ?? {};
    this._rawAttributes = Object.entries(attributes).map(([k, v]) => {
      if (isPromiseLike(v)) {
        this._asyncAttributesPending = true;
      }
      return [k, v];
    });
    this._rawAttributes = guardedRawAttributes(this._rawAttributes);
    this._schemaUrl = validateSchemaUrl(options?.schemaUrl);
  }
  get asyncAttributesPending() {
    return this._asyncAttributesPending;
  }
  async waitForAsyncAttributes() {
    if (!this.asyncAttributesPending) {
      return;
    }
    for (let i = 0; i < this._rawAttributes.length; i++) {
      const [k, v] = this._rawAttributes[i];
      this._rawAttributes[i] = [k, isPromiseLike(v) ? await v : v];
    }
    this._asyncAttributesPending = false;
  }
  get attributes() {
    if (this.asyncAttributesPending) {
      diag.error("Accessing resource attributes before async attributes settled");
    }
    if (this._memoizedAttributes) {
      return this._memoizedAttributes;
    }
    const attrs = {};
    for (const [k, v] of this._rawAttributes) {
      if (isPromiseLike(v)) {
        diag.debug(`Unsettled resource attribute ${k} skipped`);
        continue;
      }
      if (v != null) {
        attrs[k] ??= v;
      }
    }
    if (!this._asyncAttributesPending) {
      this._memoizedAttributes = attrs;
    }
    return attrs;
  }
  getRawAttributes() {
    return this._rawAttributes;
  }
  get schemaUrl() {
    return this._schemaUrl;
  }
  merge(resource) {
    if (resource == null)
      return this;
    const mergedSchemaUrl = mergeSchemaUrl(this, resource);
    const mergedOptions = mergedSchemaUrl ? { schemaUrl: mergedSchemaUrl } : void 0;
    return _ResourceImpl.FromAttributeList([...resource.getRawAttributes(), ...this.getRawAttributes()], mergedOptions);
  }
};
function resourceFromAttributes(attributes, options) {
  return ResourceImpl.FromAttributeList(Object.entries(attributes), options);
}
function defaultResource() {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]: defaultServiceName(),
    [ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
    [ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
    [ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION]
  });
}
function guardedRawAttributes(attributes) {
  return attributes.map(([k, v]) => {
    if (isPromiseLike(v)) {
      return [
        k,
        v.catch((err) => {
          diag.debug("promise rejection for resource attribute: %s - %s", k, err);
          return void 0;
        })
      ];
    }
    return [k, v];
  });
}
function validateSchemaUrl(schemaUrl) {
  if (typeof schemaUrl === "string" || schemaUrl === void 0) {
    return schemaUrl;
  }
  diag.warn("Schema URL must be string or undefined, got %s. Schema URL will be ignored.", schemaUrl);
  return void 0;
}
function mergeSchemaUrl(old, updating) {
  const oldSchemaUrl = old?.schemaUrl;
  const updatingSchemaUrl = updating?.schemaUrl;
  const isOldEmpty = oldSchemaUrl === void 0 || oldSchemaUrl === "";
  const isUpdatingEmpty = updatingSchemaUrl === void 0 || updatingSchemaUrl === "";
  if (isOldEmpty) {
    return updatingSchemaUrl;
  }
  if (isUpdatingEmpty) {
    return oldSchemaUrl;
  }
  if (oldSchemaUrl === updatingSchemaUrl) {
    return oldSchemaUrl;
  }
  diag.warn('Schema URL merge conflict: old resource has "%s", updating resource has "%s". Resulting resource will have undefined Schema URL.', oldSchemaUrl, updatingSchemaUrl);
  return void 0;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/TracerProvider.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/Tracer.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/Span.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/enums.js
var ExceptionEventName = "exception";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/inspect.js
var inspectCustom = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
function settledResourceAttributes(resource) {
  const attrs = {};
  for (const [k, v] of resource.getRawAttributes()) {
    if (typeof v?.then === "function") {
      continue;
    }
    if (v != null) {
      attrs[k] ??= v;
    }
  }
  return attrs;
}
function formatInspect(className, payload, depth, options, inspect2) {
  if (typeof depth === "number" && depth < 0) {
    const tag = `[${className}]`;
    return options?.stylize ? options.stylize(tag, "special") : tag;
  }
  if (typeof inspect2 !== "function" || !options) {
    return payload;
  }
  const childOptions = {
    ...options,
    depth: options.depth == null ? options.depth : options.depth - 1
  };
  return `${className} ${inspect2(payload, childOptions)}`;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/Span.js
var SpanImpl = class {
  // Below properties are included to implement ReadableSpan for export
  // purposes but are not intended to be written-to directly.
  _spanContext;
  kind;
  parentSpanContext;
  attributes = {};
  links = [];
  events = [];
  startTime;
  resource;
  instrumentationScope;
  _droppedAttributesCount = 0;
  _droppedEventsCount = 0;
  _droppedLinksCount = 0;
  _attributesCount = 0;
  name;
  status = {
    code: SpanStatusCode.UNSET
  };
  endTime = [0, 0];
  _ended = false;
  _duration = [-1, -1];
  _spanProcessor;
  _spanLimits;
  _attributeValueLengthLimit;
  _recordEndMetrics;
  _performanceStartTime;
  _performanceOffset;
  _startTimeProvided;
  /**
   * Constructs a new SpanImpl instance.
   */
  constructor(opts) {
    const now = Date.now();
    this._spanContext = opts.spanContext;
    this._performanceStartTime = otperformance.now();
    this._performanceOffset = now - (this._performanceStartTime + otperformance.timeOrigin);
    this._startTimeProvided = opts.startTime != null;
    this._spanLimits = opts.spanLimits;
    this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit ?? 0;
    this._spanProcessor = opts.spanProcessor;
    this.name = opts.name;
    this.parentSpanContext = opts.parentSpanContext;
    this.kind = opts.kind;
    if (opts.links) {
      for (const link of opts.links) {
        this.addLink(link);
      }
    }
    this.startTime = this._getTime(opts.startTime ?? now);
    this.resource = opts.resource;
    this.instrumentationScope = opts.scope;
    this._recordEndMetrics = opts.recordEndMetrics;
    if (opts.attributes != null) {
      this.setAttributes(opts.attributes);
    }
    this._spanProcessor.onStart(this, opts.context);
  }
  spanContext() {
    return this._spanContext;
  }
  setAttribute(key, value) {
    if (value == null || this._isSpanEnded())
      return this;
    if (key.length === 0) {
      diag.warn(`Invalid attribute key: ${key}`);
      return this;
    }
    if (!isAttributeValue(value)) {
      diag.warn(`Invalid attribute value set for key: ${key}`);
      return this;
    }
    const { attributeCountLimit } = this._spanLimits;
    const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (attributeCountLimit !== void 0 && this._attributesCount >= attributeCountLimit && isNewKey) {
      this._droppedAttributesCount++;
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    if (isNewKey) {
      this._attributesCount++;
    }
    return this;
  }
  setAttributes(attributes) {
    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        this.setAttribute(key, attributes[key]);
      }
    }
    return this;
  }
  /**
   *
   * @param name Span Name
   * @param [attributesOrStartTime] Span attributes or start time
   *     if type is {@type TimeInput} and 3rd param is undefined
   * @param [timeStamp] Specified time stamp for the event
   */
  addEvent(name, attributesOrStartTime, timeStamp) {
    if (this._isSpanEnded())
      return this;
    const { eventCountLimit } = this._spanLimits;
    if (eventCountLimit === 0) {
      diag.warn("No events allowed.");
      this._droppedEventsCount++;
      return this;
    }
    if (eventCountLimit !== void 0 && this.events.length >= eventCountLimit) {
      if (this._droppedEventsCount === 0) {
        diag.debug("Dropping extra events.");
      }
      this.events.shift();
      this._droppedEventsCount++;
    }
    if (isTimeInput(attributesOrStartTime)) {
      if (!isTimeInput(timeStamp)) {
        timeStamp = attributesOrStartTime;
      }
      attributesOrStartTime = void 0;
    }
    const sanitized = sanitizeAttributes(attributesOrStartTime);
    const { attributePerEventCountLimit } = this._spanLimits;
    const attributes = {};
    let droppedAttributesCount = 0;
    let eventAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerEventCountLimit !== void 0 && eventAttributesCount >= attributePerEventCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes[attr] = this._truncateToSize(attrVal);
      eventAttributesCount++;
    }
    this.events.push({
      name,
      attributes,
      time: this._getTime(timeStamp),
      droppedAttributesCount
    });
    return this;
  }
  addLink(link) {
    if (this._isSpanEnded())
      return this;
    const { linkCountLimit } = this._spanLimits;
    if (linkCountLimit === 0) {
      this._droppedLinksCount++;
      return this;
    }
    if (linkCountLimit !== void 0 && this.links.length >= linkCountLimit) {
      if (this._droppedLinksCount === 0) {
        diag.debug("Dropping extra links.");
      }
      this.links.shift();
      this._droppedLinksCount++;
    }
    const { attributePerLinkCountLimit } = this._spanLimits;
    const sanitized = sanitizeAttributes(link.attributes);
    const attributes = {};
    let droppedAttributesCount = 0;
    let linkAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerLinkCountLimit !== void 0 && linkAttributesCount >= attributePerLinkCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes[attr] = this._truncateToSize(attrVal);
      linkAttributesCount++;
    }
    const processedLink = { context: link.context };
    if (linkAttributesCount > 0) {
      processedLink.attributes = attributes;
    }
    if (droppedAttributesCount > 0) {
      processedLink.droppedAttributesCount = droppedAttributesCount;
    }
    this.links.push(processedLink);
    return this;
  }
  addLinks(links) {
    for (const link of links) {
      this.addLink(link);
    }
    return this;
  }
  setStatus(status) {
    if (this._isSpanEnded())
      return this;
    if (status.code === SpanStatusCode.UNSET)
      return this;
    if (this.status.code === SpanStatusCode.OK)
      return this;
    const newStatus = { code: status.code };
    if (status.code === SpanStatusCode.ERROR) {
      if (typeof status.message === "string") {
        newStatus.message = status.message;
      } else if (status.message != null) {
        diag.warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
      }
    }
    this.status = newStatus;
    return this;
  }
  updateName(name) {
    if (this._isSpanEnded())
      return this;
    this.name = name;
    return this;
  }
  end(endTime) {
    if (this._isSpanEnded()) {
      diag.error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
      return;
    }
    this.endTime = this._getTime(endTime);
    this._duration = hrTimeDuration(this.startTime, this.endTime);
    if (this._duration[0] < 0) {
      diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
      this.endTime = this.startTime.slice();
      this._duration = [0, 0];
    }
    if (this._droppedEventsCount > 0) {
      diag.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
    }
    if (this._droppedLinksCount > 0) {
      diag.warn(`Dropped ${this._droppedLinksCount} links because linkCountLimit reached`);
    }
    if (this._spanProcessor.onEnding) {
      this._spanProcessor.onEnding(this);
    }
    this._recordEndMetrics?.();
    this._ended = true;
    this._spanProcessor.onEnd(this);
  }
  _getTime(inp) {
    if (typeof inp === "number" && inp <= otperformance.now()) {
      return hrTime(inp + this._performanceOffset);
    }
    if (typeof inp === "number") {
      return millisToHrTime(inp);
    }
    if (inp instanceof Date) {
      return millisToHrTime(inp.getTime());
    }
    if (isTimeInputHrTime(inp)) {
      return inp;
    }
    if (this._startTimeProvided) {
      return millisToHrTime(Date.now());
    }
    const msDuration = otperformance.now() - this._performanceStartTime;
    return addHrTimes(this.startTime, millisToHrTime(msDuration));
  }
  isRecording() {
    return this._ended === false;
  }
  recordException(exception, time) {
    const attributes = {};
    if (typeof exception === "string") {
      attributes[ATTR_EXCEPTION_MESSAGE] = exception;
    } else if (exception) {
      if (exception.code) {
        attributes[ATTR_EXCEPTION_TYPE] = exception.code.toString();
      } else if (exception.name) {
        attributes[ATTR_EXCEPTION_TYPE] = exception.name;
      }
      if (exception.message) {
        attributes[ATTR_EXCEPTION_MESSAGE] = exception.message;
      }
      if (exception.stack) {
        attributes[ATTR_EXCEPTION_STACKTRACE] = exception.stack;
      }
    }
    if (attributes[ATTR_EXCEPTION_TYPE] || attributes[ATTR_EXCEPTION_MESSAGE]) {
      this.addEvent(ExceptionEventName, attributes, time);
    } else {
      diag.warn(`Failed to record an exception ${exception}`);
    }
  }
  get duration() {
    return this._duration;
  }
  get ended() {
    return this._ended;
  }
  get droppedAttributesCount() {
    return this._droppedAttributesCount;
  }
  get droppedEventsCount() {
    return this._droppedEventsCount;
  }
  get droppedLinksCount() {
    return this._droppedLinksCount;
  }
  _isSpanEnded() {
    if (this._ended) {
      const error = new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
      diag.warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error);
    }
    return this._ended;
  }
  // Utility function to truncate given value within size
  // for value type of string, will truncate to given limit
  // for type of non-string, will return same value
  _truncateToLimitUtil(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  }
  /**
   * If the given attribute value is of type string and has more characters than given {@code attributeValueLengthLimit} then
   * return string with truncated to {@code attributeValueLengthLimit} characters
   *
   * If the given attribute value is array of strings then
   * return new array of strings with each element truncated to {@code attributeValueLengthLimit} characters
   *
   * Otherwise return same Attribute {@code value}
   *
   * @param value Attribute value
   * @returns truncated attribute value if required, otherwise same value
   */
  _truncateToSize(value) {
    const limit = this._attributeValueLengthLimit;
    if (limit <= 0) {
      diag.warn(`Attribute value limit must be positive, got ${limit}`);
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (Array.isArray(value)) {
      return value.map((val) => typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val);
    }
    return value;
  }
  [inspectCustom](depth, options, inspect2) {
    const payload = {
      name: this.name,
      kind: this.kind,
      spanContext: this._spanContext,
      parentSpanContext: this.parentSpanContext,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this._duration,
      ended: this._ended,
      attributes: this.attributes,
      events: this.events,
      links: this.links,
      droppedAttributesCount: this._droppedAttributesCount,
      droppedEventsCount: this._droppedEventsCount,
      droppedLinksCount: this._droppedLinksCount,
      instrumentationScope: this.instrumentationScope,
      resource: { attributes: settledResourceAttributes(this.resource) }
    };
    return formatInspect("SpanImpl", payload, depth, options, inspect2);
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js
var SamplingDecision2;
(function(SamplingDecision3) {
  SamplingDecision3[SamplingDecision3["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision3[SamplingDecision3["RECORD"] = 1] = "RECORD";
  SamplingDecision3[SamplingDecision3["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision2 || (SamplingDecision2 = {}));

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js
var ATTR_OTEL_SPAN_PARENT_ORIGIN = "otel.span.parent.origin";
var ATTR_OTEL_SPAN_SAMPLING_RESULT = "otel.span.sampling_result";
var METRIC_OTEL_SDK_SPAN_LIVE = "otel.sdk.span.live";
var METRIC_OTEL_SDK_SPAN_STARTED = "otel.sdk.span.started";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/TracerMetrics.js
var TracerMetrics = class {
  startedSpans;
  liveSpans;
  constructor(meter) {
    this.startedSpans = meter.createCounter(METRIC_OTEL_SDK_SPAN_STARTED, {
      unit: "{span}",
      description: "The number of created spans."
    });
    this.liveSpans = meter.createUpDownCounter(METRIC_OTEL_SDK_SPAN_LIVE, {
      unit: "{span}",
      description: "The number of currently live spans."
    });
  }
  startSpan(parentSpanCtx, samplingDecision) {
    const samplingDecisionStr = samplingDecisionToString(samplingDecision);
    this.startedSpans.add(1, {
      [ATTR_OTEL_SPAN_PARENT_ORIGIN]: parentOrigin(parentSpanCtx),
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    });
    if (samplingDecision === SamplingDecision2.NOT_RECORD) {
      return () => {
      };
    }
    const liveSpanAttributes = {
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    };
    this.liveSpans.add(1, liveSpanAttributes);
    return () => {
      this.liveSpans.add(-1, liveSpanAttributes);
    };
  }
};
function parentOrigin(parentSpanContext) {
  if (!parentSpanContext) {
    return "none";
  }
  if (parentSpanContext.isRemote) {
    return "remote";
  }
  return "local";
}
function samplingDecisionToString(decision) {
  switch (decision) {
    case SamplingDecision2.RECORD_AND_SAMPLED:
      return "RECORD_AND_SAMPLE";
    case SamplingDecision2.RECORD:
      return "RECORD_ONLY";
    case SamplingDecision2.NOT_RECORD:
      return "DROP";
  }
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/version.js
var VERSION3 = "2.12.0";

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/Tracer.js
var Tracer = class {
  _sampler;
  _spanLimits;
  _idGenerator;
  instrumentationScope;
  _resource;
  _spanProcessor;
  _tracerMetrics;
  /**
   * Constructs a new Tracer instance.
   */
  constructor(instrumentationScope, options) {
    this.instrumentationScope = instrumentationScope;
    this._sampler = options.sampler;
    this._spanLimits = options.spanLimits;
    this._resource = options.resource;
    this._idGenerator = options.idGenerator;
    this._spanProcessor = options.spanProcessor;
    const meter = options.meterProvider.getMeter("@opentelemetry/sdk-trace", VERSION3);
    this._tracerMetrics = new TracerMetrics(meter);
  }
  /**
   * Starts a new Span or returns the default NoopSpan based on the sampling
   * decision.
   */
  startSpan(name, options = {}, context2 = context.active()) {
    if (options.root) {
      context2 = trace.deleteSpan(context2);
    }
    const parentSpan = trace.getSpan(context2);
    if (isTracingSuppressed(context2)) {
      diag.debug("Instrumentation suppressed, returning Noop Span");
      const nonRecordingSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
      return nonRecordingSpan;
    }
    const parentSpanContext = parentSpan?.spanContext();
    const spanId = this._idGenerator.generateSpanId();
    let validParentSpanContext;
    let traceId2;
    let traceState;
    if (!parentSpanContext || !trace.isSpanContextValid(parentSpanContext)) {
      traceId2 = this._idGenerator.generateTraceId();
    } else {
      traceId2 = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      validParentSpanContext = parentSpanContext;
    }
    const spanKind = options.kind ?? SpanKind.INTERNAL;
    const links = (options.links ?? []).map((link) => {
      return {
        context: link.context,
        attributes: sanitizeAttributes(link.attributes)
      };
    });
    const attributes = sanitizeAttributes(options.attributes);
    const samplingResult = this._sampler.shouldSample(context2, traceId2, name, spanKind, attributes, links);
    const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
    traceState = samplingResult.traceState ?? traceState;
    const traceFlags = samplingResult.decision === SamplingDecision.RECORD_AND_SAMPLED ? TraceFlags.SAMPLED : TraceFlags.NONE;
    const spanContext = { traceId: traceId2, spanId, traceFlags, traceState };
    if (samplingResult.decision === SamplingDecision.NOT_RECORD) {
      diag.debug("Recording is off, propagating context in a non-recording span");
      const nonRecordingSpan = trace.wrapSpanContext(spanContext);
      return nonRecordingSpan;
    }
    const initAttributes = sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
    const span = new SpanImpl({
      resource: this._resource,
      scope: this.instrumentationScope,
      context: context2,
      spanContext,
      name,
      kind: spanKind,
      links,
      parentSpanContext: validParentSpanContext,
      attributes: initAttributes,
      startTime: options.startTime,
      spanProcessor: this._spanProcessor,
      spanLimits: this._spanLimits,
      recordEndMetrics
    });
    return span;
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx ?? context.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = trace.setSpan(parentContext, span);
    return context.with(contextWithSpanSet, fn, void 0, span);
  }
  [inspectCustom](depth, options, inspect2) {
    const payload = {
      instrumentationScope: this.instrumentationScope,
      resource: { attributes: settledResourceAttributes(this._resource) },
      spanLimits: this._spanLimits
    };
    return formatInspect("Tracer", payload, depth, options, inspect2);
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/MultiSpanProcessor.js
var MultiSpanProcessor = class {
  _spanProcessors;
  constructor(spanProcessors) {
    this._spanProcessors = spanProcessors;
  }
  forceFlush() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.forceFlush());
    }
    return new Promise((resolve2) => {
      Promise.all(promises).then(() => {
        resolve2();
      }).catch((error) => {
        globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
        resolve2();
      });
    });
  }
  onStart(span, context2) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onStart(span, context2);
    }
  }
  onEnding(span) {
    for (const spanProcessor of this._spanProcessors) {
      if (spanProcessor.onEnding) {
        spanProcessor.onEnding(span);
      }
    }
  }
  onEnd(span) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onEnd(span);
    }
  }
  shutdown() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.shutdown());
    }
    return new Promise((resolve2, reject) => {
      Promise.all(promises).then(() => {
        resolve2();
      }, reject);
    });
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/ParentBasedSampler.js
init_esm();

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOffSampler.js
var AlwaysOffSampler = class {
  shouldSample() {
    return {
      decision: SamplingDecision2.NOT_RECORD
    };
  }
  toString() {
    return "AlwaysOffSampler";
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOnSampler.js
var AlwaysOnSampler = class {
  shouldSample() {
    return {
      decision: SamplingDecision2.RECORD_AND_SAMPLED
    };
  }
  toString() {
    return "AlwaysOnSampler";
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/ParentBasedSampler.js
var ParentBasedSampler = class {
  _root;
  _remoteParentSampled;
  _remoteParentNotSampled;
  _localParentSampled;
  _localParentNotSampled;
  constructor(config) {
    this._root = config.root;
    if (!this._root) {
      globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
      this._root = new AlwaysOnSampler();
    }
    this._remoteParentSampled = config.remoteParentSampled ?? new AlwaysOnSampler();
    this._remoteParentNotSampled = config.remoteParentNotSampled ?? new AlwaysOffSampler();
    this._localParentSampled = config.localParentSampled ?? new AlwaysOnSampler();
    this._localParentNotSampled = config.localParentNotSampled ?? new AlwaysOffSampler();
  }
  shouldSample(context2, traceId2, spanName, spanKind, attributes, links) {
    const parentContext = trace.getSpanContext(context2);
    if (!parentContext || !isSpanContextValid(parentContext)) {
      return this._root.shouldSample(context2, traceId2, spanName, spanKind, attributes, links);
    }
    if (parentContext.isRemote) {
      if (parentContext.traceFlags & TraceFlags.SAMPLED) {
        return this._remoteParentSampled.shouldSample(context2, traceId2, spanName, spanKind, attributes, links);
      }
      return this._remoteParentNotSampled.shouldSample(context2, traceId2, spanName, spanKind, attributes, links);
    }
    if (parentContext.traceFlags & TraceFlags.SAMPLED) {
      return this._localParentSampled.shouldSample(context2, traceId2, spanName, spanKind, attributes, links);
    }
    return this._localParentNotSampled.shouldSample(context2, traceId2, spanName, spanKind, attributes, links);
  }
  toString() {
    return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/platform/node/RandomIdGenerator.js
var SPAN_ID_BYTES = 8;
var TRACE_ID_BYTES = 16;
var RandomIdGenerator = class {
  /**
   * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
   * characters corresponding to 128 bits.
   */
  generateTraceId = getIdGenerator(TRACE_ID_BYTES);
  /**
   * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
   * characters corresponding to 64 bits.
   */
  generateSpanId = getIdGenerator(SPAN_ID_BYTES);
};
var SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
function getIdGenerator(bytes) {
  return function generateId() {
    for (let i = 0; i < bytes / 4; i++) {
      SHARED_BUFFER.writeUInt32BE(Math.random() * 2 ** 32 >>> 0, i * 4);
    }
    for (let i = 0; i < bytes; i++) {
      if (SHARED_BUFFER[i] > 0) {
        break;
      } else if (i === bytes - 1) {
        SHARED_BUFFER[bytes - 1] = 1;
      }
    }
    return SHARED_BUFFER.toString("hex", 0, bytes);
  };
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/TracerProvider.js
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
var TracerProvider = class {
  _resource;
  _activeSpanProcessor;
  _forceFlushTimeoutMillis;
  _tracerOptions;
  _tracers = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this._forceFlushTimeoutMillis = options.forceFlushTimeoutMillis ?? 3e4;
    this._resource = options.resource ?? defaultResource();
    const spanProcessors = options.spanProcessors ?? [];
    this._activeSpanProcessor = new MultiSpanProcessor(spanProcessors);
    this._tracerOptions = {
      resource: this._resource,
      sampler: options.sampler ?? new ParentBasedSampler({
        root: new AlwaysOnSampler()
      }),
      spanLimits: {
        attributeCountLimit: options.spanLimits?.attributeCountLimit ?? 128,
        attributeValueLengthLimit: options.spanLimits?.attributeValueLengthLimit ?? Infinity,
        eventCountLimit: options.spanLimits?.eventCountLimit ?? 128,
        linkCountLimit: options.spanLimits?.linkCountLimit ?? 128,
        attributePerEventCountLimit: options.spanLimits?.attributePerEventCountLimit ?? 128,
        attributePerLinkCountLimit: options.spanLimits?.attributePerLinkCountLimit ?? 128
      },
      idGenerator: options.idGenerator || new RandomIdGenerator(),
      spanProcessor: this._activeSpanProcessor,
      meterProvider: options.meterProvider ?? {
        getMeter() {
          return createNoopMeter();
        }
      }
    };
  }
  getTracer(name, version, options) {
    const key = `${name}@${version || ""}:${options?.schemaUrl || ""}`;
    if (!this._tracers.has(key)) {
      this._tracers.set(key, new Tracer({ name, version, schemaUrl: options?.schemaUrl }, this._tracerOptions));
    }
    return this._tracers.get(key);
  }
  forceFlush(options) {
    const timeout = options?.timeoutMillis ?? this._forceFlushTimeoutMillis;
    const promises = this._activeSpanProcessor["_spanProcessors"].map((spanProcessor) => {
      return new Promise((resolve2) => {
        let state;
        const timeoutInterval = setTimeout(() => {
          resolve2(new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
          state = ForceFlushState.timeout;
        }, timeout);
        spanProcessor.forceFlush().then(() => {
          clearTimeout(timeoutInterval);
          if (state !== ForceFlushState.timeout) {
            state = ForceFlushState.resolved;
            resolve2(state);
          }
        }).catch((error) => {
          clearTimeout(timeoutInterval);
          state = ForceFlushState.error;
          resolve2(error);
        });
      });
    });
    return new Promise((resolve2, reject) => {
      Promise.all(promises).then((results) => {
        const errors = results.filter((result) => result !== ForceFlushState.resolved);
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve2();
        }
      }).catch((error) => reject([error]));
    });
  }
  shutdown() {
    return this._activeSpanProcessor.shutdown();
  }
  [inspectCustom](depth, options, inspect2) {
    const processors = this._activeSpanProcessor["_spanProcessors"];
    const payload = {
      resource: { attributes: settledResourceAttributes(this._resource) },
      tracers: Array.from(this._tracers.keys()),
      spanProcessors: processors.map((p) => p.constructor?.name ?? "SpanProcessor")
    };
    return formatInspect("TracerProvider", payload, depth, options, inspect2);
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/TraceIdRatioBasedSampler.js
init_esm();
var TraceIdRatioBasedSampler = class {
  _ratio;
  _upperBound;
  constructor(ratio = 0) {
    this._ratio = this._normalize(ratio);
    this._upperBound = this._ratio === 1 ? 4294967296 : Math.floor(this._ratio * 4294967295);
  }
  shouldSample(context2, traceId2) {
    return {
      decision: isValidTraceId(traceId2) && this._accumulate(traceId2) < this._upperBound ? SamplingDecision2.RECORD_AND_SAMPLED : SamplingDecision2.NOT_RECORD
    };
  }
  toString() {
    return `TraceIdRatioBased{${this._ratio}}`;
  }
  _normalize(ratio) {
    if (typeof ratio !== "number" || isNaN(ratio))
      return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  }
  _accumulate(traceId2) {
    let accumulation = 0;
    for (let i = 0; i < 32; i += 8) {
      let part = 0;
      for (let j = 0; j < 8; j++) {
        const c = traceId2.charCodeAt(i + j);
        const v = c < 58 ? c - 48 : c < 71 ? c - 55 : c - 87;
        part = part << 4 | v;
      }
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  }
};

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var TracesSamplerValues;
(function(TracesSamplerValues2) {
  TracesSamplerValues2["AlwaysOff"] = "always_off";
  TracesSamplerValues2["AlwaysOn"] = "always_on";
  TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
  TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
  TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
  TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));
var DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  return {
    sampler: buildSamplerFromEnv(),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? 128
    },
    spanLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? 128,
      linkCountLimit: getNumberFromEnv("OTEL_SPAN_LINK_COUNT_LIMIT") ?? 128,
      eventCountLimit: getNumberFromEnv("OTEL_SPAN_EVENT_COUNT_LIMIT") ?? 128,
      attributePerEventCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT") ?? 128,
      attributePerLinkCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT") ?? 128
    }
  };
}
function buildSamplerFromEnv() {
  const sampler = getStringFromEnv("OTEL_TRACES_SAMPLER") ?? TracesSamplerValues.ParentBasedAlwaysOn;
  switch (sampler) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler();
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler();
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler()
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv());
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv())
      });
    default:
      diag.error(`OTEL_TRACES_SAMPLER value "${sampler}" invalid, defaulting to "${TracesSamplerValues.ParentBasedAlwaysOn}".`);
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
  }
}
function getSamplerProbabilityFromEnv() {
  const probability = getNumberFromEnv("OTEL_TRACES_SAMPLER_ARG");
  if (probability == null) {
    diag.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    diag.error(`OTEL_TRACES_SAMPLER_ARG=${probability} was given, but it is out of range ([0..1]), defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  return probability;
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
var DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
var DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
function reconfigureLimits(userConfig) {
  const spanLimits = Object.assign({}, userConfig.spanLimits);
  spanLimits.attributeCountLimit = userConfig.spanLimits?.attributeCountLimit ?? userConfig.generalLimits?.attributeCountLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = userConfig.spanLimits?.attributeValueLengthLimit ?? userConfig.generalLimits?.attributeValueLengthLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}

// ../telmoni/sdk/typescript/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider-shim.js
var BasicTracerProvider = class extends TracerProvider {
  constructor(config = {}) {
    const mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
    delete mergedConfig.generalLimits;
    super(mergedConfig);
  }
};

// ../telmoni/sdk/typescript/dist/index.mjs
init_esm();
import { createHash as createHash2 } from "crypto";
import { Agent as HttpAgent, ClientRequest } from "http";
import { Agent as HttpsAgent } from "https";
import { urlToHttpOptions } from "url";
import { createHash as createHash22 } from "crypto";
init_esm();
init_esm();
init_esm();
import { randomUUID } from "crypto";
var SCOPE = "telmoni";
var TRACE_START = "telmoni.trace.start";
var DISTRO_NAME = "telemetry.distro.name";
var DISTRO = "telmoni";
var AGENT2 = "telmoni.agent";
var USER_ID = "user.id";
var TAG_PREFIX = "telmoni.tag.";
var TAGS_MAX2 = 32;
var TAG_KEY_MAX = 64;
var TAG_VALUE_MAX = 256;
var NAME_MAX = 145;
var AGENT_MAX = 128;
var ERROR_TYPE_MAX = 128;
var MODEL_MAX2 = 128;
var PROVIDER_MAX = 128;
var USER_ID_MAX = 128;
var SESSION_ID_MAX = 200;
var BATCH_MAX_BYTES = 1 << 20;
var BATCH_SPANS_MAX = 1e3;
var ATTRIBUTE_KEY_MAX = 128;
var ATTRIBUTE_VALUE_MAX = 1024;
var CANCELLED = "telmoni.cancelled";
var RETRIEVAL_RETURNED = "telmoni.retrieval.returned";
var ENVIRONMENT = "deployment.environment.name";
var RELEASE = "service.version";
var ENVIRONMENT_MAX = 128;
var RELEASE_MAX = 128;
var TRACEPARENT = "traceparent";
var BAGGAGE = "baggage";
var OPERATION = "gen_ai.operation.name";
var AGENT_NAME = "gen_ai.agent.name";
var TOOL_NAME = "gen_ai.tool.name";
var ERROR_TYPE = "error.type";
var RESPONSE_MODEL = "gen_ai.response.model";
var REQUEST_MODEL = "gen_ai.request.model";
var PROVIDER = "gen_ai.provider.name";
var REQUEST_REASONING_LEVEL = "gen_ai.request.reasoning.level";
var PROMPT_NAME = "gen_ai.prompt.name";
var PROMPT_VERSION = "gen_ai.prompt.version";
var TIME_TO_FIRST_CHUNK = "gen_ai.response.time_to_first_chunk";
var INPUT_TOKENS = "gen_ai.usage.input_tokens";
var OUTPUT_TOKENS = "gen_ai.usage.output_tokens";
var CACHE_READ_INPUT_TOKENS = "gen_ai.usage.cache_read.input_tokens";
var CACHE_WRITE_INPUT_TOKENS = "gen_ai.usage.cache_write.input_tokens";
var COST = "gen_ai.usage.cost";
var SESSION_ID = "gen_ai.conversation.id";
var DATA_SOURCE_ID = "gen_ai.data_source.id";
var MEMORY_STORE_ID = "gen_ai.memory.store.id";
var RETRIEVAL_TOP_K = "gen_ai.retrieval.top_k";
var MEMORY_RECORD_COUNT = "gen_ai.memory.record.count";
var INPUT_MESSAGES = "gen_ai.input.messages";
var OUTPUT_MESSAGES = "gen_ai.output.messages";
var SYSTEM_INSTRUCTIONS = "gen_ai.system_instructions";
var TOOL_CALL_ARGUMENTS = "gen_ai.tool.call.arguments";
var TOOL_CALL_RESULT = "gen_ai.tool.call.result";
var RETRIEVAL_QUERY_TEXT = "gen_ai.retrieval.query.text";
var RETRIEVAL_DOCUMENTS = "gen_ai.retrieval.documents";
var MEMORY_QUERY_TEXT = "gen_ai.memory.query.text";
var MEMORY_RECORDS = "gen_ai.memory.records";
var CONTENT_CUT = "telmoni.content_cut";
var SCRUBBED = "telmoni.scrubbed";
var STATUS_DESCRIPTION = "otel.status_description";
var EXCEPTION_EVENT = "exception";
var EXCEPTION_TYPE = "exception.type";
var EXCEPTION_MESSAGE = "exception.message";
var EXCEPTION_STACKTRACE = "exception.stacktrace";
var CONTENT = /* @__PURE__ */ new Set([
  INPUT_MESSAGES,
  OUTPUT_MESSAGES,
  SYSTEM_INSTRUCTIONS,
  "gen_ai.tool.definitions",
  TOOL_CALL_ARGUMENTS,
  TOOL_CALL_RESULT,
  RETRIEVAL_QUERY_TEXT,
  RETRIEVAL_DOCUMENTS,
  MEMORY_QUERY_TEXT,
  MEMORY_RECORDS,
  "gen_ai.prompt.variable",
  "user.email",
  "user.full_name",
  "user.name",
  CONTENT_CUT,
  EXCEPTION_TYPE,
  EXCEPTION_MESSAGE,
  EXCEPTION_STACKTRACE,
  STATUS_DESCRIPTION,
  "telmoni.events"
]);
var MODEL_OPERATIONS = /* @__PURE__ */ new Set([
  "chat",
  "generate_content",
  "text_completion",
  "embeddings"
]);
var DEFAULT_MODEL_OPERATION = "chat";
var TOOL_OPERATION = "execute_tool";
var AGENT_OPERATION = "invoke_agent";
var RETRIEVAL_OPERATION = "retrieval";
var SEARCH_MEMORY = "search_memory";
var MEDIA_FIELDS = [INPUT_MESSAGES, OUTPUT_MESSAGES, SYSTEM_INSTRUCTIONS];
var MEDIA_PATH = "/v1/media/";
var FILE_ID_PREFIX = "telmoni:";
var MEDIA_MAX_BYTES = 5 * 1024 * 1024;
var MEDIA_DEFAULT_TYPE = "application/octet-stream";
var EVALUATION_EVENT = "gen_ai.evaluation.result";
var EVALUATION_NAME = "gen_ai.evaluation.name";
var EVALUATION_VALUE = "gen_ai.evaluation.score.value";
var EVALUATION_LABEL = "gen_ai.evaluation.score.label";
var SCORE_TYPE = "telmoni.score.type";
var SCORE_RANGE_MIN = "telmoni.score.range_min";
var SCORE_RANGE_MAX = "telmoni.score.range_max";
var SCORE_VERSION = "telmoni.score.version";
var SCORES_PATH = "/v1/scores";
var SCORE_SPAN = "telmoni.score";
var SCORE_SENT = "telmoni.score.sent";
var SCORE_NAME_MAX = 64;
var SCORE_CATEGORY_MAX = 64;
var SCORE_VERSION_MAX = 64;
var SCORES_PER_SPAN = 16;
var SCORES_SENT_MAX = 100;
var CAPTURE_CONTENT_ENV = "TELMONI_CAPTURE_CONTENT";
var SCRUB_SECRETS_ENV = "TELMONI_SCRUB_SECRETS";
var SCRUB_PII_ENV = "TELMONI_SCRUB_PII";
var CONTENT_MODE_HEADER = "Telmoni-Content-Mode";
var SENT_AT_HEADER = "Telmoni-Sent-At";
function names(error) {
  if (error === null || error === void 0) return { ctor: "", name: "" };
  const named = error;
  const ctor = typeof named.constructor?.name === "string" ? named.constructor.name : "";
  const name = typeof named.name === "string" ? named.name : "";
  return { ctor, name };
}
function errorType2(error) {
  const { ctor, name } = names(error);
  if (ctor === "DOMException") return name || ctor;
  return ctor || name || "Error";
}
function errorName(error) {
  const { ctor, name } = names(error);
  return name || ctor || "Error";
}
var QueueFullError = class extends Error {
  constructor(spans, queue) {
    const advice = spans <= queue ? "flush or wait, then record it again" : `the queue holds ${queue}, so raise its size to record it`;
    super(`the export queue has no room for the record's ${spans} spans; ${advice}`);
    this.name = "QueueFullError";
  }
};
var ShutdownError = class extends Error {
  constructor() {
    super("the client is shut down; the record was not sent");
    this.name = "ShutdownError";
  }
};
var CapExceededError = class extends Error {
  cap;
  limit;
  used;
  constructor(cap, limit, used) {
    super(
      cap === "steps" ? `the trace reached its step cap of ${plain(limit)}` : `the trace reached its spend cap of $${plain(limit)}, having spent $${plain(used)}`
    );
    this.name = "CapExceededError";
    this.cap = cap;
    this.limit = limit;
    this.used = used;
  }
};
function plain(amount) {
  const [digits = "", exponent] = String(amount).split("e");
  if (exponent === void 0) return digits;
  const sign = digits.startsWith("-") ? "-" : "";
  const [whole2 = "", fraction = ""] = digits.slice(sign.length).split(".");
  const all = whole2 + fraction;
  const point = whole2.length + Number(exponent);
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${all}`;
  if (point >= all.length) return `${sign}${all}${"0".repeat(point - all.length)}`;
  return `${sign}${all.slice(0, point)}.${all.slice(point)}`;
}
function isAbort(error) {
  return typeof error === "object" && error !== null && error.name === "AbortError";
}
function digitAt(text, i) {
  const c = text.charCodeAt(i);
  return c >= 48 && c <= 57;
}
function upperAt(text, i) {
  const c = text.charCodeAt(i);
  return c >= 65 && c <= 90;
}
function letterAt(text, i) {
  const c = text.charCodeAt(i);
  return c >= 65 && c <= 90 || c >= 97 && c <= 122;
}
function alnumAt(text, i) {
  return digitAt(text, i) || letterAt(text, i);
}
function wordAt(text, i) {
  return alnumAt(text, i) || text.charAt(i) === "_";
}
function keyAt(text, i) {
  return wordAt(text, i) || text.charAt(i) === "-";
}
function hexAt(text, i) {
  const c = text.charCodeAt(i);
  return digitAt(text, i) || c >= 65 && c <= 70 || c >= 97 && c <= 102;
}
function digitsAt(text, i, count2) {
  for (let n = 0; n < count2; n++) if (!digitAt(text, i + n)) return false;
  return true;
}
function bounded(text, start, end) {
  return !wordAt(text, start - 1) && !wordAt(text, end);
}
function each(find) {
  return (text) => (from) => find(text, from);
}
function matching(pattern, boundary) {
  return (text) => (from) => {
    for (let at = from; at <= text.length; ) {
      pattern.lastIndex = at;
      const match = pattern.exec(text);
      if (match === null) return void 0;
      const end = match.index + match[0].length;
      if (!boundary || bounded(text, match.index, end)) return [match.index, end];
      at = match.index + 1;
    }
    return void 0;
  };
}
function keyed(prefix, runOf) {
  return (text) => (from) => {
    for (prefix.lastIndex = from; ; ) {
      const found = prefix.exec(text);
      if (found === null) return void 0;
      const start = found.index;
      if (wordAt(text, start - 1)) {
        prefix.lastIndex = start + 1;
        continue;
      }
      const [inRun, least] = runOf(found[0]);
      const run2 = start + found[0].length;
      let end = run2;
      while (inRun(text, end)) end++;
      if (end - run2 >= least && !wordAt(text, end)) return [start, end];
      prefix.lastIndex = end;
    }
  };
}
var BEGIN = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g;
var END = /-----END [A-Z0-9 ]*PRIVATE KEY-----/g;
function unescapedQuote(text, i) {
  for (let at = text.indexOf('"', i); at >= 0; at = text.indexOf('"', at + 1)) {
    let slashes = 0;
    while (text.charAt(at - 1 - slashes) === "\\") slashes++;
    if (slashes % 2 === 0) return at;
  }
  return -1;
}
function privateKeys(text) {
  let end;
  let quote;
  return (from) => {
    BEGIN.lastIndex = from;
    const begin = BEGIN.exec(text);
    if (begin === null) return void 0;
    const after = begin.index + begin[0].length;
    if (end === void 0 || end !== null && end.index < after) {
      END.lastIndex = after;
      end = END.exec(text);
    }
    if (quote === void 0 || quote >= 0 && quote < after) quote = unescapedQuote(text, after);
    const stop = quote < 0 ? text.length : quote;
    if (end !== null && end.index + end[0].length <= stop) return [begin.index, end.index + end[0].length];
    return [begin.index, stop];
  };
}
function schemeAt(text, i) {
  const c = text.charAt(i);
  return alnumAt(text, i) || c === "+" || c === "." || c === "-";
}
var CREDENTIALS = /[^ \t\n\v\f\r"'\\\/@:]+:[^ \t\n\v\f\r"'\\\/@]+@[^ \t\n\v\f\r"'\\]+/y;
function findConnection(text, from) {
  for (let at = text.indexOf("://", from); at >= 0; at = text.indexOf("://", at + 1)) {
    let start = at;
    while (start > from && start > at - 21 && schemeAt(text, start - 1)) start--;
    while (start < at - 1 && !letterAt(text, start)) start++;
    if (start > at - 2) continue;
    CREDENTIALS.lastIndex = at + 3;
    const credentials = CREDENTIALS.exec(text);
    if (credentials !== null) return [start, at + 3 + credentials[0].length];
  }
  return void 0;
}
function keyRunEnd(text, i) {
  while (keyAt(text, i)) i++;
  return i;
}
function jwtTail(text, at) {
  if (text.charAt(at) !== "." || !text.startsWith("eyJ", at + 1)) return void 0;
  const second = keyRunEnd(text, at + 4);
  if (second - (at + 4) < 8 || text.charAt(second) !== ".") return void 0;
  const third = keyRunEnd(text, second + 1);
  return third - (second + 1) >= 8 ? third : void 0;
}
function findJwt(text, from) {
  for (let start = text.indexOf("eyJ", from); start >= 0; ) {
    if (wordAt(text, start - 1)) {
      start = text.indexOf("eyJ", start + 1);
      continue;
    }
    const first = keyRunEnd(text, start + 3);
    const end = first - (start + 3) >= 8 ? jwtTail(text, first) : void 0;
    if (end !== void 0) return [start, end];
    start = text.indexOf("eyJ", first);
  }
  return void 0;
}
var KEYWORDS = [
  "sharedaccesskey",
  "client_secret",
  "accountkey",
  "access_key",
  "access-key",
  "password",
  "api_key",
  "api-key",
  "apikey",
  "passwd",
  "secret",
  "token",
  "pwd"
];
var KEYWORD = new RegExp(KEYWORDS.join("|"), "gi");
var PASSWORDS = /* @__PURE__ */ new Set(["password", "passwd", "pwd"]);
var SEPARATORS = new Set(` 	"'\\`);
var VALUE_STOPS = new Set(` 	
\v\f\r"'\\,;&{}()<>[]`);
function separated(text, i) {
  for (let n = 0; n < 4 && SEPARATORS.has(text.charAt(i)); n++) i++;
  return i;
}
function holds(text, start, end, count2) {
  let held = 0;
  for (let i = start; i < end && held < count2; i += text.codePointAt(i) > 65535 ? 2 : 1) held++;
  return held >= count2;
}
function keywords(text) {
  let runFrom = -1;
  let runEnd = -1;
  let lastLetter = -1;
  let lastDigit = -1;
  return (from) => {
    for (KEYWORD.lastIndex = from; ; ) {
      const match = KEYWORD.exec(text);
      if (match === null) return void 0;
      const i = match.index;
      KEYWORD.lastIndex = i + 1;
      if (wordAt(text, i - 1)) continue;
      const keyword = match[0].toLowerCase();
      let start = separated(text, i + keyword.length);
      if (text.charAt(start) !== ":" && text.charAt(start) !== "=") continue;
      start = separated(text, start + 1);
      if (start < runFrom || start > runEnd) {
        runFrom = start;
        lastLetter = lastDigit = -1;
        for (runEnd = start; runEnd < text.length && !VALUE_STOPS.has(text.charAt(runEnd)); runEnd++) {
          if (letterAt(text, runEnd)) lastLetter = runEnd;
          else if (digitAt(text, runEnd)) lastDigit = runEnd;
        }
      }
      const kind2 = PASSWORDS.has(keyword) ? "password" : "token";
      const held = kind2 === "password" ? holds(text, start, runEnd, 8) : holds(text, start, runEnd, 16) && lastLetter >= start && lastDigit >= start;
      if (held) return [start, runEnd, kind2];
    }
  };
}
var SECRETS = [
  ["private_key", privateKeys],
  ["connection_string", each(findConnection)],
  ["jwt", each(findJwt)],
  ["anthropic_key", keyed(/sk-ant-/g, () => [keyAt, 20])],
  ["openai_key", keyed(/sk-/g, () => [keyAt, 20])],
  ["stripe_key", keyed(/(?:sk|rk)_(?:live|test)_|whsec_/g, () => [alnumAt, 16])],
  ["github_token", keyed(/gh[pousr]_|github_pat_/g, (prefix) => prefix.length === 4 ? [alnumAt, 36] : [wordAt, 22])],
  ["slack_token", keyed(/xox[abposr]-/g, () => [(text, i) => alnumAt(text, i) || text.charAt(i) === "-", 10])],
  ["aws_key", matching(/(?:AKIA|ASIA)[0-9A-Z]{16}/g, true)],
  ["gcp_key", matching(/AIza[0-9A-Za-z_-]{35}/g, true)],
  ["telmoni_key", keyed(/tm_/g, () => [keyAt, 20])],
  ["token", keywords]
];
var LOCAL_MARKS = new Set("._%+-");
var DOMAIN = /[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/y;
function findEmail(text, from) {
  for (let at = text.indexOf("@", from); at >= 0; at = text.indexOf("@", at + 1)) {
    let start = at;
    while (start > from && (alnumAt(text, start - 1) || LOCAL_MARKS.has(text.charAt(start - 1)))) start--;
    if (start === at) continue;
    DOMAIN.lastIndex = at + 1;
    const domain = DOMAIN.exec(text);
    if (domain !== null) return [start, at + 1 + domain[0].length];
  }
  return void 0;
}
function ibanCharsAt(text, i, count2) {
  for (let n = 0; n < count2; n++) if (!upperAt(text, i + n) && !digitAt(text, i + n)) return false;
  return true;
}
function ibanGrouped(text, i) {
  let end = i + 4;
  for (let held = 4; text.charAt(end) === " " && ibanCharsAt(text, end + 1, 4); held += 4) {
    if (held + 4 > 34) return void 0;
    end += 5;
  }
  if (end === i + 4) return void 0;
  let tail = end + 1;
  if (text.charAt(end) === " ") while (tail - (end + 1) < 3 && ibanCharsAt(text, tail, 1)) tail++;
  return tail > end + 1 ? tail : end;
}
function ibanCompact(text, i) {
  let end = i + 4;
  while (end - (i + 4) < 30 && ibanCharsAt(text, end, 1)) end++;
  return end - (i + 4) >= 11 ? end : void 0;
}
function ibanValid(candidate) {
  const compact = candidate.replaceAll(" ", "");
  if (compact.length < 15 || compact.length > 34) return false;
  let rest = 0;
  for (const c of compact.slice(4) + compact.slice(0, 4)) {
    const value = c >= "A" ? c.charCodeAt(0) - 55 : c.charCodeAt(0) - 48;
    rest = (rest * (value > 9 ? 100 : 10) + value) % 97;
  }
  return rest === 1;
}
var IBAN_FORMS = [ibanGrouped, ibanCompact];
function findIban(text, from) {
  for (let i = from; i < text.length; i++) {
    if (!upperAt(text, i) || !upperAt(text, i + 1) || !digitAt(text, i + 2) || !digitAt(text, i + 3)) continue;
    for (const form of IBAN_FORMS) {
      const end = form(text, i);
      if (end !== void 0 && bounded(text, i, end) && ibanValid(text.slice(i, end))) return [i, end];
    }
  }
  return void 0;
}
function findCard(text, from) {
  for (let i = from; i < text.length; i++) {
    const first = text.charCodeAt(i);
    if (first < 50 || first > 54 || alnumAt(text, i - 1)) continue;
    let evens = 0;
    let odds = 0;
    let longest;
    for (let j = i, count2 = 1; ; count2++) {
      const digit = text.charCodeAt(j) - 48;
      const twice = digit > 4 ? 2 * digit - 9 : 2 * digit;
      evens += count2 % 2 === 1 ? twice : digit;
      odds += count2 % 2 === 1 ? digit : twice;
      j += 1;
      if (count2 > 12 && (count2 % 2 === 0 ? evens : odds) % 10 === 0 && !alnumAt(text, j)) longest = j;
      if (count2 === 19) break;
      if (digitAt(text, j)) continue;
      if (text.charAt(j) !== " " && text.charAt(j) !== "-" || !digitAt(text, j + 1)) break;
      j += 1;
    }
    if (longest !== void 0) return [i, longest];
  }
  return void 0;
}
var SSN = /[0-9]{3}-[0-9]{2}-[0-9]{4}/g;
function findSsn(text, from) {
  for (let i = from; ; i++) {
    SSN.lastIndex = i;
    const match = SSN.exec(text);
    if (match === null) return void 0;
    i = match.index;
    if (alnumAt(text, i - 1) || alnumAt(text, i + 11)) continue;
    const area = text.slice(i, i + 3);
    if (area === "000" || area === "666" || area.startsWith("9")) continue;
    if (text.slice(i + 4, i + 6) === "00" || text.slice(i + 7, i + 11) === "0000") continue;
    return [i, i + 11];
  }
}
var PHONE_SEPARATORS = new Set(" .-");
var PHONE_MARKS = /[ .\-()]/;
function findPhone(text, from) {
  for (let i = from; i < text.length; i++) {
    const c = text.charAt(i);
    if (c !== "+" && c !== "(" && !digitAt(text, i) || alnumAt(text, i - 1) || text.charAt(i - 1) === "+") continue;
    let j = i;
    let country = false;
    if (c === "+") {
      let k = j + 1;
      while (k - (j + 1) < 3 && digitAt(text, k)) k++;
      if (k === j + 1) continue;
      j = k;
      country = true;
      if (PHONE_SEPARATORS.has(text.charAt(j))) j++;
    }
    if (text.charAt(j) === "(") {
      if (!digitsAt(text, j + 1, 3) || text.charAt(j + 4) !== ")") continue;
      j += 5;
    } else if (digitsAt(text, j, 3)) {
      j += 3;
    } else {
      continue;
    }
    if (PHONE_SEPARATORS.has(text.charAt(j))) j++;
    if (!digitsAt(text, j, 3)) continue;
    j += 3;
    if (PHONE_SEPARATORS.has(text.charAt(j))) j++;
    if (!digitsAt(text, j, 4)) continue;
    j += 4;
    if (alnumAt(text, j)) continue;
    if (country || PHONE_MARKS.test(text.slice(i, j))) return [i, j];
  }
  return void 0;
}
function ipv4At(text, i) {
  let j = i;
  for (let part = 0; part < 4; part++) {
    let k = j;
    let octet = 0;
    for (; k - j < 3 && digitAt(text, k); k++) octet = octet * 10 + text.charCodeAt(k) - 48;
    if (k === j || octet > 255) return void 0;
    j = k;
    if (part < 3) {
      if (text.charAt(j) !== ".") return void 0;
      j++;
    }
  }
  return alnumAt(text, j) || text.charAt(j) === "." ? void 0 : j;
}
function ipv6Valid(candidate) {
  const halves = candidate.split("::");
  if (halves.length > 2) return false;
  const groups = halves.length === 2 ? halves.flatMap((half) => half ? half.split(":") : []) : candidate.split(":");
  if (halves.length === 2 ? groups.length > 7 : groups.length !== 8) return false;
  return groups.every((group) => /^[0-9A-Fa-f]{1,4}$/.test(group));
}
function findIp(text, from) {
  for (let i = from; i < text.length; i++) {
    if (!hexAt(text, i) && text.charAt(i) !== ":") continue;
    if (digitAt(text, i) && !alnumAt(text, i - 1) && text.charAt(i - 1) !== ".") {
      const end2 = ipv4At(text, i);
      if (end2 !== void 0) return [i, end2];
    }
    if (hexAt(text, i - 1) || text.charAt(i - 1) === ":" || letterAt(text, i - 1)) continue;
    let end = i;
    let colons = 0;
    for (; hexAt(text, end) || text.charAt(end) === ":"; end++) if (text.charAt(end) === ":") colons++;
    if (colons < 2 || letterAt(text, end)) continue;
    const candidate = text.slice(i, end);
    if ((candidate.includes("::") || colons === 7) && ipv6Valid(candidate)) return [i, end];
  }
  return void 0;
}
var HOME = /(?:\/home\/|\/Users\/|[A-Za-z]:(?:\\{1,2}|\/)Users(?:\\{1,2}|\/))[A-Za-z0-9._-]+/g;
var PII = [
  ["email", each(findEmail)],
  ["iban", each(findIban)],
  ["card", each(findCard)],
  ["ssn", each(findSsn)],
  ["phone", each(findPhone)],
  ["ip", each(findIp)],
  ["home_path", matching(HOME, false)]
];
function replaced(text, family, [kind2, reading], counts) {
  const find = reading(text);
  let out = "";
  let at = 0;
  for (let found = find(at); found !== void 0; found = find(at)) {
    const [start, end, named = kind2] = found;
    out += `${text.slice(at, start)}[${family}: ${named}]`;
    counts.set(`${family}:${named}`, (counts.get(`${family}:${named}`) ?? 0) + 1);
    at = end;
  }
  return out + text.slice(at);
}
function scrub(text, secrets, pii) {
  const counts = /* @__PURE__ */ new Map();
  if (secrets) for (const rule of SECRETS) text = replaced(text, "secret", rule, counts);
  if (pii) for (const rule of PII) text = replaced(text, "pii", rule, counts);
  return [text, counts];
}
function scrubbedOf(counts) {
  return JSON.stringify(Object.fromEntries([...counts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)));
}
var scrubber = { scrub };
var VERSION4 = "0.2.0";
var WHITE_SPACE = new Set("	\n\v\f\r \x85\xA0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000");
function trimEnds(value) {
  let start = 0;
  while (start < value.length && WHITE_SPACE.has(value.charAt(start))) start++;
  let end = value.length;
  while (end > start && WHITE_SPACE.has(value.charAt(end - 1))) end--;
  return value.slice(start, end);
}
function isBlank(value) {
  return trimEnds(value) === "";
}
var ATTEMPTS = 3;
var MASK_FAILED = /* @__PURE__ */ Symbol("mask failed");
var RETRIED = /* @__PURE__ */ new Set([429, 502, 503, 504]);
var REQUEST_TIMEOUT_MS = 1e4;
var ANSWER_MAX = 1 << 20;
var RETRY_AFTER_MAX_S = 60;
var WARNED_MAX = 1024;
var UPLOADED_MAX = 4096;
var CONTENT_DOCS = "https://telmoni.com/docs/api/ingest#what-is-dropped-at-the-door";
var LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
var DROPPED = /^span (\S+) dropped (\S+): (\w+)(?:; (.*))?$/;
var REFUSED = /^span (\S+) refused: (.*)$/;
var SECONDS = /^[ \t]*([+-]?)([0-9]+)[ \t]*$/;
var BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
var HEADER_SAFE = /^ *[\x21-\x7e][\x20-\x7e]*$/;
var KINDS = {
  [SpanKind.INTERNAL]: 1,
  [SpanKind.SERVER]: 2,
  [SpanKind.CLIENT]: 3,
  [SpanKind.PRODUCER]: 4,
  [SpanKind.CONSUMER]: 5
};
var DOUBLES = /* @__PURE__ */ new Set([
  COST,
  TIME_TO_FIRST_CHUNK,
  EVALUATION_VALUE,
  SCORE_RANGE_MIN,
  SCORE_RANGE_MAX
]);
var SCORE_KEYS = /* @__PURE__ */ new Set([
  EVALUATION_NAME,
  EVALUATION_VALUE,
  EVALUATION_LABEL,
  SCORE_TYPE,
  SCORE_RANGE_MIN,
  SCORE_RANGE_MAX,
  SCORE_VERSION
]);
var INTEGERS = /* @__PURE__ */ new Set([
  INPUT_TOKENS,
  OUTPUT_TOKENS,
  CACHE_READ_INPUT_TOKENS,
  CACHE_WRITE_INPUT_TOKENS,
  RETRIEVAL_TOP_K
]);
var fetchTransport = async (url, init) => {
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  return { status: response.status, headers: response.headers, text: () => textOf2(response.body) };
};
var directTransport = (url, init) => new Promise((resolve2, reject) => {
  const body = typeof init.body === "string" ? Buffer.from(init.body) : init.body;
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const request = new ClientRequest(
    {
      ...urlToHttpOptions(new URL(url)),
      method: init.method,
      headers: { ...init.headers, "Content-Length": String(body.byteLength) },
      agent: /^https:/i.test(url) ? new HttpsAgent() : new HttpAgent(),
      signal
    },
    (response) => {
      response.on("error", () => {
      });
      const headers = {
        get: (name) => {
          const value = response.headers[name.toLowerCase()];
          return value === void 0 ? null : Array.isArray(value) ? value.join(", ") : value;
        }
      };
      resolve2({ status: response.statusCode ?? 0, headers, text: () => messageText(response) });
    }
  );
  request.on("error", (error) => reject(signal.aborted ? signal.reason : error));
  request.on("close", () => reject(new Error("the connection closed before an answer")));
  request.end(body);
});
var Capped = class {
  #decoder = new TextDecoder();
  #text = "";
  #left = ANSWER_MAX;
  /** Takes what fits of `chunk`; false once the cap is reached. */
  take(chunk) {
    const part = chunk.subarray(0, this.#left);
    this.#text += this.#decoder.decode(part, { stream: true });
    this.#left -= part.byteLength;
    return this.#left > 0;
  }
  end() {
    return this.#text + this.#decoder.decode();
  }
};
async function messageText(response) {
  const capped = new Capped();
  try {
    for await (const chunk of response) {
      if (!capped.take(chunk)) break;
    }
  } catch {
  }
  return capped.end();
}
async function textOf2(body) {
  if (body === null) return "";
  const reader = body.getReader();
  const capped = new Capped();
  try {
    for (let more = true; more; ) {
      const { done, value } = await reader.read();
      more = !done && capped.take(value);
    }
    await reader.cancel();
  } catch {
  }
  return capped.end();
}
var realSleep = (seconds, signal) => new Promise((resolve2) => {
  const done = () => {
    clearTimeout(timer);
    signal.removeEventListener("abort", done);
    resolve2();
  };
  const timer = setTimeout(done, seconds * 1e3);
  if (signal.aborted) done();
  else signal.addEventListener("abort", done, { once: true });
});
function sdkVersion() {
  const version = defaultResource().attributes["telemetry.sdk.version"];
  return typeof version === "string" ? version : "unknown";
}
var Exporter = class {
  #config;
  #transport;
  #sleep;
  #warn;
  #url;
  #mediaUrl;
  #scoresUrl;
  #uploaded = /* @__PURE__ */ new Set();
  #warned = /* @__PURE__ */ new Set();
  #resource;
  #givenUp = new AbortController();
  #contentMode;
  constructor(config, hooks) {
    this.#config = config;
    this.#transport = hooks.transport;
    this.#sleep = hooks.sleep;
    this.#warn = hooks.warn;
    this.#url = `${config.endpoint}/otlp/v1/traces`;
    this.#mediaUrl = `${config.endpoint}${MEDIA_PATH}`;
    this.#scoresUrl = `${config.endpoint}${SCORES_PATH}`;
    this.#resource = [
      attribute(DISTRO_NAME, DISTRO),
      attribute("telemetry.distro.version", VERSION4),
      attribute("telemetry.sdk.language", "nodejs"),
      attribute("telemetry.sdk.name", "opentelemetry"),
      attribute("telemetry.sdk.version", sdkVersion())
    ];
    const deployment = [
      [ENVIRONMENT, config.environment, ENVIRONMENT_MAX, "environment"],
      [RELEASE, config.release, RELEASE_MAX, "release"]
    ];
    for (const [key, value, most, what] of deployment) {
      if (value === void 0) continue;
      if ([...value].length > most) {
        this.warnOnce(`long:${key}`, `telmoni: the ${what} must be up to ${most} characters; it is not sent`, {
          kind: "input"
        });
        continue;
      }
      this.#resource.push(attribute(key, value));
    }
  }
  /** The project's mode, as the last answer named it; undefined while unheard. */
  get contentMode() {
    return this.#contentMode;
  }
  /**
   * Gives up what is left: the wait before a retry ends now, and no attempt
   * follows it. A shutdown past its deadline calls it, so a process that
   * ends without `process.exit()` is not held for the retries.
   */
  giveUp() {
    this.#givenUp.abort();
  }
  /**
   * Sends the spans, halved past ingest's caps; false once they failed for a
   * reason not their own, which the rest of a batch they are part of would meet.
   */
  async export(spans) {
    if (spans.length === 0) return true;
    const scores = spans.filter(carriesScore);
    if (scores.length > 0) {
      await this.#sendScores(scores.map((span) => span.attributes[SCORE_SENT]));
      spans = spans.filter((span) => !carriesScore(span));
      if (spans.length === 0) return true;
    }
    if (this.#config.captureContent && this.#contentMode === void 0 && spans.some(holdsContent)) {
      await this.#ask();
    }
    const keep = this.#keepsContent();
    if (keep) spans = this.#mask(spans);
    let lifted = keep ? await this.#lift(spans) : /* @__PURE__ */ new Map();
    if (keep && (this.#config.scrubSecrets || this.#config.scrubPii)) {
      spans = this.#scrub(spans, lifted);
      lifted = /* @__PURE__ */ new Map();
    }
    return this.#export(spans, lifted, keep);
  }
  async #export(spans, lifted, keep) {
    if (spans.length > BATCH_SPANS_MAX) return this.#halve(spans, lifted, keep);
    let body = this.#body(spans, lifted, keep);
    if (Buffer.byteLength(body) > BATCH_MAX_BYTES) {
      if (spans.length > 1) return this.#halve(spans, lifted, keep);
      const cut22 = this.#cut(spans[0], lifted, keep);
      if (cut22 !== void 0) {
        this.warnOnce(
          "content-cut",
          "telmoni: a span past the 1 MiB an export may hold was sent without its longest content, named in telmoni.content_cut",
          { kind: "trimmed" }
        );
        return this.#send(cut22);
      }
      body = this.#body(spans, lifted, keep, true);
      if (Buffer.byteLength(body) > BATCH_MAX_BYTES) {
        this.warnOnce("too-large", "telmoni: a span past the 1 MiB an export may hold was dropped", {
          kind: "too_large"
        });
        return true;
      }
      this.warnOnce(
        "trimmed",
        "telmoni: a span past the 1 MiB an export may hold was sent without the attributes ingest drops for their length",
        { kind: "trimmed" }
      );
    }
    return this.#send(body);
  }
  /** Exports each half of the spans, the second only where the first went. */
  async #halve(spans, lifted, keep) {
    const half = Math.floor(spans.length / 2);
    return await this.#export(spans.slice(0, half), lifted, keep) && this.#export(spans.slice(half), lifted, keep);
  }
  /** The spans with every field the mask is handed as it answers it, before a part it takes out could be put. */
  #mask(spans) {
    if (this.#config.mask === void 0) return spans;
    return spans.map((span) => fieldsAs(span, span.attributes, (key, value) => this.#masked(key, value)));
  }
  /** One field as the mask answers it, handed as a string, any other value as its JSON; undefined to send the span without it. An answer unchanged keeps the value as it was. */
  #masked(key, value) {
    const given = typeof value === "string" ? value : JSON.stringify(value);
    let answer;
    try {
      answer = this.#config.mask(key, given);
    } catch {
      answer = MASK_FAILED;
    }
    if (answer === void 0 || answer === null) return void 0;
    if (typeof answer !== "string") {
      this.warnOnce(`mask:${key}`, `telmoni: the mask failed on ${key}; the span was sent without it`, {
        kind: "mask_failed"
      });
      return void 0;
    }
    return answer === given ? value : answer;
  }
  /**
   * The spans with every field the mask is handed as the scrubbers leave it, each as it is sent, `lifted`'s in place
   * of their own; a span they changed counts what in `telmoni.scrubbed`.
   */
  #scrub(spans, lifted) {
    return spans.map((span) => {
      const counts = /* @__PURE__ */ new Map();
      const scrubbed = fieldsAs(span, attributesOf(span, lifted), (key, value) => this.#scrubbed(key, value, counts));
      if (counts.size > 0) scrubbed.attributes[SCRUBBED] = scrubbedOf(counts);
      return scrubbed;
    });
  }
  /** One field as the scrubbers switched on leave it, handed as the mask is, what they replaced counted; undefined where one fails, counted as dropped. */
  #scrubbed(key, value, counts) {
    const given = typeof value === "string" ? value : JSON.stringify(value);
    try {
      const [text, found] = scrubber.scrub(given, this.#config.scrubSecrets, this.#config.scrubPii);
      for (const [kind2, count2] of found) counts.set(kind2, (counts.get(kind2) ?? 0) + count2);
      return text === given ? value : text;
    } catch {
      counts.set(`dropped:${key}`, (counts.get(`dropped:${key}`) ?? 0) + 1);
      return void 0;
    }
  }
  /** Each span's messages with every `blob` part lifted out: a blob repeated in every span would bloat each, past 1 MiB maybe. */
  async #lift(spans) {
    const lifted = /* @__PURE__ */ new Map();
    for (const span of spans) {
      for (const key of MEDIA_FIELDS) {
        const value = span.attributes[key];
        if (typeof value !== "string") continue;
        const decoded = parseJson(value);
        if (!Array.isArray(decoded) || !await this.#liftParts(decoded)) continue;
        try {
          lifted.set(span, { ...lifted.get(span), [key]: JSON.stringify(decoded) });
        } catch {
        }
      }
    }
    return lifted;
  }
  /** Replaces each `blob` part in place, a message's parts too; whether any was. */
  async #liftParts(parts) {
    let lifted = false;
    for (const [at, part] of parts.entries()) {
      if (isRecord(part) && Array.isArray(part["parts"])) {
        lifted = await this.#liftParts(part["parts"]) || lifted;
        continue;
      }
      const file = await this.#filePart(part);
      if (file !== void 0) {
        parts[at] = file;
        lifted = true;
      }
    }
    return lifted;
  }
  /** The `file` part naming a `blob` part's bytes, put first unless past the platform's cap or put already. */
  async #filePart(part) {
    if (!isRecord(part) || part["type"] !== "blob") return void 0;
    const content2 = part["content"];
    if (typeof content2 !== "string" || content2.length % 4 !== 0 || !BASE64.test(content2)) return void 0;
    const data = Buffer.from(content2, "base64");
    const sha256 = createHash2("sha256").update(data).digest("hex");
    if (data.byteLength <= MEDIA_MAX_BYTES && !this.#uploaded.has(sha256)) {
      await this.#upload(sha256, data, part["mime_type"]);
    }
    const file = { type: "file" };
    for (const name of ["modality", "mime_type"]) {
      if (name in part) file[name] = part[name];
    }
    file["file_id"] = `${FILE_ID_PREFIX}${sha256}`;
    return file;
  }
  /** Puts one file, once: a failure is warned of, never the export's. */
  async #upload(sha256, data, mimeType) {
    if (this.#givenUp.signal.aborted) return;
    const headers = this.#headers(
      typeof mimeType === "string" && HEADER_SAFE.test(mimeType) ? mimeType : MEDIA_DEFAULT_TYPE
    );
    let failure;
    let warning = { kind: "upload_failed" };
    try {
      const answer = await this.#transport(`${this.#mediaUrl}${sha256}`, { method: "PUT", headers, body: data });
      await bodyOf(answer);
      if (answer.status >= 200 && answer.status < 300) {
        if (this.#uploaded.size >= UPLOADED_MAX) this.#uploaded.clear();
        this.#uploaded.add(sha256);
        return;
      }
      failure = String(answer.status);
      warning = { kind: "upload_failed", status: answer.status };
    } catch (error) {
      failure = errorName(error);
    }
    this.warnOnce(
      `upload:${failure}`,
      `telmoni: an image or file in a message could not be uploaded (${failure}); its part was sent naming it, which the platform may not hold`,
      warning
    );
  }
  /**
   * The span's body without its longest content, as few fields as fit it in an export: a content field, or any
   * past ingest's caps, which on a project that keeps content is content too; undefined where it sends no
   * content, or fits without all of it.
   */
  #cut(span, lifted, keep) {
    if (!keep) return void 0;
    const content2 = Object.entries(attributesOf(span, lifted)).filter(
      ([key, value]) => value !== void 0 && key !== CONTENT_CUT && (CONTENT.has(key) || pastCaps(key, value))
    ).map(([key, value]) => [key, Array.from(asIngestWrites(value)).length]).sort((a, b) => b[1] - a[1]);
    const cut22 = [];
    for (const [key] of content2) {
      cut22.push(key);
      const body = this.#body([span], lifted, keep, false, cut22);
      if (Buffer.byteLength(body) <= BATCH_MAX_BYTES) return body;
    }
    return void 0;
  }
  #keepsContent() {
    return this.#config.captureContent && this.#contentMode === "on";
  }
  #body(spans, lifted, keep, trimmed2 = false, cut22 = []) {
    return JSON.stringify(
      this.encode(spans, lifted, keep, trimmed2, cut22),
      (_key, value) => typeof value === "string" ? value.replace(LONE_SURROGATE, "\uFFFD") : value
    );
  }
  #headers(contentType = "application/json") {
    const headers = {
      "Content-Type": contentType,
      "User-Agent": `telmoni-typescript/${VERSION4}`
    };
    if (this.#config.apiKey !== void 0) {
      headers["Authorization"] = `Bearer ${this.#config.apiKey}`;
    }
    return headers;
  }
  /**
   * Asks the project's content mode with an export of no spans, which ingest
   * answers as the mode is now: once and silently, since the export after it
   * retries and warns of what it meets, its content held back meanwhile.
   */
  async #ask() {
    if (this.#givenUp.signal.aborted) return;
    try {
      const answer = await this.#transport(this.#url, {
        method: "POST",
        headers: { ...this.#headers(), [SENT_AT_HEADER]: sentAtNow() },
        body: ASK
      });
      if (answer.status >= 200 && answer.status < 300) await this.#read(answer);
    } catch {
    }
  }
  async #send(body) {
    const headers = this.#headers();
    const posted = await this.#post(this.#url, body, () => ({ ...headers, [SENT_AT_HEADER]: sentAtNow() }));
    switch (posted.kind) {
      case "answered":
        await this.#read(posted.answer);
        return true;
      case "refused":
        this.warnOnce(
          `status:${posted.status}`,
          `telmoni: export refused with ${nameOf(posted.status, posted.named)}; the batch was dropped`,
          answered("refused", posted.status, posted.named)
        );
        return posted.status === 400 || posted.status === 413;
      case "failed":
        this.warnOnce(
          `failed:${posted.failure}`,
          `telmoni: export failed after ${ATTEMPTS} attempts (${posted.failure}); the batch was dropped`,
          posted.warning
        );
        return false;
      case "given_up":
        return false;
    }
  }
  /** Posts the scores' items, in order, `SCORES_SENT_MAX` a body; a failure is warned of, never the spans'. */
  async #sendScores(items) {
    const headers = this.#headers();
    for (let at = 0; at < items.length; at += SCORES_SENT_MAX) {
      const body = `{"scores":[${items.slice(at, at + SCORES_SENT_MAX).join(",")}]}`;
      const posted = await this.#post(this.#scoresUrl, body, () => headers);
      if (posted.kind === "given_up") return;
      if (posted.kind === "answered") {
        await bodyOf(posted.answer);
      } else if (posted.kind === "refused") {
        this.warnOnce(
          `scores:status:${posted.status}`,
          `telmoni: scores refused with ${nameOf(posted.status, posted.named)}; they were dropped`,
          answered("refused", posted.status, posted.named)
        );
      } else {
        this.warnOnce(
          `scores:failed:${posted.failure}`,
          `telmoni: scores failed after ${ATTEMPTS} attempts (${posted.failure}); they were dropped`,
          posted.warning
        );
      }
    }
  }
  /** Posts `body`, sent again on no answer or a retried status, `ATTEMPTS` in all, as long as nothing gave it up. */
  async #post(url, body, headers) {
    let failure = "";
    let met = { kind: "failed" };
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      if (this.#givenUp.signal.aborted) return { kind: "given_up" };
      let answer;
      try {
        answer = await this.#transport(url, { method: "POST", headers: headers(), body });
      } catch (error) {
        failure = errorName(error);
        met = { kind: "failed" };
        await this.#wait(null, attempt);
        continue;
      }
      if (answer.status >= 200 && answer.status < 300) return { kind: "answered", answer };
      const named = problemType(await bodyOf(answer));
      if (RETRIED.has(answer.status)) {
        failure = nameOf(answer.status, named);
        met = answered("failed", answer.status, named);
        await this.#wait(answer.headers.get("Retry-After"), attempt);
        continue;
      }
      return { kind: "refused", status: answer.status, named };
    }
    return { kind: "failed", failure, warning: met };
  }
  /**
   * OTLP's `ExportTraceServiceRequest`, in its JSON encoding, `lifted`'s fields in place of the spans' own; `keep`,
   * with their content; `trimmed`, without the attributes ingest drops for their length; `cut`, without those
   * content fields, named in `telmoni.content_cut`.
   */
  encode(spans, lifted, keep, trimmed2 = false, cut22 = []) {
    return {
      resourceSpans: [
        {
          resource: { attributes: this.#resource },
          scopeSpans: [
            {
              scope: { name: SCOPE, version: VERSION4 },
              spans: spans.map((span) => this.#span(span, lifted, keep, trimmed2, cut22))
            }
          ]
        }
      ]
    };
  }
  #span(span, lifted, keepContent, trimmed2 = false, cut22 = []) {
    const attributes = [];
    for (const [key, value] of Object.entries(attributesOf(span, lifted))) {
      if (value === void 0) continue;
      if (!keepContent && CONTENT.has(key)) continue;
      if (cut22.includes(key) || cut22.length > 0 && key === CONTENT_CUT) continue;
      if (trimmed2 && pastCaps(key, value)) continue;
      attributes.push(attribute(key, value));
    }
    if (cut22.length > 0) attributes.push(attribute(CONTENT_CUT, [...cut22]));
    const spanContext = span.spanContext();
    const parent = span.parentSpanContext;
    const start = span.startTime;
    const end = isUnset(span.endTime) ? start : span.endTime;
    const encoded = {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      ...parent !== void 0 && isSpanContextValid(parent) ? { parentSpanId: parent.spanId } : {},
      name: span.name,
      kind: KINDS[span.kind],
      startTimeUnixNano: nanos(start),
      endTimeUnixNano: nanos(end),
      attributes
    };
    if (span.links.length > 0) {
      encoded.links = span.links.map((link) => ({ traceId: link.context.traceId, spanId: link.context.spanId }));
    }
    const events = keepContent && !trimmed2;
    const sent = span.events.filter((event) => events || event.name === EVALUATION_EVENT);
    if (sent.length > 0) {
      encoded.events = sent.map((event) => ({
        timeUnixNano: nanos(event.time),
        name: event.name,
        attributes: Object.entries(event.attributes ?? {}).filter((entry) => entry[1] !== void 0 && (events || SCORE_KEYS.has(entry[0]))).map(([key, value]) => attribute(key, value))
      }));
    }
    if (span.status.code === SpanStatusCode.ERROR) {
      encoded.status = { code: 2 };
      if (events && span.status.message) encoded.status.message = span.status.message;
    }
    return encoded;
  }
  async #read(answer) {
    const mode = trimEnds(answer.headers.get(CONTENT_MODE_HEADER) ?? "");
    if (mode) this.#contentMode = mode === "off" || mode === "on" ? mode : void 0;
    const decoded = parseJson(await bodyOf(answer));
    const partial = isRecord(decoded) ? decoded["partialSuccess"] : void 0;
    if (!isRecord(partial)) return;
    const message2 = partial["errorMessage"];
    if (typeof message2 === "string" && message2 !== "") this.#note(message2);
  }
  #note(message2) {
    for (const line of message2.split(/\r?\n/)) {
      const dropped = DROPPED.exec(line);
      if (dropped !== null) {
        const [, , attributeName = "", reason = "", rest] = dropped;
        let text = `telmoni: the server dropped ${attributeName} (${reason}`;
        if (rest) text += `; ${rest}`;
        text += `); ${remedy(attributeName, reason)}`;
        this.warnOnce(`dropped:${attributeName}:${reason}`, text, { kind: "dropped" });
        continue;
      }
      const refused2 = REFUSED.exec(line);
      if (refused2 !== null) {
        const why = refused2[2] ?? "";
        this.warnOnce(`refused:${why}`, `telmoni: the server refused a span: ${why}`, { kind: "span_refused" });
        continue;
      }
      if (line.startsWith("and ") || line === "") continue;
      this.warnOnce(`line:${line}`, `telmoni: the server said: ${line}`, { kind: "said" });
    }
  }
  /** Before the next attempt; nothing after the last. */
  async #wait(retryAfter, attempt) {
    if (attempt + 1 >= ATTEMPTS) return;
    const seconds = retrySeconds(retryAfter) ?? 2 ** attempt;
    await this.#sleep(Math.min(seconds, RETRY_AFTER_MAX_S), this.#givenUp.signal);
  }
  /** Warns `text` once per client under `key`, as every warning is. */
  warnOnce(key, text, warning) {
    if (this.#warned.has(key)) return;
    if (this.#warned.size >= WARNED_MAX) this.#warned.clear();
    this.#warned.add(key);
    this.warn(text, warning);
  }
  /** Warns `text` through the hook, which may throw: never into the worker or the agent's own call. */
  warn(text, warning) {
    try {
      this.#warn(text, warning);
    } catch {
    }
  }
};
function asIngestWrites(value) {
  return Array.isArray(value) ? JSON.stringify(value.filter((item) => item !== null && item !== void 0)) : String(value);
}
function pastCaps(key, value) {
  if (Array.from(key).length > ATTRIBUTE_KEY_MAX) return true;
  return Array.from(asIngestWrites(value)).length > ATTRIBUTE_VALUE_MAX;
}
function remedy(attributeName, reason) {
  if (reason === "content") return `the project's content mode decides whether content is kept: ${CONTENT_DOCS}`;
  if (reason === "unlisted") return `send it as the tag ${TAG_PREFIX}${attributeName} to keep it`;
  if (reason === "over_cap") return "shorten it to keep it";
  if (reason === "cardinality") return "keep tags to a few keys of a few values each: an id goes as the user or the session";
  return "see the server's answer";
}
function answered(kind2, status, type) {
  return type === "" ? { kind: kind2, status } : { kind: kind2, status, problemType: type };
}
function carriesScore(span) {
  return span.name === SCORE_SPAN && span.parentSpanContext === void 0 && typeof span.attributes[SCORE_SENT] === "string";
}
var ASK = '{"resourceSpans":[]}';
function holdsContent(span) {
  return Object.keys(span.attributes).some((key) => CONTENT.has(key)) || span.events.some(
    (event) => event.name !== EVALUATION_EVENT || Object.keys(event.attributes ?? {}).some((key) => !SCORE_KEYS.has(key))
  ) || Boolean(span.status.message);
}
function sentAtNow() {
  return (BigInt(Math.trunc(Date.now())) * 1000000n).toString();
}
function nameOf(status, problem2) {
  return problem2 === "" ? String(status) : `${status} ${problem2}`;
}
function problemType(body) {
  const decoded = parseJson(body);
  const message2 = isRecord(decoded) ? decoded["message"] : void 0;
  if (typeof message2 !== "string" || !message2.startsWith("/errors/")) return "";
  return message2.split(":", 1)[0] ?? "";
}
function retrySeconds(header) {
  const given = SECONDS.exec(header ?? "");
  if (given === null) return void 0;
  const whole2 = (given[2] ?? "").replace(/^0+/, "");
  if (given[1] === "-") return 0;
  return whole2.length > 2 ? RETRY_AFTER_MAX_S : Number(whole2);
}
async function bodyOf(answer) {
  try {
    return await answer.text();
  } catch {
    return "";
  }
}
function parseJson(text) {
  try {
    return JSON.parse(text === "" ? "{}" : text);
  } catch {
    return void 0;
  }
}
function fieldsAs(span, attributes, answer) {
  const kept2 = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === void 0) continue;
    const given = CONTENT.has(key) && key !== CONTENT_CUT ? answer(key, value) : value;
    if (given !== void 0) kept2[key] = given;
  }
  const events = span.events.map((event) => {
    const eventKept = {};
    for (const [key, value] of Object.entries(event.attributes ?? {})) {
      const score = event.name === EVALUATION_EVENT && SCORE_KEYS.has(key);
      const given = value === void 0 || score ? value : answer(key, value);
      if (given !== void 0) eventKept[key] = given;
    }
    return { ...event, attributes: eventKept };
  });
  let status = span.status;
  if (status.message) {
    const message2 = answer(STATUS_DESCRIPTION, status.message);
    status = message2 === void 0 ? { code: status.code } : { ...status, message: message2 };
  }
  return maskedSpan(span, kept2, events, status);
}
function maskedSpan(span, attributes, events, status) {
  return {
    name: span.name,
    kind: span.kind,
    spanContext: () => span.spanContext(),
    ...span.parentSpanContext === void 0 ? {} : { parentSpanContext: span.parentSpanContext },
    startTime: span.startTime,
    endTime: span.endTime,
    status,
    attributes,
    links: span.links,
    events,
    duration: span.duration,
    ended: span.ended,
    resource: span.resource,
    instrumentationScope: span.instrumentationScope,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount
  };
}
function attributesOf(span, lifted) {
  const fields = lifted.get(span);
  return fields === void 0 ? span.attributes : { ...span.attributes, ...fields };
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUnset(time) {
  return time[0] === 0 && time[1] === 0;
}
function nanos(time) {
  const count2 = BigInt(Math.trunc(time[0])) * 1000000000n + BigInt(Math.trunc(time[1]));
  return count2 >= 0n && count2 < 2n ** 64n ? count2.toString() : "0";
}
function attribute(key, value) {
  return { key, value: anyValue(key, value) };
}
function anyValue(key, value) {
  if (typeof value === "boolean") return { boolValue: value };
  if (typeof value === "number") {
    if (DOUBLES.has(key)) return { doubleValue: value };
    const whole2 = Math.trunc(value);
    if ((INTEGERS.has(key) || Number.isSafeInteger(value)) && whole2 >= -(2 ** 63) && whole2 < 2 ** 63) {
      return { intValue: String(whole2) };
    }
    return { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) {
    const values = [];
    for (const item of value) {
      if (item !== null && item !== void 0) values.push(anyValue("", item));
    }
    return { arrayValue: { values } };
  }
  return { stringValue: String(value) };
}
var model_prices_default = {
  source: {
    repository: "https://github.com/BerriAI/litellm",
    path: "model_prices_and_context_window.json",
    commit: "de5dc5b238b6e972869d7dedc6ba3c4fb8d931fe",
    sha256: "12ea25ddb6f2427bf7be2550b5a160d8659136d8747cfddf62327701591d2226",
    license: [
      "MIT License",
      "",
      "Copyright (c) 2023 Berri AI",
      "",
      "Permission is hereby granted, free of charge, to any person obtaining a copy",
      'of this software and associated documentation files (the "Software"), to deal',
      "in the Software without restriction, including without limitation the rights",
      "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell",
      "copies of the Software, and to permit persons to whom the Software is",
      "furnished to do so, subject to the following conditions:",
      "",
      "The above copyright notice and this permission notice shall be included in all",
      "copies or substantial portions of the Software.",
      "",
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
      "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,",
      "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE",
      "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER",
      "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,",
      "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE",
      "SOFTWARE."
    ]
  },
  prices: [
    { provider: "anthropic", model: "claude-fable-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "anthropic", model: "claude-fable-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "anthropic", model: "claude-haiku-4-5", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "anthropic", model: "claude-haiku-4-5-20251001", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "anthropic", model: "claude-haiku-5-5", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "anthropic", model: "claude-mythos-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "anthropic", model: "claude-mythos-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "anthropic", model: "claude-mythos-preview", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "anthropic", model: "claude-opus-4-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-5-20251101", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-6", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-6-20260205", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-7", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-7-20260416", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-4-8", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "anthropic", model: "claude-opus-5-5", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "anthropic", model: "claude-sonnet-4-5", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "anthropic", model: "claude-sonnet-4-5-20250929", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "anthropic", model: "claude-sonnet-4-6", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "anthropic", model: "claude-sonnet-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "anthropic", model: "claude-sonnet-5-5", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "ai21.j2-mid-v1", input: 125e-7, output: 125e-7, cache_read: 125e-7, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "ai21.j2-ultra-v1", input: 188e-7, output: 188e-7, cache_read: 188e-7, cache_write: 188e-7 },
    { provider: "aws.bedrock", model: "ai21.jamba-1-5-large-v1:0", input: 2e-6, output: 8e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "ai21.jamba-1-5-mini-v1:0", input: 2e-7, output: 4e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "aws.bedrock", model: "ai21.jamba-instruct-v1:0", input: 5e-7, output: 7e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "aws.bedrock", model: "amazon.nova-2-lite-v1:0", input: 3e-7, output: 25e-7, cache_read: 75e-9, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "amazon.nova-2-multimodal-embeddings-v1:0", input: 135e-9, output: 0, cache_read: 135e-9, cache_write: 135e-9 },
    { provider: "aws.bedrock", model: "amazon.nova-2-pro-preview-20251202-v1:0", input: 125e-8, output: 1e-5, cache_read: 3125e-10, cache_write: 125e-8 },
    { provider: "aws.bedrock", model: "amazon.nova-lite-v1:0", input: 6e-8, output: 24e-8, cache_read: 15e-9, cache_write: 6e-8 },
    { provider: "aws.bedrock", model: "amazon.nova-micro-v1:0", input: 35e-9, output: 14e-8, cache_read: 875e-11, cache_write: 35e-9 },
    { provider: "aws.bedrock", model: "amazon.nova-premier-v1:0", input: 25e-7, output: 125e-7, cache_read: 625e-9, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "amazon.nova-pro-v1:0", input: 8e-7, output: 32e-7, cache_read: 2e-7, cache_write: 8e-7 },
    { provider: "aws.bedrock", model: "amazon.titan-embed-g1-text-02", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "amazon.titan-embed-image-v1", input: 8e-7, output: 0, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "aws.bedrock", model: "amazon.titan-embed-text-v1", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "amazon.titan-embed-text-v2:0", input: 2e-8, output: 0, cache_read: 2e-8, cache_write: 2e-8 },
    { provider: "aws.bedrock", model: "amazon.titan-text-express-v1", input: 2e-7, output: 6e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "aws.bedrock", model: "amazon.titan-text-lite-v1", input: 15e-8, output: 2e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "amazon.titan-text-premier-v1:0", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-5-haiku-20241022-v1:0", input: 8e-7, output: 4e-6, cache_read: 8e-8, cache_write: 1e-6 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-5-sonnet-20240620-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-5-sonnet-20241022-v2:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-7-sonnet-20240620-v1:0", input: 36e-7, output: 18e-6, cache_read: 36e-8, cache_write: 45e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-7-sonnet-20250219-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-3-opus-20240229-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-fable-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-fable-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-haiku-4-5-20251001-v1:0", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-haiku-4-5@20251001", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-haiku-5-5", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "aws.bedrock", model: "anthropic.claude-instant-v1", input: 8e-7, output: 24e-7, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-mythos-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-mythos-preview", input: 275e-7, output: 1375e-7, cache_read: 275e-8, cache_write: 34375e-9 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-1-20250805-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-20250514-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-5-20251101-v1:0", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-6-v1", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-7", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-4-8", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-opus-5-5", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "aws.bedrock", model: "anthropic.claude-sonnet-4-20250514-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-sonnet-4-5-20250929-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-sonnet-4-6", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "anthropic.claude-sonnet-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-sonnet-5-5", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "anthropic.claude-v1", input: 8e-6, output: 24e-6, cache_read: 8e-6, cache_write: 8e-6 },
    { provider: "aws.bedrock", model: "anthropic.claude-v2:1", input: 8e-6, output: 24e-6, cache_read: 8e-6, cache_write: 8e-6 },
    { provider: "aws.bedrock", model: "apac.amazon.nova-2-lite-v1:0", input: 396e-9, output: 3311e-9, cache_read: 99e-9, cache_write: 396e-9 },
    { provider: "aws.bedrock", model: "apac.amazon.nova-2-pro-preview-20251202-v1:0", input: 1375e-9, output: 11e-6, cache_read: 34375e-11, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "apac.amazon.nova-lite-v1:0", input: 63e-9, output: 252e-9, cache_read: 1575e-11, cache_write: 63e-9 },
    { provider: "aws.bedrock", model: "apac.amazon.nova-micro-v1:0", input: 37e-9, output: 148e-9, cache_read: 925e-11, cache_write: 37e-9 },
    { provider: "aws.bedrock", model: "apac.amazon.nova-pro-v1:0", input: 84e-8, output: 336e-8, cache_read: 21e-8, cache_write: 84e-8 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-fable-5", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-haiku-4-5-20251001-v1:0", input: 11e-7, output: 55e-7, cache_read: 11e-8, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-haiku-5-5", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-mythos-preview", input: 275e-7, output: 1375e-7, cache_read: 275e-8, cache_write: 34375e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-opus-4-7", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-opus-4-8", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-opus-5", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-opus-5-5", input: 44e-7, output: 22e-6, cache_read: 22e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-sonnet-4-20250514-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-sonnet-4-6", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-sonnet-5", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "apac.anthropic.claude-sonnet-5-5", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-fable-5", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-haiku-4-5-20251001-v1:0", input: 11e-7, output: 55e-7, cache_read: 11e-8, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-haiku-5-5", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-mythos-preview", input: 275e-7, output: 1375e-7, cache_read: 275e-8, cache_write: 34375e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-opus-4-6-v1", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-opus-4-7", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-opus-4-8", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-opus-5", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-opus-5-5", input: 44e-7, output: 22e-6, cache_read: 22e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-sonnet-4-6", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-sonnet-5", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "au.anthropic.claude-sonnet-5-5", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "claude-sonnet-4-5-20250929-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "cohere.command-light-text-v14", input: 3e-7, output: 6e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "cohere.command-text-v14", input: 1e-6, output: 2e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "aws.bedrock", model: "cohere.embed-english-v3", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "cohere.embed-multilingual-v3", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "cohere.embed-v4:0", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "aws.bedrock", model: "deepseek.r1-v1:0", input: 135e-8, output: 54e-7, cache_read: 135e-8, cache_write: 135e-8 },
    { provider: "aws.bedrock", model: "deepseek.v3-v1:0", input: 58e-8, output: 168e-8, cache_read: 58e-8, cache_write: 58e-8 },
    { provider: "aws.bedrock", model: "deepseek.v3.2", input: 62e-8, output: 185e-8, cache_read: 62e-8, cache_write: 62e-8 },
    { provider: "aws.bedrock", model: "eu.amazon.nova-2-lite-v1:0", input: 429e-9, output: 3597e-9, cache_read: 10725e-11, cache_write: 429e-9 },
    { provider: "aws.bedrock", model: "eu.amazon.nova-2-pro-preview-20251202-v1:0", input: 1375e-9, output: 11e-6, cache_read: 34375e-11, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "eu.amazon.nova-lite-v1:0", input: 78e-9, output: 312e-9, cache_read: 195e-10, cache_write: 78e-9 },
    { provider: "aws.bedrock", model: "eu.amazon.nova-micro-v1:0", input: 46e-9, output: 184e-9, cache_read: 115e-10, cache_write: 46e-9 },
    { provider: "aws.bedrock", model: "eu.amazon.nova-pro-v1:0", input: 105e-8, output: 42e-7, cache_read: 2625e-10, cache_write: 105e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-3-5-haiku-20241022-v1:0", input: 8e-7, output: 4e-6, cache_read: 8e-8, cache_write: 1e-6 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-3-5-sonnet-20240620-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-3-5-sonnet-20241022-v2:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-3-7-sonnet-20250219-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-3-opus-20240229-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-fable-5", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-fable-5-1", input: 11e-6, output: 55e-6, cache_read: 275e-9, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-haiku-4-5-20251001-v1:0", input: 11e-7, output: 55e-7, cache_read: 11e-8, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-haiku-5-5", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-1-20250805-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-20250514-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-5-20251101-v1:0", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-6-v1", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-7", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-4-8", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-5", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-opus-5-5", input: 44e-7, output: 22e-6, cache_read: 22e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-sonnet-4-20250514-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-sonnet-4-6", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-sonnet-5", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "eu.anthropic.claude-sonnet-5-5", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "eu.deepseek.v3.2", input: 74e-8, output: 222e-8, cache_read: 74e-8, cache_write: 74e-8 },
    { provider: "aws.bedrock", model: "eu.meta.llama3-2-1b-instruct-v1:0", input: 13e-8, output: 13e-8, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "aws.bedrock", model: "eu.meta.llama3-2-3b-instruct-v1:0", input: 19e-8, output: 19e-8, cache_read: 19e-8, cache_write: 19e-8 },
    { provider: "aws.bedrock", model: "eu.mistral.pixtral-large-2502-v1:0", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "global.amazon.nova-2-lite-v1:0", input: 3e-7, output: 25e-7, cache_read: 75e-9, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-fable-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-fable-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-haiku-4-5-20251001-v1:0", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-haiku-5-5", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-mythos-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-4-5-20251101-v1:0", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-4-6-v1", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-4-7", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-4-8", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-opus-5-5", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-sonnet-4-20250514-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-sonnet-4-6", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-sonnet-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.anthropic.claude-sonnet-5-5", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.cohere.embed-v4:0", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "aws.bedrock", model: "global.moonshotai.kimi-k3", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "global.openai.gpt-5.4", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.openai.gpt-5.5", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "aws.bedrock", model: "global.openai.gpt-5.6-luna", input: 2e-7, output: 12e-7, cache_read: 2e-8, cache_write: 25e-8 },
    { provider: "aws.bedrock", model: "global.openai.gpt-5.6-sol", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "aws.bedrock", model: "global.openai.gpt-5.6-terra", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.openai.gpt-6-astra", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "aws.bedrock", model: "global.openai.gpt-6-luna", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "aws.bedrock", model: "global.openai.gpt-6-sol", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.openai.gpt-6.1-sol", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "global.xai.grok-4.6", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "global.xai.grok-4.7", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "global.zai.glm-5.3", input: 168e-8, output: 528e-8, cache_read: 312e-9, cache_write: 21e-7 },
    { provider: "aws.bedrock", model: "google.gemma-3-12b-it", input: 9e-8, output: 29e-8, cache_read: 9e-8, cache_write: 9e-8 },
    { provider: "aws.bedrock", model: "google.gemma-3-27b-it", input: 23e-8, output: 38e-8, cache_read: 23e-8, cache_write: 23e-8 },
    { provider: "aws.bedrock", model: "google.gemma-3-4b-it", input: 4e-8, output: 8e-8, cache_read: 4e-8, cache_write: 4e-8 },
    { provider: "aws.bedrock", model: "in.moonshotai.kimi-k3", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "jp.amazon.nova-2-lite-v1:0", input: 396e-9, output: 3311e-9, cache_read: 99e-9, cache_write: 396e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-haiku-4-5-20251001-v1:0", input: 11e-7, output: 55e-7, cache_read: 11e-8, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-haiku-5-5", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-opus-4-7", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-opus-4-8", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-opus-5", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-opus-5-5", input: 44e-7, output: 22e-6, cache_read: 22e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-sonnet-4-6", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-sonnet-5", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "jp.anthropic.claude-sonnet-5-5", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "meta.llama2-13b-chat-v1", input: 75e-8, output: 1e-6, cache_read: 75e-8, cache_write: 75e-8 },
    { provider: "aws.bedrock", model: "meta.llama2-70b-chat-v1", input: 195e-8, output: 256e-8, cache_read: 195e-8, cache_write: 195e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-1-405b-instruct-v1:0", input: 24e-7, output: 24e-7, cache_read: 24e-7, cache_write: 24e-7 },
    { provider: "aws.bedrock", model: "meta.llama3-1-70b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-1-8b-instruct-v1:0", input: 22e-8, output: 22e-8, cache_read: 22e-8, cache_write: 22e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-2-11b-instruct-v1:0", input: 16e-8, output: 16e-8, cache_read: 16e-8, cache_write: 16e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-2-1b-instruct-v1:0", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "meta.llama3-2-3b-instruct-v1:0", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-2-90b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-3-70b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-70b-instruct-v1:0", input: 265e-8, output: 35e-7, cache_read: 265e-8, cache_write: 265e-8 },
    { provider: "aws.bedrock", model: "meta.llama3-8b-instruct-v1:0", input: 3e-7, output: 6e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "meta.llama4-maverick-17b-instruct-v1:0", input: 24e-8, output: 97e-8, cache_read: 24e-8, cache_write: 24e-8 },
    { provider: "aws.bedrock", model: "meta.llama4-scout-17b-instruct-v1:0", input: 17e-8, output: 66e-8, cache_read: 17e-8, cache_write: 17e-8 },
    { provider: "aws.bedrock", model: "minimax.minimax-m2", input: 3e-7, output: 12e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "minimax.minimax-m2.1", input: 3e-7, output: 12e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "minimax.minimax-m2.5", input: 3e-7, output: 12e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "aws.bedrock", model: "mistral.devstral-2-123b", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "aws.bedrock", model: "mistral.magistral-small-2509", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "aws.bedrock", model: "mistral.ministral-3-14b-instruct", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "aws.bedrock", model: "mistral.ministral-3-3b-instruct", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "mistral.ministral-3-8b-instruct", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "mistral.mistral-7b-instruct-v0:2", input: 15e-8, output: 2e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "mistral.mistral-large-2402-v1:0", input: 4e-6, output: 12e-6, cache_read: 4e-6, cache_write: 4e-6 },
    { provider: "aws.bedrock", model: "mistral.mistral-large-2407-v1:0", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "mistral.mistral-large-3-675b-instruct", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "aws.bedrock", model: "mistral.mistral-small-2402-v1:0", input: 1e-6, output: 3e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "aws.bedrock", model: "mistral.mixtral-8x7b-instruct-v0:1", input: 45e-8, output: 7e-7, cache_read: 45e-8, cache_write: 45e-8 },
    { provider: "aws.bedrock", model: "mistral.pixtral-large-2502-v1:0", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "mistral.voxtral-mini-3b-2507", input: 4e-8, output: 4e-8, cache_read: 4e-8, cache_write: 4e-8 },
    { provider: "aws.bedrock", model: "mistral.voxtral-small-24b-2507", input: 1e-7, output: 3e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "moonshot.kimi-k2-thinking", input: 6e-7, output: 25e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "moonshotai.kimi-k2-thinking", input: 6e-7, output: 25e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "moonshotai.kimi-k2.5", input: 6e-7, output: 3e-6, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "moonshotai.kimi-k3", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "nvidia.nemotron-nano-12b-v2", input: 2e-7, output: 6e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "aws.bedrock", model: "nvidia.nemotron-nano-3-30b", input: 6e-8, output: 24e-8, cache_read: 6e-8, cache_write: 6e-8 },
    { provider: "aws.bedrock", model: "nvidia.nemotron-nano-9b-v2", input: 6e-8, output: 23e-8, cache_read: 6e-8, cache_write: 6e-8 },
    { provider: "aws.bedrock", model: "nvidia.nemotron-super-3-120b", input: 15e-8, output: 65e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "openai.gpt-6-luna", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "aws.bedrock", model: "openai.gpt-6-sol", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "openai.gpt-oss-120b-1:0", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "openai.gpt-oss-20b-1:0", input: 7e-8, output: 3e-7, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "aws.bedrock", model: "openai.gpt-oss-safeguard-120b", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "openai.gpt-oss-safeguard-20b", input: 7e-8, output: 2e-7, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-235b-a22b-2507-v1:0", input: 22e-8, output: 88e-8, cache_read: 22e-8, cache_write: 22e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-32b-v1:0", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-coder-30b-a3b-v1:0", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-coder-480b-a35b-v1:0", input: 45e-8, output: 18e-7, cache_read: 45e-8, cache_write: 45e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-coder-next", input: 5e-7, output: 12e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "aws.bedrock", model: "qwen.qwen3-next-80b-a3b", input: 15e-8, output: 12e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "qwen.qwen3-vl-235b-a22b", input: 53e-8, output: 266e-8, cache_read: 53e-8, cache_write: 53e-8 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-fable-5-1", input: 12e-6, output: 6e-5, cache_read: 3e-7, cache_write: 15e-6 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-haiku-5-5", input: 12e-8, output: 6e-7, cache_read: 12e-9, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-opus-4-8", input: 6e-6, output: 3e-5, cache_read: 6e-7, cache_write: 75e-7 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-opus-5", input: 6e-6, output: 3e-5, cache_read: 6e-7, cache_write: 75e-7 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-opus-5-5", input: 48e-7, output: 24e-6, cache_read: 24e-8, cache_write: 6e-6 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 36e-7, output: 18e-6, cache_read: 36e-8, cache_write: 45e-7 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-sonnet-5", input: 24e-7, output: 12e-6, cache_read: 24e-8, cache_write: 3e-6 },
    { provider: "aws.bedrock", model: "us-gov.anthropic.claude-sonnet-5-5", input: 24e-7, output: 12e-6, cache_read: 12e-8, cache_write: 3e-6 },
    { provider: "aws.bedrock", model: "us-gov.nvidia.nemotron-nano-12b-v2", input: 24e-8, output: 72e-8, cache_read: 24e-8, cache_write: 24e-8 },
    { provider: "aws.bedrock", model: "us-gov.nvidia.nemotron-nano-3-30b", input: 72e-9, output: 288e-9, cache_read: 72e-9, cache_write: 72e-9 },
    { provider: "aws.bedrock", model: "us-gov.nvidia.nemotron-nano-9b-v2", input: 72e-9, output: 276e-9, cache_read: 72e-9, cache_write: 72e-9 },
    { provider: "aws.bedrock", model: "us-gov.nvidia.nemotron-super-3-120b", input: 18e-8, output: 78e-8, cache_read: 18e-8, cache_write: 18e-8 },
    { provider: "aws.bedrock", model: "us-gov.openai.gpt-oss-120b-1:0", input: 18e-8, output: 72e-8, cache_read: 18e-8, cache_write: 18e-8 },
    { provider: "aws.bedrock", model: "us-gov.openai.gpt-oss-20b-1:0", input: 84e-9, output: 36e-8, cache_read: 84e-9, cache_write: 84e-9 },
    { provider: "aws.bedrock", model: "us-gov.xai.grok-4.6", input: 264e-8, output: 792e-8, cache_read: 66e-8, cache_write: 264e-8 },
    { provider: "aws.bedrock", model: "us.amazon.nova-2-lite-v1:0", input: 33e-8, output: 275e-8, cache_read: 825e-10, cache_write: 33e-8 },
    { provider: "aws.bedrock", model: "us.amazon.nova-2-pro-preview-20251202-v1:0", input: 1375e-9, output: 11e-6, cache_read: 34375e-11, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "us.amazon.nova-lite-v1:0", input: 6e-8, output: 24e-8, cache_read: 15e-9, cache_write: 6e-8 },
    { provider: "aws.bedrock", model: "us.amazon.nova-micro-v1:0", input: 35e-9, output: 14e-8, cache_read: 875e-11, cache_write: 35e-9 },
    { provider: "aws.bedrock", model: "us.amazon.nova-pro-v1:0", input: 8e-7, output: 32e-7, cache_read: 2e-7, cache_write: 8e-7 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-3-5-haiku-20241022-v1:0", input: 8e-7, output: 4e-6, cache_read: 8e-8, cache_write: 1e-6 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-3-5-sonnet-20240620-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-3-opus-20240229-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-fable-5", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-fable-5-1", input: 11e-6, output: 55e-6, cache_read: 275e-9, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-haiku-4-5-20251001-v1:0", input: 11e-7, output: 55e-7, cache_read: 11e-8, cache_write: 1375e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-haiku-5-5", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-mythos-5", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-mythos-5-1", input: 11e-6, output: 55e-6, cache_read: 275e-9, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-mythos-preview", input: 275e-7, output: 1375e-7, cache_read: 275e-8, cache_write: 34375e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-1-20250805-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-20250514-v1:0", input: 15e-6, output: 75e-6, cache_read: 15e-7, cache_write: 1875e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-5-20251101-v1:0", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-6-v1", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-7", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-4-8", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-5", input: 55e-7, output: 275e-7, cache_read: 55e-8, cache_write: 6875e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-opus-5-5", input: 44e-7, output: 22e-6, cache_read: 22e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-sonnet-4-20250514-v1:0", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-sonnet-4-5-20250929-v1:0", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-sonnet-4-6", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-sonnet-5", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.anthropic.claude-sonnet-5-5", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.cohere.embed-v4:0", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "aws.bedrock", model: "us.deepseek.r1-v1:0", input: 135e-8, output: 54e-7, cache_read: 135e-8, cache_write: 135e-8 },
    { provider: "aws.bedrock", model: "us.deepseek.v3.2", input: 62e-8, output: 185e-8, cache_read: 62e-8, cache_write: 62e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-1-405b-instruct-v1:0", input: 24e-7, output: 24e-7, cache_read: 24e-7, cache_write: 24e-7 },
    { provider: "aws.bedrock", model: "us.meta.llama3-1-70b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-1-8b-instruct-v1:0", input: 22e-8, output: 22e-8, cache_read: 22e-8, cache_write: 22e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-2-11b-instruct-v1:0", input: 16e-8, output: 16e-8, cache_read: 16e-8, cache_write: 16e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-2-1b-instruct-v1:0", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "aws.bedrock", model: "us.meta.llama3-2-3b-instruct-v1:0", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-2-90b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama3-3-70b-instruct-v1:0", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama4-maverick-17b-instruct-v1:0", input: 24e-8, output: 97e-8, cache_read: 24e-8, cache_write: 24e-8 },
    { provider: "aws.bedrock", model: "us.meta.llama4-scout-17b-instruct-v1:0", input: 17e-8, output: 66e-8, cache_read: 17e-8, cache_write: 17e-8 },
    { provider: "aws.bedrock", model: "us.mistral.pixtral-large-2502-v1:0", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "aws.bedrock", model: "us.moonshotai.kimi-k3", input: 33e-7, output: 165e-7, cache_read: 33e-8, cache_write: 4125e-9 },
    { provider: "aws.bedrock", model: "us.openai.gpt-5.4", input: 275e-8, output: 165e-7, cache_read: 275e-9, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.openai.gpt-5.5", input: 55e-7, output: 33e-6, cache_read: 55e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "us.openai.gpt-5.6-luna", input: 22e-8, output: 132e-8, cache_read: 22e-9, cache_write: 275e-9 },
    { provider: "aws.bedrock", model: "us.openai.gpt-5.6-sol", input: 44e-7, output: 22e-6, cache_read: 44e-8, cache_write: 55e-7 },
    { provider: "aws.bedrock", model: "us.openai.gpt-5.6-terra", input: 22e-7, output: 132e-7, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.openai.gpt-6-astra", input: 11e-6, output: 55e-6, cache_read: 11e-7, cache_write: 1375e-8 },
    { provider: "aws.bedrock", model: "us.openai.gpt-6-luna", input: 11e-8, output: 55e-8, cache_read: 11e-9, cache_write: 1375e-10 },
    { provider: "aws.bedrock", model: "us.openai.gpt-6-sol", input: 22e-7, output: 11e-6, cache_read: 22e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.openai.gpt-6.1-sol", input: 22e-7, output: 11e-6, cache_read: 11e-8, cache_write: 275e-8 },
    { provider: "aws.bedrock", model: "us.writer.palmyra-x4-v1:0", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "us.writer.palmyra-x5-v1:0", input: 6e-7, output: 6e-6, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "us.xai.grok-4.6", input: 22e-7, output: 66e-7, cache_read: 55e-8, cache_write: 22e-7 },
    { provider: "aws.bedrock", model: "us.xai.grok-4.7", input: 22e-7, output: 66e-7, cache_read: 55e-8, cache_write: 22e-7 },
    { provider: "aws.bedrock", model: "us.zai.glm-5.3", input: 1848e-9, output: 5808e-9, cache_read: 3432e-10, cache_write: 231e-8 },
    { provider: "aws.bedrock", model: "writer.palmyra-vision-7b", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "aws.bedrock", model: "writer.palmyra-x4-v1:0", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "aws.bedrock", model: "writer.palmyra-x5-v1:0", input: 6e-7, output: 6e-6, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "zai.glm-4.7", input: 6e-7, output: 22e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "aws.bedrock", model: "zai.glm-4.7-flash", input: 7e-8, output: 4e-7, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "aws.bedrock", model: "zai.glm-5", input: 1e-6, output: 32e-7, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "azure.ai.inference", model: "Codestral-2501", input: 3e-7, output: 9e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "azure.ai.inference", model: "Cohere-Embed-V5-Fast", input: 8e-8, output: 0, cache_read: 8e-8, cache_write: 8e-8 },
    { provider: "azure.ai.inference", model: "Cohere-Embed-V5-Pro", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "azure.ai.inference", model: "Cohere-command-a-plus-05-2026", input: 8e-7, output: 32e-7, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "azure.ai.inference", model: "Cohere-embed-v3-english", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "azure.ai.inference", model: "Cohere-embed-v3-multilingual", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "azure.ai.inference", model: "DeepSeek-V4-Flash-0731", input: 44e-8, output: 132e-8, cache_read: 14e-9, cache_write: 44e-8 },
    { provider: "azure.ai.inference", model: "FW-DeepSeek-V3.2", input: 62e-8, output: 185e-8, cache_read: 31e-8, cache_write: 62e-8 },
    { provider: "azure.ai.inference", model: "FW-DeepSeek-V4-Flash", input: 15e-8, output: 31e-8, cache_read: 3e-8, cache_write: 15e-8 },
    { provider: "azure.ai.inference", model: "FW-DeepSeek-V4-Pro", input: 1925e-9, output: 3828e-9, cache_read: 165e-9, cache_write: 1925e-9 },
    { provider: "azure.ai.inference", model: "FW-DeepSeek-V4.1-Flash", input: 375e-9, output: 15e-7, cache_read: 8e-9, cache_write: 375e-9 },
    { provider: "azure.ai.inference", model: "FW-GLM-5", input: 11e-7, output: 352e-8, cache_read: 22e-8, cache_write: 11e-7 },
    { provider: "azure.ai.inference", model: "FW-GLM-5.1", input: 154e-8, output: 484e-8, cache_read: 286e-9, cache_write: 154e-8 },
    { provider: "azure.ai.inference", model: "FW-GLM-5.2", input: 154e-8, output: 484e-8, cache_read: 15e-8, cache_write: 154e-8 },
    { provider: "azure.ai.inference", model: "FW-GLM-5.2-Fast", input: 231e-8, output: 726e-8, cache_read: 231e-9, cache_write: 231e-8 },
    { provider: "azure.ai.inference", model: "FW-GLM-5.3", input: 175e-8, output: 55e-7, cache_read: 325e-9, cache_write: 175e-8 },
    { provider: "azure.ai.inference", model: "FW-GLM-5.3-Flash", input: 188e-9, output: 625e-9, cache_read: 38e-9, cache_write: 188e-9 },
    { provider: "azure.ai.inference", model: "FW-GPT-OSS-120B", input: 165e-9, output: 66e-8, cache_read: 82e-9, cache_write: 165e-9 },
    { provider: "azure.ai.inference", model: "FW-Inkling", input: 11e-7, output: 446e-8, cache_read: 19e-8, cache_write: 11e-7 },
    { provider: "azure.ai.inference", model: "FW-Kimi-K2.5", input: 66e-8, output: 33e-7, cache_read: 11e-8, cache_write: 66e-8 },
    { provider: "azure.ai.inference", model: "FW-Kimi-K2.6", input: 1045e-9, output: 44e-7, cache_read: 176e-9, cache_write: 1045e-9 },
    { provider: "azure.ai.inference", model: "FW-Kimi-K2.7-Code", input: 105e-8, output: 44e-7, cache_read: 21e-8, cache_write: 105e-8 },
    { provider: "azure.ai.inference", model: "FW-Kimi-K3", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 3e-6 },
    { provider: "azure.ai.inference", model: "FW-MiniMax-M2.5", input: 33e-8, output: 132e-8, cache_read: 33e-9, cache_write: 33e-8 },
    { provider: "azure.ai.inference", model: "FW-MiniMax-M3", input: 33e-8, output: 132e-8, cache_read: 66e-9, cache_write: 33e-8 },
    { provider: "azure.ai.inference", model: "FW-Nemotron-3-Ultra-NVFP4", input: 66e-8, output: 264e-8, cache_read: 13e-8, cache_write: 66e-8 },
    { provider: "azure.ai.inference", model: "FW-Nemotron-Lightning-3.5-30B-A3B", input: 6e-8, output: 22e-8, cache_read: 1e-8, cache_write: 6e-8 },
    { provider: "azure.ai.inference", model: "Llama-3.3-70B-Instruct", input: 71e-8, output: 71e-8, cache_read: 71e-8, cache_write: 71e-8 },
    { provider: "azure.ai.inference", model: "Llama-4-Maverick-17B-128E-Instruct-FP8", input: 25e-8, output: 1e-6, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "azure.ai.inference", model: "Llama-4-Scout-17B-16E-Instruct", input: 2e-7, output: 78e-8, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "MAI-Code-1.1-Flash", input: 2e-7, output: 12e-7, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "MAI-Cyber-1-Flash", input: 6e-7, output: 35e-7, cache_read: 6e-8, cache_write: 6e-7 },
    { provider: "azure.ai.inference", model: "MAI-DS-R1", input: 135e-8, output: 54e-7, cache_read: 135e-8, cache_write: 135e-8 },
    { provider: "azure.ai.inference", model: "MAI-Thinking-1", input: 2e-6, output: 8e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "azure.ai.inference", model: "Meta-Llama-3-70B-Instruct", input: 11e-7, output: 37e-8, cache_read: 11e-7, cache_write: 11e-7 },
    { provider: "azure.ai.inference", model: "Meta-Llama-3.1-70B-Instruct", input: 268e-8, output: 354e-8, cache_read: 268e-8, cache_write: 268e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-medium-128k-instruct", input: 17e-8, output: 68e-8, cache_read: 17e-8, cache_write: 17e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-medium-4k-instruct", input: 17e-8, output: 68e-8, cache_read: 17e-8, cache_write: 17e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-mini-128k-instruct", input: 13e-8, output: 52e-8, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-mini-4k-instruct", input: 13e-8, output: 52e-8, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-small-128k-instruct", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "azure.ai.inference", model: "Phi-3-small-8k-instruct", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "azure.ai.inference", model: "Phi-3.5-MoE-instruct", input: 16e-8, output: 64e-8, cache_read: 16e-8, cache_write: 16e-8 },
    { provider: "azure.ai.inference", model: "Phi-3.5-mini-instruct", input: 13e-8, output: 52e-8, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "azure.ai.inference", model: "Phi-3.5-vision-instruct", input: 13e-8, output: 52e-8, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "azure.ai.inference", model: "Phi-4", input: 125e-9, output: 5e-7, cache_read: 125e-9, cache_write: 125e-9 },
    { provider: "azure.ai.inference", model: "Phi-4-mini-instruct", input: 75e-9, output: 3e-7, cache_read: 75e-9, cache_write: 75e-9 },
    { provider: "azure.ai.inference", model: "Phi-4-mini-reasoning", input: 75e-9, output: 3e-7, cache_read: 75e-9, cache_write: 75e-9 },
    { provider: "azure.ai.inference", model: "Phi-4-multimodal-instruct", input: 8e-8, output: 32e-8, cache_read: 8e-8, cache_write: 8e-8 },
    { provider: "azure.ai.inference", model: "Phi-4-reasoning", input: 125e-9, output: 5e-7, cache_read: 125e-9, cache_write: 125e-9 },
    { provider: "azure.ai.inference", model: "claude-fable-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "azure.ai.inference", model: "claude-fable-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "azure.ai.inference", model: "claude-haiku-4-5", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "azure.ai.inference", model: "claude-haiku-5-5", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "azure.ai.inference", model: "claude-opus-4-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "azure.ai.inference", model: "claude-opus-4-6", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "azure.ai.inference", model: "claude-opus-4-7", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "azure.ai.inference", model: "claude-opus-4-8", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "azure.ai.inference", model: "claude-opus-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "azure.ai.inference", model: "claude-opus-5-5", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "azure.ai.inference", model: "claude-opus-5-5-fast", input: 8e-6, output: 4e-5, cache_read: 4e-7, cache_write: 1e-5 },
    { provider: "azure.ai.inference", model: "claude-sonnet-4-5", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "azure.ai.inference", model: "claude-sonnet-4-6", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "azure.ai.inference", model: "claude-sonnet-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "claude-sonnet-5-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "codex-mini", input: 15e-7, output: 6e-6, cache_read: 375e-9, cache_write: 15e-7 },
    { provider: "azure.ai.inference", model: "cohere-command-a", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "deepseek-r1", input: 135e-8, output: 54e-7, cache_read: 135e-8, cache_write: 135e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v3", input: 114e-8, output: 456e-8, cache_read: 114e-8, cache_write: 114e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v3-0324", input: 114e-8, output: 456e-8, cache_read: 114e-8, cache_write: 114e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v3.1", input: 123e-8, output: 494e-8, cache_read: 123e-8, cache_write: 123e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v3.2", input: 58e-8, output: 168e-8, cache_read: 58e-8, cache_write: 58e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v3.2-speciale", input: 58e-8, output: 168e-8, cache_read: 58e-8, cache_write: 58e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v4-flash", input: 19e-8, output: 51e-8, cache_read: 28e-9, cache_write: 19e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v4-pro", input: 174e-8, output: 348e-8, cache_read: 145e-9, cache_write: 174e-8 },
    { provider: "azure.ai.inference", model: "deepseek-v4.1-flash", input: 3e-7, output: 12e-7, cache_read: 6e-9, cache_write: 3e-7 },
    { provider: "azure.ai.inference", model: "embed-v-4-0", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "azure.ai.inference", model: "gpt-5.4", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "gpt-5.4-2026-03-05", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "gpt-5.4-mini", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "azure.ai.inference", model: "gpt-5.4-mini-2026-03-17", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "azure.ai.inference", model: "gpt-5.4-nano", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "gpt-5.4-nano-2026-03-17", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "gpt-5.4-pro", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.inference", model: "gpt-5.4-pro-2026-03-05", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.inference", model: "gpt-5.5", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.inference", model: "gpt-5.5-2026-04-23", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.inference", model: "gpt-5.5-2026-04-24", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.inference", model: "gpt-6-astra", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "azure.ai.inference", model: "gpt-6-luna", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "azure.ai.inference", model: "gpt-6-sol", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "gpt-6.1-sol", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "azure.ai.inference", model: "gpt-chat-latest", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.inference", model: "gpt-oss-120b", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "azure.ai.inference", model: "grok-3", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.inference", model: "grok-3-mini", input: 25e-8, output: 127e-8, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "azure.ai.inference", model: "grok-4", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.inference", model: "grok-4-1-fast-non-reasoning", input: 2e-7, output: 5e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "grok-4-1-fast-reasoning", input: 2e-7, output: 5e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "grok-4-20-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 125e-8, cache_write: 125e-8 },
    { provider: "azure.ai.inference", model: "grok-4-20-reasoning", input: 125e-8, output: 25e-7, cache_read: 125e-8, cache_write: 125e-8 },
    { provider: "azure.ai.inference", model: "grok-4-fast-non-reasoning", input: 2e-7, output: 5e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "grok-4-fast-reasoning", input: 2e-7, output: 5e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "grok-4.3", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "azure.ai.inference", model: "grok-4.6", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.inference", model: "grok-4.7", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.inference", model: "grok-code-fast-1", input: 2e-7, output: 15e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "azure.ai.inference", model: "jamba-instruct", input: 5e-7, output: 7e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "azure.ai.inference", model: "kimi-k2-thinking", input: 6e-7, output: 25e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "azure.ai.inference", model: "kimi-k2.5", input: 6e-7, output: 3e-6, cache_read: 1e-7, cache_write: 6e-7 },
    { provider: "azure.ai.inference", model: "kimi-k2.6", input: 95e-8, output: 4e-6, cache_read: 16e-8, cache_write: 95e-8 },
    { provider: "azure.ai.inference", model: "kimi-k2.7-code", input: 95e-8, output: 4e-6, cache_read: 19e-8, cache_write: 95e-8 },
    { provider: "azure.ai.inference", model: "ministral-3b", input: 4e-8, output: 4e-8, cache_read: 4e-8, cache_write: 4e-8 },
    { provider: "azure.ai.inference", model: "mistral-large", input: 4e-6, output: 12e-6, cache_read: 4e-6, cache_write: 4e-6 },
    { provider: "azure.ai.inference", model: "mistral-large-2407", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "azure.ai.inference", model: "mistral-large-3", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "azure.ai.inference", model: "mistral-large-latest", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "azure.ai.inference", model: "mistral-medium-2505", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "azure.ai.inference", model: "mistral-medium-3-5", input: 15e-7, output: 75e-7, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "azure.ai.inference", model: "mistral-nemo", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "azure.ai.inference", model: "mistral-small", input: 1e-6, output: 3e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "azure.ai.inference", model: "mistral-small-2503", input: 1e-7, output: 3e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "azure.ai.inference", model: "model-router", input: 14e-8, output: 0, cache_read: 14e-8, cache_write: 14e-8 },
    { provider: "azure.ai.inference", model: "model_router", input: 14e-8, output: 0, cache_read: 14e-8, cache_write: 14e-8 },
    { provider: "azure.ai.openai", model: "ada", input: 11e-8, output: 0, cache_read: 11e-8, cache_write: 11e-8 },
    { provider: "azure.ai.openai", model: "chat-latest", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "codex-mini", input: 15e-7, output: 6e-6, cache_read: 375e-9, cache_write: 15e-7 },
    { provider: "azure.ai.openai", model: "command-r-plus", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.openai", model: "computer-use-preview", input: 3e-6, output: 12e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.openai", model: "gpt-3.5-turbo", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "azure.ai.openai", model: "gpt-3.5-turbo-instruct-0914", input: 165e-8, output: 22e-7, cache_read: 165e-8, cache_write: 165e-8 },
    { provider: "azure.ai.openai", model: "gpt-35-turbo", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "azure.ai.openai", model: "gpt-35-turbo-16k", input: 3e-6, output: 4e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.openai", model: "gpt-35-turbo-16k-0613", input: 3e-6, output: 4e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "azure.ai.openai", model: "gpt-35-turbo-instruct", input: 165e-8, output: 22e-7, cache_read: 165e-8, cache_write: 165e-8 },
    { provider: "azure.ai.openai", model: "gpt-35-turbo-instruct-0914", input: 165e-8, output: 22e-7, cache_read: 165e-8, cache_write: 165e-8 },
    { provider: "azure.ai.openai", model: "gpt-4", input: 3e-5, output: 6e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-0125-preview", input: 1e-5, output: 3e-5, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-0613", input: 3e-5, output: 6e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-1106-preview", input: 1e-5, output: 3e-5, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-32k", input: 6e-5, output: 12e-5, cache_read: 6e-5, cache_write: 6e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-32k-0613", input: 6e-5, output: 12e-5, cache_read: 6e-5, cache_write: 6e-5 },
    { provider: "azure.ai.openai", model: "gpt-4-turbo", input: 11e-6, output: 33e-6, cache_read: 11e-6, cache_write: 11e-6 },
    { provider: "azure.ai.openai", model: "gpt-4-turbo-2024-04-09", input: 11e-6, output: 33e-6, cache_read: 11e-6, cache_write: 11e-6 },
    { provider: "azure.ai.openai", model: "gpt-4-turbo-vision-preview", input: 11e-6, output: 33e-6, cache_read: 11e-6, cache_write: 11e-6 },
    { provider: "azure.ai.openai", model: "gpt-4.1", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.openai", model: "gpt-4.1-2025-04-14", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.openai", model: "gpt-4.1-mini", input: 4e-7, output: 16e-7, cache_read: 1e-7, cache_write: 4e-7 },
    { provider: "azure.ai.openai", model: "gpt-4.1-mini-2025-04-14", input: 4e-7, output: 16e-7, cache_read: 1e-7, cache_write: 4e-7 },
    { provider: "azure.ai.openai", model: "gpt-4.1-nano", input: 1e-7, output: 4e-7, cache_read: 25e-9, cache_write: 1e-7 },
    { provider: "azure.ai.openai", model: "gpt-4.1-nano-2025-04-14", input: 1e-7, output: 4e-7, cache_read: 25e-9, cache_write: 1e-7 },
    { provider: "azure.ai.openai", model: "gpt-4.5-preview", input: 75e-6, output: 15e-5, cache_read: 375e-7, cache_write: 75e-6 },
    { provider: "azure.ai.openai", model: "gpt-4o", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-4o-2024-05-13", input: 5e-6, output: 15e-6, cache_read: 5e-6, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-4o-2024-08-06", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-4o-2024-11-20", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-4o-audio-preview-2024-12-17", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-4o-mini", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "azure.ai.openai", model: "gpt-4o-mini-2024-07-18", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "azure.ai.openai", model: "gpt-4o-mini-audio-preview-2024-12-17", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "azure.ai.openai", model: "gpt-5", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-2025-08-07", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-chat", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-codex", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-mini", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-mini-2025-08-07", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-nano", input: 5e-8, output: 4e-7, cache_read: 5e-9, cache_write: 5e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-nano-2025-08-07", input: 5e-8, output: 4e-7, cache_read: 5e-9, cache_write: 5e-8 },
    { provider: "azure.ai.openai", model: "gpt-5-pro", input: 15e-6, output: 12e-5, cache_read: 15e-6, cache_write: 15e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.1", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-2025-11-13", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-chat", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-codex", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-codex-2025-11-13", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-codex-max", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-codex-mini", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.1-codex-mini-2025-11-13", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.2", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.2-2025-12-11", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.2-chat", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.2-codex", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.2-pro", input: 21e-6, output: 168e-6, cache_read: 21e-6, cache_write: 21e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.2-pro-2025-12-11", input: 21e-6, output: 168e-6, cache_read: 21e-6, cache_write: 21e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.3-chat", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.3-codex", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.4", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-5.4-2026-03-05", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-5.4-mini", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.4-mini-2026-03-17", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.4-nano", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "azure.ai.openai", model: "gpt-5.4-nano-2026-03-17", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "azure.ai.openai", model: "gpt-5.4-pro", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-5.4-pro-2026-03-05", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-5.5", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.5-2026-04-23", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.5-2026-04-24", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.5-pro", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-5.5-pro-2026-04-23", input: 3e-5, output: 18e-5, cache_read: 3e-6, cache_write: 3e-5 },
    { provider: "azure.ai.openai", model: "gpt-5.6", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.6-luna", input: 2e-7, output: 12e-7, cache_read: 2e-8, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.6-luna-2026-07-09", input: 2e-7, output: 12e-7, cache_read: 2e-8, cache_write: 25e-8 },
    { provider: "azure.ai.openai", model: "gpt-5.6-sol", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.6-sol-2026-07-09", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "gpt-5.6-terra", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-5.6-terra-2026-07-09", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-6-astra", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "azure.ai.openai", model: "gpt-6-astra-2026-09-03", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "azure.ai.openai", model: "gpt-6-luna", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "azure.ai.openai", model: "gpt-6-luna-2026-09-22", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "azure.ai.openai", model: "gpt-6-sol", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-6-sol-2026-09-22", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-6.1-sol", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-6.1-sol-2026-09-29", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio-1.5", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio-1.5-2026-02-23", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio-2025-08-28", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio-mini", input: 6e-7, output: 24e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "azure.ai.openai", model: "gpt-audio-mini-2025-10-06", input: 6e-7, output: 24e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "azure.ai.openai", model: "gpt-chat-latest", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "azure.ai.openai", model: "mistral-large-2402", input: 8e-6, output: 24e-6, cache_read: 8e-6, cache_write: 8e-6 },
    { provider: "azure.ai.openai", model: "mistral-large-latest", input: 8e-6, output: 24e-6, cache_read: 8e-6, cache_write: 8e-6 },
    { provider: "azure.ai.openai", model: "model-router", input: 14e-8, output: 0, cache_read: 14e-8, cache_write: 14e-8 },
    { provider: "azure.ai.openai", model: "o1", input: 15e-6, output: 6e-5, cache_read: 75e-7, cache_write: 15e-6 },
    { provider: "azure.ai.openai", model: "o1-2024-12-17", input: 15e-6, output: 6e-5, cache_read: 75e-7, cache_write: 15e-6 },
    { provider: "azure.ai.openai", model: "o1-mini", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "o1-mini-2024-09-12", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "o3", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.openai", model: "o3-2025-04-16", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "azure.ai.openai", model: "o3-deep-research", input: 1e-5, output: 4e-5, cache_read: 25e-7, cache_write: 1e-5 },
    { provider: "azure.ai.openai", model: "o3-mini", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "o3-mini-2025-01-31", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "o3-pro", input: 2e-5, output: 8e-5, cache_read: 2e-5, cache_write: 2e-5 },
    { provider: "azure.ai.openai", model: "o3-pro-2025-06-10", input: 2e-5, output: 8e-5, cache_read: 2e-5, cache_write: 2e-5 },
    { provider: "azure.ai.openai", model: "o4-mini", input: 11e-7, output: 44e-7, cache_read: 275e-9, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "o4-mini-2025-04-16", input: 11e-7, output: 44e-7, cache_read: 275e-9, cache_write: 11e-7 },
    { provider: "azure.ai.openai", model: "text-embedding-3-large", input: 143e-9, output: 0, cache_read: 143e-9, cache_write: 143e-9 },
    { provider: "azure.ai.openai", model: "text-embedding-3-small", input: 22e-9, output: 0, cache_read: 22e-9, cache_write: 22e-9 },
    { provider: "azure.ai.openai", model: "text-embedding-ada-002", input: 11e-8, output: 0, cache_read: 11e-8, cache_write: 11e-8 },
    { provider: "cohere", model: "c4ai-aya-expanse-32b", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "cohere", model: "command-a-03-2025", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "cohere", model: "command-nightly", input: 1e-6, output: 2e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "cohere", model: "command-r-08-2024", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "cohere", model: "command-r-plus-08-2024", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "cohere", model: "command-r7b-12-2024", input: 375e-10, output: 15e-8, cache_read: 375e-10, cache_write: 375e-10 },
    { provider: "cohere", model: "embed-english-light-v3.0", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "cohere", model: "embed-english-v3.0", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "cohere", model: "embed-multilingual-v3.0", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "cohere", model: "embed-v4.0", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "cohere", model: "embed-v5.0-fast", input: 8e-8, output: 0, cache_read: 8e-8, cache_write: 8e-8 },
    { provider: "cohere", model: "embed-v5.0-pro", input: 12e-8, output: 0, cache_read: 12e-8, cache_write: 12e-8 },
    { provider: "deepseek", model: "deepseek-chat", input: 28e-8, output: 42e-8, cache_read: 28e-9, cache_write: 0 },
    { provider: "deepseek", model: "deepseek-coder", input: 14e-8, output: 28e-8, cache_read: 14e-9, cache_write: 14e-8 },
    { provider: "deepseek", model: "deepseek-flash", input: 3e-7, output: 12e-7, cache_read: 6e-9, cache_write: 0 },
    { provider: "deepseek", model: "deepseek-r1", input: 55e-8, output: 219e-8, cache_read: 14e-8, cache_write: 55e-8 },
    { provider: "deepseek", model: "deepseek-reasoner", input: 28e-8, output: 42e-8, cache_read: 28e-9, cache_write: 28e-8 },
    { provider: "deepseek", model: "deepseek-v3", input: 27e-8, output: 11e-7, cache_read: 7e-8, cache_write: 0 },
    { provider: "deepseek", model: "deepseek-v3.2", input: 28e-8, output: 4e-7, cache_read: 28e-9, cache_write: 28e-8 },
    { provider: "deepseek", model: "deepseek-v4-flash", input: 3e-7, output: 12e-7, cache_read: 6e-9, cache_write: 0 },
    { provider: "deepseek", model: "deepseek-v4-flash-vision-exp", input: 3e-7, output: 12e-7, cache_read: 6e-9, cache_write: 0 },
    { provider: "deepseek", model: "deepseek-v4-pro", input: 132e-8, output: 396e-8, cache_read: 44e-9, cache_write: 0 },
    { provider: "gcp.gemini", model: "deep-research-max-preview-04-2026", input: 2e-6, output: 12e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "deep-research-preview-04-2026", input: 2e-6, output: 12e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "deep-research-pro-preview-12-2025", input: 2e-6, output: 12e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "gemini-2.5-computer-use-preview-10-2025", input: 125e-8, output: 1e-5, cache_read: 125e-8, cache_write: 125e-8 },
    { provider: "gcp.gemini", model: "gemini-2.5-flash", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.gemini", model: "gemini-2.5-flash-lite", input: 1e-7, output: 4e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "gcp.gemini", model: "gemini-2.5-pro", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "gcp.gemini", model: "gemini-2.5-pro-preview-tts", input: 1e-6, output: 2e-5, cache_read: 125e-9, cache_write: 1e-6 },
    { provider: "gcp.gemini", model: "gemini-3-flash-preview", input: 5e-7, output: 3e-6, cache_read: 5e-8, cache_write: 5e-7 },
    { provider: "gcp.gemini", model: "gemini-3.1-flash-lite", input: 25e-8, output: 15e-7, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "gcp.gemini", model: "gemini-3.1-flash-lite-preview", input: 25e-8, output: 15e-7, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "gcp.gemini", model: "gemini-3.1-pro-preview", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "gemini-3.1-pro-preview-customtools", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "gemini-3.5-flash", input: 15e-7, output: 9e-6, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "gcp.gemini", model: "gemini-3.5-flash-lite", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.gemini", model: "gemini-3.6-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.gemini", model: "gemini-3.7-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.gemini", model: "gemini-3.8-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.gemini", model: "gemini-4-argon", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "gemini-embedding-001", input: 15e-8, output: 0, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.gemini", model: "gemini-embedding-2", input: 2e-7, output: 0, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.gemini", model: "gemini-embedding-2-preview", input: 2e-7, output: 0, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.gemini", model: "gemini-exp-1206", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.gemini", model: "gemini-flash-latest", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.gemini", model: "gemini-flash-lite-latest", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.gemini", model: "gemini-gemma-2-27b-it", input: 35e-8, output: 105e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "gcp.gemini", model: "gemini-gemma-2-9b-it", input: 35e-8, output: 105e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "gcp.gemini", model: "gemini-omni-1.1-flash", input: 15e-7, output: 9e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "gcp.gemini", model: "gemini-omni-flash-preview", input: 15e-7, output: 9e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "gcp.gemini", model: "gemini-pro-latest", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.gemini", model: "gemini-robotics-er-2-preview", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 1e-6 },
    { provider: "gcp.gemini", model: "gemini-robotics-er-2-streaming-preview", input: 1e-6, output: 5e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-5-haiku", input: 1e-6, output: 5e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-5-haiku@20241022", input: 1e-6, output: 5e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-5-sonnet", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-5-sonnet@20240620", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-haiku", input: 25e-8, output: 125e-8, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "claude-3-haiku@20240307", input: 25e-8, output: 125e-8, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "claude-3-opus", input: 15e-6, output: 75e-6, cache_read: 15e-6, cache_write: 15e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-opus@20240229", input: 15e-6, output: 75e-6, cache_read: 15e-6, cache_write: 15e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-sonnet", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "gcp.vertex_ai", model: "claude-3-sonnet@20240229", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "gcp.vertex_ai", model: "claude-fable-5", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "gcp.vertex_ai", model: "claude-fable-5-1", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "gcp.vertex_ai", model: "claude-fable-5-1@default", input: 1e-5, output: 5e-5, cache_read: 25e-8, cache_write: 125e-7 },
    { provider: "gcp.vertex_ai", model: "claude-fable-5@default", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "gcp.vertex_ai", model: "claude-haiku-4-5", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "claude-haiku-4-5@20251001", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "claude-haiku-5-5", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "gcp.vertex_ai", model: "claude-haiku-5-5@default", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-5@20251101", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-6", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-6@default", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-7", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-7@default", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-8", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-4-8@default", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-5", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-opus-5-5", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "gcp.vertex_ai", model: "claude-opus-5-5@default", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 5e-6 },
    { provider: "gcp.vertex_ai", model: "claude-opus-5@default", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 625e-8 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-4-5", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-4-5@20250929", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-4-6", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-4-6@default", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 375e-8 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-5", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-5-5", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-5-5@default", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "gcp.vertex_ai", model: "claude-sonnet-5@default", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "gcp.vertex_ai", model: "codestral-2", input: 3e-7, output: 9e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "codestral-2501", input: 2e-7, output: 6e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "codestral-2@001", input: 3e-7, output: 9e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "codestral@2405", input: 2e-7, output: 6e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "codestral@latest", input: 2e-7, output: 6e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "deep-research-pro-preview-12-2025", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "deepseek-ai/deepseek-r1-0528-maas", input: 135e-8, output: 54e-7, cache_read: 135e-8, cache_write: 135e-8 },
    { provider: "gcp.vertex_ai", model: "deepseek-ai/deepseek-v3.1-maas", input: 6e-7, output: 17e-7, cache_read: 6e-8, cache_write: 6e-7 },
    { provider: "gcp.vertex_ai", model: "deepseek-ai/deepseek-v3.2-maas", input: 56e-8, output: 168e-8, cache_read: 56e-9, cache_write: 56e-8 },
    { provider: "gcp.vertex_ai", model: "deepseek-ai/deepseek-v4.1-flash-maas", input: 3e-7, output: 12e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-2.0-flash", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-2.0-flash-lite", input: 75e-9, output: 3e-7, cache_read: 75e-9, cache_write: 75e-9 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-computer-use-preview-10-2025", input: 125e-8, output: 1e-5, cache_read: 125e-8, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-flash", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-flash-lite", input: 1e-7, output: 4e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-flash-lite-preview-09-2025", input: 1e-7, output: 4e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-flash-preview-09-2025", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-pro", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-2.5-pro-preview-tts", input: 1e-6, output: 2e-5, cache_read: 125e-9, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-3-flash-preview", input: 5e-7, output: 3e-6, cache_read: 5e-8, cache_write: 5e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-3-pro-preview", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-3.1-flash-lite", input: 25e-8, output: 15e-7, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-3.1-flash-lite-preview", input: 25e-8, output: 15e-7, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-3.1-pro-preview", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-3.1-pro-preview-customtools", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-3.5-flash", input: 15e-7, output: 9e-6, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-3.5-flash-lite", input: 3e-7, output: 25e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-3.6-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-3.7-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-3.8-flash", input: 75e-8, output: 375e-8, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-3.8-flash-cyber", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-4-argon", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-4-argon-cyber-permissive", input: 4e-6, output: 2e-5, cache_read: 2e-7, cache_write: 4e-6 },
    { provider: "gcp.vertex_ai", model: "gemini-embedding-001", input: 15e-8, output: 0, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "gemini-embedding-2", input: 2e-7, output: 0, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-embedding-2-preview", input: 2e-7, output: 0, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-omni-1.1-flash", input: 15e-7, output: 9e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-omni-1.1-flash-preview", input: 15e-7, output: 9e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-omni-flash-preview", input: 15e-7, output: 9e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-robotics-er-1.5-preview", input: 3e-7, output: 25e-7, cache_read: 0, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "gemini-robotics-er-2-preview", input: 1e-6, output: 5e-6, cache_read: 1e-7, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "gemma-4-26b-a4b-it", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "google/gemma-4-26b-a4b-it-maas", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "jamba-1.5", input: 2e-7, output: 4e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "jamba-1.5-large", input: 2e-6, output: 8e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "jamba-1.5-large@001", input: 2e-6, output: 8e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "jamba-1.5-mini", input: 2e-7, output: 4e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "jamba-1.5-mini@001", input: 2e-7, output: 4e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "meta/llama-3.1-405b-instruct-maas", input: 5e-6, output: 16e-6, cache_read: 5e-6, cache_write: 5e-6 },
    { provider: "gcp.vertex_ai", model: "meta/llama-3.3-70b-instruct-maas", input: 72e-8, output: 72e-8, cache_read: 72e-8, cache_write: 72e-8 },
    { provider: "gcp.vertex_ai", model: "meta/llama-4-maverick-17b-128e-instruct-maas", input: 35e-8, output: 115e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "gcp.vertex_ai", model: "meta/llama-4-maverick-17b-16e-instruct-maas", input: 35e-8, output: 115e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "gcp.vertex_ai", model: "meta/llama-4-scout-17b-128e-instruct-maas", input: 25e-8, output: 7e-7, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "meta/llama-4-scout-17b-16e-instruct-maas", input: 25e-8, output: 7e-7, cache_read: 25e-8, cache_write: 25e-8 },
    { provider: "gcp.vertex_ai", model: "minimaxai/minimax-m2-maas", input: 3e-7, output: 12e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "mistral-large-2411", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "mistral-large@2407", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "mistral-large@2411-001", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "mistral-large@latest", input: 2e-6, output: 6e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "mistral-medium-3", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "gcp.vertex_ai", model: "mistral-medium-3@001", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "gcp.vertex_ai", model: "mistral-nemo@2407", input: 3e-6, output: 3e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "gcp.vertex_ai", model: "mistral-nemo@latest", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "mistral-small-2503", input: 1e-7, output: 3e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "mistral-small-2503@001", input: 1e-7, output: 3e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "mistralai/codestral-2", input: 3e-7, output: 9e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "mistralai/codestral-2@001", input: 3e-7, output: 9e-7, cache_read: 3e-7, cache_write: 3e-7 },
    { provider: "gcp.vertex_ai", model: "mistralai/mistral-medium-3", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "gcp.vertex_ai", model: "mistralai/mistral-medium-3@001", input: 4e-7, output: 2e-6, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "gcp.vertex_ai", model: "moonshotai/kimi-k2-thinking-maas", input: 6e-7, output: 25e-7, cache_read: 6e-8, cache_write: 6e-7 },
    { provider: "gcp.vertex_ai", model: "multimodalembedding", input: 8e-7, output: 0, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "gcp.vertex_ai", model: "multimodalembedding@001", input: 8e-7, output: 0, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "gcp.vertex_ai", model: "openai/gpt-oss-120b-maas", input: 9e-8, output: 36e-8, cache_read: 9e-8, cache_write: 9e-8 },
    { provider: "gcp.vertex_ai", model: "openai/gpt-oss-20b-maas", input: 7e-8, output: 25e-8, cache_read: 7e-9, cache_write: 7e-8 },
    { provider: "gcp.vertex_ai", model: "qwen/qwen3-235b-a22b-instruct-2507-maas", input: 22e-8, output: 88e-8, cache_read: 22e-8, cache_write: 22e-8 },
    { provider: "gcp.vertex_ai", model: "qwen/qwen3-coder-480b-a35b-instruct-maas", input: 22e-8, output: 18e-7, cache_read: 22e-9, cache_write: 22e-8 },
    { provider: "gcp.vertex_ai", model: "qwen/qwen3-next-80b-a3b-instruct-maas", input: 15e-8, output: 12e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "qwen/qwen3-next-80b-a3b-thinking-maas", input: 15e-8, output: 12e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "gcp.vertex_ai", model: "text-embedding-004", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "text-embedding-005", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "text-embedding-large-exp-03-07", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "text-embedding-preview-0409", input: 625e-11, output: 0, cache_read: 625e-11, cache_write: 625e-11 },
    { provider: "gcp.vertex_ai", model: "text-multilingual-embedding-002", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "gcp.vertex_ai", model: "text-unicorn", input: 1e-5, output: 28e-6, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "gcp.vertex_ai", model: "text-unicorn@001", input: 1e-5, output: 28e-6, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.1-fast-non-reasoning", input: 2e-7, output: 5e-7, cache_read: 5e-8, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.1-fast-reasoning", input: 2e-7, output: 5e-7, cache_read: 5e-8, cache_write: 2e-7 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.20-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.20-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.3", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.6", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "xai/grok-4.7", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "gcp.vertex_ai", model: "zai-org/glm-4.7-maas", input: 6e-7, output: 22e-7, cache_read: 6e-8, cache_write: 6e-7 },
    { provider: "gcp.vertex_ai", model: "zai-org/glm-5-maas", input: 1e-6, output: 32e-7, cache_read: 1e-7, cache_write: 1e-6 },
    { provider: "gcp.vertex_ai", model: "zai-org/glm-5.2-maas", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "groq", model: "llama-guard-3-8b", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "groq", model: "meta-llama/llama-prompt-guard-2-22m", input: 3e-8, output: 3e-8, cache_read: 3e-8, cache_write: 3e-8 },
    { provider: "groq", model: "meta-llama/llama-prompt-guard-2-86m", input: 4e-8, output: 4e-8, cache_read: 4e-8, cache_write: 4e-8 },
    { provider: "groq", model: "openai/gpt-oss-120b", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "groq", model: "openai/gpt-oss-20b", input: 75e-9, output: 3e-7, cache_read: 375e-10, cache_write: 75e-9 },
    { provider: "groq", model: "openai/gpt-oss-safeguard-20b", input: 75e-9, output: 3e-7, cache_read: 37e-9, cache_write: 75e-9 },
    { provider: "groq", model: "qwen/qwen3.8-27b", input: 8e-7, output: 4e-6, cache_read: 8e-7, cache_write: 8e-7 },
    { provider: "ibm.watsonx.ai", model: "bigscience/mt0-xxl", input: 1908e-9, output: 1908e-9, cache_read: 1908e-9, cache_write: 1908e-9 },
    { provider: "ibm.watsonx.ai", model: "bigscience/mt0-xxl-13b", input: 1908e-9, output: 1908e-9, cache_read: 1908e-9, cache_write: 1908e-9 },
    { provider: "ibm.watsonx.ai", model: "google/flan-t5-xl-3b", input: 6e-7, output: 6e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-13b-chat-v2", input: 6e-7, output: 6e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-13b-instruct-v2", input: 6e-7, output: 6e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-3-3-8b-instruct", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-3-8b-instruct", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-4-h-small", input: 636e-10, output: 265e-9, cache_read: 636e-10, cache_write: 636e-10 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-guardian-3-2-2b", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-guardian-3-3-8b", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-ttm-1024-96-r2", input: 38e-8, output: 38e-8, cache_read: 38e-8, cache_write: 38e-8 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-ttm-1536-96-r2", input: 38e-8, output: 38e-8, cache_read: 38e-8, cache_write: 38e-8 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-ttm-512-96-r2", input: 38e-8, output: 38e-8, cache_read: 38e-8, cache_write: 38e-8 },
    { provider: "ibm.watsonx.ai", model: "ibm/granite-vision-3-2-2b", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-3-2-11b-vision-instruct", input: 35e-8, output: 35e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-3-2-1b-instruct", input: 1e-7, output: 1e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-3-2-3b-instruct", input: 15e-8, output: 15e-8, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-3-2-90b-vision-instruct", input: 2e-6, output: 2e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-3-3-70b-instruct", input: 7526e-10, output: 7526e-10, cache_read: 7526e-10, cache_write: 7526e-10 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-4-maverick-17b", input: 371e-9, output: 1484e-9, cache_read: 371e-9, cache_write: 371e-9 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-4-maverick-17b-128e-instruct-fp8", input: 371e-9, output: 1484e-9, cache_read: 371e-9, cache_write: 371e-9 },
    { provider: "ibm.watsonx.ai", model: "meta-llama/llama-guard-3-11b-vision", input: 35e-8, output: 35e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "ibm.watsonx.ai", model: "mistralai/mistral-large", input: 3e-6, output: 1e-5, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "ibm.watsonx.ai", model: "mistralai/mistral-medium-2505", input: 3e-6, output: 1e-5, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "ibm.watsonx.ai", model: "mistralai/mistral-small-2503", input: 1e-7, output: 3e-7, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "ibm.watsonx.ai", model: "mistralai/mistral-small-3-1-24b-instruct-2503", input: 106e-9, output: 318e-9, cache_read: 106e-9, cache_write: 106e-9 },
    { provider: "ibm.watsonx.ai", model: "mistralai/pixtral-12b-2409", input: 35e-8, output: 35e-8, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "ibm.watsonx.ai", model: "openai/gpt-oss-120b", input: 159e-9, output: 636e-9, cache_read: 159e-9, cache_write: 159e-9 },
    { provider: "ibm.watsonx.ai", model: "sdaia/allam-1-13b-instruct", input: 18e-7, output: 18e-7, cache_read: 18e-7, cache_write: 18e-7 },
    { provider: "mistral_ai", model: "codestral-2508", input: 3e-7, output: 9e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "mistral_ai", model: "codestral-embed", input: 15e-8, output: 0, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "codestral-embed-2505", input: 15e-8, output: 0, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "codestral-latest", input: 3e-7, output: 9e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "mistral_ai", model: "codestral-mamba-latest", input: 25e-8, output: 25e-8, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "mistral_ai", model: "devstral-latest", input: 4e-7, output: 2e-6, cache_read: 4e-8, cache_write: 4e-7 },
    { provider: "mistral_ai", model: "devstral-medium-latest", input: 4e-7, output: 2e-6, cache_read: 4e-8, cache_write: 4e-7 },
    { provider: "mistral_ai", model: "devstral-small-latest", input: 1e-7, output: 3e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "glm-5-2", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "mistral_ai", model: "magistral-medium-latest", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "magistral-small-latest", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "ministral-14b-2512", input: 2e-7, output: 2e-7, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "mistral_ai", model: "ministral-14b-latest", input: 2e-7, output: 2e-7, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "mistral_ai", model: "ministral-3-14b-2512", input: 2e-7, output: 2e-7, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "mistral_ai", model: "ministral-3-3b-2512", input: 1e-7, output: 1e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "ministral-3-8b-2512", input: 15e-8, output: 15e-8, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "ministral-3b-2512", input: 1e-7, output: 1e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "ministral-3b-latest", input: 1e-7, output: 1e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "ministral-8b-2512", input: 15e-8, output: 15e-8, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "ministral-8b-latest", input: 15e-8, output: 15e-8, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "mistral-code-agent-latest", input: 4e-7, output: 2e-6, cache_read: 4e-8, cache_write: 4e-7 },
    { provider: "mistral_ai", model: "mistral-code-fim-latest", input: 3e-7, output: 9e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "mistral_ai", model: "mistral-code-latest", input: 3e-7, output: 9e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "mistral_ai", model: "mistral-embed", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "mistral-embed-2312", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "mistral-large-2512", input: 5e-7, output: 15e-7, cache_read: 5e-8, cache_write: 5e-7 },
    { provider: "mistral_ai", model: "mistral-large-3", input: 5e-7, output: 15e-7, cache_read: 5e-8, cache_write: 5e-7 },
    { provider: "mistral_ai", model: "mistral-large-4", input: 68e-8, output: 209e-8, cache_read: 68e-9, cache_write: 68e-8 },
    { provider: "mistral_ai", model: "mistral-large-4-0", input: 68e-8, output: 209e-8, cache_read: 68e-9, cache_write: 68e-8 },
    { provider: "mistral_ai", model: "mistral-large-latest", input: 5e-7, output: 15e-7, cache_read: 5e-8, cache_write: 5e-7 },
    { provider: "mistral_ai", model: "mistral-medium", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-medium-2604", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-medium-3", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-medium-3-5", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-medium-3.5", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-medium-latest", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-small", input: 1e-7, output: 3e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "mistral-small-2603", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "mistral-small-latest", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "mistral-tiny", input: 25e-8, output: 25e-8, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "mistral_ai", model: "mistral-vibe-cli-fast", input: 15e-8, output: 6e-7, cache_read: 15e-9, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "mistral-vibe-cli-latest", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "mistral-vibe-cli-with-tools", input: 15e-7, output: 75e-7, cache_read: 15e-8, cache_write: 15e-7 },
    { provider: "mistral_ai", model: "open-mistral-nemo", input: 3e-7, output: 3e-7, cache_read: 3e-8, cache_write: 3e-7 },
    { provider: "mistral_ai", model: "pixtral-large-latest", input: 2e-6, output: 6e-6, cache_read: 2e-7, cache_write: 2e-6 },
    { provider: "mistral_ai", model: "voxtral-small-2507", input: 1e-7, output: 4e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "voxtral-small-latest", input: 1e-7, output: 4e-7, cache_read: 1e-8, cache_write: 1e-7 },
    { provider: "mistral_ai", model: "zai-glm-5", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "mistral_ai", model: "zai-glm-5-2", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "mistral_ai", model: "zai-glm-5-3", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "mistral_ai", model: "zai-glm-5-3-flash", input: 15e-8, output: 5e-7, cache_read: 3e-8, cache_write: 15e-8 },
    { provider: "mistral_ai", model: "zai-glm-latest", input: 14e-7, output: 44e-7, cache_read: 14e-8, cache_write: 14e-7 },
    { provider: "moonshot_ai", model: "kimi-k2.5", input: 6e-7, output: 3e-6, cache_read: 1e-7, cache_write: 6e-7 },
    { provider: "moonshot_ai", model: "kimi-k2.6", input: 95e-8, output: 4e-6, cache_read: 16e-8, cache_write: 95e-8 },
    { provider: "moonshot_ai", model: "kimi-k2.7-code", input: 95e-8, output: 4e-6, cache_read: 19e-8, cache_write: 95e-8 },
    { provider: "moonshot_ai", model: "kimi-k3", input: 3e-6, output: 15e-6, cache_read: 3e-7, cache_write: 3e-6 },
    { provider: "moonshot_ai", model: "moonshot-v1-128k", input: 2e-6, output: 5e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "moonshot_ai", model: "moonshot-v1-128k-vision-preview", input: 2e-6, output: 5e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "moonshot_ai", model: "moonshot-v1-32k", input: 1e-6, output: 3e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "moonshot_ai", model: "moonshot-v1-32k-vision-preview", input: 1e-6, output: 3e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "moonshot_ai", model: "moonshot-v1-8k", input: 2e-7, output: 2e-6, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "moonshot_ai", model: "moonshot-v1-8k-vision-preview", input: 2e-7, output: 2e-6, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "moonshot_ai", model: "moonshot-v1-auto", input: 2e-6, output: 5e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "openai", model: "babbage-002", input: 4e-7, output: 4e-7, cache_read: 4e-7, cache_write: 4e-7 },
    { provider: "openai", model: "chat-latest", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "openai", model: "computer-use-preview", input: 3e-6, output: 12e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "openai", model: "computer-use-preview-2025-03-11", input: 3e-6, output: 12e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "openai", model: "davinci-002", input: 2e-6, output: 2e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "openai", model: "daybreak-blue-latest", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "openai", model: "daybreak-red-latest", input: 125e-7, output: 75e-6, cache_read: 125e-8, cache_write: 15625e-9 },
    { provider: "openai", model: "gpt-3.5-turbo", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "openai", model: "gpt-3.5-turbo-0125", input: 5e-7, output: 15e-7, cache_read: 5e-7, cache_write: 5e-7 },
    { provider: "openai", model: "gpt-3.5-turbo-1106", input: 1e-6, output: 2e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "openai", model: "gpt-3.5-turbo-16k", input: 3e-6, output: 4e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "openai", model: "gpt-3.5-turbo-instruct", input: 15e-7, output: 2e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "openai", model: "gpt-3.5-turbo-instruct-0914", input: 15e-7, output: 2e-6, cache_read: 15e-7, cache_write: 15e-7 },
    { provider: "openai", model: "gpt-4", input: 3e-5, output: 6e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-4-0613", input: 3e-5, output: 6e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-4-1106-preview", input: 1e-5, output: 3e-5, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "openai", model: "gpt-4-turbo", input: 1e-5, output: 3e-5, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "openai", model: "gpt-4-turbo-2024-04-09", input: 1e-5, output: 3e-5, cache_read: 1e-5, cache_write: 1e-5 },
    { provider: "openai", model: "gpt-4.1", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "gpt-4.1-2025-04-14", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "gpt-4.1-mini", input: 4e-7, output: 16e-7, cache_read: 1e-7, cache_write: 4e-7 },
    { provider: "openai", model: "gpt-4.1-mini-2025-04-14", input: 4e-7, output: 16e-7, cache_read: 1e-7, cache_write: 4e-7 },
    { provider: "openai", model: "gpt-4.1-nano", input: 1e-7, output: 4e-7, cache_read: 25e-9, cache_write: 1e-7 },
    { provider: "openai", model: "gpt-4.1-nano-2025-04-14", input: 1e-7, output: 4e-7, cache_read: 25e-9, cache_write: 1e-7 },
    { provider: "openai", model: "gpt-4o", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-2024-05-13", input: 5e-6, output: 15e-6, cache_read: 5e-6, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-4o-2024-08-06", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-2024-11-20", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-audio-preview-2024-12-17", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-audio-preview-2025-06-03", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-mini", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "openai", model: "gpt-4o-mini-2024-07-18", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "openai", model: "gpt-4o-mini-audio-preview-2024-12-17", input: 15e-8, output: 6e-7, cache_read: 15e-8, cache_write: 15e-8 },
    { provider: "openai", model: "gpt-4o-mini-search-preview", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "openai", model: "gpt-4o-mini-search-preview-2025-03-11", input: 15e-8, output: 6e-7, cache_read: 75e-9, cache_write: 15e-8 },
    { provider: "openai", model: "gpt-4o-search-preview", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-4o-search-preview-2025-03-11", input: 25e-7, output: 1e-5, cache_read: 125e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-5", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-2025-08-07", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-chat", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-chat-latest", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-codex", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-mini", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "openai", model: "gpt-5-mini-2025-08-07", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "openai", model: "gpt-5-nano", input: 5e-8, output: 4e-7, cache_read: 5e-9, cache_write: 5e-8 },
    { provider: "openai", model: "gpt-5-nano-2025-08-07", input: 5e-8, output: 4e-7, cache_read: 5e-9, cache_write: 5e-8 },
    { provider: "openai", model: "gpt-5-pro", input: 15e-6, output: 12e-5, cache_read: 15e-6, cache_write: 15e-6 },
    { provider: "openai", model: "gpt-5-pro-2025-10-06", input: 15e-6, output: 12e-5, cache_read: 15e-6, cache_write: 15e-6 },
    { provider: "openai", model: "gpt-5-search-api", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5-search-api-2025-10-14", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1-2025-11-13", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1-chat-latest", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1-codex", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1-codex-max", input: 125e-8, output: 1e-5, cache_read: 125e-9, cache_write: 125e-8 },
    { provider: "openai", model: "gpt-5.1-codex-mini", input: 25e-8, output: 2e-6, cache_read: 25e-9, cache_write: 25e-8 },
    { provider: "openai", model: "gpt-5.2", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.2-2025-12-11", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.2-chat-latest", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.2-codex", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.2-pro", input: 21e-6, output: 168e-6, cache_read: 21e-6, cache_write: 21e-6 },
    { provider: "openai", model: "gpt-5.2-pro-2025-12-11", input: 21e-6, output: 168e-6, cache_read: 21e-6, cache_write: 21e-6 },
    { provider: "openai", model: "gpt-5.3-chat-latest", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.3-codex", input: 175e-8, output: 14e-6, cache_read: 175e-9, cache_write: 175e-8 },
    { provider: "openai", model: "gpt-5.4", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-5.4-2026-03-05", input: 25e-7, output: 15e-6, cache_read: 25e-8, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-5.4-mini", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "openai", model: "gpt-5.4-mini-2026-03-17", input: 75e-8, output: 45e-7, cache_read: 75e-9, cache_write: 75e-8 },
    { provider: "openai", model: "gpt-5.4-nano", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "openai", model: "gpt-5.4-nano-2026-03-17", input: 2e-7, output: 125e-8, cache_read: 2e-8, cache_write: 2e-7 },
    { provider: "openai", model: "gpt-5.4-pro", input: 3e-5, output: 18e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-5.4-pro-2026-03-05", input: 3e-5, output: 18e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-5.5", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-5.5-2026-04-23", input: 5e-6, output: 3e-5, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-5.5-cyber", input: 125e-7, output: 75e-6, cache_read: 125e-8, cache_write: 125e-7 },
    { provider: "openai", model: "gpt-5.5-cyber-preview", input: 125e-7, output: 75e-6, cache_read: 125e-8, cache_write: 125e-7 },
    { provider: "openai", model: "gpt-5.5-pro", input: 3e-5, output: 18e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-5.5-pro-2026-04-23", input: 3e-5, output: 18e-5, cache_read: 3e-5, cache_write: 3e-5 },
    { provider: "openai", model: "gpt-5.6", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-5.6-cyber", input: 125e-7, output: 75e-6, cache_read: 125e-8, cache_write: 15625e-9 },
    { provider: "openai", model: "gpt-5.6-luna", input: 2e-7, output: 12e-7, cache_read: 2e-8, cache_write: 25e-8 },
    { provider: "openai", model: "gpt-5.6-sol", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-5.6-terra", input: 2e-6, output: 12e-6, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-6-astra", input: 1e-5, output: 5e-5, cache_read: 1e-6, cache_write: 125e-7 },
    { provider: "openai", model: "gpt-6-luna", input: 1e-7, output: 5e-7, cache_read: 1e-8, cache_write: 125e-9 },
    { provider: "openai", model: "gpt-6-sol", input: 2e-6, output: 1e-5, cache_read: 2e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-6.1-sol", input: 2e-6, output: 1e-5, cache_read: 1e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-audio", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-audio-1.5", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-audio-2025-08-28", input: 25e-7, output: 1e-5, cache_read: 25e-7, cache_write: 25e-7 },
    { provider: "openai", model: "gpt-audio-mini", input: 6e-7, output: 24e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "openai", model: "gpt-audio-mini-2025-10-06", input: 6e-7, output: 24e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "openai", model: "gpt-audio-mini-2025-12-15", input: 6e-7, output: 24e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "openai", model: "gpt-daybreak-blue-latest", input: 4e-6, output: 2e-5, cache_read: 4e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-daybreak-red-latest", input: 125e-7, output: 75e-6, cache_read: 125e-8, cache_write: 15625e-9 },
    { provider: "openai", model: "gpt-rosalind-discovery", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "openai", model: "gpt-rosalind-research", input: 5e-6, output: 25e-6, cache_read: 5e-7, cache_write: 5e-6 },
    { provider: "openai", model: "o1", input: 15e-6, output: 6e-5, cache_read: 75e-7, cache_write: 15e-6 },
    { provider: "openai", model: "o1-2024-12-17", input: 15e-6, output: 6e-5, cache_read: 75e-7, cache_write: 15e-6 },
    { provider: "openai", model: "o1-pro", input: 15e-5, output: 6e-4, cache_read: 15e-5, cache_write: 15e-5 },
    { provider: "openai", model: "o1-pro-2025-03-19", input: 15e-5, output: 6e-4, cache_read: 15e-5, cache_write: 15e-5 },
    { provider: "openai", model: "o3", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "o3-2025-04-16", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "o3-deep-research", input: 1e-5, output: 4e-5, cache_read: 25e-7, cache_write: 1e-5 },
    { provider: "openai", model: "o3-deep-research-2025-06-26", input: 1e-5, output: 4e-5, cache_read: 25e-7, cache_write: 1e-5 },
    { provider: "openai", model: "o3-mini", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "openai", model: "o3-mini-2025-01-31", input: 11e-7, output: 44e-7, cache_read: 55e-8, cache_write: 11e-7 },
    { provider: "openai", model: "o3-pro", input: 2e-5, output: 8e-5, cache_read: 2e-5, cache_write: 2e-5 },
    { provider: "openai", model: "o3-pro-2025-06-10", input: 2e-5, output: 8e-5, cache_read: 2e-5, cache_write: 2e-5 },
    { provider: "openai", model: "o4-mini", input: 11e-7, output: 44e-7, cache_read: 275e-9, cache_write: 11e-7 },
    { provider: "openai", model: "o4-mini-2025-04-16", input: 11e-7, output: 44e-7, cache_read: 275e-9, cache_write: 11e-7 },
    { provider: "openai", model: "o4-mini-deep-research", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "o4-mini-deep-research-2025-06-26", input: 2e-6, output: 8e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "openai", model: "text-embedding-3-large", input: 13e-8, output: 0, cache_read: 13e-8, cache_write: 13e-8 },
    { provider: "openai", model: "text-embedding-3-small", input: 2e-8, output: 0, cache_read: 2e-8, cache_write: 2e-8 },
    { provider: "openai", model: "text-embedding-ada-002", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "openai", model: "text-embedding-ada-002-v2", input: 1e-7, output: 0, cache_read: 1e-7, cache_write: 1e-7 },
    { provider: "perplexity", model: "codellama-34b-instruct", input: 35e-8, output: 14e-7, cache_read: 35e-8, cache_write: 35e-8 },
    { provider: "perplexity", model: "codellama-70b-instruct", input: 7e-7, output: 28e-7, cache_read: 7e-7, cache_write: 7e-7 },
    { provider: "perplexity", model: "llama-2-70b-chat", input: 7e-7, output: 28e-7, cache_read: 7e-7, cache_write: 7e-7 },
    { provider: "perplexity", model: "llama-3.1-70b-instruct", input: 1e-6, output: 1e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "perplexity", model: "llama-3.1-8b-instruct", input: 2e-7, output: 2e-7, cache_read: 2e-7, cache_write: 2e-7 },
    { provider: "perplexity", model: "mistral-7b-instruct", input: 7e-8, output: 28e-8, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "perplexity", model: "mixtral-8x7b-instruct", input: 7e-8, output: 28e-8, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "perplexity", model: "pplx-70b-chat", input: 7e-7, output: 28e-7, cache_read: 7e-7, cache_write: 7e-7 },
    { provider: "perplexity", model: "pplx-70b-online", input: 0, output: 28e-7, cache_read: 0, cache_write: 0 },
    { provider: "perplexity", model: "pplx-7b-chat", input: 7e-8, output: 28e-8, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "perplexity", model: "pplx-7b-online", input: 0, output: 28e-8, cache_read: 0, cache_write: 0 },
    { provider: "perplexity", model: "pplx-embed-context-v1-0.6b", input: 8e-9, output: 0, cache_read: 8e-9, cache_write: 8e-9 },
    { provider: "perplexity", model: "pplx-embed-context-v1-4b", input: 5e-8, output: 0, cache_read: 5e-8, cache_write: 5e-8 },
    { provider: "perplexity", model: "pplx-embed-v1-0.6b", input: 4e-9, output: 0, cache_read: 4e-9, cache_write: 4e-9 },
    { provider: "perplexity", model: "pplx-embed-v1-4b", input: 3e-8, output: 0, cache_read: 3e-8, cache_write: 3e-8 },
    { provider: "perplexity", model: "sonar", input: 1e-6, output: 1e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "perplexity", model: "sonar-deep-research", input: 2e-6, output: 8e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "perplexity", model: "sonar-medium-chat", input: 6e-7, output: 18e-7, cache_read: 6e-7, cache_write: 6e-7 },
    { provider: "perplexity", model: "sonar-medium-online", input: 0, output: 18e-7, cache_read: 0, cache_write: 0 },
    { provider: "perplexity", model: "sonar-pro", input: 3e-6, output: 15e-6, cache_read: 3e-6, cache_write: 3e-6 },
    { provider: "perplexity", model: "sonar-reasoning", input: 1e-6, output: 5e-6, cache_read: 1e-6, cache_write: 1e-6 },
    { provider: "perplexity", model: "sonar-reasoning-pro", input: 2e-6, output: 8e-6, cache_read: 2e-6, cache_write: 2e-6 },
    { provider: "perplexity", model: "sonar-small-chat", input: 7e-8, output: 28e-8, cache_read: 7e-8, cache_write: 7e-8 },
    { provider: "perplexity", model: "sonar-small-online", input: 0, output: 28e-8, cache_read: 0, cache_write: 0 },
    { provider: "x_ai", model: "grok-4.20", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-0309", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-0309-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-0309-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-0309", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-0309-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-0309-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-latest-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-latest-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-beta-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-0304", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-0304-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-0304-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-non-reasoning-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-experimental-beta-reasoning-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-0309", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-beta-0309", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-beta-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-experimental-beta-0304", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-experimental-beta-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-multi-agent-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-non-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-non-reasoning-gv2", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-non-reasoning-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-reasoning", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-reasoning-gv2", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.20-reasoning-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.3", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.3-latest", input: 125e-8, output: 25e-7, cache_read: 2e-7, cache_write: 125e-8 },
    { provider: "x_ai", model: "grok-4.5", input: 2e-6, output: 6e-6, cache_read: 3e-7, cache_write: 2e-6 },
    { provider: "x_ai", model: "grok-4.5-latest", input: 2e-6, output: 6e-6, cache_read: 3e-7, cache_write: 2e-6 },
    { provider: "x_ai", model: "grok-4.6", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "x_ai", model: "grok-4.7", input: 2e-6, output: 6e-6, cache_read: 5e-7, cache_write: 2e-6 },
    { provider: "x_ai", model: "grok-build-0.1", input: 1e-6, output: 2e-6, cache_read: 2e-7, cache_write: 1e-6 },
    { provider: "x_ai", model: "grok-build-latest", input: 2e-6, output: 6e-6, cache_read: 3e-7, cache_write: 2e-6 },
    { provider: "x_ai", model: "grok-code-fast", input: 1e-6, output: 2e-6, cache_read: 2e-7, cache_write: 1e-6 },
    { provider: "x_ai", model: "grok-code-fast-1", input: 1e-6, output: 2e-6, cache_read: 2e-7, cache_write: 1e-6 },
    { provider: "x_ai", model: "grok-code-fast-1-0825", input: 1e-6, output: 2e-6, cache_read: 2e-7, cache_write: 1e-6 }
  ]
};
function costOf(rate, tokens) {
  const uncached = Math.max(tokens.input - tokens.cacheRead - tokens.cacheWrite, 0);
  return uncached * rate.input + tokens.cacheRead * rate.cacheRead + tokens.cacheWrite * rate.cacheWrite + tokens.output * rate.output;
}
function byName(rows) {
  const rates = /* @__PURE__ */ new Map();
  for (const { provider, model: model4, ...rate } of rows) {
    let models = rates.get(provider);
    if (models === void 0) rates.set(provider, models = /* @__PURE__ */ new Map());
    models.set(model4, rate);
  }
  return rates;
}
var table;
function tableRates() {
  if (table === void 0) {
    const rows = model_prices_default.prices;
    table = byName(
      rows.map((row) => ({
        provider: row.provider,
        model: row.model,
        input: row.input,
        output: row.output,
        cacheRead: row.cache_read,
        cacheWrite: row.cache_write
      }))
    );
  }
  return table;
}
function ownRates(prices) {
  return byName(
    prices.map((price) => ({
      provider: price.provider,
      model: price.model,
      input: price.input,
      output: price.output,
      cacheRead: price.cacheRead ?? price.input,
      cacheWrite: price.cacheWrite ?? price.input
    }))
  );
}
function priced(own, provider, model4, tokens) {
  const rate = own.get(provider)?.get(model4) ?? tableRates().get(provider)?.get(model4);
  return rate === void 0 ? void 0 : costOf(rate, tokens);
}
function checkedPrice(given) {
  const price = given;
  if (typeof price !== "object" || price === null || typeof price.provider !== "string" || price.provider === "" || typeof price.model !== "string" || price.model === "") {
    throw new TypeError("a price names its provider and its model");
  }
  const amounts = [price.input, price.output, price.cacheRead ?? 0, price.cacheWrite ?? 0];
  if (!amounts.every((amount) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0)) {
    throw new RangeError("a price is a finite number of US dollars a token, from 0");
  }
  return Object.freeze({ ...price });
}
var Guard = class _Guard {
  #maxSteps;
  #maxSpend;
  #steps = 0;
  #spent = 0;
  constructor(maxSteps, maxSpend) {
    this.#maxSteps = maxSteps;
    this.#maxSpend = maxSpend;
  }
  /** The trace's options' caps, or why they are none: whole steps above 0, and a spend above 0. */
  static of(options) {
    const steps = options.maxSteps ?? void 0;
    if (steps !== void 0 && !(typeof steps === "number" && Number.isInteger(steps) && steps >= 1)) {
      throw new RangeError("maxSteps must be a whole number above 0");
    }
    const spend = options.maxSpend ?? void 0;
    if (spend !== void 0 && !(typeof spend === "number" && Number.isFinite(spend) && spend > 0)) {
      throw new RangeError("maxSpend must be a finite number of US dollars above 0");
    }
    return new _Guard(steps, spend);
  }
  get spent() {
    return this.#spent;
  }
  /** Whether the trace has a spend cap, which a call priced at nothing never reaches. */
  get capped() {
    return this.#maxSpend !== void 0;
  }
  /** Counts a step opening, or throws where the trace reached a cap: its spend for whatever opens, its steps for a step. */
  opens(step2) {
    if (this.#maxSpend !== void 0 && this.#spent >= this.#maxSpend) {
      throw new CapExceededError("spend", this.#maxSpend, this.#spent);
    }
    if (step2) {
      if (this.#maxSteps !== void 0 && this.#steps >= this.#maxSteps) {
        throw new CapExceededError("steps", this.#maxSteps, this.#steps);
      }
      this.#steps += 1;
    }
  }
  /** A call's cost counted again: `now` in place of `before`. */
  counts(before, now) {
    this.#spent += now - before;
  }
};
var Ids = class {
  #random = new RandomIdGenerator();
  #given;
  generateTraceId() {
    return this.#given?.traceId ?? this.#random.generateTraceId();
  }
  generateSpanId() {
    return this.#given?.spanId ?? this.#random.generateSpanId();
  }
  /**
   * `open`, with the span it opens taking these ids. It runs synchronously,
   * so no other span can open in between and take them.
   */
  given(traceId2, spanId, open) {
    this.#given = { traceId: traceId2, spanId };
    try {
      return open();
    } finally {
      this.#given = void 0;
    }
  }
};
function spanIdAt(traceHex, place) {
  const digest = createHash22("sha1").update(Buffer.from(traceHex, "hex")).update(String(place)).digest();
  digest[6] = (digest[6] ?? 0) & 15 | 80;
  return digest.subarray(0, 8).toString("hex");
}
var MAX_QUEUE_SIZE = 2048;
var MAX_BATCH_SIZE = 512;
var SCHEDULE_DELAY_S = 5;
var SHUTDOWN_TIMEOUT_S = 30;
var live = /* @__PURE__ */ new Set();
var hooked = false;
function beforeExit() {
  for (const held of live) {
    const processor = held.deref();
    if (processor === void 0) live.delete(held);
    else processor.drainBeforeExit();
  }
}
var Processor = class {
  #held = new WeakRef(this);
  #exporter;
  #maxQueueSize;
  #maxBatchSize;
  #delayMs;
  #queue = [];
  /**
   * The queue's first span is the `#taken`th ever queued; a batch stops at
   * each fence, a record's first span and one past its last.
   */
  #taken = 0;
  #fences = [];
  /** The record being built: its trace, its spans as they end, and its room. */
  #stage;
  #reserved = 0;
  #dropped = 0;
  /** A trace's opening queued, which goes without waiting for the delay. */
  #opening = false;
  #flushers = [];
  #timer;
  #inFlight;
  #down = false;
  /** Set once a shutdown's deadline has passed: nothing more is started. */
  #givenUp = false;
  constructor(exporter, options = {}) {
    this.#exporter = exporter;
    this.#maxQueueSize = bound(options.maxQueueSize ?? MAX_QUEUE_SIZE, "maxQueueSize");
    this.#maxBatchSize = bound(options.maxBatchSize ?? MAX_BATCH_SIZE, "maxBatchSize");
    const delay = options.scheduleDelaySeconds ?? SCHEDULE_DELAY_S;
    if (typeof delay !== "number" || !(delay >= 0 && delay * 1e3 <= 2 ** 31 - 1)) {
      throw new RangeError("scheduleDelaySeconds must be a number of seconds from 0, under 25 days");
    }
    this.#delayMs = delay * 1e3;
    live.add(this.#held);
    if (!hooked) {
      hooked = true;
      process.on("beforeExit", beforeExit);
    }
  }
  /**
   * Runs `build`, staging the spans of trace `traceId` as they end, then
   * queues them whole, to travel in exports of their own: so the same record
   * sent again is the same bytes, whatever else ends meanwhile. Throws
   * `ShutdownError` once shut down, and `QueueFullError` when the queue has no
   * room for the record's `need` spans, running nothing; the room is kept for
   * them meanwhile. A `build` that throws queues nothing. Of the application's,
   * it runs the root sampler and the reads of the caller's record alone, a
   * record's warnings given before it.
   */
  record(traceId2, need2, build2) {
    if (this.#down) throw new ShutdownError();
    if (this.#queue.length + need2 > this.#maxQueueSize) throw new QueueFullError(need2, this.#maxQueueSize);
    const stage = { traceId: traceId2, spans: [] };
    this.#stage = stage;
    this.#reserved = need2;
    try {
      build2();
    } finally {
      this.#stage = void 0;
      this.#reserved = 0;
    }
    if (this.#down || stage.spans.length === 0) return;
    const first = this.#taken + this.#queue.length;
    if (first > this.#taken) this.#fences.push(first);
    this.#fences.push(first + stage.spans.length);
    for (const span of stage.spans) this.#queue.push(span);
    this.#wake(0);
  }
  onStart(_span, _parentContext) {
  }
  onEnd(span) {
    if (this.#down) return;
    if (this.#stage !== void 0 && span.spanContext().traceId === this.#stage.traceId) {
      this.#stage.spans.push(span);
      return;
    }
    if (this.#queue.length + this.#reserved >= this.#maxQueueSize) {
      this.#dropped += 1;
      return;
    }
    this.#queue.push(span);
    if (span.name === TRACE_START && span.parentSpanContext !== void 0) this.#opening = true;
    this.#wake(this.#due() ? 0 : this.#delayMs);
  }
  /** Resolves once the queue is empty and the export in flight has settled. */
  forceFlush() {
    if (this.#idle() || this.#givenUp) return Promise.resolve();
    return new Promise((resolve2) => {
      this.#flushers.push(resolve2);
      this.#wake(0);
    });
  }
  /** Spans still queued as Node's loop empties: sent within a shutdown's 30 s, the export holding the loop. */
  drainBeforeExit() {
    if (!this.#down && !this.#idle()) void this.shutdown();
  }
  /**
   * Drains, then takes nothing more. Past the timeout what is left is given
   * up: the wait for a retry ends there and no batch or attempt follows, so
   * nothing of the SDK's but a request already in flight, which its own
   * timeout bounds, holds the process the caller is ending, as the other
   * SDKs' workers hold none.
   */
  async shutdown() {
    live.delete(this.#held);
    if (this.#down) return;
    this.#down = true;
    const deadline = Date.now() + SHUTDOWN_TIMEOUT_S * 1e3;
    while (!this.#idle()) {
      if (this.#inFlight === void 0) this.#tick();
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        this.#givenUp = true;
        this.#exporter.giveUp();
        for (const resolve2 of this.#flushers.splice(0)) resolve2();
        break;
      }
      await Promise.race([this.#inFlight, pause(remaining)]);
    }
    if (this.#timer !== void 0) {
      clearTimeout(this.#timer);
      this.#timer = void 0;
    }
  }
  #idle() {
    return this.#queue.length === 0 && this.#inFlight === void 0;
  }
  /** Whether the worker should export without waiting; a record queued, or a trace's opening, goes at once. */
  #due() {
    return this.#down || this.#flushers.length > 0 || this.#opening || this.#fences.length > 0 || this.#queue.length >= this.#maxBatchSize;
  }
  // The worker is a timer, never referenced: an idle SDK never keeps the
  // process alive, and a pending one fires no later than the delay.
  #wake(ms) {
    if (this.#givenUp) return;
    if (this.#timer !== void 0) {
      if (ms > 0) return;
      clearTimeout(this.#timer);
    }
    const timer = setTimeout(() => {
      this.#timer = void 0;
      this.#tick();
    }, ms);
    timer.unref();
    this.#timer = timer;
  }
  /** One batch, one at a time; the export's end looks again. */
  #tick() {
    if (this.#inFlight !== void 0 || this.#givenUp) return;
    const fence = this.#fences[0];
    const batch = this.#queue.splice(0, Math.min(this.#maxBatchSize, (fence ?? Infinity) - this.#taken));
    this.#opening &&= this.#queue.length > 0;
    this.#taken += batch.length;
    while ((this.#fences[0] ?? Infinity) <= this.#taken) this.#fences.shift();
    const dropped = this.#dropped;
    this.#dropped = 0;
    if (dropped > 0) {
      this.#exporter.warn(`telmoni: the export queue was full; ${dropped} spans were dropped`, { kind: "queue_full" });
    }
    if (batch.length === 0) {
      this.#settle();
      return;
    }
    this.#inFlight = this.#send(batch).then(() => {
      this.#inFlight = void 0;
      this.#settle();
    });
  }
  async #send(batch) {
    try {
      await this.#exporter.export(batch);
    } catch (error) {
      this.#exporter.warn(`telmoni: an export failed (${errorName(error)}); the batch was dropped`, {
        kind: "export_error"
      });
    }
  }
  #settle() {
    if (this.#queue.length > 0) {
      this.#wake(this.#due() ? 0 : this.#delayMs);
      return;
    }
    const flushers = this.#flushers;
    this.#flushers = [];
    for (const resolve2 of flushers) resolve2();
  }
};
function bound(given, name) {
  if (typeof given === "number" && (given === Number.POSITIVE_INFINITY || Number.isInteger(given) && given >= 1)) {
    return given;
  }
  throw new RangeError(`${name} must be a whole number from 1, or Infinity`);
}
function pause(ms) {
  return new Promise((resolve2) => {
    const timer = setTimeout(resolve2, ms);
    timer.unref();
  });
}
var HEX = /^[0-9a-f]+$/;
function writeHeaders(headers, span, agent) {
  const sampled = (span.traceFlags & TraceFlags.SAMPLED) !== 0 ? "01" : "00";
  setHeader(headers, TRACEPARENT, `00-${span.traceId}-${span.spanId}-${sampled}`);
  const members = (getHeader(headers, BAGGAGE) ?? "").split(",").map((member) => member.trim()).filter((member) => member !== "" && !isOurs(member));
  members.push(`${AGENT2}=${encodeBaggageValue(agent)}`);
  setHeader(headers, BAGGAGE, members.join(","));
}
function readHeaders(headers) {
  const traceparent = getHeader(headers, TRACEPARENT);
  if (traceparent === void 0) return void 0;
  const spanContext = parseTraceparent(traceparent);
  if (spanContext === void 0) return void 0;
  const agent = baggageMembers(getHeader(headers, BAGGAGE) ?? "").get(AGENT2);
  if (agent === void 0 || agent === "") return void 0;
  return { spanContext, agent };
}
function parseTraceparent(header) {
  const parts = header.trim().split("-");
  if (parts.length < 4) return void 0;
  const [version, traceId2, spanId, flags] = parts;
  if (!isHex2(version, 2) || version === "ff") return void 0;
  if (version === "00" && parts.length !== 4) return void 0;
  if (!isHex2(traceId2, 32) || !/[1-9a-f]/.test(traceId2)) return void 0;
  if (!isHex2(spanId, 16) || !/[1-9a-f]/.test(spanId)) return void 0;
  if (!isHex2(flags, 2)) return void 0;
  return { traceId: traceId2, spanId, traceFlags: Number.parseInt(flags, 16) & TraceFlags.SAMPLED, isRemote: true };
}
function baggageMembers(header) {
  const members = /* @__PURE__ */ new Map();
  for (const member of header.split(",")) {
    const equals = member.indexOf("=");
    if (equals < 0) continue;
    const key = member.slice(0, equals).trim();
    const value = member.slice(equals + 1).split(";", 1)[0].trim();
    if (key !== "") members.set(key, decodeBaggageValue(value));
  }
  return members;
}
function isOurs(member) {
  return member.split("=", 1)[0].trim() === AGENT2;
}
function isHex2(text, length) {
  return text.length === length && HEX.test(text);
}
function encodeBaggageValue(value) {
  let out = "";
  for (const byte of new TextEncoder().encode(value)) {
    out += allowedInBaggage(byte) ? String.fromCharCode(byte) : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return out;
}
function decodeBaggageValue(value) {
  const bytes = [];
  const encoder = new TextEncoder();
  for (let i = 0; i < value.length; ) {
    const pair = value.slice(i + 1, i + 3);
    if (value[i] === "%" && pair.length === 2 && HEX.test(pair.toLowerCase())) {
      bytes.push(Number.parseInt(pair, 16));
      i += 3;
      continue;
    }
    const char = String.fromCodePoint(value.codePointAt(i));
    for (const byte of encoder.encode(char)) bytes.push(byte);
    i += char.length;
  }
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(Uint8Array.from(bytes));
}
function allowedInBaggage(byte) {
  return byte === 33 || byte >= 35 && byte <= 43 && byte !== 37 || byte >= 45 && byte <= 58 || byte >= 60 && byte <= 91 || byte >= 93 && byte <= 126;
}
function hasGet(headers) {
  return typeof headers.get === "function";
}
function getHeader(headers, name) {
  if (hasGet(headers)) {
    const value = headers.get(name);
    return typeof value === "string" ? value : void 0;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== name) continue;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(",");
  }
  return void 0;
}
function setHeader(headers, name, value) {
  if (hasGet(headers)) {
    headers.set(name, value);
    return;
  }
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name) delete headers[key];
  }
  headers[name] = value;
}
var WHY = {
  name: `its name is 1 to ${SCORE_NAME_MAX} characters`,
  number: "a number score is a finite number within its range",
  category: `its category is 1 to ${SCORE_CATEGORY_MAX} characters`,
  version: `its version is up to ${SCORE_VERSION_MAX} characters`,
  range: "a range is a number score's alone",
  value: "its value is a number, a yes or no, or a category",
  target: `it names a trace by 32 hex digits, a trace and one of its spans by 16, or a session of up to ${SESSION_ID_MAX} characters`,
  ended: "its span had ended; send it with the client's score, naming the span",
  full: `its span holds ${SCORES_PER_SPAN} scores already`
};
function refuse(warnOnce, why) {
  warnOnce(`score:${why}`, `telmoni: a score was not sent: ${why}`, { kind: "input" });
}
function trimmed(text, most) {
  if (typeof text !== "string") return void 0;
  const kept2 = trimEnds(text);
  return [...kept2].length <= most ? kept2 : void 0;
}
function judge(name, value, options) {
  const named = trimmed(name, SCORE_NAME_MAX);
  if (!named) return WHY.name;
  const given = options?.version;
  const version = given === void 0 || given === null ? "" : trimmed(given, SCORE_VERSION_MAX);
  if (version === void 0) return WHY.version;
  const range = options?.range;
  const ranged = range !== void 0 && range !== null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return WHY.number;
    if (!ranged) return { name: named, version, type: "number", value, range: void 0 };
    const [min, max] = Array.isArray(range) && range.length === 2 ? range : [];
    if (typeof min !== "number" || typeof max !== "number" || !Number.isFinite(min) || !Number.isFinite(max)) {
      return WHY.number;
    }
    if (!(min < max && min <= value && value <= max)) return WHY.number;
    return { name: named, version, type: "number", value, range: [min, max] };
  }
  if (typeof value !== "boolean" && typeof value !== "string") return WHY.value;
  if (ranged) return WHY.range;
  if (typeof value === "boolean") return { name: named, version, type: "boolean", value };
  const label = trimmed(value, SCORE_CATEGORY_MAX);
  if (!label) return WHY.category;
  return { name: named, version, type: "category", label };
}
function eventOf(score) {
  const attributes = { [EVALUATION_NAME]: score.name };
  if (score.type === "number") {
    attributes[EVALUATION_VALUE] = score.value;
    if (score.range !== void 0) {
      attributes[SCORE_RANGE_MIN] = score.range[0];
      attributes[SCORE_RANGE_MAX] = score.range[1];
    }
  } else if (score.type === "boolean") {
    attributes[EVALUATION_VALUE] = score.value ? 1 : 0;
    attributes[SCORE_TYPE] = "boolean";
  } else {
    attributes[EVALUATION_LABEL] = score.label;
  }
  if (score.version !== "") attributes[SCORE_VERSION] = score.version;
  return attributes;
}
var TRACE = /^[0-9a-f]{32}$/i;
var SPAN = /^[0-9a-f]{16}$/i;
function traceHexOf(id) {
  if (typeof id !== "string" || !TRACE.test(id) || /^0+$/.test(id)) return void 0;
  return id.toLowerCase();
}
function targetOf(target) {
  const set = (value) => value !== void 0 && value !== null;
  const { traceId: traceId2, spanId, sessionId } = target;
  if (set(sessionId)) {
    if (set(traceId2) || set(spanId)) return void 0;
    const session = trimmed(sessionId, SESSION_ID_MAX);
    return session ? { session_id: session } : void 0;
  }
  const hex = traceHexOf(traceId2);
  if (hex === void 0) return void 0;
  const ids = { trace_id: hex };
  if (!set(spanId)) return ids;
  if (typeof spanId !== "string" || !SPAN.test(spanId)) return void 0;
  ids["span_id"] = spanId.toLowerCase();
  return ids;
}
function lateItem(target, score) {
  const ids = targetOf(target);
  if (ids === void 0) return void 0;
  const item = { id: randomUUID(), ...ids, name: score.name, data_type: score.type };
  if (score.type === "number") {
    item["value"] = score.value;
    if (score.range !== void 0) [item["range_min"], item["range_max"]] = score.range;
  } else if (score.type === "boolean") {
    item["value"] = score.value ? 1 : 0;
  } else {
    item["categories"] = [score.label];
  }
  if (score.version !== "") item["version"] = score.version;
  return JSON.stringify(
    item,
    (_key, value) => typeof value === "string" ? value.replace(LONE_SURROGATE, "\uFFFD") : value
  );
}
var TRACE_KEY = createContextKey("telmoni.trace");
var END2 = /* @__PURE__ */ Symbol("telmoni.end");
var GUARD = /* @__PURE__ */ Symbol("telmoni.guard");
function currentTrace(ctx = context.active()) {
  const found = ctx.getValue(TRACE_KEY);
  return found instanceof Trace ? found : void 0;
}
var Handle = class {
  /**
   * The OpenTelemetry context with this span current: for an application
   * without a context manager to nest its own spans under ours explicitly.
   */
  context;
  span;
  #warnOnce;
  #ended = false;
  #scores = 0;
  constructor(span, parent, owner, warnOnce) {
    this.span = span;
    this.#warnOnce = warnOnce;
    this.context = trace.setSpan(parent, span).setValue(TRACE_KEY, owner ?? this);
  }
  /**
   * Mark it failed by an error's class, a class's name or a type as text; an `Error`'s message and stack are
   * content, kept on the span for the exporter's lock.
   */
  fail(error) {
    let text = error ? typeOfError(error, this.#warnOnce) : "";
    if (text !== "") {
      text = cut2(text, ERROR_TYPE_MAX, "span's error type", this.#warnOnce);
      this.span.setAttribute(ERROR_TYPE, text);
    }
    if (!(error instanceof Error)) {
      this.span.setStatus({ code: SpanStatusCode.ERROR });
      return;
    }
    const message2 = textOf22(error.message);
    const attributes = { [EXCEPTION_MESSAGE]: message2 };
    if (text !== "") attributes[EXCEPTION_TYPE] = text;
    if (typeof error.stack === "string") attributes[EXCEPTION_STACKTRACE] = error.stack;
    this.span.addEvent(EXCEPTION_EVENT, attributes);
    this.span.setStatus({ code: SpanStatusCode.ERROR, message: message2 });
  }
  /** Mark it cancelled by the agent, which is neither ok nor an error. */
  cancel() {
    this.span.setAttribute(CANCELLED, true);
  }
  /** Its span's id, 16 lowercase hex digits: what the client's `score` names once it has ended. */
  get spanId() {
    return this.span.spanContext().spanId;
  }
  /**
   * Score it, timed now: a number, within `range` where given, a yes or no, or
   * a category's label. One refused, or given once it has ended, is not sent, with one warning.
   */
  score(name, value, options) {
    if (this.#ended) return refuse(this.#warnOnce, WHY.ended);
    const score = judge(name, value, options);
    if (typeof score === "string") return refuse(this.#warnOnce, score);
    if (this.#scores >= SCORES_PER_SPAN) return refuse(this.#warnOnce, WHY.full);
    this.#scores += 1;
    this.span.addEvent(EVALUATION_EVENT, eventOf(score));
  }
  /** Whether its span has ended. */
  get ended() {
    return this.#ended;
  }
  [END2](outcome) {
    if (this.#ended) return;
    this.#ended = true;
    if (outcome.failed) {
      if (isAbort(outcome.error)) this.cancel();
      else this.fail(outcome.error instanceof Error ? outcome.error : errorType2(outcome.error));
    }
    this.span.end();
  }
};
var Parent = class extends Handle {
  #opener;
  constructor(opener, span, parent, owner) {
    super(span, parent, owner, opener.warnOnce);
    this.#opener = opener;
  }
  step(name, fn) {
    return within2(this.#opener.step(this.owner, this.context, name), fn);
  }
  modelCall(model4, a, b) {
    const [options, fn] = split(a, b);
    return within2(this.#opener.modelCall(this.owner, this.context, model4, options ?? {}), fn);
  }
  toolCall(name, a, b) {
    const [options, fn] = split(a, b);
    return within2(this.#opener.toolCall(this.owner, this.context, name, options ?? {}), fn);
  }
  retrieval(source, a, b) {
    const [options, fn] = split(a, b);
    return within2(this.#opener.retrieval(this.owner, this.context, source, options ?? {}), fn);
  }
};
var Trace = class extends Parent {
  /** Its trace's id, 32 lowercase hex digits: what the client's `score` names once it has ended. */
  traceId;
  agent;
  #inherited;
  #warnOnce;
  [GUARD];
  constructor(opener, span, parent, agent, inherited, guard = new Guard()) {
    super(opener, span, parent, void 0);
    this.traceId = span.spanContext().traceId;
    this.agent = agent;
    this.#inherited = { ...inherited };
    this.#warnOnce = opener.warnOnce;
    this[GUARD] = guard;
  }
  get owner() {
    return this;
  }
  /** What the agent answered: its messages. An answer given after the trace ended is not sent. */
  answered(answer) {
    if (this.ended) {
      this.#warnOnce("trace:late", "telmoni: a trace must be answered before it ends; an answer given after is not sent", {
        kind: "input"
      });
      return;
    }
    if (answer.outputMessages !== void 0) {
      this.span.setAttribute(OUTPUT_MESSAGES, asJson(answer.outputMessages));
    }
  }
  /** What every span inside the trace carries. */
  get inherited() {
    return { ...this.#inherited };
  }
  /** What the trace's model calls have cost so far in US dollars, counted as its spend cap counts them, in this process. */
  get spent() {
    return this[GUARD].spent;
  }
};
var Step = class extends Parent {
  #trace;
  constructor(opener, span, parent, owner) {
    super(opener, span, parent, owner);
    this.#trace = owner;
  }
  get owner() {
    return this.#trace;
  }
};
var ModelCall = class extends Handle {
  #warnOnce;
  #trace;
  #provider;
  #prices;
  #model;
  /** Its usage as its span holds it, each attribute as last sent. */
  #held = {};
  #counted = 0;
  constructor(span, parent, owner, warnOnce, by) {
    super(span, parent, owner, warnOnce);
    this.#warnOnce = warnOnce;
    this.#trace = owner;
    this.#provider = by.provider;
    this.#model = by.model;
    this.#prices = by.prices;
  }
  /**
   * What the model answered: its name, its tokens, and its messages. An answer
   * given after the call ended is not sent, and counts nothing.
   */
  answered(answer) {
    const named = filled(answer.responseModel, "response model", this.#warnOnce);
    const model4 = named === void 0 ? void 0 : cut2(named, MODEL_MAX2, "response model", this.#warnOnce);
    const sent = usageOf(answer.usage, this.#warnOnce);
    const firstToken = finiteFromZero(answer.timeToFirstToken);
    if (isSet(answer.timeToFirstToken) && firstToken === void 0) {
      this.#warnOnce(
        `call:${TIME_TO_FIRST_CHUNK}`,
        `telmoni: ${TIME_TO_FIRST_CHUNK} must be a finite number of seconds from 0; the call is sent without it`,
        { kind: "input" }
      );
    }
    if (this.ended) {
      this.#warnOnce(
        "call:late",
        "telmoni: a model call must be answered before it ends; an answer given after is not sent and counts nothing toward the trace's spend",
        { kind: "input" }
      );
      return;
    }
    if (model4 !== void 0) {
      this.#model = model4;
      this.span.setAttribute(RESPONSE_MODEL, model4);
    }
    this.span.setAttributes(sent);
    this.#held = { ...this.#held, ...sent };
    if (firstToken !== void 0) this.span.setAttribute(TIME_TO_FIRST_CHUNK, firstToken);
    if (answer.outputMessages !== void 0) {
      this.span.setAttribute(OUTPUT_MESSAGES, asJson(answer.outputMessages));
    }
    this.#count();
  }
  /** Its cost to its trace's spend, in place of what it counted before: reported, else priced, else nothing. */
  #count() {
    const held = this.#held;
    const count2 = (key) => {
      const value = held[key];
      return typeof value === "number" ? value : 0;
    };
    const tokens = {
      input: count2(INPUT_TOKENS),
      output: count2(OUTPUT_TOKENS),
      cacheRead: count2(CACHE_READ_INPUT_TOKENS),
      cacheWrite: count2(CACHE_WRITE_INPUT_TOKENS)
    };
    const reported = held[COST];
    let cost = typeof reported === "number" ? reported : priced(this.#prices, this.#provider, this.#model, tokens);
    const guard = this.#trace[GUARD];
    if (cost === void 0) {
      cost = 0;
      if (guard.capped && Object.values(tokens).some((n) => n > 0)) {
        this.#warnOnce(
          `unpriced:${this.#provider}:${this.#model}`,
          `telmoni: no price for ${this.#model || "a call with no model"} (${this.#provider || "no provider"}), which reported no cost; it counts nothing toward the trace's spend cap`,
          { kind: "input" }
        );
      }
    }
    guard.counts(this.#counted, cost);
    this.#counted = cost;
  }
};
var ToolCall = class extends Handle {
  /** What the tool returned: content, sent only when asked and allowed. */
  returned(result) {
    this.span.setAttribute(TOOL_CALL_RESULT, asJson(result));
  }
};
var Retrieval = class extends Handle {
  #warnOnce;
  /** Whether it searched a memory, whose names its finds go under. */
  #memory;
  constructor(span, parent, owner, warnOnce, memory) {
    super(span, parent, owner, warnOnce);
    this.#warnOnce = warnOnce;
    this.#memory = memory;
  }
  /** What the search found, a list: content, sent only when asked and allowed, and how many it holds, sent in every mode. */
  returned(documents) {
    if (!Array.isArray(documents)) {
      this.#warnOnce("retrieval:documents", "telmoni: a retrieval's documents must be a list; they are neither sent nor counted", {
        kind: "input"
      });
      return;
    }
    const [found, count2] = this.#memory ? [MEMORY_RECORDS, MEMORY_RECORD_COUNT] : [RETRIEVAL_DOCUMENTS, RETRIEVAL_RETURNED];
    this.span.setAttributes({ [found]: asJson(documents), [count2]: documents.length });
  }
};
function within2(handle, fn) {
  let result;
  try {
    result = context.with(handle.context, fn, void 0, handle);
  } catch (error) {
    handle[END2]({ failed: true, error });
    throw error;
  }
  if (isPromiseLike2(result)) {
    return result.then(
      (value) => {
        handle[END2]({ failed: false });
        return value;
      },
      (error) => {
        handle[END2]({ failed: true, error });
        throw error;
      }
    );
  }
  handle[END2]({ failed: false });
  return result;
}
function split(a, b) {
  if (typeof a === "function") return [void 0, a];
  if (b === void 0) throw new TypeError("a callback is needed");
  return [a, b];
}
var Opener = class {
  #tracer;
  #processor;
  #ids;
  #warnOnce;
  /** The project's own prices, which the guard counts a call by first. */
  #prices;
  constructor(tracer, processor, config, ids, warnOnce) {
    this.#tracer = tracer;
    this.#processor = processor;
    this.#ids = ids;
    this.#warnOnce = warnOnce;
    this.#prices = ownRates(config.prices);
  }
  /** The client's warning, once per key, which every handle gives. */
  get warnOnce() {
    return this.#warnOnce;
  }
  trace(given, options) {
    const named = given;
    if (!isSet(named) || isBlank(textOf22(named))) {
      throw new TypeError("a trace needs its agent's name");
    }
    const agent = cut2(asText(named, "trace's agent", this.#warnOnce), AGENT_MAX, "trace's agent", this.#warnOnce);
    const guard = Guard.of(options);
    const user = filled(options.userId, "user id", this.#warnOnce);
    const session = filled(options.sessionId, "session id", this.#warnOnce);
    const inherited = inheritedOf(
      agent,
      user !== void 0 && fits(user, USER_ID_MAX, "user id", "trace", this.#warnOnce) ? user : void 0,
      session !== void 0 && fits(session, SESSION_ID_MAX, "session id", "trace", this.#warnOnce) ? session : void 0
    );
    const attributes = agentAttributes(agent, inherited, tagsOf(Object.entries(options.tags ?? {}), this.#warnOnce));
    if (isSet(options.inputMessages)) {
      attributes[INPUT_MESSAGES] = asJson(options.inputMessages);
    }
    const application = context.active();
    const linked = trace.getSpanContext(application);
    const links = linked !== void 0 && isSpanContextValid(linked) ? [{ context: linked }] : [];
    const span = this.#tracer.startSpan(agentSpanName(agent), { kind: SpanKind.INTERNAL, attributes, links }, ROOT_CONTEXT);
    const openedAt = span.startTime;
    if (openedAt !== void 0) {
      const options2 = { kind: SpanKind.INTERNAL, attributes: inherited, startTime: openedAt };
      this.#tracer.startSpan(TRACE_START, options2, trace.setSpan(application, span)).end(openedAt);
    }
    return new Trace(this, span, application, agent, inherited, guard);
  }
  /**
   * A trace another service opened, continued here under the span the headers
   * named: a trace whose own span is the caller's, non-recording here, so its
   * steps and calls nest under it and carry the agent, and nothing of it is
   * sent or ended from this side.
   */
  continued(remote, given) {
    const agent = cut2(given, AGENT_MAX, "trace's agent", this.#warnOnce);
    return new Trace(this, trace.wrapSpanContext(remote), context.active(), agent, inheritedOf(agent));
  }
  step(owner, parent, given) {
    owner[GUARD].opens(true);
    let name = asText(given, "step's name", this.#warnOnce);
    if (name === "") {
      this.#warnOnce("step:name", "telmoni: a step needs its name; one without is sent named step", { kind: "input" });
      name = "step";
    }
    const span = this.#start(cut2(name, NAME_MAX, "step's name", this.#warnOnce), parent, owner.inherited, SpanKind.INTERNAL);
    return new Step(this, span, parent, owner);
  }
  modelCall(owner, parent, given, options) {
    owner[GUARD].opens(false);
    const asked2 = asText(given, "model", this.#warnOnce);
    const model4 = asked2 === "" ? "" : cut2(asked2, MODEL_MAX2, "model", this.#warnOnce);
    if (model4 === "") {
      this.#warnOnce(
        "call:model",
        "telmoni: a model call needs its model; one without is sent named by its operation alone",
        { kind: "input" }
      );
    }
    const named = filled(options.provider, "provider", this.#warnOnce);
    const provider = named === void 0 ? "" : cut2(named, PROVIDER_MAX, "provider", this.#warnOnce);
    const operation = operationOf(options.operation, this.#warnOnce);
    const [prompt, promptVersion] = promptOf(options, this.#warnOnce);
    const [name, attributes] = modelCallOpening(owner.inherited, model4, operation, provider, prompt, promptVersion);
    if (isSet(options.inputMessages)) {
      attributes[INPUT_MESSAGES] = asJson(options.inputMessages);
    }
    if (isSet(options.systemInstructions)) {
      attributes[SYSTEM_INSTRUCTIONS] = asJson(options.systemInstructions);
    }
    const span = this.#start(name, parent, attributes, SpanKind.CLIENT);
    return new ModelCall(span, parent, owner, this.#warnOnce, { provider, model: model4, prices: this.#prices });
  }
  toolCall(owner, parent, given, options) {
    owner[GUARD].opens(false);
    const name = cut2(asText(given, "tool's name", this.#warnOnce), NAME_MAX, "tool's name", this.#warnOnce);
    const attributes = toolAttributes(owner.inherited, name);
    if (isSet(options.arguments)) {
      attributes[TOOL_CALL_ARGUMENTS] = asJson(options.arguments);
    }
    const span = this.#start(toolSpanName(name), parent, attributes, SpanKind.INTERNAL);
    return new ToolCall(span, parent, owner, this.#warnOnce);
  }
  retrieval(owner, parent, given, options) {
    owner[GUARD].opens(false);
    const memory = Boolean(options.memory);
    const [operation, sourceKey, queryKey] = memory ? [SEARCH_MEMORY, MEMORY_STORE_ID, MEMORY_QUERY_TEXT] : [RETRIEVAL_OPERATION, DATA_SOURCE_ID, RETRIEVAL_QUERY_TEXT];
    const attributes = { ...owner.inherited, [OPERATION]: operation };
    const named = asText(given, "retrieval's source", this.#warnOnce);
    const source = isBlank(named) ? "" : cut2(named, NAME_MAX, "retrieval's source", this.#warnOnce);
    if (source === "") {
      this.#warnOnce(
        "retrieval:source",
        "telmoni: a retrieval needs its source; one without is sent named by its operation alone",
        { kind: "input" }
      );
    } else {
      attributes[sourceKey] = source;
    }
    const name = memory || source === "" ? operation : `${operation} ${source}`;
    if (isSet(options.topK)) {
      const topK = whole(options.topK, 0, 2 ** 63);
      if (topK === void 0) {
        this.#warnOnce(
          `retrieval:${RETRIEVAL_TOP_K}`,
          `telmoni: ${RETRIEVAL_TOP_K} must be a whole number from 0 within 64 bits; the retrieval is sent without it`,
          { kind: "input" }
        );
      } else {
        attributes[RETRIEVAL_TOP_K] = topK;
      }
    }
    if (isSet(options.query)) attributes[queryKey] = asJson(options.query);
    const span = this.#start(name, parent, attributes, SpanKind.CLIENT);
    return new Retrieval(span, parent, owner, this.#warnOnce, memory);
  }
  /**
   * A trace that has ended, sent as the live calls would have sent it.
   *
   * It goes under the trace id the record gives, whatever context is active;
   * each span's id is derived from that id and the span's place in the record.
   * Its spans are queued whole once built, the agent's own last, and travel in
   * exports of their own, so the same record sent again is the same bytes,
   * whatever else is sent meanwhile. Throws `QueueFullError`, queuing nothing,
   * when the export queue has no room for the whole record, and
   * `ShutdownError` once the client is shut down.
   */
  record(record) {
    const agent = record.agent;
    if (typeof agent !== "string" || isBlank(agent)) {
      throw new TypeError("a trace needs its agent's name");
    }
    if ([...agent].length > AGENT_MAX) {
      throw new RangeError(`a recorded trace's agent must be up to ${AGENT_MAX} characters`);
    }
    const traceHex = traceHexOf(record.traceId);
    if (traceHex === void 0) throw new TypeError("a recorded trace's id must be 32 hex digits, not all zeros");
    check(record, "trace");
    const tags = record.tags ?? {};
    const tagged = isObject3(tags) ? Object.entries(tags) : void 0;
    if (tagged === void 0 || tagged.some(([, value]) => typeof value !== "string")) {
      throw new TypeError("a recorded trace's tags must be an object of strings");
    }
    const messages = [
      [INPUT_MESSAGES, record.inputMessages],
      [OUTPUT_MESSAGES, record.outputMessages]
    ];
    const items = read2(record);
    const every = [...walk(items)];
    for (const each2 of [record, ...every]) {
      const [start, end] = [hrTimeOf(each2.start), hrTimeOf(each2.end)];
      if (!readable(start) || !readable(end)) {
        throw new RangeError("a recorded time must fall after the Unix epoch and less than 2^64 nanoseconds after it");
      }
      if (later2(start, end)) throw new RangeError("a recorded span cannot end before it starts");
    }
    const inherited = inheritedOf(record.agent, record.userId, record.sessionId);
    const attributes = agentAttributes(record.agent, inherited, tagsOf(tagged, this.#warnOnce));
    for (const [key, value] of messages) {
      if (isSet(value)) attributes[key] = asJson(value);
    }
    const usages = /* @__PURE__ */ new Map();
    const operations = /* @__PURE__ */ new Map();
    const contents = /* @__PURE__ */ new Map();
    const scored = /* @__PURE__ */ new Map([[record, scoresOf(record, this.#warnOnce)]]);
    for (const each2 of every) {
      contents.set(each2, contentOf(each2));
      scored.set(each2, scoresOf(each2, this.#warnOnce));
      if (each2.type !== "model_call") continue;
      usages.set(each2, usageOf(each2.usage, this.#warnOnce));
      operations.set(each2, operationOf(each2.operation, this.#warnOnce));
    }
    let place = 0;
    const open = (name, parent, spanAttributes, kind2, at) => this.#ids.given(
      traceHex,
      spanIdAt(traceHex, place++),
      () => this.#tracer.startSpan(name, { kind: kind2, attributes: spanAttributes, startTime: hrTimeOf(at) }, parent)
    );
    const call = (item, parent) => {
      if (item.type === "model_call") {
        const operation = operations.get(item) ?? DEFAULT_MODEL_OPERATION;
        const [name, callAttributes] = modelCallOpening(inherited, item.model, operation, item.provider ?? "");
        const effort = item.reasoningEffort;
        if (effort) callAttributes[REQUEST_REASONING_LEVEL] = effort;
        Object.assign(callAttributes, usages.get(item), contents.get(item));
        close(open(name, parent, callAttributes, SpanKind.CLIENT, item.start), item, scored.get(item));
      } else {
        const callAttributes = { ...toolAttributes(inherited, item.name), ...contents.get(item) };
        close(open(toolSpanName(item.name), parent, callAttributes, SpanKind.INTERNAL, item.start), item, scored.get(item));
      }
    };
    const build2 = (held, parent) => {
      for (const [item, inside] of held) {
        if (item.type !== "step") {
          call(item, parent);
          continue;
        }
        const step2 = open(item.name, parent, { ...inherited, ...contents.get(item) }, SpanKind.INTERNAL, item.start);
        build2(inside, trace.setSpan(parent, step2));
        close(step2, item, scored.get(item));
      }
    };
    this.#processor.record(traceHex, 1 + every.length, () => {
      const span = open(agentSpanName(record.agent), ROOT_CONTEXT, attributes, SpanKind.INTERNAL, record.start);
      build2(items, trace.setSpan(ROOT_CONTEXT, span));
      close(span, record, scored.get(record));
    });
  }
  /**
   * A score of what has ended, sent to `/v1/scores`: a span of its own trace,
   * never sent as one, carries it through the export queue, so a flush or a
   * shutdown holds it as it holds spans.
   */
  score(name, value, options) {
    const score = judge(name, value, options);
    if (typeof score === "string") return refuse(this.#warnOnce, score);
    const sent = lateItem(options, score);
    if (sent === void 0) return refuse(this.#warnOnce, WHY.target);
    this.#tracer.startSpan(SCORE_SPAN, { attributes: { [SCORE_SENT]: sent } }, ROOT_CONTEXT).end();
  }
  #start(name, parent, attributes, kind2) {
    return this.#tracer.startSpan(name, { kind: kind2, attributes }, parent);
  }
};
function hrTimeOf(time) {
  const ms = time instanceof Date ? time.getTime() : time;
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    throw new TypeError("a recorded time must be a Date or milliseconds since the Unix epoch");
  }
  const seconds = Math.floor(ms / 1e3);
  const nanos2 = Math.round((ms - seconds * 1e3) * 1e6);
  return nanos2 >= 1e9 ? [seconds + 1, nanos2 - 1e9] : [seconds, nanos2];
}
function later2(a, b) {
  return a[0] > b[0] || a[0] === b[0] && a[1] > b[1];
}
var STEP_DEPTH_MAX2 = 16;
function read2(record) {
  const inside = record.inside ?? [];
  if (!Array.isArray(inside)) {
    throw new TypeError("a recorded trace's inside must be an array, in the order it ran");
  }
  return readItems(inside, 1);
}
function readItems(given, depth) {
  const items = [];
  for (const item of given) {
    if (item?.type === "model_call" || item?.type === "tool_call") {
      check(item, item.type);
      items.push([item, []]);
      continue;
    }
    if (item?.type !== "step") {
      throw new TypeError("a recorded item's type must be 'step', 'model_call' or 'tool_call'");
    }
    if (depth > STEP_DEPTH_MAX2) {
      throw new RangeError(`a recorded step must be nested at most ${STEP_DEPTH_MAX2} deep`);
    }
    check(item, "step");
    const calls = item.calls ?? [];
    if (!Array.isArray(calls)) {
      throw new TypeError("a recorded step's calls must be an array, in the order they ran");
    }
    items.push([item, readItems(calls, depth + 1)]);
  }
  return items;
}
function* walk(items) {
  for (const [item, inside] of items) {
    yield item;
    yield* walk(inside);
  }
}
var FIELDS = {
  trace: [
    ["userId", "string", true],
    ["sessionId", "string", true]
  ],
  step: [["name", "string", false]],
  model_call: [
    ["model", "string", false],
    ["provider", "string", true],
    ["operation", "string", true],
    ["reasoningEffort", "string", true],
    ["usage", "object", true]
  ],
  tool_call: [["name", "string", false]]
};
var OUTCOME = [
  ["errorType", "string", true],
  ["cancelled", "boolean", true]
];
var CAPS = {
  trace: { userId: USER_ID_MAX, sessionId: SESSION_ID_MAX },
  step: { name: NAME_MAX },
  model_call: { model: MODEL_MAX2, provider: PROVIDER_MAX, reasoningEffort: ATTRIBUTE_VALUE_MAX },
  tool_call: { name: NAME_MAX }
};
function check(item, kind2) {
  const what = kind2.replace("_", " ");
  const caps = { ...CAPS[kind2], errorType: ERROR_TYPE_MAX };
  const read22 = {};
  for (const [field, type, optional2] of [...FIELDS[kind2], ...OUTCOME]) {
    const value = Reflect.get(item, field);
    read22[field] = value;
    if (optional2 && (value === void 0 || value === null)) continue;
    if (!(type === "object" ? isObject3(value) : typeof value === type)) {
      const article = type === "object" ? "an" : "a";
      throw new TypeError(`a recorded ${what}'s ${field} must be ${article} ${type}`);
    }
    if (value === "" && (kind2 === "step" && field === "name" || field === "model")) {
      throw new TypeError(`a recorded ${what}'s ${field} cannot be empty`);
    }
    const most = caps[field];
    if (most !== void 0 && typeof value === "string" && [...value].length > most) {
      throw new RangeError(`a recorded ${what}'s ${field} must be up to ${most} characters`);
    }
  }
  const scores = Reflect.get(item, "scores");
  if (scores !== void 0 && scores !== null && !Array.isArray(scores)) {
    throw new TypeError(`a recorded ${what}'s scores must be an array`);
  }
}
function scoresOf(outcome, warnOnce) {
  const given = outcome.scores;
  const events = [];
  for (const each2 of Array.isArray(given) ? given : []) {
    const score = isObject3(each2) ? judge(Reflect.get(each2, "name"), Reflect.get(each2, "value"), each2) : WHY.value;
    if (typeof score === "string") refuse(warnOnce, score);
    else if (events.length >= SCORES_PER_SPAN) refuse(warnOnce, WHY.full);
    else events.push(eventOf(score));
  }
  return events;
}
function isObject3(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}
function contentOf(item) {
  const fields = item.type === "model_call" ? [
    [INPUT_MESSAGES, item.inputMessages],
    [OUTPUT_MESSAGES, item.outputMessages]
  ] : item.type === "tool_call" ? [
    [TOOL_CALL_ARGUMENTS, item.arguments],
    [TOOL_CALL_RESULT, item.result]
  ] : [
    [INPUT_MESSAGES, item.inputMessages],
    [OUTPUT_MESSAGES, item.outputMessages]
  ];
  const out = {};
  for (const [key, value] of fields) {
    if (isSet(value)) out[key] = asJson(value);
  }
  return out;
}
function close(span, outcome, scores = []) {
  for (const score of scores) span.addEvent(EVALUATION_EVENT, score, hrTimeOf(outcome.end));
  if (outcome.errorType) {
    span.setAttribute(ERROR_TYPE, outcome.errorType);
    span.setStatus({ code: SpanStatusCode.ERROR });
  }
  if (outcome.cancelled) span.setAttribute(CANCELLED, true);
  span.end(hrTimeOf(outcome.end));
}
var USAGE_KEYS = [
  "inputTokens",
  "outputTokens",
  "cacheReadInputTokens",
  "cacheWriteInputTokens",
  "cost"
];
function usageOf(usage2, warnOnce) {
  const out = {};
  if (!isSet(usage2)) return out;
  const given = Object(usage2);
  if (!USAGE_KEYS.some((key) => key in given)) {
    warnOnce(
      "usage:foreign",
      "telmoni: a usage must be telmoni's Usage, the provider's counts copied into it; the call is sent without it",
      { kind: "input" }
    );
    return out;
  }
  for (const [key, value] of [
    [INPUT_TOKENS, usage2.inputTokens],
    [OUTPUT_TOKENS, usage2.outputTokens],
    [CACHE_READ_INPUT_TOKENS, usage2.cacheReadInputTokens],
    [CACHE_WRITE_INPUT_TOKENS, usage2.cacheWriteInputTokens]
  ]) {
    if (!isSet(value)) continue;
    const count2 = whole(value, 0, 2 ** 63);
    if (count2 === void 0) {
      warnOnce(
        `usage:${key}`,
        `telmoni: ${key} must be a whole number from 0 within 64 bits; the call is sent without it`,
        { kind: "input" }
      );
    } else {
      out[key] = count2;
    }
  }
  if (isSet(usage2.cost)) {
    const cost = finiteFromZero(usage2.cost);
    if (cost !== void 0) {
      out[COST] = cost;
    } else {
      warnOnce(
        `usage:${COST}`,
        `telmoni: ${COST} must be a finite number of US dollars from 0; the call is sent without it`,
        { kind: "input" }
      );
    }
  }
  return out;
}
function finiteFromZero(given) {
  const number = typeof given === "bigint" || given instanceof Number ? Number(given) : given;
  return typeof number === "number" && Number.isFinite(number) && number >= 0 ? number : void 0;
}
function whole(value, least, end) {
  const number = Math.trunc(numberOf(value));
  return Number.isFinite(number) && number >= least && number < end ? number : void 0;
}
var DECIMAL = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i;
function numberOf(value) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint" || value instanceof Number) return Number(value);
  return typeof value === "string" && DECIMAL.test(value) ? Number(value) : Number.NaN;
}
function inheritedOf(agent, user, session) {
  const inherited = { [AGENT2]: agent };
  if (user) inherited[USER_ID] = user;
  if (session) inherited[SESSION_ID] = session;
  return inherited;
}
function agentAttributes(agent, inherited, tags) {
  return {
    [OPERATION]: AGENT_OPERATION,
    [AGENT_NAME]: agent,
    ...inherited,
    ...tags
  };
}
function modelCallOpening(inherited, model4, operation, provider, prompt = "", promptVersion = "") {
  const attributes = { ...inherited, [OPERATION]: operation };
  if (model4 !== "") attributes[REQUEST_MODEL] = model4;
  if (provider !== "") attributes[PROVIDER] = provider;
  if (prompt !== "") {
    attributes[PROMPT_NAME] = prompt;
    if (promptVersion !== "") attributes[PROMPT_VERSION] = promptVersion;
  }
  return [model4 === "" ? operation : `${operation} ${model4}`, attributes];
}
function promptOf(options, warnOnce) {
  const kept2 = (value, what) => {
    const text = isSet(value) ? asText(value, what, warnOnce) : "";
    return isBlank(text) || !fits(text, ATTRIBUTE_VALUE_MAX, what, "call", warnOnce) ? "" : text;
  };
  const name = kept2(options.prompt, "prompt's name");
  const version = kept2(options.promptVersion, "prompt's version");
  if (version === "" || name !== "") return [name, version];
  warnOnce("call:prompt_version", "telmoni: a prompt's version needs its prompt's name; the call is sent without it", {
    kind: "input"
  });
  return ["", ""];
}
function toolAttributes(inherited, name) {
  return { ...inherited, [OPERATION]: TOOL_OPERATION, [TOOL_NAME]: name };
}
function agentSpanName(agent) {
  return `${AGENT_OPERATION} ${agent}`;
}
function toolSpanName(name) {
  return `${TOOL_OPERATION} ${name}`;
}
function operationOf(given, warnOnce) {
  if (typeof given !== "string" || isBlank(given)) return DEFAULT_MODEL_OPERATION;
  if (MODEL_OPERATIONS.has(given)) return given;
  warnOnce(
    "call:operation",
    "telmoni: a model call's operation must be chat, generate_content, text_completion or embeddings, which ingest reads as a model call; it is sent as chat",
    { kind: "input" }
  );
  return DEFAULT_MODEL_OPERATION;
}
function tagsOf(given, warnOnce) {
  const kept2 = {};
  let count2 = 0;
  for (const [key, value] of given) {
    if (!isSet(value)) continue;
    const sent = tagValue(value);
    const length = [...key].length;
    if (length === 0 || length > TAG_KEY_MAX || shown(sent) > TAG_VALUE_MAX) {
      warnOnce(
        "trace:tag",
        "telmoni: a tag's key must be 1 to 64 characters and its value up to 256; the tag is not sent",
        { kind: "input" }
      );
    } else if (count2 === TAGS_MAX2) {
      warnOnce("trace:tags", "telmoni: a trace carries up to 32 tags, the most ingest keeps; the rest are not sent", {
        kind: "input"
      });
    } else {
      kept2[`${TAG_PREFIX}${key}`] = typeof sent === "string" ? asText(value, "tag", warnOnce) : sent;
      count2 += 1;
    }
  }
  return kept2;
}
function tagValue(value) {
  if (typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  return textOf22(value);
}
function shown(value) {
  if (typeof value !== "number") return [...String(value)].length;
  const [mantissa, exponent] = Math.abs(value).toExponential().split("e");
  const digits = mantissa.replace(".", "").length;
  const point = Number(exponent) + 1;
  const length = point >= digits ? point : point > 0 ? digits + 1 : 2 - point + digits;
  return length + (value < 0 ? 1 : 0);
}
function asText(value, what, warnOnce) {
  if (typeof value === "string") return value;
  warnOnce(`text:${what}`, `telmoni: a ${what} that is no string is sent as its text`, { kind: "input" });
  return textOf22(value);
}
function typeOfError(value, warnOnce) {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) return errorType2(value);
  if (typeof value === "function" && value.name !== "") return value.name;
  return asText(value, "span's error type", warnOnce);
}
function cut2(value, most, what, warnOnce) {
  if (value.length <= most) return value;
  const characters = [...value];
  if (characters.length <= most) return value;
  warnOnce(`cut:${what}`, `telmoni: a ${what} must be up to ${most} characters; it is sent cut to its first ${most}`, {
    kind: "input"
  });
  return characters.slice(0, most).join("");
}
function fits(value, most, what, span, warnOnce) {
  if (value.length <= most || [...value].length <= most) return true;
  warnOnce(`long:${what}`, `telmoni: a ${what} must be up to ${most} characters; the ${span} is sent without it`, {
    kind: "input"
  });
  return false;
}
function textOf22(value) {
  try {
    return String(value);
  } catch {
    return typeof value;
  }
}
function filled(value, what, warnOnce) {
  const text = isSet(value) ? asText(value, what, warnOnce) : "";
  return text === "" ? void 0 : text;
}
function readable([seconds, nanos2]) {
  const after = seconds > 0 || seconds === 0 && nanos2 > 0;
  const within22 = seconds < 18446744073 || seconds === 18446744073 && nanos2 < 709551616;
  return after && within22;
}
function asJson(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? String(item) : item) ?? textOf22(value);
  } catch {
    return textOf22(value);
  }
}
function isSet(value) {
  return value !== null && value !== void 0;
}
function isPromiseLike2(value) {
  return typeof value === "object" && value !== null && typeof value.then === "function";
}
var RecordingSampler = class {
  #root;
  // The api gives no way to read the application's provider's sampler, as
  // Python's does; without one given, a trace samples, as an application's
  // default ParentBased(AlwaysOn) would.
  constructor(root) {
    this.#root = root ?? new AlwaysOnSampler();
  }
  shouldSample(context3, traceId2, spanName, spanKind, attributes, links) {
    const parent = trace.getSpanContext(context3);
    if (parent !== void 0 && isSpanContextValid(parent)) {
      const sampled = (parent.traceFlags & TraceFlags.SAMPLED) !== 0;
      const result2 = { decision: recording(sampled) };
      if (parent.traceState !== void 0) result2.traceState = parent.traceState;
      return result2;
    }
    const decision = this.#root.shouldSample(context3, traceId2, spanName, spanKind, attributes, links);
    const result = {
      decision: recording(decision.decision === SamplingDecision2.RECORD_AND_SAMPLED)
    };
    if (decision.traceState !== void 0) result.traceState = decision.traceState;
    return result;
  }
  toString() {
    return "TelmoniRecordingSampler";
  }
};
function recording(sampled) {
  return sampled ? SamplingDecision2.RECORD_AND_SAMPLED : SamplingDecision2.RECORD;
}
var DEFAULT_ENDPOINT = "https://api.telmoni.com";
var FLUSH_MAX_MS = 2 ** 31 - 1;
function trimTail(value) {
  let end = value.length;
  while (end > 0 && (value.charAt(end - 1) === "/" || WHITE_SPACE.has(value.charAt(end - 1)))) end--;
  return value.slice(0, end);
}
function unsetIfBlank(value) {
  const trimmed2 = value === void 0 ? void 0 : trimEnds(value);
  return trimmed2 ? trimmed2 : void 0;
}
function environment() {
  return typeof process !== "undefined" ? process.env : void 0;
}
var PRINTABLE = /^[\x21-\x7e]*$/;
var NAME = /^[A-Za-z0-9._-]+$/;
var PATH2 = /^[A-Za-z0-9\-._~!$&'()*+,;=:@/]*$/;
var IPV6 = /^[0-9A-Fa-f:.]+$/;
var PORT = /^(:\d{0,5})?$/;
var LOOPBACK = new BlockList();
LOOPBACK.addSubnet("127.0.0.0", 8, "ipv4");
LOOPBACK.addAddress("::1", "ipv6");
function hostOf(endpoint) {
  const scheme = endpoint.indexOf("://");
  if (!PRINTABLE.test(endpoint) || scheme < 0 || !/^https?$/i.test(endpoint.slice(0, scheme))) return void 0;
  const rest = endpoint.slice(scheme + 3);
  const slash = rest.indexOf("/");
  const authority = slash < 0 ? rest : rest.slice(0, slash);
  const path = slash < 0 ? "" : rest.slice(slash + 1);
  if (!PATH2.test(path) || path.split("/").some((segment) => segment === "." || segment === "..")) return void 0;
  let host;
  let port;
  if (authority.startsWith("[")) {
    const end = authority.indexOf("]") + 1;
    host = authority.slice(0, end);
    port = authority.slice(end);
    const inner = host.slice(1, -1);
    if (end === 0 || !IPV6.test(inner) || !isIPv6(inner)) return void 0;
  } else {
    const colon = authority.indexOf(":");
    host = colon < 0 ? authority : authority.slice(0, colon);
    port = colon < 0 ? "" : authority.slice(colon);
    const labels = host.replace(/\.$/, "").split(".");
    if (!NAME.test(host) || !labels.every(labelOk) || numbered(host) && !isIPv4(host)) return void 0;
  }
  return portOk(port) ? host : void 0;
}
function labelOk(label) {
  return label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-");
}
function portOk(port) {
  if (!PORT.test(port)) return false;
  if (port.length <= 1) return true;
  const number = Number(port.slice(1));
  return number > 0 && number <= 65535;
}
function numbered(host) {
  const last = host.replace(/\.$/, "").split(".").pop() ?? "";
  return /^\d+$/.test(last) || /^0x[0-9a-f]*$/i.test(last);
}
function isThisMachine(host) {
  if (host.startsWith("[")) return LOOPBACK.check(host.slice(1, -1), "ipv6");
  if (isIPv4(host)) return LOOPBACK.check(host, "ipv4");
  const name = host.toLowerCase();
  return name === "localhost" || name.endsWith(".localhost");
}
function bypassesProxy(endpoint) {
  const host = hostOf(endpoint);
  return host !== void 0 && isThisMachine(host);
}
function endpointOf(given) {
  const text = trimEnds(given ?? "");
  const scheme = text.indexOf("://");
  if (scheme >= 0) return text.slice(0, scheme + 3) + trimTail(text.slice(scheme + 3));
  const endpoint = trimTail(text);
  if (endpoint === "") return DEFAULT_ENDPOINT;
  if (/^https?$/i.test(endpoint.split(/[:/]/, 1)[0] ?? "")) return endpoint;
  const host = hostOf(`http://${endpoint}`);
  const local = host !== void 0 && isThisMachine(host);
  return `${local ? "http" : "https"}://${endpoint}`;
}
function checkEndpoint(endpoint) {
  const host = hostOf(endpoint);
  if (host === void 0) throw new TypeError("the endpoint must be an http:// or https:// URL");
  if (endpoint.slice(0, 7).toLowerCase() === "http://" && !isThisMachine(host)) {
    throw new TypeError(`refusing to send the API key over unencrypted HTTP to '${host}'; use HTTPS`);
  }
}
function resolve(config) {
  const endpoint = endpointOf(config?.endpoint);
  checkEndpoint(endpoint);
  const prices = config?.prices ?? [];
  if (!Array.isArray(prices)) throw new TypeError("prices must be an array of prices");
  const captureContent = config?.captureContent ?? false;
  if (typeof captureContent !== "boolean") throw new TypeError("captureContent must be a boolean");
  const mask = config?.mask;
  if (mask !== void 0 && typeof mask !== "function") throw new TypeError("mask must be a function");
  const env = environment();
  const scrubSecrets = config?.scrubSecrets ?? unsetIfBlank(env?.[SCRUB_SECRETS_ENV]) !== "0";
  if (typeof scrubSecrets !== "boolean") throw new TypeError("scrubSecrets must be a boolean");
  const scrubPii = config?.scrubPii ?? unsetIfBlank(env?.[SCRUB_PII_ENV]) === "1";
  if (typeof scrubPii !== "boolean") throw new TypeError("scrubPii must be a boolean");
  const resolved = {
    endpoint,
    apiKey: unsetIfBlank(config?.apiKey),
    organizationId: unsetIfBlank(config?.organizationId),
    captureContent,
    mask: config?.mask,
    scrubSecrets,
    scrubPii,
    sampler: config?.sampler,
    environment: unsetIfBlank(config?.environment),
    release: unsetIfBlank(config?.release),
    prices: Object.freeze(prices.map(checkedPrice))
  };
  Object.defineProperty(resolved, "apiKey", { enumerable: false });
  return Object.freeze(resolved);
}
var Telmoni = class _Telmoni {
  config;
  #exporter;
  #processor;
  #provider;
  #opener;
  constructor(config, hooks) {
    this.config = resolve(config);
    this.#exporter = new Exporter(this.config, {
      transport: hooks?.transport ?? (bypassesProxy(this.config.endpoint) ? directTransport : fetchTransport),
      sleep: hooks?.sleep ?? realSleep,
      warn: hooks?.warn ?? ((message2) => console.warn(message2))
    });
    this.#processor = new Processor(this.#exporter, hooks?.processor);
    const ids = new Ids();
    this.#provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        [DISTRO_NAME]: DISTRO,
        "telemetry.distro.version": VERSION4
      }),
      sampler: new RecordingSampler(this.config.sampler),
      spanLimits: {
        attributeCountLimit: 128,
        attributeValueLengthLimit: Infinity,
        eventCountLimit: 32,
        // One: the application's span a trace opened beside.
        linkCountLimit: 1,
        attributePerEventCountLimit: 32,
        attributePerLinkCountLimit: 0
      },
      generalLimits: { attributeCountLimit: 128, attributeValueLengthLimit: Infinity },
      idGenerator: ids,
      spanProcessors: [this.#processor]
    });
    this.#opener = new Opener(
      this.#provider.getTracer(SCOPE, VERSION4),
      this.#processor,
      this.config,
      ids,
      (key, text, warning) => this.#exporter.warnOnce(key, text, warning)
    );
  }
  /**
   * Initializes a Telmoni client automatically from environment variables:
   * - `TELMONI_ENDPOINT`
   * - `TELMONI_API_KEY`
   * - `TELMONI_ORG`
   * - `TELMONI_ENVIRONMENT` and `TELMONI_RELEASE`, the deployment it names
   * - `TELMONI_CAPTURE_CONTENT`, whose `1` alone sets `captureContent`
   * - `TELMONI_SCRUB_SECRETS` and `TELMONI_SCRUB_PII`, as every client whose
   *   code leaves `scrubSecrets` and `scrubPii` unset reads them
   *
   * A blank value is unset, as the CLI reads them. No `OTEL_*` variable is
   * read: the SDK's tracer provider is built part by part.
   */
  static fromEnv(hooks) {
    const env = environment();
    return new _Telmoni(
      {
        endpoint: env?.["TELMONI_ENDPOINT"],
        apiKey: env?.["TELMONI_API_KEY"],
        organizationId: env?.["TELMONI_ORG"],
        // Only 1: a 'false' or a 'no' must never let content out.
        captureContent: unsetIfBlank(env?.[CAPTURE_CONTENT_ENV]) === "1",
        environment: env?.["TELMONI_ENVIRONMENT"],
        release: env?.["TELMONI_RELEASE"]
      },
      hooks
    );
  }
  /** The project's content mode, as the last answer named it. */
  get contentMode() {
    return this.#exporter.contentMode;
  }
  trace(agent, a, b) {
    const [options, fn] = split(a, b);
    return within2(this.#opener.trace(agent, options ?? {}), fn);
  }
  wrap(agent, a, b) {
    const [options, fn] = split(a, b);
    const wrapped = (...args) => this.trace(agent, options ?? {}, (opened) => fn(...args, opened));
    Object.defineProperty(wrapped, "name", { value: fn.name, configurable: true });
    return wrapped;
  }
  /**
   * Send a trace that has already ended, as the live calls would have; a record
   * ingest would refuse, or the queue has no room for, throws, sending nothing.
   */
  recordTrace(record) {
    this.#opener.record(record);
  }
  /**
   * Score what has ended — a trace, by `traceId`; one of its spans, by
   * `traceId` and the handle's `spanId`; or a session, by `sessionId` — sent
   * to `/v1/scores` with the next export. One refused is not sent, with one warning.
   */
  score(name, value, options) {
    this.#opener.score(name, value, options ?? {});
  }
  /**
   * Writes what the next service continues the trace from: the W3C `traceparent`
   * of `from`'s span, or the active context's, and the agent as a `baggage`
   * member beside the headers' own. Outside a trace it writes nothing.
   */
  inject(headers, from) {
    const ctx = from?.context ?? context.active();
    const current = currentTrace(ctx);
    if (current === void 0) return;
    const span = trace.getSpanContext(ctx);
    if (span === void 0 || !isSpanContextValid(span)) return;
    writeHeaders(headers, span, current.agent);
  }
  /**
   * The trace `headers` name, continued here: its steps and calls take the
   * caller's span as their parent and carry the caller's agent, so the trace
   * shows the work where it was asked for. Nothing ends a continued trace
   * here; the caller's own span does. Undefined for headers that name no
   * trace.
   */
  extract(headers) {
    const read22 = readHeaders(headers);
    if (read22 === void 0) return void 0;
    return this.#opener.continued(read22.spanContext, read22.agent);
  }
  /**
   * Waits for everything queued to be sent or given up: true once nothing is left to send, kept or
   * not, and at once after a shutdown; false past the timeout. A batch refused or dropped is warned of.
   */
  async flush(timeoutSeconds = 30) {
    let timer;
    const ms = timeoutSeconds > 0 ? Math.min(timeoutSeconds * 1e3, FLUSH_MAX_MS) : 0;
    const expired = new Promise((resolve2) => {
      timer = setTimeout(() => resolve2(false), ms);
    });
    try {
      return await Promise.race([this.#processor.forceFlush().then(() => true), expired]);
    } finally {
      clearTimeout(timer);
    }
  }
  /** Flush, then stop the exporter; call it before the process exits. */
  shutdown() {
    return this.#provider.shutdown();
  }
};

// src/send.ts
var UNDELIVERED = /* @__PURE__ */ new Set(["failed", "export_error", "queue_full"]);
var PARTIAL = /* @__PURE__ */ new Set([
  "dropped",
  "span_refused",
  "said",
  "too_large",
  "trimmed",
  "upload_failed"
]);
var FINAL_STATUSES = /* @__PURE__ */ new Set([400, 402, 413, 500]);
var DATABASE_FAILED = "/errors/internal/database";
function judge2(warnings, flushed) {
  for (const [warning, text] of warnings) {
    if (UNDELIVERED.has(warning.kind) || keptRefusal(warning)) {
      return { outcome: "undelivered", detail: text };
    }
  }
  if (!flushed) return { outcome: "undelivered", detail: "the flush timed out" };
  const refused2 = warnings.find(([warning]) => warning.kind === "refused");
  if (refused2) return { outcome: "refused", detail: refused2[1] };
  const partial = warnings.find(([warning]) => PARTIAL.has(warning.kind));
  if (partial) return { outcome: "partial", detail: partial[1] };
  return { outcome: "sent", detail: "" };
}
function keptRefusal({ kind: kind2, status, problemType: problemType2 }) {
  return kind2 === "refused" && status !== void 0 && (!FINAL_STATUSES.has(status) || status === 500 && problemType2 === DATABASE_FAILED);
}
var Sender = class {
  constructor(settings, log, session, event, hooks = {}) {
    this.settings = settings;
    this.log = log;
    this.session = session;
    this.event = event;
    this.hooks = hooks;
  }
  settings;
  log;
  session;
  event;
  hooks;
  async send(record, warned) {
    let built;
    try {
      built = toSdk(record);
    } catch (fault) {
      return { outcome: "refused", detail: `the record did not build: ${nameOf2(fault)}` };
    }
    const heard = [];
    let client;
    try {
      client = new Telmoni(
        {
          endpoint: this.settings.endpoint,
          apiKey: this.settings.apiKey,
          captureContent: this.settings.captureContent,
          scrubSecrets: this.settings.scrubSecrets,
          scrubPii: this.settings.scrubPii,
          release: typeof record.release === "string" ? record.release : void 0
        },
        {
          transport: this.hooks.transport,
          sleep: this.hooks.sleep,
          warn: (text, warning) => void heard.push([warning, text]),
          // The trace's own client: its queue takes the trace whole, however long the turn.
          processor: { maxQueueSize: Number.POSITIVE_INFINITY }
        }
      );
    } catch (refusal) {
      if (!(refusal instanceof TypeError)) throw refusal;
      if (!warned.endpoint) {
        warned.endpoint = true;
        this.log.line(this.session, this.event, `endpoint refused: ${refusal.message}`);
      }
      return { outcome: "undelivered", detail: "endpoint refused" };
    }
    let flushed;
    try {
      try {
        client.recordTrace(built);
      } catch (fault) {
        if (fault instanceof QueueFullError) {
          return { outcome: "refused", detail: "more spans than the SDK's queue holds" };
        }
        if (fault instanceof TypeError || fault instanceof RangeError) {
          return { outcome: "refused", detail: `the SDK refused the trace: ${fault.message}` };
        }
        throw fault;
      }
      flushed = await client.flush(Number.POSITIVE_INFINITY);
    } finally {
      await client.shutdown();
    }
    return judge2(heard, flushed);
  }
};
function nameOf2(fault) {
  return fault instanceof Error ? fault.name : typeof fault;
}
function need(given, field) {
  if (!isObject(given) || given[field] === void 0 || given[field] === null) {
    throw new TypeError(`no ${field}`);
  }
  return given[field];
}
function needString(given, field) {
  const value = need(given, field);
  if (typeof value !== "string") throw new TypeError(`${field} is not a string`);
  return value;
}
function when(given, field) {
  const value = parseTimestamp(needString(given, field));
  if (value === void 0) throw new RangeError(`${field} is not a time`);
  return value;
}
function optional(value) {
  return value ?? void 0;
}
function toSdk(record) {
  const calls = need(record, "calls");
  if (!Array.isArray(calls)) throw new TypeError("calls is not a list");
  const tags = isObject(record.tags) && Object.keys(record.tags).length > 0 ? record.tags : void 0;
  return {
    traceId: needString(record, "trace_id"),
    agent: needString(record, "agent"),
    start: when(record, "start"),
    end: when(record, "end"),
    sessionId: optional(record.session_id),
    tags,
    inputMessages: optional(record.input_messages),
    outputMessages: optional(record.output_messages),
    inside: calls.map(toCall),
    errorType: optional(record.error_type),
    cancelled: truthy(record.cancelled)
  };
}
function toCall(call) {
  need(call, "kind");
  if (call.kind === "model") {
    const usage2 = call.usage;
    if (usage2 !== null && usage2 !== void 0 && !isObject(usage2)) {
      throw new TypeError("usage is not an object");
    }
    return {
      type: "model_call",
      model: needString(call, "model"),
      start: when(call, "start"),
      end: when(call, "end"),
      // A trace kept by an older version names none: Anthropic's own was all it sent.
      provider: call.provider ?? "anthropic",
      usage: usage2 === null || usage2 === void 0 ? void 0 : {
        inputTokens: optional(usage2.input),
        outputTokens: optional(usage2.output),
        cacheReadInputTokens: optional(usage2.cache_read),
        cacheWriteInputTokens: optional(usage2.cache_write)
      },
      inputMessages: optional(call.input_messages),
      outputMessages: optional(call.output_messages),
      errorType: optional(call.error_type),
      cancelled: truthy(call.cancelled)
    };
  }
  if (call.kind === "step") {
    const inner = call.calls ?? [];
    if (!Array.isArray(inner)) throw new TypeError("calls is not a list");
    return {
      type: "step",
      name: needString(call, "name"),
      start: when(call, "start"),
      end: when(call, "end"),
      inputMessages: optional(call.input_messages),
      outputMessages: optional(call.output_messages),
      calls: inner.map(toCall),
      errorType: optional(call.error_type),
      cancelled: truthy(call.cancelled)
    };
  }
  return {
    type: "tool_call",
    name: needString(call, "name"),
    start: when(call, "start"),
    end: when(call, "end"),
    arguments: optional(call.arguments),
    result: optional(call.result),
    errorType: optional(call.error_type),
    cancelled: truthy(call.cancelled)
  };
}

// src/settings.ts
import { createHash as createHash3 } from "crypto";
import { accessSync, chmodSync, constants as constants2, mkdirSync, statSync as statSync3 } from "fs";
import { homedir as homedir2 } from "os";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join4 } from "path";
var DEFAULT_ENDPOINT2 = "https://api.telmoni.com";
var CAPTURE_CONTENT = "TELMONI_CAPTURE_CONTENT";
var SCRUB_SECRETS = "TELMONI_SCRUB_SECRETS";
var SCRUB_PII = "TELMONI_SCRUB_PII";
var WHITE_SPACE2 = "[\\t\\n\\v\\f\\r \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]";
var ENDS = new RegExp(`^${WHITE_SPACE2}+|${WHITE_SPACE2}+$`, "g");
var SERVED_BY = [
  ["CLAUDE_CODE_USE_BEDROCK", "aws.bedrock"],
  ["CLAUDE_CODE_USE_VERTEX", "gcp.vertex_ai"],
  ["CLAUDE_CODE_USE_FOUNDRY", "azure.ai.inference"]
];
function providerOf(env) {
  for (const [name, provider] of SERVED_BY) {
    const given = (env[name] ?? "").trim().toLowerCase();
    if (given === "1" || given === "true") return provider;
  }
  return "anthropic";
}
function stateDir(env) {
  const data = env.CLAUDE_PLUGIN_DATA;
  if (data && isAbsolute2(data)) {
    const made2 = usable(data);
    if (made2 !== void 0) return made2;
  }
  const given = env.CLAUDE_CONFIG_DIR;
  const home = given && isAbsolute2(given) ? given : join4(homedir2(), ".claude");
  const made = usable(join4(home, "telmoni"));
  if (made === void 0) throw new Error("no writable state folder");
  return made;
}
function usable(path) {
  try {
    mkdirSync(dirname2(path), { recursive: true });
    mkdirSync(path, { mode: 448 });
  } catch (fault) {
    if (fault.code !== "EEXIST") return void 0;
  }
  try {
    if (!statSync3(path).isDirectory()) return void 0;
    chmodSync(path, 448);
  } catch {
  }
  try {
    accessSync(path, constants2.W_OK | constants2.X_OK);
    return path;
  } catch {
    return void 0;
  }
}
function contentOn(value, own) {
  if (own) return value === "true";
  return (value ?? "").replace(ENDS, "") === "1";
}
function scrubOn(value, own) {
  if (own) return value !== "false";
  return (value ?? "").replace(ENDS, "") !== "0";
}
function readSettings(env) {
  const prefix = (env.TELMONI_API_KEY ?? "").trim() ? "" : "CLAUDE_PLUGIN_OPTION_";
  const own = prefix !== "";
  const key = (env[`${prefix}TELMONI_API_KEY`] ?? "").trim();
  const endpoint = (env[`${prefix}TELMONI_ENDPOINT`] ?? "").trim();
  return {
    apiKey: key || void 0,
    endpoint: endpoint || DEFAULT_ENDPOINT2,
    stateDir: stateDir(env),
    provider: providerOf(env),
    captureContent: contentOn(env[`${prefix}${CAPTURE_CONTENT}`], own),
    scrubSecrets: scrubOn(env[`${prefix}${SCRUB_SECRETS}`], own),
    scrubPii: scrubOn(env[`${prefix}${SCRUB_PII}`], own)
  };
}
function destination(settings) {
  return createHash3("sha256").update(`${settings.endpoint}
${settings.apiKey ?? ""}`).digest("hex").slice(0, 16);
}

// src/state.ts
import { randomUUID as randomUUID2 } from "crypto";
import {
  closeSync as closeSync3,
  fsyncSync,
  openSync as openSync3,
  readFileSync as readFileSync2,
  renameSync as renameSync2,
  rmSync,
  statSync as statSync4,
  utimesSync,
  writeFileSync,
  writeSync
} from "fs";
import { setTimeout as sleep } from "timers/promises";
var limits = {
  sent: 500,
  // Traces kept for a Telmoni that stays away: the newest, so the file stays small and current.
  pending: 200,
  // A lock not freshened for this long was left by a hook that died holding it.
  staleMs: 6e4
};
var UTF83 = new TextDecoder("utf-8", { fatal: true });
var State = class _State {
  // Where the rows of the first turn not yet sent begin.
  offset = 0;
  sent = [];
  // Turns Telmoni could not take yet, in order, sent again before any new one.
  pending = [];
  warned = {};
  // Where the session's key sends (`destination`): its kept traces go there alone.
  destination;
  // The tags asked for in the turns before `offset`, which every later turn carries.
  tags = /* @__PURE__ */ new Map();
  /**
   * The session's state, new where none was saved; one that cannot be read throws, since read as
   * new it would send the whole session again and lose its kept traces.
   */
  static load(path) {
    let text;
    try {
      text = UTF83.decode(readFileSync2(path));
    } catch (fault) {
      if (fault.code === "ENOENT") return new _State();
      throw fault;
    }
    const data = JSON.parse(text);
    if (!isObject(data)) throw new TypeError("the state is not an object");
    const state = new _State();
    const { offset, sent, pending, warned, destination: destination2, tags } = data;
    if (typeof offset === "number" && Number.isInteger(offset) && offset >= 0)
      state.offset = offset;
    if (Array.isArray(sent)) {
      state.sent = sent.filter((item) => typeof item === "string").slice(-limits.sent);
    }
    if (Array.isArray(pending)) state.pending = pending.filter(isObject);
    if (isObject(warned)) {
      state.warned = Object.fromEntries(
        Object.entries(warned).filter(([, value]) => value === true).map(([key]) => [key, true])
      );
    }
    if (typeof destination2 === "string") state.destination = destination2;
    state.tags = kept(tags);
    return state;
  }
  /** Written aside and synced before it replaces the last, so a power cut leaves one whole. */
  save(path) {
    this.sent = this.sent.slice(-limits.sent);
    const text = JSON.stringify({
      offset: this.offset,
      sent: this.sent,
      pending: this.pending,
      warned: this.warned,
      destination: this.destination ?? null,
      tags: Object.fromEntries(this.tags)
    });
    const temporary = `${path}.${process.pid}.tmp`;
    const fd = openSync3(temporary, "w", 384);
    try {
      writeSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync3(fd);
    }
    renameSync2(temporary, path);
    const marker = `${path.replace(/\.json$/, "")}.pending`;
    if (this.pending.length > 0) touch(marker);
    else rmSync(marker, { force: true });
  }
  markSent(traceId2) {
    if (!this.sent.includes(traceId2)) this.sent.push(traceId2);
  }
  /** Lets the oldest pending traces go past the cap; how many went. */
  trimPending() {
    const over = this.pending.length - limits.pending;
    if (over <= 0) return 0;
    this.pending.splice(0, over);
    return over;
  }
};
function touch(path) {
  const now = /* @__PURE__ */ new Date();
  try {
    utimesSync(path, now, now);
  } catch {
    closeSync3(openSync3(path, "a", 384));
  }
}
var Lock = class {
  constructor(path) {
    this.path = path;
  }
  path;
  #token;
  #freshen;
  /** Takes the lock, waiting up to `waitMs` for its holder, or without limit when `waitMs` is none. */
  async acquire(waitMs, pollMs = 200) {
    const deadline = waitMs === void 0 ? Infinity : Date.now() + waitMs;
    const token = `${process.pid}:${randomUUID2()}`;
    for (; ; ) {
      try {
        writeFileSync(this.path, token, { flag: "wx", mode: 384 });
        break;
      } catch (fault) {
        if (fault.code !== "EEXIST") throw fault;
      }
      if (deadHolder(this.path) && breakDead(this.path)) continue;
      if (Date.now() >= deadline) return false;
      await sleep(pollMs);
    }
    this.#token = token;
    this.#freshen = setInterval(() => {
      try {
        const now = /* @__PURE__ */ new Date();
        utimesSync(this.path, now, now);
      } catch {
      }
    }, limits.staleMs / 6);
    this.#freshen.unref();
    return true;
  }
  release() {
    clearInterval(this.#freshen);
    const token = this.#token;
    this.#token = void 0;
    if (token === void 0) return;
    try {
      if (readFileSync2(this.path, "utf8") === token) rmSync(this.path, { force: true });
    } catch {
    }
  }
};
function breakDead(path) {
  const breaker = `${path}.break`;
  try {
    writeFileSync(breaker, "", { flag: "wx", mode: 384 });
  } catch {
    if (Date.now() - modified(breaker) > limits.staleMs) rmSync(breaker, { force: true });
    return false;
  }
  try {
    if (!deadHolder(path)) return false;
    rmSync(path, { force: true });
    return true;
  } finally {
    rmSync(breaker, { force: true });
  }
}
function modified(path) {
  try {
    return statSync4(path).mtimeMs;
  } catch {
    return Date.now();
  }
}
function deadHolder(path) {
  let token;
  let touched;
  try {
    token = readFileSync2(path, "utf8");
    touched = statSync4(path).mtimeMs;
  } catch {
    return false;
  }
  if (Date.now() - touched > limits.staleMs) return true;
  const pid = Number(token.split(":")[0]);
  return Number.isInteger(pid) && pid > 0 && !alive(pid);
}
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (fault) {
    return fault.code === "EPERM";
  }
}

// src/worker.ts
var waits = {
  // A Stop waits this long for another hook on the session; the session's end waits it out.
  stopMs: 6e4,
  settleQuietMs: 500,
  settleLimitMs: 3e3,
  settlePollMs: 100,
  // Each trace sent is remembered at most this soon after the last: a catch-up may take hours.
  saveEveryMs: 1e3,
  // A session's lock untouched this long is let go: a session hooks again within days, or not at all.
  sweepAfterMs: 7 * 24 * 3600 * 1e3
};
async function main(raw2, env, hooks = {}) {
  try {
    return await run(fromJson(JSON.parse(raw2)), env, hooks);
  } catch {
    return 0;
  }
}
async function run(given, env, hooks = {}) {
  let settings;
  try {
    settings = readSettings(env);
  } catch {
    return 0;
  }
  const log = new Log(join5(settings.stateDir, "hook.log"));
  try {
    await work(given, settings, log, hooks);
  } catch (fault) {
    log.line(given.sessionId, given.event, `failed: ${nameOf3(fault)}`);
  }
  return 0;
}
async function work(given, settings, log, hooks) {
  const { sessionId: session, event } = given;
  const statePath = join5(settings.stateDir, `${session}.json`);
  const lock = new Lock(join5(settings.stateDir, `${session}.lock`));
  if (!await lock.acquire(event === "SessionEnd" ? void 0 : waits.stopMs)) {
    log.line(session, event, "another hook holds the session; the next hook sends");
    return;
  }
  let reached = false;
  try {
    let state;
    try {
      state = State.load(statePath);
    } catch (fault) {
      log.line(session, event, `state not read (${nameOf3(fault)}); nothing sent`);
      return;
    }
    if (!settings.apiKey) {
      if (!state.warned.key) {
        state.warned.key = true;
        state.save(statePath);
        log.line(
          session,
          event,
          "no key: set TELMONI_API_KEY as a plugin setting or in the environment"
        );
      }
      return;
    }
    const path = given.transcriptPath;
    if (!isFile(path)) {
      log.line(session, event, "no transcript at the path given");
      return;
    }
    await settle(path);
    const read3 = readRows(path, state.offset);
    if (read3.restarted) {
      state.offset = 0;
      state.tags = /* @__PURE__ */ new Map();
    }
    const subagents = discoverSubagents(path);
    const found = assemble(read3.rows, session, read3.end, settings.captureContent);
    const sender = new Sender(settings, log, session, event, hooks);
    state.destination = destination(settings);
    const saver = new Saver(state, statePath);
    try {
      await deliver(state, found, sender, given, subagents, log, saver);
    } finally {
      saver.save();
    }
    reached = state.pending.length === 0;
  } finally {
    lock.release();
  }
  if (reached) await sendLeft(settings, log, session, event, hooks);
  await sweepLocks(settings, session);
}
async function sweepLocks(settings, own) {
  const now = Date.now();
  for (const name of listed(settings.stateDir, ".lock")) {
    if (name === own) continue;
    const path = join5(settings.stateDir, `${name}.lock`);
    const last = Math.max(modified2(path), modified2(join5(settings.stateDir, `${name}.json`)));
    if (now - last <= waits.sweepAfterMs) continue;
    const lock = new Lock(path);
    if (await lock.acquire(0)) lock.release();
  }
}
async function sendLeft(settings, log, own, event, hooks) {
  const here = destination(settings);
  const markers = listed(settings.stateDir, ".pending").map((session) => ({ session, at: modified2(join5(settings.stateDir, `${session}.pending`)) })).sort((a, b) => a.at - b.at || (a.session < b.session ? -1 : 1));
  for (const { session } of markers) {
    if (session === own) continue;
    const lock = new Lock(join5(settings.stateDir, `${session}.lock`));
    if (!await lock.acquire(0)) continue;
    let emptied = true;
    try {
      const path = join5(settings.stateDir, `${session}.json`);
      let state;
      try {
        state = State.load(path);
      } catch {
        continue;
      }
      if (state.destination !== here) continue;
      const sender = new Sender(settings, log, session, event, hooks);
      const saver = new Saver(state, path);
      try {
        emptied = await sendPending(state, sender, log, session, event, saver);
      } finally {
        saver.save();
      }
    } finally {
      lock.release();
    }
    if (!emptied) return;
  }
}
function listed(folder, suffix) {
  try {
    return readdirSync2(folder).filter((name) => name.endsWith(suffix) && name.length > suffix.length).map((name) => name.slice(0, -suffix.length));
  } catch {
    return [];
  }
}
function modified2(path) {
  try {
    return statSync5(path).mtimeMs;
  } catch {
    return 0;
  }
}
function isFile(path) {
  try {
    return statSync5(path).isFile();
  } catch {
    return false;
  }
}
var Saver = class {
  constructor(state, path) {
    this.state = state;
    this.path = path;
  }
  state;
  path;
  #last = performance.now();
  soon() {
    if (performance.now() - this.#last >= waits.saveEveryMs) this.save();
  }
  save() {
    this.state.save(this.path);
    this.#last = performance.now();
  }
};
async function deliver(state, found, sender, given, subagents, log, saver) {
  const { sessionId: session, event } = given;
  const note = noter(state, log, session, event);
  await sendPending(state, sender, log, session, event, saver);
  let asked2 = state.tags;
  for (const turn of found) {
    asked2 = asked(asked2, turn.asked, note);
    const traceId2 = traceId(session, turn.promptUuid);
    if (state.sent.includes(traceId2)) {
      state.offset = turn.nextOffset;
      state.tags = asked2;
      continue;
    }
    if (!isComplete(turn, event, given.busy, subagents)) {
      log.line(session, event, `held ${traceId2.slice(0, 8)}: its turn is not over yet`);
      break;
    }
    if (turn.modelCalls.length === 0 && turn.toolCalls.length === 0) {
      state.offset = turn.nextOffset;
      state.tags = asked2;
      continue;
    }
    const made = build(turn, {
      sessionId: session,
      event,
      payloadError: given.error,
      subagents,
      read: readSubagent,
      provider: sender.settings.provider,
      tags: ofTurn(asked2, turn.folder, note),
      note
    });
    if (state.pending.length > 0) {
      state.pending.push(made);
    } else {
      const verdict = await sender.send(made, state.warned);
      noteVerdict(log, session, event, made, verdict);
      if (verdict.outcome === "undelivered") state.pending.push(made);
      else state.markSent(traceId2);
    }
    state.offset = turn.nextOffset;
    state.tags = asked2;
    saver.soon();
  }
  const dropped = state.trimPending();
  if (dropped > 0) {
    log.line(
      session,
      event,
      `dropped ${dropped} traces Telmoni could not take, the newest ${limits.pending} kept`
    );
  }
}
function noter(state, log, session, event) {
  return (text) => {
    if (!state.warned[`tags:${text}`]) {
      state.warned[`tags:${text}`] = true;
      log.line(session, event, text);
    }
  };
}
async function sendPending(state, sender, log, session, event, saver) {
  while (state.pending.length > 0) {
    const first = state.pending[0];
    const verdict = await sender.send(first, state.warned);
    noteVerdict(log, session, event, first, verdict);
    if (verdict.outcome === "undelivered") return false;
    state.pending.shift();
    if (typeof first.trace_id === "string") state.markSent(first.trace_id);
    saver.soon();
  }
  return true;
}
function readSubagent(known) {
  try {
    return readRows(known.path, 0).rows;
  } catch {
    return [];
  }
}
function noteVerdict(log, session, event, made, verdict) {
  const trace2 = String(made.trace_id).slice(0, 8);
  const lines = {
    sent: `sent ${trace2}`,
    partial: `taken in part ${trace2}: ${verdict.detail}`,
    refused: `refused, not sent again ${trace2}: ${verdict.detail}`,
    undelivered: `not delivered ${trace2}, sent again at the next hook: ${verdict.detail}`
  };
  log.line(session, event, lines[verdict.outcome]);
}
async function settle(path) {
  const deadline = performance.now() + waits.settleLimitMs;
  let seen = mark(path);
  let quietSince = performance.now();
  while (performance.now() < deadline) {
    await sleep2(waits.settlePollMs);
    const now = mark(path);
    if (now !== seen) {
      seen = now;
      quietSince = performance.now();
    } else if (performance.now() - quietSince >= waits.settleQuietMs) {
      return;
    }
  }
}
function mark(path) {
  try {
    const stat = statSync5(path, { bigint: true });
    return `${stat.size}:${stat.mtimeNs}`;
  } catch {
    return "gone";
  }
}
function nameOf3(fault) {
  return fault instanceof Error ? fault.name : typeof fault;
}

// src/bin/worker.ts
var raw = "";
try {
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
} catch {
}
await main(raw, process.env);
process.exit(0);
