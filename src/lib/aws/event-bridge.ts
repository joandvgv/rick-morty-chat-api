import { EventBridge } from "aws-sdk";

type Source = "event.processor" | "graphql.handler" | "apollo";

export default class EventHandler {
  private eventBridge: EventBridge;

  private busName: string;

  constructor(busName: string) {
    this.eventBridge = new EventBridge({
      region: process.env.AWS_REGION,
    });
    this.busName = busName;
  }

  async emit<T extends object>(source: Source, name: string, data: T) {
    const result = await this.eventBridge
      .putEvents({
        Entries: [
          {
            Source: source,
            EventBusName: this.busName,
            DetailType: name,
            Time: new Date(),
            Detail: JSON.stringify(data),
          },
        ],
      })
      .promise();

    return {
      id: result.Entries![0].EventId,
      error: result.$response.error,
    };
  }
}
