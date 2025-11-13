import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteMapProps {
  pickupZip: string;
  deliveryZip: string;
  pickupCity?: string;
  deliveryCity?: string;
  pickupState?: string;
  deliveryState?: string;
}

export const RouteMap = ({ 
  pickupZip, 
  deliveryZip,
  pickupCity,
  deliveryCity,
  pickupState,
  deliveryState
}: RouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  const pickupLocation = pickupCity && pickupState 
    ? `${pickupCity}, ${pickupState}` 
    : pickupZip;
    
  const deliveryLocation = deliveryCity && deliveryState 
    ? `${deliveryCity}, ${deliveryState}` 
    : deliveryZip;

  useEffect(() => {
    // Get Mapbox token from environment variable
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    setMapboxToken(token);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Geocode addresses to get coordinates
    const geocodeAndInitMap = async () => {
      try {
        const pickupQuery = encodeURIComponent(pickupLocation);
        const deliveryQuery = encodeURIComponent(deliveryLocation);

        const [pickupResponse, deliveryResponse] = await Promise.all([
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${pickupQuery}.json?access_token=${mapboxToken}`),
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${deliveryQuery}.json?access_token=${mapboxToken}`)
        ]);

        const pickupData = await pickupResponse.json();
        const deliveryData = await deliveryResponse.json();

        if (!pickupData.features?.length || !deliveryData.features?.length) {
          console.error('Unable to geocode addresses');
          return;
        }

        const pickupCoords = pickupData.features[0].center;
        const deliveryCoords = deliveryData.features[0].center;

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [
            (pickupCoords[0] + deliveryCoords[0]) / 2,
            (pickupCoords[1] + deliveryCoords[1]) / 2
          ],
          zoom: 4
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          if (!map.current) return;

          // Add pickup marker
          const pickupEl = document.createElement('div');
          pickupEl.className = 'pickup-marker';
          pickupEl.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
          pickupEl.style.width = '32px';
          pickupEl.style.height = '32px';
          pickupEl.style.backgroundSize = '100%';

          new mapboxgl.Marker({ color: '#22c55e' })
            .setLngLat(pickupCoords)
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>发货地</strong><br/>${pickupLocation}`))
            .addTo(map.current);

          // Add delivery marker
          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat(deliveryCoords)
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>收货地</strong><br/>${deliveryLocation}`))
            .addTo(map.current);

          // Get route from Mapbox Directions API
          const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${deliveryCoords[0]},${deliveryCoords[1]}?geometries=geojson&access_token=${mapboxToken}`;

          fetch(directionsUrl)
            .then(response => response.json())
            .then(data => {
              if (!map.current || !data.routes?.length) return;

              const route = data.routes[0].geometry;

              // Add route line
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: route
                }
              });

              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.75
                }
              });

              // Fit map to show entire route
              const coordinates = route.coordinates;
              const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
                return bounds.extend(coord as [number, number]);
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

              map.current.fitBounds(bounds, {
                padding: 50
              });
            })
            .catch(error => console.error('Error fetching route:', error));
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    geocodeAndInitMap();

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, pickupLocation, deliveryLocation]);

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 左侧：地点信息 */}
          <div className="flex flex-col gap-4 w-1/3">
            {/* 发货地 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">发货地</p>
                <p className="font-bold text-sm">{pickupLocation}</p>
              </div>
            </div>

            {/* 路线指示 */}
            <div className="flex items-center gap-2 pl-5">
              <div className="h-0.5 w-8 bg-primary/30"></div>
              <ArrowRight className="h-6 w-6 text-primary" />
              <div className="h-0.5 w-8 bg-primary/30"></div>
            </div>

            {/* 收货地 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">收货地</p>
                <p className="font-bold text-sm">{deliveryLocation}</p>
              </div>
            </div>

            {/* 预计时间 */}
            <div className="mt-2">
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-primary to-red-500 animate-pulse"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                预计运输时间：3-5个工作日
              </p>
            </div>
          </div>

          {/* 右侧：地图 */}
          <div className="w-2/3 h-64 rounded-lg overflow-hidden bg-muted relative">
            {mapboxToken ? (
              <div ref={mapContainer} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>需要配置 Mapbox Token</p>
                  <p className="text-xs mt-1">请在后端密钥中添加 MAPBOX_ACCESS_TOKEN</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
