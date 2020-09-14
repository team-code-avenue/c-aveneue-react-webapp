import { ApolloLink } from "apollo-link";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";

import {
  logLink,
  authLink,
  errorLink,
  queryOrMutationLink,
  requestLink,
  subscriptionLink
} from "core/apollo/links";

const createClient = dispatch => {
  const cache = new InMemoryCache();

  const client = new ApolloClient({
    ssrMode: false,
    link: ApolloLink.from([
      logLink(dispatch),
      authLink,
      errorLink(dispatch),
      requestLink({
        queryOrMutationLink: queryOrMutationLink(),
        subscriptionLink: subscriptionLink()
      })
    ]),
    cache,
    connectToDevTools: true,
    queryDeduplication: true
  });

  return client;
};

export default createClient;
