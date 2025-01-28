export const createDelayedMethod = () => {
  let timeout = setTimeout(() => {}, 0);

  return function (callback: () => void) {
    // Clear the previous timeout if the function is called again within 2 seconds
    clearTimeout(timeout);

    // Set a new timeout to execute the callback after 2 seconds of inactivity
    timeout = setTimeout(() => {
      callback();
    }, 2000);
  };
};
