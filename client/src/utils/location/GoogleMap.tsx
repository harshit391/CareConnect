import { AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, Pin } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

type Poi = { key: string, location: google.maps.LatLngLiteral }

const PoiMarkers = (props: { pois: Poi[] }) => {
    return (
        <>
            {props.pois.map((poi: Poi) => (
                <AdvancedMarker
                    key={poi.key}
                    position={poi.location}>
                    <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                </AdvancedMarker>
            ))}
        </>
    );
};

export const GoogleMap = ({ mapId, name, latitude, longitude }: {
    name: string;
    mapId: string;
    latitude: number;
    longitude: number;
}) => {

    useEffect(() => {
        // Component mounted
    }, [])

    return <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
        onLoad={() => {}}>
        <Map
            defaultZoom={13}
            defaultCenter={{ lat: Number(latitude), lng: Number(longitude) }}
            mapId={mapId}
            onCameraChanged={(_ev: MapCameraChangedEvent) => {}}>
            <PoiMarkers pois={[
                { key: name, location: { lat: Number(latitude), lng: Number(longitude) } },
            ]} />
        </Map>
        {/* Redicect to Google Maps */}


    </APIProvider>
};
