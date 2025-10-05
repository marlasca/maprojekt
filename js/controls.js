// --- Control de coordenadas ---
const CoordsControl = L.Control.extend({
  onAdd: function(map) {
	const div = L.DomUtil.create('div', 'coords-control');
	div.innerHTML =
	  '<div><strong>Coordenadas:</strong></div>' +
	  '<label>Lat: <input type="text" id="latBox" readonly></label><br>' +
	  '<label>Lng: <input type="text" id="lngBox" readonly></label>';
	L.DomEvent.disableClickPropagation(div);
	L.DomEvent.disableScrollPropagation(div);
	return div;
  }
});
map.addControl(new CoordsControl({ position: 'topright' }));

// --- Waypoints ---
const waypoints = L.layerGroup().addTo(map);
map.on('click', function(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);
  document.getElementById('latBox').value = lat;
  document.getElementById('lngBox').value = lng;
  waypoints.clearLayers();
  L.marker([lat, lng]).addTo(waypoints);
});

// --- Grupo para capas cargadas ---
const loadedLayers = L.layerGroup().addTo(map);

// --- Listado de capas ---
const LayersListControl = L.Control.extend({
  onAdd: function(map) {
	const div = L.DomUtil.create('div', 'layers-list-control');
	div.innerHTML = `<strong>Capas cargadas:</strong><br><div id="layersList"></div>`;
	L.DomEvent.disableClickPropagation(div);
	return div;
  }
});
map.addControl(new LayersListControl({ position: 'topright' }));


