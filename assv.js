'use strict';


const getXfromValue = (v) => {
  return (v * Math.E) / (1 - v);
}

const getValueFromX = (x) => {
  return x / (x + Math.E);
}

const getAdjustedAssociativeValue = (assv, success) => {
  var x = getXfromValue(assv);
  if (success) {
    x += 0.1;
    return getValueFromX(x);
  } else {
    x -= 0.1;
    return getValueFromX(x);
  }
}
console.log(getXfromValue(0.5));
console.log(getValueFromX(0.5));
console.log(getValueFromX(getXfromValue(0.5)));
console.log(getAdjustedAssociativeValue(0.1, true));
console.log(getAdjustedAssociativeValue(0.8, true));