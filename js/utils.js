function processGeoJSON(data) {
  const geoLayer = L.geoJSON(data, {
	pointToLayer: function (feature, latlng) {
	  if (feature.properties["marker-type"] === "circlemarker") {
		return L.circleMarker(latlng, {
		  radius: feature.properties.radius || 10,
		  color: feature.properties.color || "#3388ff",
		  fillColor: feature.properties.fillColor || feature.properties.color || "#3388ff",
		  fillOpacity: feature.properties.fillOpacity ?? 0.6
		});
	  } else if (feature.properties.iconKey) {
		// Usar icono de tu lista
		return L.marker(latlng, {
		  icon: customIcons[feature.properties.iconKey] || customIcons["pin"]
		});
	  } else if (feature.properties["marker-color"]) {
		return L.marker(latlng, {
		  icon: L.divIcon({
			className: "",
			html: `<svg width="25" height="41" viewBox="0 0 25 41">
					 <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.8 12.5 28.5 12.5 28.5S25 21.3 25 12.5C25 5.6 19.4 0 12.5 0z"
						   fill="${feature.properties["marker-color"]}" stroke="black" stroke-width="1"/>
					 <circle cx="12.5" cy="12.5" r="5" fill="white"/>
				   </svg>`,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [0, -35]
		  })
		});
	  } else {
		// Marker normal sin nada especial
		return L.marker(latlng);
	  }
	},

	onEachFeature: function (feature, layer) {
	  // Estilos solo si el layer soporta setStyle
	  if (layer.setStyle && feature.properties) {
		const style = {};
		if (feature.properties.color) style.color = feature.properties.color;
		if (feature.properties.fillColor) style.fillColor = feature.properties.fillColor;
		if (feature.properties.fillOpacity !== undefined) style.fillOpacity = feature.properties.fillOpacity;
		layer.setStyle(style);
	  }

	  // Añadimos al drawnItems para que sea editable
	  drawnItems.addLayer(layer);
	}
  }).addTo(loadedLayers);

  return geoLayer;
}


function download(data, filename, type) {
  const file = new Blob([data], {type: type});
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
  }, 0);
}


// --- Exportar dibujo a GeoJSON (círculos como polígonos, circlemarkers preservados) ---
function circleToPolygon(circle, points = 60) {
  const coords = [];
  const center = circle.getLatLng();
  const radius = circle.getRadius();
  const earthRadius = 6378137; // radio de la Tierra en metros

  for (let i = 0; i < points; i++) {
	const angle = (i * 2 * Math.PI) / points;
	const dx = (radius / earthRadius) * Math.cos(angle);
	const dy = (radius / earthRadius) * Math.sin(angle);

	// desplazamiento en lat/lng
	const lat = center.lat + (dy * 180) / Math.PI;
	const lng = center.lng + (dx * 180) / Math.PI / Math.cos(center.lat * Math.PI / 180);

	coords.push([lng, lat]);
  }
  coords.push(coords[0]); // cerrar polígono

  return {
	type: "Feature",
	properties: { type: "circle" },
	geometry: { type: "Polygon", coordinates: [coords] }
  };
}


function exportGeoJSON() {
  const features = [];

  drawnItems.eachLayer(layer => {
    let f;

    if (layer instanceof L.Circle) {
      f = circleToPolygon(layer);
      f.properties = f.properties || {};
      if (layer.options) {
        if (layer.options.color)       f.properties.color = layer.options.color;
        if (layer.options.fillColor)   f.properties.fillColor = layer.options.fillColor;
        if (layer.options.fillOpacity !== undefined) f.properties.fillOpacity = layer.options.fillOpacity;
        if (layer.options.weight !== undefined)      f.properties.weight = layer.options.weight;
        if (layer.options.opacity !== undefined)     f.properties.opacity = layer.options.opacity;
      }
      features.push(f);

    } else if (layer instanceof L.CircleMarker) {
      f = layer.toGeoJSON();
      f.properties = f.properties || {};
      f.properties["marker-type"] = "circlemarker";
      if (layer.options) {
        if (layer.options.radius !== undefined)      f.properties.radius = layer.options.radius;
        if (layer.options.color)       f.properties.color = layer.options.color;
        if (layer.options.fillColor)   f.properties.fillColor = layer.options.fillColor;
        if (layer.options.fillOpacity !== undefined) f.properties.fillOpacity = layer.options.fillOpacity;
        if (layer.options.weight !== undefined)      f.properties.weight = layer.options.weight;
        if (layer.options.opacity !== undefined)     f.properties.opacity = layer.options.opacity;
      }
      features.push(f);

    } else if (layer instanceof L.Marker) {
	  f = layer.toGeoJSON();
	  f.type = "Feature"; 
	  f.properties = f.properties || {};
	  if (layer.options.icon?.options?.key) {
		f.properties.iconKey = layer.options.icon.options.key;   // icono de tu lista
	  }
	  if (layer.options.icon?.options?.markerColor) {
		f.properties["marker-color"] = layer.options.icon.options.markerColor; // color simple
	  }
	  features.push(f);

    } else if (layer instanceof L.Path) {
      // Cubre: Polyline, Polygon, Rectangle (todo lo que “pinta” salvo Circle/CircleMarker)
      f = layer.toGeoJSON();
      f.properties = f.properties || {};
      const opt = layer.options || {};
      if (opt.color)       f.properties.color = opt.color;
      if (opt.fillColor)   f.properties.fillColor = opt.fillColor;
      if (opt.fillOpacity !== undefined) f.properties.fillOpacity = opt.fillOpacity;
      if (opt.weight !== undefined)      f.properties.weight = opt.weight;
      if (opt.opacity !== undefined)     f.properties.opacity = opt.opacity;
      features.push(f);

    } else {
      features.push(layer.toGeoJSON());
    }
  });

  return { type: "FeatureCollection", features };
}

function addLayerToList(layer, name) {
  const listDiv = document.getElementById('layersList');
  const id = "layer-" + Date.now();
  let displayName = name.length > 20 ? name.substring(0, 20) + '…' : name;

  const item = document.createElement("div");
  item.style.display = "flex";
  item.style.justifyContent = "space-between";
  item.style.alignItems = "center";
  item.style.marginBottom = "4px";

  item.innerHTML = `
	<label style="flex:1; cursor:pointer;">
	  <input type="checkbox" id="${id}" checked>
	  ${displayName}
	</label>
	<button class="remove-btn" title="Eliminar capa">✖</button>
  `;
  listDiv.appendChild(item);

  document.getElementById(id).addEventListener("change", function(e) {
	if (e.target.checked) {
	  loadedLayers.addLayer(layer);
	} else {
	  loadedLayers.removeLayer(layer);
	}
  });

  item.querySelector(".remove-btn").addEventListener("click", function() {
	loadedLayers.removeLayer(layer);
	listDiv.removeChild(item);
  });
}