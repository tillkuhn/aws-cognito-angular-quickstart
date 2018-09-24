import {attribute, autoGeneratedHashKey, hashKey, table} from '@aws/dynamodb-data-mapper-annotations';

@table('place')
export class Location {

    @autoGeneratedHashKey()
    id: string;

    @attribute()
    code: string;

    @attribute()
    name: string;

    @attribute()
    country?: String;

    @attribute()
    region?: string;

    @attribute()
    lotype?: LocationType;

    @attribute()
    rating?: number

    @attribute()
    primaryUrl?: string;

    @attribute()
    imageUrl?: string;

    @attribute()
    notes?: string;

    @attribute({memberType: 'String'})
    tags?: Set<string>;

    @attribute()
    coordinates?: number[]; //// lon lat

    @attribute({defaultProvider: () => new Date().toISOString()})
    createdAt?: string;

    @attribute()
    createdBy?: string;

    @attribute({defaultProvider: () => new Date().toISOString()})
    updatedAt?: string;

    @attribute()
    updatedBy?: string;
}

export enum Region {
    Asia,
    Europa,
    Americas,
    Africa
}

export enum LocationType {
    Place,
    Country,
    Region
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