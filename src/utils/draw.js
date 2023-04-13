export function createLine( position1, /*[number, number]*/ position2, color = '#5500ff') {
  let shapes = [];
  shapes.push({
    type: 'line',
    start: position1,
    end: position2,
    style: { stroke: color, strokeWidth: 10 },
  });
  return shapes;
}

export function createPolyline(polyline, color = '#5500ff', dash = false){
  let shapes = [];
  shapes.push({
    type: 'polyline',
    points: polyline,
    style: { stroke: color, strokeWidth: 10, dash: dash },
  });
  return shapes;
}

export function createPolygon(outline, holes, color = '#5500ff'){
  let shapes = [];
  shapes.push({
    type: 'polygon',
    points: outline,
    holes: holes,
    style: { stroke: color, strokeWidth: 10, fill: color, fillOpacity: 0.2 },
  });
  return shapes;
}

export function createPolygons(arr, color = '#5500ff'){
  let shapes = [];
  arr.forEach(el => {
    shapes.push({
      type: 'polygon',
      points: el,
      style: { stroke: color, fill: color, fillOpacity: 0.2, strokeWidth: 10 }
    })
  })
  return shapes;
}

export function removeLines(layer) {
  console.log('layer from removeLines !!!!!!', layer)
  if (layer.graphics.size !== 0) {
    layer.graphics.forEach((graphic) => {
      layer.deleteGraphic(graphic)
    });
  }
}