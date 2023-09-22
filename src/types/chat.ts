export type PutMessageMutationVariables = {
  message: string;
  threadId: string;
  character: string;
};

export type GetMessagesQueryVariables = {
  threadId: string;
};
