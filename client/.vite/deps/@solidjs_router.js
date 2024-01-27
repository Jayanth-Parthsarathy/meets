import {
  $PROXY,
  $TRACK,
  DEV,
  Show,
  batch,
  children,
  createComponent,
  createContext,
  createMemo,
  createRenderEffect,
  createResource,
  createRoot,
  createSignal,
  delegateEvents,
  getListener,
  getOwner,
  isServer,
  mergeProps,
  on,
  onCleanup,
  resetErrorBoundaries,
  runWithOwner,
  sharedConfig,
  splitProps,
  spread,
  startTransition,
  template,
  untrack,
  useContext,
  voidFn
} from "./chunk-C7F2IG3J.js";

// node_modules/solid-js/store/dist/dev.js
var $RAW = Symbol("store-raw");
var $NODE = Symbol("store-node");
var $HAS = Symbol("store-has");
var $SELF = Symbol("store-self");
var DevHooks = {
  onStoreNodeUpdate: null
};
function wrap$1(value) {
  let p = value[$PROXY];
  if (!p) {
    Object.defineProperty(value, $PROXY, {
      value: p = new Proxy(value, proxyTraps$1)
    });
    if (!Array.isArray(value)) {
      const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
      for (let i = 0, l = keys.length; i < l; i++) {
        const prop = keys[i];
        if (desc[prop].get) {
          Object.defineProperty(value, prop, {
            enumerable: desc[prop].enumerable,
            get: desc[prop].get.bind(p)
          });
        }
      }
    }
  }
  return p;
}
function isWrappable(obj) {
  let proto;
  return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
}
function unwrap(item, set = /* @__PURE__ */ new Set()) {
  let result, unwrapped, v, prop;
  if (result = item != null && item[$RAW])
    return result;
  if (!isWrappable(item) || set.has(item))
    return item;
  if (Array.isArray(item)) {
    if (Object.isFrozen(item))
      item = item.slice(0);
    else
      set.add(item);
    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v, set)) !== v)
        item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item))
      item = Object.assign({}, item);
    else
      set.add(item);
    const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
    for (let i = 0, l = keys.length; i < l; i++) {
      prop = keys[i];
      if (desc[prop].get)
        continue;
      v = item[prop];
      if ((unwrapped = unwrap(v, set)) !== v)
        item[prop] = unwrapped;
    }
  }
  return item;
}
function getNodes(target, symbol) {
  let nodes = target[symbol];
  if (!nodes)
    Object.defineProperty(target, symbol, {
      value: nodes = /* @__PURE__ */ Object.create(null)
    });
  return nodes;
}
function getNode(nodes, property, value) {
  if (nodes[property])
    return nodes[property];
  const [s, set] = createSignal(value, {
    equals: false,
    internal: true
  });
  s.$ = set;
  return nodes[property] = s;
}
function proxyDescriptor$1(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE)
    return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => target[$PROXY][property];
  return desc;
}
function trackSelf(target) {
  getListener() && getNode(getNodes(target, $NODE), $SELF)();
}
function ownKeys(target) {
  trackSelf(target);
  return Reflect.ownKeys(target);
}
var proxyTraps$1 = {
  get(target, property, receiver) {
    if (property === $RAW)
      return target;
    if (property === $PROXY)
      return receiver;
    if (property === $TRACK) {
      trackSelf(target);
      return receiver;
    }
    const nodes = getNodes(target, $NODE);
    const tracked = nodes[property];
    let value = tracked ? tracked() : target[property];
    if (property === $NODE || property === $HAS || property === "__proto__")
      return value;
    if (!tracked) {
      const desc = Object.getOwnPropertyDescriptor(target, property);
      if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
        value = getNode(nodes, property, value)();
    }
    return isWrappable(value) ? wrap$1(value) : value;
  },
  has(target, property) {
    if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === $HAS || property === "__proto__")
      return true;
    getListener() && getNode(getNodes(target, $HAS), property)();
    return property in target;
  },
  set() {
    console.warn("Cannot mutate a Store directly");
    return true;
  },
  deleteProperty() {
    console.warn("Cannot mutate a Store directly");
    return true;
  },
  ownKeys,
  getOwnPropertyDescriptor: proxyDescriptor$1
};
function setProperty(state, property, value, deleting = false) {
  if (!deleting && state[property] === value)
    return;
  const prev = state[property], len = state.length;
  DevHooks.onStoreNodeUpdate && DevHooks.onStoreNodeUpdate(state, property, value, prev);
  if (value === void 0) {
    delete state[property];
    if (state[$HAS] && state[$HAS][property] && prev !== void 0)
      state[$HAS][property].$();
  } else {
    state[property] = value;
    if (state[$HAS] && state[$HAS][property] && prev === void 0)
      state[$HAS][property].$();
  }
  let nodes = getNodes(state, $NODE), node;
  if (node = getNode(nodes, property, prev))
    node.$(() => value);
  if (Array.isArray(state) && state.length !== len) {
    for (let i = state.length; i < len; i++)
      (node = nodes[i]) && node.$();
    (node = getNode(nodes, "length", len)) && node.$(state.length);
  }
  (node = nodes[$SELF]) && node.$();
}
function mergeStoreNode(state, value) {
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key]);
  }
}
function updateArray(current, next) {
  if (typeof next === "function")
    next = next(current);
  next = unwrap(next);
  if (Array.isArray(next)) {
    if (current === next)
      return;
    let i = 0, len = next.length;
    for (; i < len; i++) {
      const value = next[i];
      if (current[i] !== value)
        setProperty(current, i, value);
    }
    setProperty(current, "length", len);
  } else
    mergeStoreNode(current, next);
}
function updatePath(current, path, traversed = []) {
  let part, prev = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part, isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i = 0; i < part.length; i++) {
        updatePath(current, [part[i]].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i = 0; i < current.length; i++) {
        if (part(current[i], i))
          updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "object") {
      const { from = 0, to = current.length - 1, by = 1 } = part;
      for (let i = from; i <= to; i += by) {
        updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    prev = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(prev, traversed);
    if (value === prev)
      return;
  }
  if (part === void 0 && value == void 0)
    return;
  value = unwrap(value);
  if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
    mergeStoreNode(prev, value);
  } else
    setProperty(current, part, value);
}
function createStore(...[store, options]) {
  const unwrappedStore = unwrap(store || {});
  const isArray = Array.isArray(unwrappedStore);
  if (typeof unwrappedStore !== "object" && typeof unwrappedStore !== "function")
    throw new Error(
      `Unexpected type ${typeof unwrappedStore} received when initializing 'createStore'. Expected an object.`
    );
  const wrappedStore = wrap$1(unwrappedStore);
  DEV.registerGraph({
    value: unwrappedStore,
    name: options && options.name
  });
  function setStore(...args) {
    batch(() => {
      isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
    });
  }
  return [wrappedStore, setStore];
}
var $ROOT = Symbol("store-root");
function applyState(target, parent, property, merge, key) {
  const previous = parent[property];
  if (target === previous)
    return;
  const isArray = Array.isArray(target);
  if (property !== $ROOT && (!isWrappable(target) || !isWrappable(previous) || isArray !== Array.isArray(previous) || key && target[key] !== previous[key])) {
    setProperty(parent, property, target);
    return;
  }
  if (isArray) {
    if (target.length && previous.length && (!merge || key && target[0] && target[0][key] != null)) {
      let i, j, start, end, newEnd, item, newIndicesNext, keyVal;
      for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start] && target[start] && previous[start][key] === target[start][key]); start++) {
        applyState(target[start], previous, start, merge, key);
      }
      const temp = new Array(target.length), newIndices = /* @__PURE__ */ new Map();
      for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[start] && target[start] && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
        temp[newEnd] = previous[end];
      }
      if (start > newEnd || start > end) {
        for (j = start; j <= newEnd; j++)
          setProperty(previous, j, target[j]);
        for (; j < target.length; j++) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        }
        if (previous.length > target.length)
          setProperty(previous, "length", target.length);
        return;
      }
      newIndicesNext = new Array(newEnd + 1);
      for (j = newEnd; j >= start; j--) {
        item = target[j];
        keyVal = key && item ? item[key] : item;
        i = newIndices.get(keyVal);
        newIndicesNext[j] = i === void 0 ? -1 : i;
        newIndices.set(keyVal, j);
      }
      for (i = start; i <= end; i++) {
        item = previous[i];
        keyVal = key && item ? item[key] : item;
        j = newIndices.get(keyVal);
        if (j !== void 0 && j !== -1) {
          temp[j] = previous[i];
          j = newIndicesNext[j];
          newIndices.set(keyVal, j);
        }
      }
      for (j = start; j < target.length; j++) {
        if (j in temp) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        } else
          setProperty(previous, j, target[j]);
      }
    } else {
      for (let i = 0, len = target.length; i < len; i++) {
        applyState(target[i], previous, i, merge, key);
      }
    }
    if (previous.length > target.length)
      setProperty(previous, "length", target.length);
    return;
  }
  const targetKeys = Object.keys(target);
  for (let i = 0, len = targetKeys.length; i < len; i++) {
    applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
  }
  const previousKeys = Object.keys(previous);
  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (target[previousKeys[i]] === void 0)
      setProperty(previous, previousKeys[i], void 0);
  }
}
function reconcile(value, options = {}) {
  const { merge, key = "id" } = options, v = unwrap(value);
  return (state) => {
    if (!isWrappable(state) || !isWrappable(v))
      return v;
    const res = applyState(
      v,
      {
        [$ROOT]: state
      },
      $ROOT,
      merge,
      key
    );
    return res === void 0 ? state : res;
  };
}

