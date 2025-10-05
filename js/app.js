    // --- Capas base ---
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    });

    const ignBase = L.tileLayer.providerESP('IGNBase.Todo');  
    const mtn = L.tileLayer.providerESP('MTN');               
    const pnoaProv = L.tileLayer.providerESP('PNOA');         

    // --- Overlays ---
    const nombres = L.tileLayer.providerESP('NombresGeograficos'); 
    const curvas = L.tileLayer.providerESP('MDT.CurvasNivel');    

    // --- Inicializar mapa ---
    var map = L.map('map', {
      center: [43.150931, -4.813221],
      zoom: 13,
      layers: [osm]
    });

    // --- Control de capas ---
    const baseMaps = {
      'OpenStreetMap': osm,
      'IGN Base (callejero)': ignBase,
      'MTN (Mapa Raster)': mtn,
      'IGN Ortofoto': pnoaProv
    };
    const overlays = {
      'Nombres geográficos': nombres,
      'Curvas de nivel': curvas
    };
    L.control.layers(baseMaps, overlays, { collapsed: false }).addTo(map);
	
