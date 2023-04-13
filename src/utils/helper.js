export function clamp(input, min, max) {
  return input < min ? min : input > max ? max : input
}

export function map(current, in_min, in_max, out_min, out_max) {
  const mapped = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
  return clamp(mapped, out_min, out_max)
}

export function arrayEquals(array1, array2){
  if (JSON.stringify(array1) === JSON.stringify(array2)){
    return true
  } else {
    return false
  }
}
export const objectEquals = (objA, objB) => {
  const aProps = Object.keys(objA);
  const bProps = Object.keys(objB);

  if (aProps.length !== bProps.length) {
    return false;
  }

  for (let i = 0; i < aProps.length; i++) {
    const propName = aProps[i];

    if (objA[propName] !== objB[propName]) {
      return false;
    }
  }

  return true;
};