import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default class Database {
  private dynamoDbClient: DocumentClient;

  private tableName: string;

  constructor(tableName: string) {
    this.dynamoDbClient = new DynamoDB.DocumentClient({
      apiVersion: "latest",
      region: process.env.AWS_REGION,
    });

    this.tableName = tableName;
  }

  async queryByKey<T>(key: string, value: T) {
    const result = await this.dynamoDbClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression: `${key} = :${key}`,
        ExpressionAttributeValues: {
          [`:${key}`]: value,
        },
      })
      .promise();
    return result.Items;
  }

  async save<T extends DocumentClient.PutItemInputAttributeMap>(item: T) {
    await this.dynamoDbClient
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();
  }

  async bulkDelete<T extends DynamoDB.DocumentClient.WriteRequests>(items: T) {
    return this.dynamoDbClient
      .batchWrite({
        RequestItems: {
          [this.tableName]: items,
        },
      })
      .promise();
  }
}
