function saveToLocalStorage() {
  try {
    const geojson = exportGeoJSON(); // ← serializa SOLO drawnItems
    localStorage.setItem("mapSession", JSON.stringify(geojson));
    console.log("✅ Sesión guardada en localStorage");
  } catch (err) {
    console.error("❌ Error guardando sesión:", err);
  }
}


function restoreFromLocalStorage() {
  const hash = window.location.hash;
  if (!hash.startsWith("#session=")) {
	  const saved = localStorage.getItem("mapSession");
	  if (!saved) return;

	  try {
		const data = JSON.parse(saved);
		if (data && data.type === "FeatureCollection") {
		  // Limpia lo actual (opcional, pero recomendable)
		  drawnItems.clearLayers();
		  loadedLayers.clearLayers();

		  const geoLayer = processGeoJSON(data); // tu función actual
		  if (geoLayer.getBounds && geoLayer.getBounds().isValid()) {
			map.fitBounds(geoLayer.getBounds());
		  }
		  console.log("✅ Sesión restaurada desde localStorage");
		}
	  } catch (err) {
		console.error("❌ Error restaurando sesión:", err);
	  }
  }
}

