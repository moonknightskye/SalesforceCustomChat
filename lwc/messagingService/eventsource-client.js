import { createParser } from "./eventsource-parser.js";
const CONNECTING = "connecting",
  OPEN = "open",
  CLOSED = "closed",
  noop = () => {};
function createEventSource$1(optionsOrUrl, { getStream: getStream2 }) {
  const options =
      typeof optionsOrUrl == "string" || optionsOrUrl instanceof URL
        ? { url: optionsOrUrl }
        : optionsOrUrl,
    {
      onMessage,
      onConnect = noop,
      onDisconnect = noop,
      onScheduleReconnect = noop
    } = options,
    { fetch, url, initialLastEventId } = validate(options),
    requestHeaders = { ...options.headers },
    onCloseSubscribers = [],
    subscribers = onMessage ? [onMessage] : [],
    emit = (event) => subscribers.forEach((fn) => fn(event)),
    parser = createParser({ onEvent, onRetry });
  let request,
    currentUrl = url.toString(),
    controller = new AbortController(),
    lastEventId = initialLastEventId,
    reconnectMs = 2e3,
    reconnectTimer,
    readyState = CLOSED;
  return (
    connect(),
    {
      close,
      connect,
      [Symbol.iterator]: () => {
        throw new Error(
          "EventSource does not support synchronous iteration. Use `for await` instead."
        );
      },
      [Symbol.asyncIterator]: getEventIterator,
      get lastEventId() {
        return lastEventId;
      },
      get url() {
        return currentUrl;
      },
      get readyState() {
        return readyState;
      }
    }
  );
  function connect() {
    request ||
      ((readyState = CONNECTING),
      (controller = new AbortController()),
      (request = fetch(url, getRequestOptions())
        .then(onFetchResponse)
        .catch((err) => {
          (request = null),
            !(err.name === "AbortError" || err.type === "aborted") &&
              scheduleReconnect();
        })));
  }
  function close() {
    (readyState = CLOSED),
      controller.abort(),
      parser.reset(),
      clearTimeout(reconnectTimer),
      onCloseSubscribers.forEach((fn) => fn());
  }
  function getEventIterator() {
    const pullQueue = [],
      pushQueue = [];
    function pullValue() {
      return new Promise((resolve) => {
        const value = pushQueue.shift();
        value ? resolve({ value, done: !1 }) : pullQueue.push(resolve);
      });
    }
    const pushValue = function (value) {
      const resolve = pullQueue.shift();
      resolve ? resolve({ value, done: !1 }) : pushQueue.push(value);
    };
    function unsubscribe() {
      for (
        subscribers.splice(subscribers.indexOf(pushValue), 1);
        pullQueue.shift();

      );
      for (; pushQueue.shift(); );
    }
    function onClose() {
      const resolve = pullQueue.shift();
      resolve && (resolve({ done: !0, value: void 0 }), unsubscribe());
    }
    return (
      onCloseSubscribers.push(onClose),
      subscribers.push(pushValue),
      {
        next() {
          return readyState === CLOSED ? this.return() : pullValue();
        },
        return() {
          return unsubscribe(), Promise.resolve({ done: !0, value: void 0 });
        },
        throw(error) {
          return unsubscribe(), Promise.reject(error);
        },
        [Symbol.asyncIterator]() {
          return this;
        }
      }
    );
  }
  function scheduleReconnect() {
    onScheduleReconnect({ delay: reconnectMs }),
      (readyState = CONNECTING),
      (reconnectTimer = setTimeout(connect, reconnectMs));
  }
  async function onFetchResponse(response) {
    onConnect(), parser.reset();
    const { body, redirected, status } = response;
    if (status === 204) {
      onDisconnect(), close();
      return;
    }
    if (!body) throw new Error("Missing response body");
    redirected && (currentUrl = response.url);
    const stream = getStream2(body),
      decoder = new TextDecoder(),
      reader = stream.getReader();
    let open = !0;
    readyState = OPEN;
    do {
      const { done, value } = await reader.read();
      value && parser.feed(decoder.decode(value, { stream: !done })),
        done &&
          ((open = !1),
          (request = null),
          parser.reset(),
          scheduleReconnect(),
          onDisconnect());
    } while (open);
  }
  function onEvent(msg) {
    typeof msg.id == "string" && (lastEventId = msg.id), emit(msg);
  }
  function onRetry(ms) {
    reconnectMs = ms;
  }
  function getRequestOptions() {
    const {
        mode,
        credentials,
        body,
        method,
        redirect,
        referrer,
        referrerPolicy
      } = options,
      headers = {
        Accept: "text/event-stream",
        ...requestHeaders,
        ...(lastEventId ? { "Last-Event-ID": lastEventId } : void 0)
      };
    return {
      mode,
      credentials,
      body,
      method,
      redirect,
      referrer,
      referrerPolicy,
      headers,
      cache: "no-store",
      signal: controller.signal
    };
  }
}
function validate(options) {
  const fetch = options.fetch || globalThis.fetch;
  if (!isFetchLike(fetch))
    throw new Error(
      "No fetch implementation provided, and one was not found on the global object."
    );
  if (typeof AbortController != "function")
    throw new Error("Missing AbortController implementation");
  const { url, initialLastEventId } = options;
  if (typeof url != "string" && !(url instanceof URL))
    throw new Error("Invalid URL provided - must be string or URL instance");
  if (typeof initialLastEventId != "string" && initialLastEventId !== void 0)
    throw new Error(
      "Invalid initialLastEventId provided - must be string or undefined"
    );
  return { fetch, url, initialLastEventId };
}
function isFetchLike(fetch) {
  return typeof fetch == "function";
}
const defaultAbstractions = {
  getStream
};
function createEventSource(optionsOrUrl) {
  return createEventSource$1(optionsOrUrl, defaultAbstractions);
}
function getStream(body) {
  if (!(body instanceof ReadableStream))
    throw new Error("Invalid stream, expected a web ReadableStream");
  return body;
}
export { CLOSED, CONNECTING, OPEN, createEventSource };
//# sourceMappingURL=default.esm.js.map
