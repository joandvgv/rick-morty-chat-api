export default `#graphql
  type EventDetails {
    EventId: String
    ErrorMessage: String
    ErrorCode: String
  }

  type Message {
    id: String
    character: String
    message: String
    threadId: String
    time: String
  }

  type DeleteResult {
    ids: [String]
  }

  type Subscription {
    chat(threadId: String!): String
  }

  type Mutation {
    putMessage(message: String!, threadId: String!, character: String!): Message
    deleteMessages(threadId: String!): DeleteResult
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
