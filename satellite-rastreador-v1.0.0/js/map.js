import { Storage } from './storage.js';
import { footprintRadiusMeters } from './orbit.js';
import { normalizeSatelliteIcon, satelliteIconUrl } from './icons.js';

function makeSatelliteIcon(record){
  const key=normalizeSatelliteIcon(record.iconKey);
  return L.icon({
    iconUrl:satelliteIconUrl(key,32),
    iconRetinaUrl:satelliteIconUrl(key,64),
    iconSize:[32,32],iconAnchor:[16,16],tooltipAnchor:[0,-17],popupAnchor:[0,-16],
    className:'satellite-image-marker'
  });
}

function shiftedSegments(segments,offset){
  if(!offset)return segments||[];
  return (segments||[]).map(seg=>seg.map(([lat,lon])=>[lat,lon+offset]));
}

function setMarkerVisual(marker,record,selected=false){
  const el=marker?.getElement?.();
  if(!el)return;
  el.style.setProperty('--sat-color',record.color||'#6aa8ff');
  el.classList.toggle('selected',!!selected);
}

export class MapManager extends EventTarget {
  constructor(elementId='map'){
    super();
    this.map=L.map(elementId,{
      zoomControl:false,
      worldCopyJump:true,
      scrollWheelZoom:true,wheelDebounceTime:25,wheelPxPerZoomLevel:140,
      zoomSnap:.5,zoomDelta:.5,touchZoom:'center',doubleClickZoom:false,
      inertia:true,inertiaDeceleration:2500,inertiaMaxSpeed:1500,maxZoom:22,minZoom:2
    }).setView([0,0],2);
    this.map.on('dblclick',e=>this.map.setZoomAround(e.latlng,Math.min(this.map.getMaxZoom(),this.map.getZoom()+.5)));
    this.map.on('contextmenu',e=>this.dispatchEvent(new CustomEvent('observerpick',{detail:{lat:e.latlng.lat,lon:e.latlng.lng,altMeters:0}})));
    this.createPanes(); this.createBases(); this.layers=new Map(); this.selectedId=null;this.followId=null;this.watchId=null;this.observer=null;this.observerMode=null;this._worldOffsetsKey='';
    this.currentBaseKey='osm'; this.showLabels=true;
    const saved=Storage.loadMapView(); if(saved?.center&&Number.isFinite(saved.zoom)) this.map.setView(saved.center,saved.zoom,{animate:false});
    this.showFootprints=true;
    this.map.on('moveend zoomend',()=>{
      const c=this.map.wrapLatLng(this.map.getCenter());Storage.saveMapView({center:[c.lat,c.lng],zoom:this.map.getZoom()});
      this.refreshWorldCopies();this.dispatchEvent(new Event('viewportchange'));
    });
    this.map.on('move',()=>{this.refreshWorldCopies();this.dispatchEvent(new Event('viewportchange'));});
  }
  createPanes(){
    for(const [name,z] of Object.entries({baseLabelsPane:350,orbitPane:720,satPane:750})){
      if(!this.map.getPane(name))this.map.createPane(name);
      const p=this.map.getPane(name);p.style.zIndex=z;p.style.pointerEvents='none';
    }
    this.map.getPane('satPane').style.pointerEvents='auto';
  }
  createBases(){
    const common={maxZoom:22,updateWhenZooming:true,updateWhenIdle:false,keepBuffer:3,noWrap:false};

    // Todos los mapas se montan sobre una base SIN textos y una capa de etiquetas
    // independiente. Así el botón Aa solo quita/añade nombres; no cambia bosques,
    // carreteras, costas, relieve ni el resto de la cartografía.
    this.bases={
      osm:L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',{...common,maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      light:L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{...common,maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      dark:L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{...common,maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      sat:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{...common,maxNativeZoom:19,attribution:'Tiles © Esri'})
    };
    this.labelOverlays={
      osm:L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',{...common,pane:'baseLabelsPane',maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      light:L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{...common,pane:'baseLabelsPane',maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      dark:L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{...common,pane:'baseLabelsPane',maxNativeZoom:20,attribution:'© OpenStreetMap © CARTO'}),
      sat:L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{...common,pane:'baseLabelsPane',maxNativeZoom:19,attribution:'Labels © Esri'})
    };
    this.currentBase=null; this.currentLabelOverlay=null;
    this.applyBase();
  }
  applyBase(){
    const next=this.bases[this.currentBaseKey]||this.bases.osm;
    if(this.currentBase&&this.map.hasLayer(this.currentBase))this.map.removeLayer(this.currentBase);
    next.addTo(this.map); this.currentBase=next;

    if(this.currentLabelOverlay&&this.map.hasLayer(this.currentLabelOverlay))this.map.removeLayer(this.currentLabelOverlay);
    this.currentLabelOverlay=null;
    const wanted=this.showLabels?this.labelOverlays[this.currentBaseKey]:null;
    if(wanted){wanted.addTo(this.map);this.currentLabelOverlay=wanted;}
  }
  setBase(key){ this.currentBaseKey=key||'osm'; this.applyBase(); }
  setLabels(on){ this.showLabels=!!on; this.applyBase(); }

  visibleWorldOffsets(){
    const b=this.map.getBounds(),west=b.getWest(),east=b.getEast();
    let first=Math.ceil((west-180)/360)-1,last=Math.floor((east+180)/360)+1;
    first=Math.max(-6,first);last=Math.min(6,last);
    const out=[];for(let k=first;k<=last;k++)out.push(k*360);
    if(!out.includes(0))out.push(0);
    return [...new Set(out)].sort((a,b)=>a-b);
  }

  setFootprints(on){
    this.showFootprints=!!on;
    for(const master of this.layers.values()) for(const copy of master.copies.values()){
      if(this.showFootprints){if(!copy.group.hasLayer(copy.footprint))copy.group.addLayer(copy.footprint);}
      else if(copy.group.hasLayer(copy.footprint))copy.group.removeLayer(copy.footprint);
    }
  }

  createCopy(master,offset){
    const {record,snap,minElevation}=master,lon=snap.lon+offset;
    const marker=L.marker([snap.lat,lon],{pane:'satPane',icon:makeSatelliteIcon(record),title:record.name});
    const tooltip=document.createElement('div');const b=document.createElement('b');b.textContent=record.name;tooltip.append(b);marker.bindTooltip(tooltip,{direction:'top',offset:[0,-13]});
    marker.on('click',()=>this.dispatchEvent(new CustomEvent('satclick',{detail:record.id})));
    marker.on('add',()=>setMarkerVisual(marker,record,record.id===this.selectedId));
    const footprint=L.circle([snap.lat,lon],{pane:'orbitPane',radius:footprintRadiusMeters(snap.altKm,minElevation),color:record.color,fillColor:record.color,weight:1,opacity:.82,fillOpacity:.08,interactive:false});
    const past=L.polyline(shiftedSegments(master.trackPast,offset),{pane:'orbitPane',color:record.color,weight:1.2,opacity:.42,dashArray:'5 6',interactive:false,lineCap:'round',lineJoin:'round'});
    const future=L.polyline(shiftedSegments(master.trackFuture,offset),{pane:'orbitPane',color:record.color,weight:1.45,opacity:.94,interactive:false,lineCap:'round',lineJoin:'round'});
    const group=L.layerGroup([marker,past,future]);if(this.showFootprints)group.addLayer(footprint);if(record.visible!==false)group.addTo(this.map);
    const copy={offset,marker,footprint,past,future,group};master.copies.set(offset,copy);return copy;
  }

  createSatLayers(record,snap,minElevation){
    const master={record,snap,minElevation,copies:new Map(),trackPast:[],trackFuture:[],iconKey:normalizeSatelliteIcon(record.iconKey)};
    this.layers.set(record.id,master);
    for(const offset of this.visibleWorldOffsets())this.createCopy(master,offset);
    return master;
  }

  refreshWorldCopies(){
    const offsets=this.visibleWorldOffsets(),key=offsets.join(',');
    if(key===this._worldOffsetsKey)return;
    this._worldOffsetsKey=key;
    const wanted=new Set(offsets);
    for(const master of this.layers.values()){
      for(const offset of wanted)if(!master.copies.has(offset)&&master.snap)this.createCopy(master,offset);
      for(const [offset,copy] of [...master.copies])if(!wanted.has(offset)){
        if(this.map.hasLayer(copy.group))this.map.removeLayer(copy.group);master.copies.delete(offset);
      }
    }
  }

  updateSatellite(record,snap,minElevation){
    if(!snap)return;let master=this.layers.get(record.id)||this.createSatLayers(record,snap,minElevation);
    master.record=record;master.snap=snap;master.minElevation=minElevation;
    const wantedIcon=normalizeSatelliteIcon(record.iconKey);
    for(const copy of master.copies.values()){
      if(master.iconKey!==wantedIcon)copy.marker.setIcon(makeSatelliteIcon(record));
      copy.marker.setLatLng([snap.lat,snap.lon+copy.offset]);
      copy.footprint.setLatLng([snap.lat,snap.lon+copy.offset]).setRadius(footprintRadiusMeters(snap.altKm,minElevation)).setStyle({color:record.color,fillColor:record.color});
      if(record.visible!==false&&!this.map.hasLayer(copy.group))copy.group.addTo(this.map);if(record.visible===false&&this.map.hasLayer(copy.group))this.map.removeLayer(copy.group);
      setMarkerVisual(copy.marker,record,record.id===this.selectedId);
    }
    master.iconKey=wantedIcon;
    if(this.followId===record.id&&record.visible!==false)this.map.setView([snap.lat,snap.lon],this.map.getZoom(),{animate:false});
  }

  updateTrack(record,track){
    const master=this.layers.get(record.id);if(!master)return;
    master.trackPast=track.past||[];master.trackFuture=track.future||[];
    for(const copy of master.copies.values()){
      copy.past.setLatLngs(shiftedSegments(master.trackPast,copy.offset));
      copy.future.setLatLngs(shiftedSegments(master.trackFuture,copy.offset));
    }
  }

  updateColor(record){
    const master=this.layers.get(record.id);if(!master)return;master.record=record;
    for(const copy of master.copies.values()){
      copy.footprint.setStyle({color:record.color,fillColor:record.color});copy.past.setStyle({color:record.color});copy.future.setStyle({color:record.color});setMarkerVisual(copy.marker,record,record.id===this.selectedId);
    }
  }
  updateIcon(record){
    const master=this.layers.get(record.id);if(!master)return;master.record=record;master.iconKey=normalizeSatelliteIcon(record.iconKey);
    for(const copy of master.copies.values()){copy.marker.setIcon(makeSatelliteIcon(record));copy.marker.once('add',()=>setMarkerVisual(copy.marker,record,record.id===this.selectedId));setTimeout(()=>setMarkerVisual(copy.marker,record,record.id===this.selectedId),0);}
  }
  setVisible(record,on){record.visible=!!on;const master=this.layers.get(record.id);if(!master)return;for(const copy of master.copies.values()){if(on&&!this.map.hasLayer(copy.group))copy.group.addTo(this.map);if(!on&&this.map.hasLayer(copy.group))this.map.removeLayer(copy.group);}}
  isSatelliteInViewport(id){
    const master=this.layers.get(id);if(!master?.record||master.record.visible===false)return false;
    const bounds=this.map.getBounds();
    for(const copy of master.copies.values()){
      if(this.map.hasLayer(copy.group)&&bounds.contains(copy.marker.getLatLng()))return true;
    }
    return false;
  }
  select(id){this.selectedId=id;for(const [sid,master] of this.layers)for(const copy of master.copies.values())setMarkerVisual(copy.marker,master.record,sid===id);}
  follow(id){this.followId=this.followId===id?null:id;return this.followId;}
  zoomTo(id){const master=this.layers.get(id);if(master?.snap)this.map.flyTo([master.snap.lat,master.snap.lon],Math.max(this.map.getZoom(),5),{duration:1.0});}
  remove(id){const master=this.layers.get(id);if(master){for(const copy of master.copies.values())if(this.map.hasLayer(copy.group))this.map.removeLayer(copy.group);this.layers.delete(id);}if(this.followId===id)this.followId=null;if(this.selectedId===id)this.selectedId=null;}
  invalidate(){this.map.invalidateSize();this.refreshWorldCopies();}
  startGeolocation(){
    if(!navigator.geolocation)throw new Error('Geolocalización no soportada por este navegador');
    if(this.watchId!=null)return;
    this.watchId=navigator.geolocation.watchPosition(pos=>{
      const o={lat:pos.coords.latitude,lon:pos.coords.longitude,altMeters:pos.coords.altitude||0,accuracy:pos.coords.accuracy||0};
      this.observerMode='geolocation';this.observer=o;this.updateObserverLayer(o);this.dispatchEvent(new CustomEvent('observer',{detail:o}));
    },err=>this.dispatchEvent(new CustomEvent('geoerror',{detail:err})),{enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  }
  setManualObserver(observer){
    const lat=Number(observer?.lat),lon=Number(observer?.lon);
    if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lon)||lon<-180||lon>180)throw new Error('La ubicación manual no es válida.');
    if(this.watchId!=null)navigator.geolocation?.clearWatch(this.watchId);
    this.watchId=null;
    const o={lat,lon,altMeters:Number(observer?.altMeters)||0,accuracy:0};
    this.observerMode='manual';this.observer=o;this.updateObserverLayer(o);this.dispatchEvent(new CustomEvent('observer',{detail:o}));
  }
  clearObserver(){
    if(this.watchId!=null)navigator.geolocation?.clearWatch(this.watchId);
    this.watchId=null;this.observer=null;this.observerMode=null;
    if(this.observerGroup){this.map.removeLayer(this.observerGroup);this.observerGroup=null;}
    this.dispatchEvent(new CustomEvent('observer',{detail:null}));
  }
  stopGeolocation(){this.clearObserver();}
  updateObserverLayer(o){
    if(!this.observerGroup){
      const icon=L.divIcon({className:'me-marker',iconSize:[14,14],iconAnchor:[7,7]});
      this.meMarker=L.marker([o.lat,o.lon],{icon,pane:'satPane',interactive:false});
      this.meAcc=L.circle([o.lat,o.lon],{radius:Math.max(0,o.accuracy||0),color:'#2a7bff',fillColor:'#2a7bff',weight:1,opacity:.4,fillOpacity:.12,pane:'orbitPane',interactive:false});
      this.observerGroup=L.layerGroup([this.meAcc,this.meMarker]).addTo(this.map);this.map.flyTo([o.lat,o.lon],Math.max(this.map.getZoom(),7),{duration:.8});
    } else {
      this.meMarker.setLatLng([o.lat,o.lon]);this.meAcc.setLatLng([o.lat,o.lon]).setRadius(Math.max(0,o.accuracy||0));
    }
  }
}
