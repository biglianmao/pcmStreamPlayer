import requestFrame from 'request-frame';
const request = requestFrame('request'); // window.requestAnimationFrame | setTimeout
const cancel = requestFrame('cancel'); // window.cancelAnimationFrame | cancelTimeout
/**
 * Create a function which will be called at the next requestAnimationFrame
 * cycle
 *
 * @param {function} func The function to call
 *
 * @return {func} The function wrapped within a requestAnimationFrame
 */
export default function frame(func) {
  // return (...args) => reqAnimationFrame(() => func(...args));
  return (...args) => {
    const requestId = request(() => func(...args));
    return () => cancel(requestId);
  };
}
