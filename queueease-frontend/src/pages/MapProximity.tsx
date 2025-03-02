import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const MapProximity: React.FC = () => {
  interface Service {
    id: number;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
  }

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/services/')
      .then(response => response.json())
      .then(data => setServices(data))
      .catch(error => console.error('Error fetching services:', error));
  }, []);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-6.0930492, 53.5222146],
      zoom: 13
    });

    services.forEach(service => {
      new mapboxgl.Marker()
        .setLngLat([service.longitude, service.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${service.name}</h3><p>${service.category}</p>`))
        .addTo(map);
    });

    return () => map.remove();
  }, [services]);

  return <div id="map" style={{ height: '100vh', width: '100%' }} />;
};

export default MapProximity;