// node_modules/@solidjs/router/dist/index.js
function createBeforeLeave() {
  let listeners = /* @__PURE__ */ new Set();
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  let ignore = false;
  function confirm(to, options) {
    if (ignore)
      return !(ignore = false);
    const e = {
      to,
      options,
      defaultPrevented: false,
      preventDefault: () => e.defaultPrevented = true
    };
    for (const l of listeners)
      l.listener({
        ...e,
        from: l.location,
        retry: (force) => {
          force && (ignore = true);
          l.navigate(to, {
            ...options,
            resolve: false
          });
        }
      });
    return !e.defaultPrevented;
  }
  return {
    subscribe,
    confirm
  };
}
var hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
var trimPathRegex = /^\/+|(\/)\/+$/g;
var mockBase = "http://sr";
var redirectStatusCodes = /* @__PURE__ */ new Set([204, 301, 302, 303, 307, 308]);
function normalizePath(path, omitSlash = false) {
  const s = path.replace(trimPathRegex, "$1");
  return s ? omitSlash || /^[?#]/.test(s) ? s : "/" + s : "";
}
function resolvePath(base, path, from) {
  if (hasSchemeRegex.test(path)) {
    return void 0;
  }
  const basePath = normalizePath(base);
  const fromPath = from && normalizePath(from);
  let result = "";
  if (!fromPath || path.startsWith("/")) {
    result = basePath;
  } else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
    result = basePath + fromPath;
  } else {
    result = fromPath;
  }
  return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}
