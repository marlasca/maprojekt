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

    // --- Leaflet.draw ---
    const drawnItems = new L.FeatureGroup();
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

	
	map.on(L.Draw.Event.CREATED, function (e) {
	  const layer = e.layer;

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
		if (e.layerType === "marker") {
			layer.feature = layer.feature || { properties: {} };

			if (currentIconKey && currentIconKey !== "pin") {
				// Iconos especiales: flag, house, truck, etc.
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
		}
	  drawnItems.addLayer(layer);
	});
