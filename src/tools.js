'use strict';

// like util.promisify but uses cb(result) format instead of callback(err, result)
function promisify(f) {
  return function (...args) { // return a wrapper-function (*)
    return new Promise((resolve, reject) => {
      function callback(result) { // our custom callback for f (**)
        resolve(result);
      }

      args.push(callback); // append our custom callback to the end of f arguments

      f.call(this, ...args); // call the original function
    });
  };
}

exports.promisify = promisify;