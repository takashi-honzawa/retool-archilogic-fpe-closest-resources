import React, { useEffect, useRef } from 'react';
import { FloorPlanEngine } from '@archilogic/floor-plan-sdk'
import './FloorPlan.css'

import {
  startupSettings,
  defaultColors,
  deskColors,
  objectEquals
} from './utils'

let hasLoaded = false
let fpe
let colorScheme
let showIcons

let spaceColorObjects = []
let cursorMarker
let nearestMarkers = []

let desks
let deskCount
let selectedSpaces
let safetyAssets

let prevClickedAssetId
let prevNearestDistances

const FloorPlan = ({ triggerQuery, model, modelUpdate }) => {
  const container = useRef(null);

  console.log('model', model)
  const { token, floorId } = model

  function addMarker(fpe, position, isCursorMarker, markerType = 'defalut-marker') {
    const el = document.createElement('div');
    el.className =  isCursorMarker ? "cursor-marker" : "icon-marker"
    el.classList.add(markerType)

    const marker = fpe.addHtmlMarker({
      el,
      pos: position,
      offset: [0, 0],
      radius: false,
    });
    return marker;
  }
  function getDistance(p1, p2) {
    let x = p2.x - p1.x;
    let y = p2.y - p1.y;
    return Math.sqrt(x * x + y * y);
  }
  function removeCursorMarker(){
    if (cursorMarker){
      cursorMarker.remove();
      cursorMarker = undefined
    }
  }
  function removeNearestMarkers(){
    if (nearestMarkers.length !== 0){
      nearestMarkers.forEach(marker => marker.remove())
      nearestMarkers = [];
    }
  }

  function selectSpacesAssets(resources){
    desks = resources.assets.filter(asset => asset.subCategories.includes("desk"))
    deskCount = desks.length

    const meetingRoom = resources.spaces.filter(space => space.program === "meet")
    const socializeSpace = resources.spaces.filter(space => space.program === "socialize")
    const restroom = resources.spaces.filter(space => space.usage === "restroom")
    const storage = resources.spaces.filter(space => space.usage === 'storage')
    const elevator = resources.spaces.filter(space => space.usage === 'elevator')
    const staircase = resources.spaces.filter(space => space.usage === 'staircase')

    selectedSpaces = {
      meetingRoom: meetingRoom,
      socializeSpace: socializeSpace,
      restroom: restroom,
      storage: storage,
      elevator: elevator,
      staircase: staircase
    }
    
    const aed = resources.assets.filter(asset => asset.productId == '79ee0055-9660-4cb0-9bdb-924b383890eb')
    const emergencyExit = resources.assets.filter(asset => asset.productId == 'b76ebd68-59d5-48c8-af38-0cd9d514c05c')
    const fireHose = resources.assets.filter(asset => asset.productId == 'f7bb8b7b-004d-4b7f-90fd-ad8e0b7e17c2')
    const fireAlarm = resources.assets.filter(asset => asset.productId == '530952b6-8961-4be4-b4d6-cbb9859d8756')
    const extinguisher = resources.assets.filter(asset => asset.productId == '4a60754a-19c4-41da-aa6c-13a9b3e66d4c')
    const sanitizer = resources.assets.filter(asset => asset.productId == '402d9f73-4eb1-4dbb-8108-c565cdd1edf7')
      
    safetyAssets = {
      aed: aed,
      emergencyExit: emergencyExit,
      fireHose: fireHose,
      fireAlarm: fireAlarm,
      extinguisher: extinguisher,
      sanitizer: sanitizer
    }
  }

  function createSpaceColorObjects(spaceResources) {
    removeCursorMarker()
    removeNearestMarkers()
    
    if(model.colorScheme === "monochrome"){
      createMonochromeColors(spaceResources)
      highlightDesksChairs(fpe.resources.assets, deskColors['highlighted'], 0.4)
      colorScheme = 'monochrome'
      if(model.showIcons){
        addAllIconMarkers()
        showIcons = true
      } else {
        showIcons = false
      }
    } else {
      createDefaultColors(spaceResources)
      highlightDesksChairs(fpe.resources.assets, deskColors['default'], 1)
      colorScheme = 'default'
      showIcons = false
    }
  }
  function createDefaultColors(spaceResources){
    spaceColorObjects = []
    spaceResources.forEach(space => {
      if ( space.program ) {
        const color = defaultColors[space.program]
        const spaceColorObject = {
          space,
          displayData: { value: null, gradientIndex: null, color: color }
        }
        spaceColorObject.space.node.setHighlight({
          fill: color,
          fillOpacity: 0.4
        })
        spaceColorObjects.push(spaceColorObject)
      } else {
        const color = defaultColors['other']
        const spaceColorObject = {
          space,
          displayData: { value: null, gradientIndex: null, color: color }
        }
        spaceColorObject.space.node.setHighlight({
          fill: color,
          fillOpacity: 0.4
        })
        spaceColorObjects.push(spaceColorObject)
      }
    })
  }
  function createMonochromeColors(spaceResources){
    spaceColorObjects = []
    const color = [255, 255, 255]
    spaceResources.forEach(space => {
      const spaceColorObject = {
        space,
        displayData: { value: null, gradientIndex: null, color: color }
      }
      spaceColorObject.space.node.setHighlight({
        fill: color,
        fillOpacity: 0.4
      })
      spaceColorObjects.push(spaceColorObject)
    })
  }
  function setSpaceColorObjectFillOpacity(opacity){
    spaceColorObjects.forEach(spaceColorObject => {
      spaceColorObject.space.node.setHighlight({
        fill: spaceColorObject.displayData.color,
        fillOpacity: opacity
      })
    })
  }
  function highlightDesksChairs(assets, color, opacity){
    assets.forEach(asset => {
      if(asset.subCategories[0] === 'desk' || asset.subCategories[0] === 'taskChair'){
        asset.node.setHighlight({
          fill: color,
          fillOpacity: opacity
        })
      }
    })
  }
  function addAllIconMarkers(){
    for (let spaceType in selectedSpaces){
      selectedSpaces[spaceType].map(space => {
        const marker = addMarker(fpe, [space.center[0], space.center[1]], false, spaceType);
        nearestMarkers.push(marker);
      })
    }

    for (let assetType in safetyAssets){
      safetyAssets[assetType].map(asset => {
        const marker = addMarker(fpe, [asset.position.x, asset.position.z], false, assetType);
        nearestMarkers.push(marker);
      })
    }
  }
    
  function calculateAverageDistance(){
    const shortestDistancesFromDesks = {
      meetingRoom: [],
      socializeSpace: [],
      restroom: [],
      storage: [],
      elevator: [],
      staircase: [],
      aed: [],
      emergencyExit: [],
      fireHose: [],
      fireAlarm: [],
      extinguisher: [],
      sanitizer: [],
    }

    for (const desk of desks){
      for (let spaceType in selectedSpaces){
        const distanceArr = []
        selectedSpaces[spaceType].forEach(space => {
          const distance = getDistance({x: desk.position.x, y: desk.position.z}, {x: space.center[0], y: space.center[1]})
          distanceArr.push(distance)
        })
        distanceArr.sort((a, b) => a - b)
        shortestDistancesFromDesks[spaceType].push(distanceArr[0])
      }
      for (let assetType in safetyAssets){
        const distanceArr = []
        safetyAssets[assetType].forEach(asset => {
          const distance = getDistance({x: desk.position.x, y: desk.position.z}, {x: asset.position.x, y: asset.position.z})
          distanceArr.push(distance)
        })
        distanceArr.sort((a, b) => a - b)
        shortestDistancesFromDesks[assetType].push(distanceArr[0])
      }
    }
    const avgDistanceSpaceAssetType = {}
    for (let spaceAssetType in shortestDistancesFromDesks){
      const sum = shortestDistancesFromDesks[spaceAssetType].reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );
      avgDistanceSpaceAssetType[spaceAssetType] = sum / deskCount
    }
    
    modelUpdate({avgDistances: avgDistanceSpaceAssetType})
  }

  function onClick(fpe){
    if(!fpe) return
    
    fpe.on('click', (event) => {
      const position = event.pos
      const positionResources = fpe.getResourcesFromPosition(position)

      if(!positionResources.assets.length){
        removeCursorMarker()
        removeNearestMarkers()
        setSpaceColorObjectFillOpacity(0.4)
        return
      }
      
      const selectedAsset = positionResources.assets[0]

      if(selectedAsset.subCategories[0] !== 'desk' && selectedAsset.subCategories[0] !== 'taskChair') {
        removeCursorMarker()
        removeNearestMarkers()
        setSpaceColorObjectFillOpacity(0.4)
        return
      }

      if (prevClickedAssetId && prevClickedAssetId == selectedAsset.id) return
      prevClickedAssetId = selectedAsset.id
      
      setSpaceColorObjectFillOpacity(0.2)

      //remove markers if exists
      removeCursorMarker()
      removeNearestMarkers()

      //add cursorMarker
      cursorMarker = addMarker(fpe, position, true)

      let nearestDistances = {}

      for (let spaceType in selectedSpaces){
        const spaceCenterArr = [];
        if(selectedSpaces[spaceType].length !== 0){
          selectedSpaces[spaceType].map(space => {
            const distance = getDistance({x: position[0], y: position[1]}, {x: space.center[0], y: space.center[1]});
            spaceCenterArr.push({x: space.center[0], y: space.center[1], distance: distance});
          })
        }
        
        if(spaceCenterArr.length !== 0){
          spaceCenterArr.sort((a, b) => a.distance - b.distance);
          for (let i = 0; i < 1; i++){
            const marker = addMarker(fpe, [spaceCenterArr[i].x, spaceCenterArr[i].y], false, spaceType);
            nearestMarkers.push(marker);
            const distanceRounded = Math.round(spaceCenterArr[i].distance * 10) / 10;
            
            nearestDistances[spaceType] = distanceRounded;
          }
        } else {
          nearestDistances[spaceType] = null
        }
        
      }

      for (let assetType in safetyAssets){
        const assetCenterArr = [];
        if(safetyAssets[assetType].length !== 0){
          safetyAssets[assetType].map(asset => {
            const distance = getDistance({x: position[0], y: position[1]}, {x: asset.position.x, y: asset.position.z});
            assetCenterArr.push({x: asset.position.x, y: asset.position.z, distance: distance});
          })
        }
        
        if(assetCenterArr.length !== 0){
          assetCenterArr.sort((a, b) => a.distance - b.distance);

          for (let i = 0; i < 1; i++){
            const marker = addMarker(fpe, [assetCenterArr[i].x, assetCenterArr[i].y], false, assetType);
            nearestMarkers.push(marker);
            const distanceRounded = Math.round(assetCenterArr[i].distance * 10) / 10;
            
            nearestDistances[assetType] = distanceRounded;
          }
        } else {
          nearestDistances[assetType] = null
        }
       
      }

      if (!prevNearestDistances){
        prevNearestDistances = nearestDistances
        modelUpdate({nearestDistances: nearestDistances})
      } else if (objectEquals(prevNearestDistances, nearestDistances)){
        return
      } else {
        prevNearestDistances = nearestDistances
        modelUpdate({nearestDistances: nearestDistances})
      }
    })
  }

  async function initFloorPlan(){
    if(!token || !floorId) return
    
    fpe = new FloorPlanEngine({container: container.current, options: startupSettings})
    const fpeLoaded = await fpe.loadScene(floorId, {publishableAccessToken: token})
    hasLoaded = floorId
    
    return fpe
  }
  useEffect(() => {
    if(fpe && hasLoaded === floorId) return
    if(container.current){
      initFloorPlan()
      .then((fpe) => {
        selectSpacesAssets(fpe.resources)
        createSpaceColorObjects(fpe.resources.spaces)
        calculateAverageDistance()
      })
    }
  })

  useEffect(() => {
    if(!fpe) return
    onClick(fpe)
    if(model.colorScheme === colorScheme && model.showIcons === showIcons) return
    if(!colorScheme && !showIcons) return
    createSpaceColorObjects(fpe.resources.spaces)
  })
  
  return(
    <div className='fpe' id="floor-plan" ref={container}></div>
  )
}

export default FloorPlan