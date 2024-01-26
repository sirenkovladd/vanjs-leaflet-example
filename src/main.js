import van from 'vanjs-core'
import leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './main.css'
import { statesData } from './us-states'

const { div, h4, b, br, sup, i } = van.tags;

const colors = {1000: '#800026', 500: '#BD0026', 200: '#E31A1C', 100: '#FC4E2A', 50: '#FD8D3C', 20: '#FEB24C', 10: '#FED976', 0: '#FFEDA0'};
function getColor(d) {
  return Object.entries(colors).reverse().find(([k]) => d > +k)[1];
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
  function onEachFeature(_, layer) {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });
        layer.bringToFront();
        textInfo.val = layer.feature.properties;
      },
      mouseout: (e) => {
        geojson.resetStyle(e.target);
        textInfo.val = null;
      },
      click: (e) => map.fitBounds(e.target.getBounds())
    });
  }
}

function mountInfo(map, textInfo) {
  const info = leaflet.control();
  info.onAdd = function () {
    return this._div = div({ class: 'info' }, h4('US Population Density'), () => {
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
  };
  info.addTo(map);
}

function mountLegend(map) {
  const legend = leaflet.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const divDom = div({ class: 'info legend' });
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000].map((grade, i, arr) => {
      if (i === arr.length - 1) return { color: getColor(grade + 1), text: `${grade}+` };
      return { color: getColor(grade + 1), text: `${grade}–${arr[i + 1]}` };
    });
    van.add(divDom, ...grades.flatMap(({ color, text }) => [i({ style: `background:${color}` }), text, br()]));
    return divDom;
  };
  legend.addTo(map);
}

function Main() {
  const dom = div({ id: 'map' })
  const map = leaflet.map(dom).setView([37.8, -96], 4);
  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  const textInfo = van.state();
  mountInfo(map, textInfo);
  mountGeojson(map, textInfo);
  mountLegend(map);
  setTimeout(() => { map.invalidateSize() });
  return dom;
}

const app = document.querySelector("#app");
van.add(app, Main());
