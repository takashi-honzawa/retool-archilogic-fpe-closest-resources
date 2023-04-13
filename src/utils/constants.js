export const startupSettings = {
  //planRotation: 90, 
  ui: { menu: false, scale: false },
  theme: {
    elements: {
      asset: {
        fillOpacity: 1,
      },
      roomStamp: {
        roomStampDisplay: ['usage']
      },
    },
    background: {
      color: '#ffffff',//'transparent',
      showGrid: false,
    },
  },
  units: {
    system: "imperial"
  }
}

export const defaultColors = {
  work: [0, 122, 255], 
  meet: [196, 0, 150],
  socialize: [255, 171, 0],
  support: [12, 24, 41],
  care: [189, 215, 255],
  circulate: [84, 192, 114],
  void: [255, 255, 255],
  other: [255, 255, 255]
}

export const deskColors = {
  default: [255, 255, 255],
  highlighted: [0, 122, 255]
}