import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {LocationService} from '../../service/location.service';
import {GeoJson, FeatureCollection} from '../../model/location';


@Component({
    selector: 'app-locations',
    templateUrl: './locations.component.html',
    styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit {

    /// default settings
    map: mapboxgl.Map;
    style = 'mapbox://styles/mapbox/outdoors-v9';
    lat = 37.75;
    lng = -122.41;
    message = 'Hello World!';

    // data
    source: any;
    markers: any;

    constructor(
        private locationService: LocationService) {
    }

    ngOnInit() {
        this.markers = this.locationService.getMarkers()
        this.initializeMap()
    }

    private initializeMap() {
        /// locate the user
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                this.lat = position.coords.latitude;
                this.lng = position.coords.longitude;
                this.map.flyTo({
                    center: [this.lng, this.lat]
                })
            });
        }

        this.buildMap()

    }

    buildMap() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: this.style,
            zoom: 13,
            center: [this.lng, this.lat]
        });


        /// Add map controls
        this.map.addControl(new mapboxgl.NavigationControl());


        //// Add Marker on Click
        this.map.on('click', (event) => {
            const coordinates = [event.lngLat.lng, event.lngLat.lat]
            const newMarker = new GeoJson(coordinates, {message: this.message})
            this.locationService.createMarker(newMarker)
        })


        /// Add realtime firebase data on map load
        this.map.on('load', (event) => {

            /// register source
            this.map.addSource('firebase', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            /// get source
            this.source = this.map.getSource('firebase')

            /// subscribe to realtime database and set data source
            /*
            this.markers.subscribe(markers => {
                let data = new FeatureCollection(markers)
                this.source.setData(data)
            })
            */

            /// create map layers with realtime data
            this.map.addLayer({
                id: 'firebase',
                source: 'firebase',
                type: 'symbol',
                layout: {
                    'text-field': '{message}',
                    'text-size': 24,
                    'text-transform': 'uppercase',
                    'icon-image': 'rocket-15',
                    'text-offset': [0, 1.5]
                },
                paint: {
                    'text-color': '#f16624',
                    'text-halo-color': '#fff',
                    'text-halo-width': 2
                }
            })

        })


    }


    /// Helpers

    removeMarker(marker) {
        this.locationService.removeMarker(marker.$key)
    }

    flyTo(data: GeoJson) {
        this.map.flyTo({
            center: data.geometry.coordinates
        })
    }
}