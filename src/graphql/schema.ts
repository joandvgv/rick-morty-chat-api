export default `#graphql
  type Message {
    id: String
    character: String
    message: String
    threadId: String
    time: String
  }

  type DeleteResult {
    success: Boolean
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
  }
`;
