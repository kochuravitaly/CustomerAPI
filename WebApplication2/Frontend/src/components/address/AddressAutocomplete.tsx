import React, { useEffect, useRef, useState } from 'react';
import { CreateAddressDto } from '../../types/address';
import { useLanguage } from '../../context/LanguageContext';

interface AddressAutocompleteProps {
    formData: CreateAddressDto;
    setFormData: (data: CreateAddressDto) => void;
}

const loadedLanguages = new Set<string>();

const loadYandexScript = (lang: string): Promise<void> => {
    return new Promise((resolve) => {
        if (loadedLanguages.has(lang) && window.ymaps) {
            resolve();
            return;
        }

        const existingScript = document.getElementById('yandex-maps-script');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'yandex-maps-script';
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=294e3384-0167-4c9b-bb1f-b5e4da2d3054&lang=${lang}`;
        script.type = 'text/javascript';
        script.onload = () => {
            loadedLanguages.add(lang);
            resolve();
        };
        script.onerror = () => {
            resolve();
        };
        document.head.appendChild(script);
    });
};

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ formData, setFormData }) => {
    const { t, language } = useLanguage();
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [showMap, setShowMap] = useState(false);

    const getYandexLang = () => {
        switch (language) {
            case 'ru': return 'ru_RU';
            case 'de': return 'de_DE';
            default: return 'en_US';
        }
    };

    const parseNominatimAddress = (data: any) => {
        const address = data?.address;
        const road = address?.road || address?.pedestrian || address?.street || '';
        const houseNumber = address?.house_number || '';

        let street = road;
        if (houseNumber) {
            street = `${houseNumber}, ${road}`;
        }

        const city = address?.city || address?.town || address?.village || '';
        const region = address?.state || address?.province || '';
        const postalCode = address?.postcode || '';
        const country = address?.country || '';

        return { street, city, region, postalCode, country };
    };

    const reverseGeocode = (coords: number[]) => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&addressdetails=1&accept-language=${language}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const parsed = parseNominatimAddress(data);
                setFormData({
                    ...formData,
                    ...parsed,
                });
            })
            .catch(() => { });
    };

    useEffect(() => {
        if (!showMap) return;
        let map: any = null;

        const initMap = async () => {
            const lang = getYandexLang();
            await loadYandexScript(lang);

            if (!window.ymaps || !mapContainerRef.current) return;

            window.ymaps.ready(() => {
                if (mapContainerRef.current) {
                    map = new window.ymaps.Map(mapContainerRef.current, {
                        center: [55.76, 37.64],
                        zoom: 10,
                    });
                    mapRef.current = map;

                    map.events.add('click', (e: any) => {
                        const coords = e.get('coords');
                        map.geoObjects.removeAll();

                        const placemark = new window.ymaps.Placemark(coords, {}, { draggable: true });

                        placemark.events.add('dragend', () => {
                            const newCoords = placemark.geometry.getCoordinates();
                            reverseGeocode(newCoords);
                        });

                        map.geoObjects.add(placemark);
                        reverseGeocode(coords);
                    });
                }
            });
        };

        initMap();
        return () => {
            if (map) map.destroy();
        };
    }, [showMap, language]);

    return (
        <div>
            <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="btn btn-outline"
                style={{ width: '100%', padding: '10px', marginBottom: '8px' }}
            >
                {showMap
                    ? (t.profile.hideMap || 'Hide Map')
                    : `🗺️ ${t.profile.selectOnMap || 'Select on Map'}`}
            </button>

            {showMap && (
                <div
                    ref={mapContainerRef}
                    style={{
                        width: '100%',
                        height: '250px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                    }}
                />
            )}
        </div>
    );
};