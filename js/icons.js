    const customIcons = {
	  pin: L.divIcon({
		html: '<i class="fas fa-map-marker-alt" style="font-size:24px; color:red;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  flag: L.divIcon({
		html: '<i class="fas fa-flag" style="font-size:24px; color:blue;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  house: L.divIcon({
		html: '<i class="fas fa-house" style="font-size:24px; color:green;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  truck: L.divIcon({
		html: '<i class="fas fa-truck" style="font-size:24px; color:orange;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  person: L.divIcon({
		html: '<i class="fas fa-person" style="font-size:24px; color:black;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  helicopter: L.divIcon({
		html: '<i class="fas fa-helicopter" style="font-size:24px; color:purple;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  fire: L.divIcon({
		html: '<i class="fas fa-fire" style="font-size:24px; color:red;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  cross: L.divIcon({
		html: '<i class="fas fa-xmark" style="font-size:24px; color:black;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  car: L.divIcon({
		html: '<i class="fas fa-car" style="font-size:24px; color:blue;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  }),
	  ship: L.divIcon({
		html: '<i class="fas fa-ship" style="font-size:24px; color:navy;"></i>',
		iconSize: [24, 24],
		className: 'custom-div-icon'
	  })
	};
	
	
	// --- Crear marcadores de color personalizado ---
    function createColoredMarker(color) {
      return L.divIcon({
        className: "",
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.8 12.5 28.5 12.5 28.5S25 21.3 25 12.5C25 5.6 19.4 0 12.5 0z"
              fill="${color}" stroke="black" stroke-width="1"/>
            <circle cx="12.5" cy="12.5" r="5" fill="white"/>
          </svg>
        `,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -35]
      });
    }