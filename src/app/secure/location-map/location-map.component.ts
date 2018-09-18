import {Component, Input, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import {NGXLogger} from 'ngx-logger';

declare var mapboxgl: any;
declare var MapboxDraw: any;

@Component({
    selector: 'app-location-map',
    templateUrl: './location-map.component.html',
    styleUrls: ['./location-map.component.css']
})
export class LocationMapComponent implements OnInit {
    @Input() center: number[] = [102.630867, 17.974855]; // lon lat
    @Input() zoom = 4; //  10.61041 104.18145
    @Input() pois: number[][] = [[100.523186, 13.736717], [104.18145, 10.61041],[105.804817, 21.028511]];
    @Input() allowDraw = false;
    @Input() geoference: number[][];

    private draw;

    constructor(
        private log: NGXLogger
    ) {}

    ngOnInit() {
        mapboxgl.accessToken = environment.mapboxAccessToken;
        let map = new mapboxgl.Map({
            container: 'map',
            /*
            dev url, only available internall style: "https://dis-openstreetmap.schenker.sh/styles/osm-bright/style.json",
            prod url, also available externally, but restricted to the following hosts: dbschenker.com, schenker.sh,
             schenker.pro, localhost, 127.0.0.1, dev.tsc.sh
            style: 'https://openstreetmap.essential-prod.acdc.dbschenker.com/styles/osm-bright/style.json',
            */
            style: 'mapbox://styles/mapbox/streets-v9',
            zoom: this.zoom,
            center: this.center
        });

        map.addControl(new mapboxgl.NavigationControl());

        if (this.allowDraw) {
            this.createDrawControl(map);
        }

        // wait until map is fully initialized
        map.on('load',  () => {
            // load image once
            this.log.info("looooafinhg map");
            map.loadImage('assets/marker.png',  (error, image)  => {
                if (error) throw error;
                // add image to the map with a given name so that we can reference it later
                map.addImage('my-icon', image);
                // https://www.mapbox.com/mapbox-gl-js/example/flyto/
                //map.flyTo({
                //    center: this.center
                //});
                this.log.info("goooo");

                map.addLayer({
                    'id': 'images',
                    'type': 'symbol',
                    'source': {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': this.pois.map(poi => ({
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': poi,
                                }
                            }))
                        }
                    },
                    'layout': {
                        'icon-image': 'my-icon',
                        'icon-size': 0.75
                    }
                });
            });
        });

        if (this.draw) {
            this.draw.add({
                id: 'geoference',
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [this.geoference]
                }
            });
        }

    }

    createDrawControl(map) {
        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            },
            styles: [
                // ACTIVE (being drawn)
                // line stroke
                {
                    'id': 'gl-draw-line',
                    'type': 'line',
                    'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                    'layout': {
                        'line-cap': 'round',
                        'line-join': 'round'
                    },
                    'paint': {
                        'line-color': '#000000',
                        // "line-dasharray": [0.2, 2],
                        'line-width': 2
                    }
                },
                // polygon fill
                {
                    'id': 'gl-draw-polygon-fill',
                    'type': 'fill',
                    'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                    'paint': {
                        'fill-color': '#000000',
                        'fill-outline-color': '#000000',
                        'fill-opacity': 0.1
                    }
                },
                // polygon outline stroke
                // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
                {
                    'id': 'gl-draw-polygon-stroke-active',
                    'type': 'line',
                    'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                    'layout': {
                        'line-cap': 'round',
                        'line-join': 'round'
                    },
                    'paint': {
                        'line-color': '#000000',
                        //"line-dasharray": [0.2, 2],
                        'line-width': 2
                    }
                },
                // vertex point halos
                {
                    'id': 'gl-draw-polygon-and-line-vertex-halo-active',
                    'type': 'circle',
                    'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                    'paint': {
                        'circle-radius': 5,
                        'circle-color': '#FFF'
                    }
                },
                // vertex points
                {
                    'id': 'gl-draw-polygon-and-line-vertex-active',
                    'type': 'circle',
                    'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                    'paint': {
                        'circle-radius': 3,
                        'circle-color': '#000000',
                    }
                },

                // INACTIVE (static, already drawn)
                // line stroke
                {
                    'id': 'gl-draw-line-static',
                    'type': 'line',
                    'filter': ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
                    'layout': {
                        'line-cap': 'round',
                        'line-join': 'round'
                    },
                    'paint': {
                        'line-color': '#000',
                        'line-width': 3
                    }
                },
                // polygon fill
                {
                    'id': 'gl-draw-polygon-fill-static',
                    'type': 'fill',
                    'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
                    'paint': {
                        'fill-color': '#000',
                        'fill-outline-color': '#000',
                        'fill-opacity': 0.1
                    }
                },
                // polygon outline
                {
                    'id': 'gl-draw-polygon-stroke-static',
                    'type': 'line',
                    'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
                    'layout': {
                        'line-cap': 'round',
                        'line-join': 'round'
                    },
                    'paint': {
                        'line-color': '#000',
                        'line-width': 3
                    }
                }
            ]
        });

        map.addControl(this.draw);
    }

    public GetGeoference(): number[][] {
        let features = this.draw.getAll().features;
        features.forEach(feature => {
            if (feature.type == 'Feature')
                return feature.geometry.coordinates[0];
        });
        return null;
    }
}
