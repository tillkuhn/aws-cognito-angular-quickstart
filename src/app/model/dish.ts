import {
    attribute,
    autoGeneratedHashKey,
    rangeKey,
    table,
} from '@aws/dynamodb-data-mapper-annotations';
// See https://github.com/awslabs/dynamodb-data-mapper-js/blob/master/README.md
// https://github.com/awslabs/dynamodb-data-mapper-js/tree/master/packages/dynamodb-data-mapper-annotations
// Types: https://docs.aws.amazon.com/de_de/amazondynamodb/latest/developerguide/DynamoDBMapper.DataTypes.html
@table('dish')
export class Dish {
    @autoGeneratedHashKey()
    id: string;
    //@rangeKey({defaultProvider: () => new Date()})
    //createdAt: Date;
    @rangeKey({defaultProvider: () => new Date().toISOString()})
    createdAt: string;
    @attribute()
    name: string;
    @attribute()
    origin: string;
    @attribute()
    authenticName?: string;
    @attribute()
    rating: number
    @attribute()
    timesServed?: number
    @attribute()
    primaryUrl?: string;
    @attribute()
    imageUrl?: string;
    @attribute()
    completed?: boolean;
    @attribute()
    lastServed?: string;
    @attribute({defaultProvider: () => new Date().toISOString()})
    updatedAt?: string;
    @attribute()
    updatedBy?: string;
    @attribute({memberType: 'String'})
    tags?: Set<string>;
}
