// --- Control de color para dibujos ---
    let currentColor = "#3388ff"; 
    const ColorControl = L.Control.extend({
      onAdd: function(map) {
        const div = L.DomUtil.create('div', 'color-control');
        div.innerHTML =
          '<label><strong>Color dibujo:</strong></label><br>' +
          '<input type="color" id="colorPicker" value="' + currentColor + '">';
        L.DomEvent.disableClickPropagation(div);
        return div;
      }
    });
    map.addControl(new ColorControl({ position: 'topright' }));

    map.addLayer(drawnItems);

    function createDrawControl(color) {
      return new L.Control.Draw({
        draw: {
          polyline: { shapeOptions: { color: color, weight: 3 } },
          polygon: { shapeOptions: { color: color, weight: 2, fillColor: color, fillOpacity: 0.4 } },
          rectangle: { shapeOptions: { color: color, weight: 2, fillOpacity: 0.4 } },
          circle: { shapeOptions: { color: color, weight: 2, fillOpacity: 0.4 } },
          circlemarker: { shapeOptions: { color: color, weight: 2, fillColor: color, fillOpacity: 0.6 } },
          marker: {icon: createColoredMarker(color)}
        },
        edit: { featureGroup: drawnItems }
      });
    }

    let drawControl = createDrawControl(currentColor);
    map.addControl(drawControl);

    document.getElementById('colorPicker').addEventListener('input', function(e) {
      currentColor = e.target.value;
      map.removeControl(drawControl);
      drawControl = createDrawControl(currentColor);
      map.addControl(drawControl);
    });
	
	let measurementTooltip;

	// Formatos
	function formatArea(area) {
	  if (area >= 1000000) {
		return (area / 1000000).toFixed(2) + " km²";
	  }
	  return area.toFixed(2) + " m²";
	}

	function formatLength(length) {
	  if (length >= 1000) {
		return (length / 1000).toFixed(2) + " km";
	  }
	  return length.toFixed(2) + " m";
	}
	
	// --- Eventos de dibujo ---
map.on(L.Draw.Event.DRAWSTART, function () {
  if (measurementTooltip) {
    map.removeLayer(measurementTooltip);
    measurementTooltip = null;
  }
});

map.on("draw:drawvertex", function (e) {
  const layers = e.layers.getLayers();
  if (layers.length < 2) return; // mínimo 2 vértices para línea

  let latlngs = layers.map(l => l.getLatLng());
  let text = "";

  if (e.layerType === "polyline") {
    let distance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    text = "Longitud: " + formatLength(distance);
  }

  if (e.layerType === "polygon") {
    const area = L.GeometryUtil.geodesicArea(latlngs);
    text = "Área: " + formatArea(area);
  }

  if (!measurementTooltip) {
    measurementTooltip = L.tooltip({
      permanent: true,
      direction: "center",
      className: "measurement-tooltip"
    })
      .setLatLng(latlngs[latlngs.length - 1])
      .setContent(text)
      .addTo(map);
  } else {
    measurementTooltip
      .setLatLng(latlngs[latlngs.length - 1])
      .setContent(text);
  }
});

map.on(L.Draw.Event.DRAWSTOP, function () {
  if (measurementTooltip) {
    map.removeLayer(measurementTooltip);
    measurementTooltip = null;
  }
});

	
	map.on(L.Draw.Event.CREATED, function (e) {
  const layer = e.layer;

  // --- Colores y estilos ---
  if (e.layerType === "polygon" || e.layerType === "rectangle" || e.layerType === "polyline") {
    layer.setStyle({
      color: currentColor,
      fillColor: currentColor,
      fillOpacity: 0.4
    });
  }

  if (e.layerType === "circlemarker") {
    // Mantener el color de los circlemarkers
    layer.setStyle({
      color: currentColor,
      fillColor: currentColor,
      fillOpacity: 0.6
    });
  }

  // --- Marcadores con iconos personalizados o SVG coloreable ---
  if (e.layerType === "marker") {
    layer.feature = layer.feature || { properties: {} };

    if (currentIconKey && currentIconKey !== "pin") {
      // Iconos especiales
      layer.setIcon(customIcons[currentIconKey]);
      layer.feature.properties.iconKey = currentIconKey;
    } else {
      // Marker normal coloreable con SVG dinámico
      const svgIcon = L.divIcon({
        className: "",
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.8 12.5 28.5 12.5 28.5S25 21.3 25 12.5C25 5.6 19.4 0 12.5 0z"
              fill="${currentColor}" stroke="black" stroke-width="1"/>
            <circle cx="12.5" cy="12.5" r="5" fill="white"/>
          </svg>
        `,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -35]
      });
      layer.setIcon(svgIcon);
      layer.feature.properties["marker-color"] = currentColor;
    }

    // popup con coordenadas
    const latlng = layer.getLatLng();
    layer.bindPopup(`Coordenadas:<br>${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
  }

  // --- Medidas finales para líneas y polígonos ---
  if (e.layerType === "polyline") {
    const latlngs = layer.getLatLngs();
    let distance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    layer.bindPopup(`Longitud: ${formatLength(distance)}`);
  }

  if (e.layerType === "polygon") {
    const latlngs = layer.getLatLngs()[0];
    const area = L.GeometryUtil.geodesicArea(latlngs);
    layer.bindPopup(`Área: ${formatArea(area)}`);
  }

  drawnItems.addLayer(layer);
});
