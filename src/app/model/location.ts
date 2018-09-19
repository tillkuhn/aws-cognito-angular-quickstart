import {attribute, hashKey, table} from '@aws/dynamodb-data-mapper-annotations';

@table('location')
export class Location {
    @hashKey()
    code: string;
    @attribute()
    name: string;
    @attribute()
    region?: string;
    @attribute()
    coordinates?: number[];

}

export interface IGeometry {
    type: string;
    coordinates: number[];
}

export interface IGeoJson {
    type: string;
    geometry: IGeometry;
    properties?: any;
    $key?: string;
}
//  x, y order (longitude, latitude for geographic coordinates). e.g. Vientiane [102.630867, 17.974855]; // lon lat
export class GeoJson implements IGeoJson {
    type = 'Feature';
    geometry: IGeometry;

    constructor(coordinates, public properties?) {
        this.geometry = {
            type: 'Point',
            coordinates: coordinates
        }
    }
}

export class FeatureCollection {
    type = 'FeatureCollection'
    constructor(public features: Array<GeoJson>) {}
}