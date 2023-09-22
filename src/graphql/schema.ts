export default `#graphql
  type EventDetails {
    EventId: String
    ErrorMessage: String
    ErrorCode: String
  }

  type Mutation {
    putEvent(message: String!, threadId: String!): Result
  }

  type Query {
    getEvent: String
  }

  type Result {
    Entries: [EventDetails]
    FailedEntries: Int
  }

  type Subscription {
    chat(threadId: String!): String
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
