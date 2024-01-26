import van from 'vanjs-core'
import leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './main.css'
import { statesData } from './us-states'

const { div, h4, b, br, sup, i } = van.tags;

function getColor(d) {
  return d > 1000 ? '#800026' :
    d > 500 ? '#BD0026' :
      d > 200 ? '#E31A1C' :
        d > 100 ? '#FC4E2A' :
          d > 50 ? '#FD8D3C' :
            d > 20 ? '#FEB24C' :
              d > 10 ? '#FED976' :
                '#FFEDA0';
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

function mountGeojson(map, textInfo) {
  const geojson = leaflet.geoJson(statesData, { style, onEachFeature }).addTo(map);
  function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });
    layer.bringToFront();
    textInfo.val = layer.feature.properties;
  }

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    textInfo.val = null;
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }
}

function mountInfo(map, textInfo) {
  const info = leaflet.control();

  info.onAdd = function (map) {
    this._div = div({class: 'info'}, h4('US Population Density'), () => {
      const children = [];
      if (textInfo.val) {
        children.push(b(textInfo.val.name));
        children.push(br());
        children.push(textInfo.val.density);
        children.push(' people / mi');
        children.push(sup('2'));
      } else {
        children.push('Hover over a state');
      }
      return div(children);
    });
    return this._div;
  };
  info.addTo(map);

  return info;
}

function mountLegend(map) {
  const legend = leaflet.control({ position: 'bottomright' });
  legend.onAdd = function (map) {
    const divDom = div({ class: 'info legend' });
		const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
		const labels = [];
		let from, to;

		for (let n = 0; n < grades.length; n++) {
			from = grades[n];
			to = grades[n + 1];
      labels.push(i( { style: `background:${getColor(from + 1)}` }));
      labels.push(`${from}${to ? `–${to}` : '+'}`);
      labels.push(br());
		}

    van.add(divDom, ...labels);
		return divDom;
  };
  legend.addTo(map);
}

function Main() {
  const dom = div({ id: 'map' })
  const map = leaflet.map(dom).setView([37.8, -96], 4);
  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  
  const textInfo = van.state();
  mountInfo(map, textInfo);
  mountGeojson(map, textInfo);
  mountLegend(map);

  setTimeout(() => { map.invalidateSize() });
  return dom;
}

const app = document.querySelector("#app");
van.add(app, Main());
