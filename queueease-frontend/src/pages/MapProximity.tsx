import React from 'react';
import Map, { MapboxStyle } from 'react-map-gl';

// Import the CSS for the map
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || ''; // Mapbox token from .env
const CUSTOM_MAP_STYLE = 'mapbox://styles/ianhipolito/cm69xpqqq002501r22n875z5f';

const MapProximity: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        initialViewState={{
          longitude: -6.2603, // Default longitude (Dublin, Ireland)
          latitude: 53.3498,  // Default latitude
          zoom: 10,           // Default zoom level
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CUSTOM_MAP_STYLE} // Custom styled map
        mapboxAccessToken={MAPBOX_TOKEN}
      />
    </div>
  );
};

export default MapProximity;
