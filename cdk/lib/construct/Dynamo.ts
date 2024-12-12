import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";


export type DynamoTableProps ={
    partitionKey: string,
    sortKey: string
};

export class DynamoTable extends Construct {
    public readonly table: Table;
    constructor(scope: Construct, id: string, props:DynamoTableProps){
        super(scope, id);

        this.table = new Table(this, 'Table', { 
            partitionKey: { 
                name: props.partitionKey, type: AttributeType.STRING },
            sortKey: { 
                name: props.sortKey, type: AttributeType.STRING },
            removalPolicy: RemovalPolicy.DESTROY},)
    }
}