function joinPaths(from, to) {
  return normalizePath(from).replace(/\/*(\*.*)?$/g, "") + normalizePath(to);
}
function extractSearchParams(url) {
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
function createMatcher(path, partial, matchFilters) {
  const [pattern, splat] = path.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  const len = segments.length;
  return (location) => {
    const locSegments = location.split("/").filter(Boolean);
    const lenDiff = locSegments.length - len;
    if (lenDiff < 0 || lenDiff > 0 && splat === void 0 && !partial) {
      return null;
    }
    const match = {
      path: len ? "" : "/",
      params: {}
    };
    const matchFilter = (s) => matchFilters === void 0 ? void 0 : matchFilters[s];
    for (let i = 0; i < len; i++) {
      const segment = segments[i];
      const locSegment = locSegments[i];
      const dynamic = segment[0] === ":";
      const key = dynamic ? segment.slice(1) : segment;
      if (dynamic && matchSegment(locSegment, matchFilter(key))) {
        match.params[key] = locSegment;
      } else if (dynamic || !matchSegment(locSegment, segment)) {
        return null;
      }
      match.path += `/${locSegment}`;
    }
    if (splat) {
      const remainder = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
      if (matchSegment(remainder, matchFilter(splat))) {
        match.params[splat] = remainder;
      } else {
        return null;
      }
    }
    return match;
  };
}
function matchSegment(input, filter) {
  const isEqual = (s) => s.localeCompare(input, void 0, {
    sensitivity: "base"
  }) === 0;
  if (filter === void 0) {
    return true;
  } else if (typeof filter === "string") {
    return isEqual(filter);
  } else if (typeof filter === "function") {
    return filter(input);
  } else if (Array.isArray(filter)) {
    return filter.some(isEqual);
  } else if (filter instanceof RegExp) {
    return filter.test(input);
  }
  return false;
}
function scoreRoute(route) {
  const [pattern, splat] = route.pattern.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === void 0 ? 0 : 1));
}
function createMemoObject(fn) {
  const map = /* @__PURE__ */ new Map();
  const owner = getOwner();
  return new Proxy({}, {
    get(_, property) {
      if (!map.has(property)) {
        runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
      }
      return map.get(property)();
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true
      };
    },
    ownKeys() {
      return Reflect.ownKeys(fn());
    }
  });
}
function mergeSearchString(search, params) {
  const merged = new URLSearchParams(search);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") {
      merged.delete(key);
    } else {
      merged.set(key, String(value));
    }
  });
  const s = merged.toString();
  return s ? `?${s}` : "";
}
function expandOptionals(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match)
    return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map((p) => p + expansion)], []);
}
var MAX_REDIRECTS = 100;
var RouterContextObj = createContext();
var RouteContextObj = createContext();
var useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
var useRoute = () => useContext(RouteContextObj) || useRouter().base;
var useResolvedPath = (path) => {
  const route = useRoute();
  return createMemo(() => route.resolvePath(path()));
};
var useHref = (to) => {
  const router = useRouter();
  return createMemo(() => {
    const to_ = to();
    return to_ !== void 0 ? router.renderPath(to_) : to_;
  });
};
var useNavigate = () => useRouter().navigatorFactory();
var useLocation = () => useRouter().location;
var useIsRouting = () => useRouter().isRouting;
var useMatch = (path, matchFilters) => {
  const location = useLocation();
  const matchers = createMemo(() => expandOptionals(path()).map((path2) => createMatcher(path2, void 0, matchFilters)));
  return createMemo(() => {
    for (const matcher of matchers()) {
      const match = matcher(location.pathname);
      if (match)
        return match;
    }
  });
};
var useParams = () => useRoute().params;
var useSearchParams = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setSearchParams = (params, options) => {
    const searchString = untrack(() => location.pathname + mergeSearchString(location.search, params) + location.hash);
    navigate(searchString, {
      scroll: false,
      resolve: false,
      ...options
    });
  };
  return [location.query, setSearchParams];
};
var useBeforeLeave = (listener) => {
  const s = useRouter().beforeLeave.subscribe({
    listener,
    location: useLocation(),
    navigate: useNavigate()
  });
  onCleanup(s);
};
function createRoutes(routeDef, base = "") {
  const {
    component,
    load,
    children: children2,
    metadata
  } = routeDef;
  const isLeaf = !children2 || Array.isArray(children2) && !children2.length;
  const shared = {
    key: routeDef,
    component,
    load,
    metadata
  };
  return asArray(routeDef.path).reduce((acc, path) => {
    for (const originalPath of expandOptionals(path)) {
      const path2 = joinPaths(base, originalPath);
      let pattern = isLeaf ? path2 : path2.split("/*", 1)[0];
      pattern = pattern.split("/").map((s) => {
        return s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s);
      }).join("/");
      acc.push({
        ...shared,
        originalPath,
        pattern,
        matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
      });
    }
    return acc;
  }, []);
}
function createBranch(routes, index = 0) {
  return {
    routes,
    score: scoreRoute(routes[routes.length - 1]) * 1e4 - index,
    matcher(location) {
      const matches = [];
      for (let i = routes.length - 1; i >= 0; i--) {
        const route = routes[i];
        const match = route.matcher(location);
        if (!match) {
          return null;
        }
        matches.unshift({
          ...match,
          route
        });
      }
      return matches;
    }
  };
}
function asArray(value) {
  return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", stack = [], branches = []) {
  const routeDefs = asArray(routeDef);
  for (let i = 0, len = routeDefs.length; i < len; i++) {
    const def = routeDefs[i];
    if (def && typeof def === "object") {
      if (!def.hasOwnProperty("path"))
        def.path = "";
      const routes = createRoutes(def, base);
      for (const route of routes) {
        stack.push(route);
        const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
        if (def.children && !isEmptyArray) {
          createBranches(def.children, route.pattern, stack, branches);
        } else {
          const branch = createBranch([...stack], branches.length);
          branches.push(branch);
        }
        stack.pop();
      }
    }
  }
  return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location) {
  for (let i = 0, len = branches.length; i < len; i++) {
    const match = branches[i].matcher(location);
    if (match) {
      return match;
    }
  }
  return [];
}
function createLocation(path, state) {
  const origin = new URL(mockBase);
  const url = createMemo((prev) => {
    const path_ = path();
    try {
      return new URL(path_, origin);
    } catch (err) {
      console.error(`Invalid path ${path_}`);
      return prev;
    }
  }, origin, {
    equals: (a, b) => a.href === b.href
  });
  const pathname = createMemo(() => url().pathname);
  const search = createMemo(() => url().search, true);
  const hash = createMemo(() => url().hash);
  const key = () => "";
  return {
    get pathname() {
      return pathname();
    },
    get search() {
      return search();
    },
    get hash() {
      return hash();
    },
    get state() {
      return state();
    },
    get key() {
      return key();
    },
    query: createMemoObject(on(search, () => extractSearchParams(url())))
  };
}
var intent;
function getIntent() {
  return intent;
}
function createRouterContext(integration, getBranches, options = {}) {
  const {
    signal: [source, setSource],
    utils = {}
  } = integration;
  const parsePath = utils.parsePath || ((p) => p);
  const renderPath = utils.renderPath || ((p) => p);
  const beforeLeave = utils.beforeLeave || createBeforeLeave();
  const basePath = resolvePath("", options.base || "");
  if (basePath === void 0) {
    throw new Error(`${basePath} is not a valid base path`);
  } else if (basePath && !source().value) {
    setSource({
      value: basePath,
      replace: true,
      scroll: false
    });
  }
  const [isRouting, setIsRouting] = createSignal(false);
  const start = async (callback) => {
    setIsRouting(true);
    try {
      await startTransition(callback);
    } finally {
      setIsRouting(false);
    }
  };
  const [reference, setReference] = createSignal(source().value);
  const [state, setState] = createSignal(source().state);
  const location = createLocation(reference, state);
  const referrers = [];
  const submissions = createSignal(isServer ? initFromFlash() : []);
  const baseRoute = {
    pattern: basePath,
    params: {},
    path: () => basePath,
    outlet: () => null,
    resolvePath(to) {
      return resolvePath(basePath, to);
    }
  };
  createRenderEffect(() => {
    const {
      value,
      state: state2
    } = source();
    untrack(() => {
      if (value !== reference()) {
        start(() => {
          intent = "native";
          setReference(value);
          setState(state2);
          resetErrorBoundaries();
          submissions[1]([]);
        }).then(() => {
          intent = void 0;
        });
      }
    });
  });
  return {
    base: baseRoute,
    location,
    isRouting,
    renderPath,
    parsePath,
    navigatorFactory,
    beforeLeave,
    preloadRoute,
    submissions
  };
  function navigateFromRoute(route, to, options2) {
    untrack(() => {
      if (typeof to === "number") {
        if (!to)
          ;
        else if (utils.go) {
          beforeLeave.confirm(to, options2) && utils.go(to);
        } else {
          console.warn("Router integration does not support relative routing");
        }
        return;
      }
      const {
        replace,
        resolve,
        scroll,
        state: nextState
      } = {
        replace: false,
        resolve: true,
        scroll: true,
        ...options2
      };
      const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
      if (resolvedTo === void 0) {
        throw new Error(`Path '${to}' is not a routable path`);
      } else if (referrers.length >= MAX_REDIRECTS) {
        throw new Error("Too many redirects");
      }
      const current = reference();
      if (resolvedTo !== current || nextState !== state()) {
        if (isServer) {
          const e = voidFn();
          e && (e.response = new Response(null, {
            status: 302,
            headers: {
              Location: resolvedTo
            }
          }));
          setSource({
            value: resolvedTo,
            replace,
            scroll,
            state: nextState
          });
        } else if (beforeLeave.confirm(resolvedTo, options2)) {
          const len = referrers.push({
            value: current,
            replace,
            scroll,
            state: state()
          });
          start(() => {
            intent = "navigate";
            setReference(resolvedTo);
            setState(nextState);
            resetErrorBoundaries();
            submissions[1]([]);
          }).then(() => {
            if (referrers.length === len) {
              intent = void 0;
              navigateEnd({
                value: resolvedTo,
                state: nextState
              });
            }
          });
        }
      }
    });
  }
  function navigatorFactory(route) {
    route = route || useContext(RouteContextObj) || baseRoute;
    return (to, options2) => navigateFromRoute(route, to, options2);
  }
  function navigateEnd(next) {
    const first = referrers[0];
    if (first) {
      if (next.value !== first.value || next.state !== first.state) {
        setSource({
          ...next,
          replace: first.replace,
          scroll: first.scroll
        });
      }
      referrers.length = 0;
    }
  }
  function preloadRoute(url, preloadData) {
    const matches = getRouteMatches(getBranches(), url.pathname);
    const prevIntent = intent;
    intent = "preload";
    for (let match in matches) {
      const {
        route,
        params
      } = matches[match];
      route.component && route.component.preload && route.component.preload();
      preloadData && route.load && route.load({
        params,
        location: {
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          query: extractSearchParams(url),
          state: null,
          key: ""
        },
        intent: "preload"
      });
    }
    intent = prevIntent;
  }
  function initFromFlash() {
    const e = voidFn();
    return e && e.initialSubmission ? [e.initialSubmission] : [];
  }
}
function createRouteContext(router, parent, outlet, match, params) {
  const {
    base,
    location
  } = router;
  const {
    pattern,
    component,
    load
  } = match().route;
  const path = createMemo(() => match().path);
  component && component.preload && component.preload();
  const data = load ? load({
    params,
    location,
    intent: intent || "initial"
  }) : void 0;
  const route = {
    parent,
    pattern,
    path,
    params,
    outlet: () => component ? createComponent(component, {
      params,
      location,
      data,
      get children() {
        return outlet();
      }
    }) : outlet(),
    resolvePath(to) {
      return resolvePath(base.path(), to, path());
    }
  };
  return route;
}
var createRouterComponent = (router) => (props) => {
  const {
    base
  } = props;
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(props.root ? {
    component: props.root,
    children: routeDefs()
  } : routeDefs(), props.base || ""));
  const routerState = createRouterContext(router, branches, {
    base
  });
  router.create && router.create(routerState);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return createComponent(Routes, {
        routerState,
        get branches() {
          return branches();
        }
      });
    }
  });
};
function Routes(props) {
  const matches = createMemo(() => getRouteMatches(props.branches, props.routerState.location.pathname));
  if (isServer) {
    const e = voidFn();
    e && (e.routerMatches || (e.routerMatches = [])).push(matches().map(({
      route,
      path,
      params: params2
    }) => ({
      path: route.originalPath,
      pattern: route.pattern,
      match: path,
      params: params2,
      metadata: route.metadata
    })));
  }
  const params = createMemoObject(() => {
    const m = matches();
    const params2 = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params2, m[i].params);
    }
    return params2;
  });
  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot((dispose) => {
          disposers[i] = dispose;
          next[i] = createRouteContext(props.routerState, next[i - 1] || props.routerState.base, createOutlet(() => routeStates()[i + 1]), () => matches()[i], params);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach((dispose) => dispose());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },
    keyed: true,
    children: (route) => createComponent(RouteContextObj.Provider, {
      value: route,
      get children() {
        return route.outlet();
      }
    })
  });
}
var createOutlet = (child) => {
  return () => createComponent(Show, {
    get when() {
      return child();
    },
    keyed: true,
    children: (child2) => createComponent(RouteContextObj.Provider, {
      value: child2,
      get children() {
        return child2.outlet();
      }
    })
  });
};
var Route = (props) => {
  const childRoutes = children(() => props.children);
  return mergeProps(props, {
    get children() {
      return childRoutes();
    }
  });
};
function intercept([value, setValue], get, set) {
  return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function querySelector(selector) {
  if (selector === "#") {
    return null;
  }
  try {
    return document.querySelector(selector);
  } catch (e) {
    return null;
  }
}
function createRouter(config) {
  let ignore = false;
  const wrap = (value) => typeof value === "string" ? {
    value
  } : value;
  const signal = intercept(createSignal(wrap(config.get()), {
    equals: (a, b) => a.value === b.value
  }), void 0, (next) => {
    !ignore && config.set(next);
    return next;
  });
  config.init && onCleanup(config.init((value = config.get()) => {
    ignore = true;
    signal[1](wrap(value));
    ignore = false;
  }));
  return createRouterComponent({
    signal,
    create: config.create,
    utils: config.utils
  });
}
function bindEvent(target, type, handler) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}
function scrollToHash(hash, fallbackTop) {
  const el = querySelector(`#${hash}`);
  if (el) {
    el.scrollIntoView();
  } else if (fallbackTop) {
    window.scrollTo(0, 0);
  }
}
function getPath(url) {
  const u = new URL(url);
  return u.pathname + u.search;
}
function StaticRouter(props) {
  let e;
  const obj = {
    value: props.url || (e = voidFn()) && getPath(e.request.url) || ""
  };
  return createRouterComponent({
    signal: [() => obj, (next) => Object.assign(obj, next)]
  })(props);
}
var LocationHeader = "Location";
var PRELOAD_TIMEOUT = 5e3;
var CACHE_TIMEOUT = 18e4;
var cacheMap = /* @__PURE__ */ new Map();
if (!isServer) {
  setInterval(() => {
    const now = Date.now();
    for (let [k, v] of cacheMap.entries()) {
      if (!v[3].size && now - v[0] > CACHE_TIMEOUT) {
        cacheMap.delete(k);
      }
    }
  }, 3e5);
}
function getCache() {
  if (!isServer)
    return cacheMap;
  const req = voidFn() || sharedConfig.context;
  if (!req)
    throw new Error("Cannot find cache context");
  return req.routerCache || (req.routerCache = /* @__PURE__ */ new Map());
}
function revalidate(key, force = true) {
  return startTransition(() => {
    const now = Date.now();
    cacheKeyOp(key, (entry) => {
      force && (entry[0] = 0);
      revalidateSignals(entry[3], now);
    });
  });
}
function cacheKeyOp(key, fn) {
  key && !Array.isArray(key) && (key = [key]);
  for (let k of cacheMap.keys()) {
    if (key === void 0 || matchKey(k, key))
      fn(cacheMap.get(k));
  }
}
function revalidateSignals(set, time) {
  for (let s of set)
    s[1](time);
}
function cache(fn, name, options) {
  const [store, setStore] = createStore({});
  if (fn.GET)
    fn = fn.GET;
  const cachedFn = (...args) => {
    const cache2 = getCache();
    const intent2 = getIntent();
    const owner = getOwner();
    const navigate = owner ? useNavigate() : void 0;
    const now = Date.now();
    const key = name + hashKey(args);
    let cached = cache2.get(key);
    let version;
    if (owner && !isServer) {
      version = createSignal(now, {
        equals: (p, v) => v - p < 50
        // margin of error
      });
      onCleanup(() => cached[3].delete(version));
      version[0]();
    }
    if (cached && (isServer || intent2 === "native" || Date.now() - cached[0] < PRELOAD_TIMEOUT)) {
      version && cached[3].add(version);
      if (cached[2] === "preload" && intent2 !== "preload") {
        cached[0] = now;
      }
      let res2 = cached[1];
      if (intent2 !== "preload") {
        res2 = "then" in cached[1] ? cached[1].then(handleResponse2(false), handleResponse2(true)) : handleResponse2(false)(cached[1]);
        !isServer && intent2 === "navigate" && startTransition(() => revalidateSignals(cached[3], cached[0]));
      }
      return res2;
    }
    let res = !isServer && sharedConfig.context && sharedConfig.load ? sharedConfig.load(key) : fn(...args);
    if (isServer && sharedConfig.context && !sharedConfig.context.noHydrate) {
      const e = voidFn();
      (!e || !e.serverOnly) && sharedConfig.context.serialize(key, res);
    }
    if (cached) {
      cached[0] = now;
      cached[1] = res;
      cached[2] = intent2;
      version && cached[3].add(version);
      if (!isServer && intent2 === "navigate") {
        startTransition(() => revalidateSignals(cached[3], cached[0]));
      }
    } else
      cache2.set(key, cached = [now, res, intent2, new Set(version ? [version] : [])]);
    if (intent2 !== "preload") {
      res = "then" in res ? res.then(handleResponse2(false), handleResponse2(true)) : handleResponse2(false)(res);
    }
    return res;
    function handleResponse2(error) {
      return async (v) => {
        if (v instanceof Response) {
          if (redirectStatusCodes.has(v.status)) {
            if (navigate) {
              startTransition(() => {
                let url = v.headers.get(LocationHeader);
                if (url && url.startsWith("/")) {
                  navigate(url, {
                    replace: true
                  });
                } else if (!isServer && url) {
                  window.location.href = url;
                }
              });
            }
            return;
          }
          if (v.customBody)
            v = await v.customBody();
        }
        if (error)
          throw v;
        if (isServer)
          return v;
        setStore(key, reconcile(v, options));
        return store[key];
      };
    }
  };
  cachedFn.keyFor = (...args) => name + hashKey(args);
  cachedFn.key = name;
  return cachedFn;
}
cache.set = (key, value) => {
  const cache2 = getCache();
  const now = Date.now();
  let cached = cache2.get(key);
  let version;
  if (getOwner()) {
    version = createSignal(now, {
      equals: (p, v) => v - p < 50
      // margin of error
    });
    onCleanup(() => cached[3].delete(version));
  }
  if (cached) {
    cached[0] = now;
    cached[1] = value;
    cached[2] = "preload";
    version && cached[3].add(version);
  } else
    cache2.set(key, cached = [now, value, , new Set(version ? [version] : [])]);
};
cache.clear = () => getCache().clear();
function matchKey(key, keys) {
  for (let k of keys) {
    if (key.startsWith(k))
      return true;
  }
  return false;
}
function hashKey(args) {
  return JSON.stringify(args, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
    result[key] = val[key];
    return result;
  }, {}) : val);
}
function isPlainObject(obj) {
  let proto;
  return obj != null && typeof obj === "object" && (!(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype);
}
var actions = /* @__PURE__ */ new Map();
function useSubmissions(fn, filter) {
  const router = useRouter();
  const subs = createMemo(() => router.submissions[0]().filter((s) => s.url === fn.toString() && (!filter || filter(s.input))));
  return new Proxy([], {
    get(_, property) {
      if (property === $TRACK)
        return subs();
      if (property === "pending")
        return subs().some((sub) => !sub.result);
      return subs()[property];
    }
  });
}
function useSubmission(fn, filter) {
  const submissions = useSubmissions(fn, filter);
  return new Proxy({}, {
    get(_, property) {
      var _a;
      return (_a = submissions[submissions.length - 1]) == null ? void 0 : _a[property];
    }
  });
}
function useAction(action2) {
  const router = useRouter();
  return (...args) => action2.apply(router, args);
}
function action(fn, name) {
  function mutate(...variables) {
    const p = fn(...variables);
    const [result, setResult] = createSignal();
    let submission;
    const router = this;
    async function handler(res) {
      const data = await handleResponse(res, router.navigatorFactory());
      data ? setResult({
        data
      }) : submission.clear();
      return data;
    }
    router.submissions[1]((s) => [...s, submission = {
      input: variables,
      url,
      get result() {
        var _a;
        return (_a = result()) == null ? void 0 : _a.data;
      },
      get pending() {
        return !result();
      },
      clear() {
        router.submissions[1]((v) => v.filter((i) => i.input !== variables));
      },
      retry() {
        setResult(void 0);
        const p2 = fn(...variables);
        p2.then(handler, handler);
        return p2;
      }
    }]);
    p.then(handler, handler);
    return p;
  }
  const url = fn.url || name && `https://action/${name}` || (!isServer ? `https://action/${hashString(fn.toString())}` : "");
  return toAction(mutate, url);
}
function toAction(fn, url) {
  fn.toString = () => {
    if (!url)
      throw new Error("Client Actions need explicit names if server rendered");
    return url;
  };
  fn.with = function(...args) {
    const newFn = function(...passedArgs) {
      return fn.call(this, ...args, ...passedArgs);
    };
    const uri = new URL(url, mockBase);
    uri.searchParams.set("args", hashKey(args));
    return toAction(newFn, (uri.origin === "https://action" ? uri.origin : "") + uri.pathname + uri.search);
  };
  fn.url = url;
  if (!isServer) {
    actions.set(url, fn);
    getOwner() && onCleanup(() => actions.delete(url));
  }
  return fn;
}
var hashString = (s) => s.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0) | 0, 0);
async function handleResponse(response, navigate) {
  let data;
  let keys;
  if (response instanceof Response) {
    if (response.headers.has("X-Revalidate"))
      keys = response.headers.get("X-Revalidate").split(",");
    if (response.customBody)
      data = await response.customBody();
    if (redirectStatusCodes.has(response.status)) {
      const locationUrl = response.headers.get("Location") || "/";
      if (locationUrl.startsWith("http")) {
        window.location.href = locationUrl;
      } else {
        navigate(locationUrl);
      }
    }
  } else
    data = response;
  cacheKeyOp(keys, (entry) => entry[0] = 0);
  await revalidate(keys, false);
  return data;
}
function setupNativeEvents(preload = true, explicitLinks = false, actionBase = "/_server") {
  return (router) => {
    const basePath = router.base.path();
    const navigateFromRoute = router.navigatorFactory(router.base);
    let preloadTimeout = {};
    function isSvg(el) {
      return el.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function handleAnchor(evt) {
      if (evt.defaultPrevented || evt.button !== 0 || evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey)
        return;
      const a = evt.composedPath().find((el) => el instanceof Node && el.nodeName.toUpperCase() === "A");
      if (!a || explicitLinks && !a.hasAttribute("link"))
        return;
      const svg = isSvg(a);
      const href = svg ? a.href.baseVal : a.href;
      const target = svg ? a.target.baseVal : a.target;
      if (target || !href && !a.hasAttribute("state"))
        return;
      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      if (a.hasAttribute("download") || rel && rel.includes("external"))
        return;
      const url = svg ? new URL(href, document.baseURI) : new URL(href);
      if (url.origin !== window.location.origin || basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase()))
        return;
      return [a, url];
    }
    function handleAnchorClick(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      const to = router.parsePath(url.pathname + url.search + url.hash);
      const state = a.getAttribute("state");
      evt.preventDefault();
      navigateFromRoute(to, {
        resolve: false,
        replace: a.hasAttribute("replace"),
        scroll: !a.hasAttribute("noscroll"),
        state: state && JSON.parse(state)
      });
    }
    function handleAnchorPreload(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      if (!preloadTimeout[url.pathname])
        router.preloadRoute(url, a.getAttribute("preload") !== "false");
    }
    function handleAnchorIn(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      if (preloadTimeout[url.pathname])
        return;
      preloadTimeout[url.pathname] = setTimeout(() => {
        router.preloadRoute(url, a.getAttribute("preload") !== "false");
        delete preloadTimeout[url.pathname];
      }, 200);
    }
    function handleAnchorOut(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [, url] = res;
      if (preloadTimeout[url.pathname]) {
        clearTimeout(preloadTimeout[url.pathname]);
        delete preloadTimeout[url.pathname];
      }
    }
    function handleFormSubmit(evt) {
      let actionRef = evt.submitter && evt.submitter.hasAttribute("formaction") ? evt.submitter.getAttribute("formaction") : evt.target.getAttribute("action");
      if (!actionRef)
        return;
      if (!actionRef.startsWith("https://action/")) {
        const url = new URL(actionRef, mockBase);
        actionRef = router.parsePath(url.pathname + url.search);
        if (!actionRef.startsWith(actionBase))
          return;
      }
      if (evt.target.method.toUpperCase() !== "POST")
        throw new Error("Only POST forms are supported for Actions");
      const handler = actions.get(actionRef);
      if (handler) {
        evt.preventDefault();
        const data = new FormData(evt.target);
        if (evt.submitter && evt.submitter.name)
          data.append(evt.submitter.name, evt.submitter.value);
        handler.call(router, data);
      }
    }
    delegateEvents(["click", "submit"]);
    document.addEventListener("click", handleAnchorClick);
    if (preload) {
      document.addEventListener("mouseover", handleAnchorIn);
      document.addEventListener("mouseout", handleAnchorOut);
      document.addEventListener("focusin", handleAnchorPreload);
      document.addEventListener("touchstart", handleAnchorPreload);
    }
    document.addEventListener("submit", handleFormSubmit);
    onCleanup(() => {
      document.removeEventListener("click", handleAnchorClick);
      if (preload) {
        document.removeEventListener("mouseover", handleAnchorIn);
        document.removeEventListener("mouseout", handleAnchorOut);
        document.removeEventListener("focusin", handleAnchorPreload);
        document.removeEventListener("touchstart", handleAnchorPreload);
      }
      document.removeEventListener("submit", handleFormSubmit);
    });
  };
}
function Router(props) {
  if (isServer)
    return StaticRouter(props);
  return createRouter({
    get: () => ({
      value: window.location.pathname + window.location.search + window.location.hash,
      state: history.state
    }),
    set({
      value,
      replace,
      scroll,
      state
    }) {
      if (replace) {
        window.history.replaceState(state, "", value);
      } else {
        window.history.pushState(state, "", value);
      }
      scrollToHash(window.location.hash.slice(1), scroll);
    },
    init: (notify) => bindEvent(window, "popstate", () => notify()),
    create: setupNativeEvents(props.preload, props.explicitLinks, props.actionBase),
    utils: {
      go: (delta) => window.history.go(delta)
    }
  })(props);
}
function hashParser(str) {
  const to = str.replace(/^.*?#/, "");
  if (!to.startsWith("/")) {
    const [, path = "/"] = window.location.hash.split("#", 2);
    return `${path}#${to}`;
  }
  return to;
}
function HashRouter(props) {
  return createRouter({
    get: () => window.location.hash.slice(1),
    set({
      value,
      replace,
      scroll,
      state
    }) {
      if (replace) {
        window.history.replaceState(state, "", "#" + value);
      } else {
        window.location.hash = value;
      }
      const hashIndex = value.indexOf("#");
      const hash = hashIndex >= 0 ? value.slice(hashIndex + 1) : "";
      scrollToHash(hash, scroll);
    },
    init: (notify) => bindEvent(window, "hashchange", () => notify()),
    create: setupNativeEvents(props.preload, props.explicitLinks, props.actionBase),
    utils: {
      go: (delta) => window.history.go(delta),
      renderPath: (path) => `#${path}`,
      parsePath: hashParser
    }
  })(props);
}
function createMemoryHistory() {
  const entries = ["/"];
  let index = 0;
  const listeners = [];
  const go = (n) => {
    index = Math.max(0, Math.min(index + n, entries.length - 1));
    const value = entries[index];
    listeners.forEach((listener) => listener(value));
  };
  return {
    get: () => entries[index],
    set: ({
      value,
      scroll,
      replace
    }) => {
      if (replace) {
        entries[index] = value;
      } else {
        entries.splice(index + 1, entries.length - index, value);
        index++;
      }
      if (scroll) {
        scrollToHash(value.split("#")[1] || "", true);
      }
    },
    back: () => {
      go(-1);
    },
    forward: () => {
      go(1);
    },
    go,
    listen: (listener) => {
      listeners.push(listener);
      return () => {
        const index2 = listeners.indexOf(listener);
        listeners.splice(index2, 1);
      };
    }
  };
}
function MemoryRouter(props) {
  const memoryHistory = props.history || createMemoryHistory();
  return createRouter({
    get: memoryHistory.get,
    set: memoryHistory.set,
    init: memoryHistory.listen,
    utils: {
      go: memoryHistory.go
    }
  })(props);
}
var _tmpl$ = template(`<a>`);
function A(props) {
  props = mergeProps({
    inactiveClass: "inactive",
    activeClass: "active"
  }, props);
  const [, rest] = splitProps(props, ["href", "state", "class", "activeClass", "inactiveClass", "end"]);
  const to = useResolvedPath(() => props.href);
  const href = useHref(to);
  const location = useLocation();
  const isActive = createMemo(() => {
    const to_ = to();
    if (to_ === void 0)
      return false;
    const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
    const loc = normalizePath(location.pathname).toLowerCase();
    return props.end ? path === loc : loc.startsWith(path);
  });
  return (() => {
    const _el$ = _tmpl$();
    spread(_el$, mergeProps(rest, {
      get href() {
        return href() || props.href;
      },
      get state() {
        return JSON.stringify(props.state);
      },
      get classList() {
        return {
          ...props.class && {
            [props.class]: true
          },
          [props.inactiveClass]: !isActive(),
          [props.activeClass]: isActive(),
          ...rest.classList
        };
      },
      "link": "",
      get ["aria-current"]() {
        return isActive() ? "page" : void 0;
      }
    }), false, false);
    return _el$;
  })();
}
function Navigate(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    href,
    state
  } = props;
  const path = typeof href === "function" ? href({
    navigate,
    location
  }) : href;
  navigate(path, {
    replace: true,
    state
  });
  return null;
}
function createAsync(fn, options) {
  const [resource] = createResource(() => subFetch(fn), (v) => v, options);
  return () => resource();
}
var MockPromise = class _MockPromise {
  static all() {
    return new _MockPromise();
  }
  static allSettled() {
    return new _MockPromise();
  }
  static any() {
    return new _MockPromise();
  }
  static race() {
    return new _MockPromise();
  }
  static reject() {
    return new _MockPromise();
  }
  static resolve() {
    return new _MockPromise();
  }
  catch() {
    return new _MockPromise();
  }
  then() {
    return new _MockPromise();
  }
  finally() {
    return new _MockPromise();
  }
};
function subFetch(fn) {
  if (isServer || !sharedConfig.context)
    return fn();
  const ogFetch = fetch;
  const ogPromise = Promise;
  try {
    window.fetch = () => new MockPromise();
    Promise = MockPromise;
    return fn();
  } finally {
    window.fetch = ogFetch;
    Promise = ogPromise;
  }
}
function redirect(url, init = 302) {
  let responseInit;
  let revalidate2;
  if (typeof init === "number") {
    responseInit = {
      status: init
    };
  } else {
    ({
      revalidate: revalidate2,
      ...responseInit
    } = init);
    if (typeof responseInit.status === "undefined") {
      responseInit.status = 302;
    }
  }
  const headers = new Headers(responseInit.headers);
  headers.set("Location", url);
  revalidate2 && headers.set("X-Revalidate", revalidate2.toString());
  const response = new Response(null, {
    ...responseInit,
    headers
  });
  return response;
}
function reload(init) {
  const {
    revalidate: revalidate2,
    ...responseInit
  } = init;
  return new Response(null, {
    ...responseInit,
    ...revalidate2 ? {
      headers: new Headers(responseInit.headers).set("X-Revalidate", revalidate2.toString())
    } : {}
  });
}
function json(data, init) {
  const headers = new Headers((init || {}).headers);
  headers.set("Content-Type", "application/json");
  const response = new Response(JSON.stringify(data), {
    ...init,
    headers
  });
  response.customBody = () => data;
  return response;
}
export {
  A,
  HashRouter,
  MemoryRouter,
  Navigate,
  Route,
  Router,
  StaticRouter,
  mergeSearchString as _mergeSearchString,
  action,
  cache,
  createAsync,
  createBeforeLeave,
  createMemoryHistory,
  createRouter,
  json,
  redirect,
  reload,
  revalidate,
  useAction,
  useBeforeLeave,
  useHref,
  useIsRouting,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
  useResolvedPath,
  useSearchParams,
  useSubmission,
  useSubmissions
};
//# sourceMappingURL=@solidjs_router.js.map