const ExportControl = L.Control.extend({
  onAdd: function(map) {
    const div = L.DomUtil.create("div", "leaflet-control leaflet-bar");
    const btn = L.DomUtil.create("a", "", div);
    btn.innerHTML = "💾";
    btn.href = "#";
    btn.title = "Exportar todo a GeoJSON";

    L.DomEvent.on(btn, "click", function(e) {
      L.DomEvent.preventDefault(e);

      // 1) Exportar dibujos con estilos usando exportGeoJSON()
      const drawn = exportGeoJSON();   // <- aquí ya se guardan color, fillColor, fillOpacity, etc.
      const features = [...drawn.features];

      // 2) Exportar capas importadas (tal cual vienen del fichero)
      loadedLayers.eachLayer(layer => {
        if (typeof layer.toGeoJSON === "function") {
          const gj = layer.toGeoJSON();
          if (!gj) return;
          if (gj.type === "FeatureCollection" && Array.isArray(gj.features)) {
            features.push(...gj.features);
          } else {
            features.push(gj);
          }
        }
      });

      // 3) Unir todo en un FeatureCollection
      const geojson = { type: "FeatureCollection", features };
      const data = JSON.stringify(geojson, null, 2);

      // Descargar archivo
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mapa.geojson";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    return div;
  }
});

map.addControl(new ExportControl({ position: "topleft" }));
	
// Control de importar archivos (GPX, GeoJSON, KML, KMZ) sobre el mapa
const ImportControl = L.Control.extend({
  onAdd: function(map) {
    const div = L.DomUtil.create("div", "leaflet-control leaflet-bar");

    // Botón visible 📂
    const btn = L.DomUtil.create("a", "", div);
    btn.innerHTML = "📂";
    btn.href = "#";
    btn.title = "Cargar archivo (GPX, GeoJSON, KML, KMZ)";

    // Input file invisible cubriendo el botón
    const input = L.DomUtil.create("input", "", div);
    input.type = "file";
    input.accept = ".gpx,.geojson,.json,.kml,.kmz";
    Object.assign(input.style, {
      position: "absolute",
      inset: "0",
      opacity: 0,
      cursor: "pointer"
    });

    input.addEventListener("change", async function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const name = file.name.toLowerCase();

      try {
        if (name.endsWith(".kmz")) {
          const zip = await JSZip.loadAsync(file);
          const kmlFile = Object.keys(zip.files).find(f => f.toLowerCase().endsWith(".kml"));
          if (!kmlFile) { alert("KMZ no contiene KML"); input.value = ""; return; }
          const kmlText = await zip.file(kmlFile).async("text");
          omnivore.kml.parse(kmlText).on("ready", function() {
            map.fitBounds(this.getBounds());
            const geojson = this.toGeoJSON();
            const layer = processGeoJSON(geojson);
            addLayerToList(layer, file.name);
			saveToLocalStorage();
          });

        } else if (name.endsWith(".kml")) {
          const text = await file.text();
          omnivore.kml.parse(text).on("ready", function() {
            map.fitBounds(this.getBounds());
            const geojson = this.toGeoJSON();
            const layer = processGeoJSON(geojson);
            addLayerToList(layer, file.name);
			saveToLocalStorage();
          });

        } else if (name.endsWith(".gpx")) {
          const text = await file.text();
          new L.GPX(text, { async: true }).on("loaded", function(evt) {
            map.fitBounds(evt.target.getBounds());
            const geojson = evt.target.toGeoJSON();
            const layer = processGeoJSON(geojson);
            addLayerToList(layer, file.name);
			saveToLocalStorage();
          });

        } else if (name.endsWith(".geojson") || name.endsWith(".json")) {
          const text = await file.text();
          const data = JSON.parse(text);
          const layer = processGeoJSON(data);
          if (layer.getBounds && layer.getBounds().isValid()) {
            map.fitBounds(layer.getBounds());
          }
          addLayerToList(layer, file.name);
		  saveToLocalStorage();

        } else {
          alert("Formato no soportado. Usa GPX, KML/KMZ o GeoJSON");
        }
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el archivo: " + err.message);
      } finally {
        input.value = ""; // reset para poder reusar el mismo archivo
      }
    });

    // Evitar scroll/clicks “raros” en el control
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  }
});

// Añadirlo al mapa
map.addControl(new ImportControl({ position: "topleft" }));

	
// === CONTROL DE ICONOS PERSONALIZADOS ===
L.Control.IconSelector = L.Control.extend({
  onAdd: function(map) {
	const div = L.DomUtil.create('div', 'info legend');
	div.innerHTML = `
	  <label><strong>Icono marcador:</strong></label><br>
	  <select id="iconSelector">
		<option value="pin">📍 Pin</option>
		<option value="flag">🚩 Bandera</option>
		<option value="house">🏠 Casa</option>
		<option value="truck">🚚 Camión</option>
		<option value="person">🧍 Persona</option>
		<option value="helicopter">🚁 Helicóptero</option>
		<option value="fire">🔥 Fuego</option>
		<option value="cross">❌ X</option>
		<option value="car">🚗 Coche</option>
		<option value="ship">⛴ Barco</option>
	  </select>
	`;
	L.DomEvent.disableClickPropagation(div);
	return div;
  }
});

// Añadir control al mapa
map.addControl(new L.Control.IconSelector({ position: 'topright' }));

// Guardar icono seleccionado
let currentIconKey = "pin";
document.getElementById("iconSelector").addEventListener("change", function(e) {
  currentIconKey = e.target.value;
});

const ShareControl = L.Control.extend({
  onAdd: function () {
    const div = L.DomUtil.create("div", "leaflet-control leaflet-bar");
    const btn = L.DomUtil.create("a", "", div);
    btn.innerHTML = '<i class="fas fa-link" style="font-size:12px; color:black;"></i>';
    btn.href = "#";
    btn.title = "Compartir sesi�n";

    L.DomEvent.on(btn, "click", function (e) {
      L.DomEvent.preventDefault(e);
      saveSessionToUrl();
    });

    return div;
  }
});

map.addControl(new ShareControl({ position: "topleft" }));


// Crear un control personalizado
const TrackControl = L.Control.extend({
  onAdd: function(map) {
	const div = L.DomUtil.create("div", "leaflet-control custom-control");
	div.innerHTML = `
	  <input id="garminUrl" type="text" placeholder="URL Garmin" /><br/>
	  <input id="trackLabel" type="text" placeholder="Etiqueta" /><br/>
	  <button id="loadTrack">Cargar Track</button>
	`;

	// Evitar que el mapa se mueva al hacer scroll/click sobre el control
	L.DomEvent.disableClickPropagation(div);

	return div;
  }
});

map.addControl(new TrackControl({ position: "topright" }));

