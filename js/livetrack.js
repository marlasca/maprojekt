
const proxyUrl = "`/track?url=`";
    let currentPolyline = null;
    let autoUpdateInterval = null;
    let allCoords = []; // acumulador de coordenadas

    async function fetchTrack(url, label) {
      try {
        const res = await fetch(proxyUrl + encodeURIComponent(url));
        const data = await res.json(); // [[lat, lon], [lat, lon], ...]

        if (!data || data.length === 0) {
          console.warn("⚠️ No se encontraron coordenadas");
          return;
        }

        // Detectar puntos nuevos (comparando con los ya acumulados)
        const newPoints = data.filter(pt => 
          !allCoords.some(existing => existing[0] === pt[0] && existing[1] === pt[1])
        );

        if (newPoints.length === 0) {
          console.log("⏸️ No hay puntos nuevos, track sin cambios");
          return;
        }

        // Añadir nuevos al acumulador
        allCoords = allCoords.concat(newPoints);

        if (!currentPolyline) {
          // Primera vez: crear la polyline
          currentPolyline = L.polyline(allCoords, {
            color: "red",
            weight: 6,
            opacity: 0.8,
            smoothFactor: 1
          }).addTo(map);
	      drawnItems.addLayer(currentPolyline); //TEST
          addLayerToList(currentPolyline, label); //TEST
	      loadedLayers.addLayer(currentPolyline); //TEST
		  saveToLocalStorage(); //TEST

          map.fitBounds(currentPolyline.getBounds());
        } else {
          // Actualizar polyline existente con puntos nuevos
          currentPolyline.setLatLngs(allCoords);
		  saveToLocalStorage(); //TEST
          map.fitBounds(currentPolyline.getBounds());
        }
		
		 // mover/crear marcador al último punto
        const lastPoint = allCoords[allCoords.length - 1];
          currentPolyline.bindTooltip(label || "Mi LiveTrack", {
            permanent: true,
            direction: "right",
            className: "track-label"
          }).openTooltip(lastPoint);

        console.log(`✅ Track actualizado, total ${allCoords.length} puntos`);
      } catch (err) {
        console.error("❌ Error al obtener track:", err);
      }
    }


    // Escuchar el botón
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "loadTrack") {
        const url = document.getElementById("garminUrl").value.trim();
        const label = document.getElementById("trackLabel").value.trim();
        if (url) {
          // reset de datos previos
          allCoords = [];
          currentPolyline = null;

          // cargar inmediatamente
          fetchTrack(url, label);

          // limpiar intervalos previos
          if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
          }

          // actualizar cada minuto
          autoUpdateInterval = setInterval(() => {
            fetchTrack(url, label);
          }, 60_000);
        } else {
          alert("Por favor introduce una URL de Garmin LiveTrack");
        }
      }
    });