export default `#graphql
  type EventDetails {
    EventId: String
    ErrorMessage: String
    ErrorCode: String
  }

  type Message {
    character: String
    message: String
    threadId: String
    time: String
  }

  type Result {
    Entries: [EventDetails]
    FailedEntries: Int
  }

  type Subscription {
    chat(threadId: String!): String
  }

  type Mutation {
    putMessage(message: String!, threadId: String!): Result
  }

  type Query {
    getMessages(threadId: String!): [Message]
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
