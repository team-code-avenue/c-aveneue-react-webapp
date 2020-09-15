import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { WebSocketLink } from "apollo-link-ws";
import { onError } from "apollo-link-error";
import { getMainDefinition } from "apollo-utilities";
import { setContext } from "apollo-link-context";
import { getCurrentSession } from "api/auth";
import { logout } from "store/auth/slice";
import { addToActive, removeFromActive } from "store/ui/request/slice";
import uuid from "uuid-random";

let subscriptionClient = null;
let link = null;

const setSubscriptionUrl = (accessToken, idToken) => {
  if (subscriptionClient) {
    const newUrl = `${
      process.env.REACT_APP_WS_GRAPHQL_URL
    }?auth-at=${encodeURIComponent(accessToken)}&auth-it=${encodeURIComponent(
      idToken
    )}`;
    const prevUrl = subscriptionClient.url;

    if (newUrl !== prevUrl) {
      subscriptionClient.close();
      subscriptionClient.url = newUrl;
      subscriptionClient.close(false);
    }
  }
};
// Could have been done inside httpLink concater too
export const logLink = dispatch =>
  new ApolloLink((operation, forward) => {
    const requestId = uuid();
    dispatch(addToActive({ requestId }));
    const reqContext = { requestId };
    operation.setContext(reqContext);
    return forward(operation).map(result => {
      dispatch(
        removeFromActive({ requestId: operation.getContext().requestId })
      );
      return result;
    });
  });

/**
 * The Http Link uses the headers field on the context to allow passing headers to the HTTP request.
 * It also supports the credentials field for defining credentials policy, uri for changing the endpoint dynamically,
 *  and fetchOptions to allow generic fetch overrides (i.e. method: "GET").
 * These options will override the same key if passed when creating the the link.
 */
export const authLink = setContext(
  //(operation, prevContext)
  (_, { headers }) =>
    new Promise((resolve, reject) => {
      getCurrentSession()
        .then(session => {
          let additionalHeaders = {};
          if (session.allowDevAuth && session.devAuthId) {
            additionalHeaders = {
              "x-auth-user-id": session.devAuthId
            };
          } else {
            const idToken = session.getIdToken().jwtToken;
            const accessToken = session.getAccessToken().jwtToken;
            additionalHeaders = {
              "x-auth-at": accessToken,
              "x-auth-it": idToken
            };

            setSubscriptionUrl(accessToken, idToken);
          }

          resolve({
            headers: {
              ...headers,
              ...additionalHeaders
            },
            credentials: "same-origin"
          });
        })
        .catch(error => {
          reject(error);
        });
    })
);

export const errorLink = dispatch =>
  onError(({ graphQLErrors, networkError, operation, forward, response }) => {
    dispatch(removeFromActive({ requestId: operation.getContext().requestId }));
    if (graphQLErrors) {
      graphQLErrors.map(({ message, location, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${location}, Path: ${path}`
        )
      );
    }
    if (networkError) {
      console.log(`[Network error]: ${networkError.bodyText}`);
      if (networkError.statusCode === 401) {
        //client.resetStore()
        dispatch(logout());
      }
    }
  });

export const subscriptionLink = (config = {}) => {
  if (!subscriptionClient) {
    subscriptionClient = new SubscriptionClient(
      process.env.REACT_APP_WS_GRAPHQL_URL,
      {
        reconnect: true,
        lazy: true,
        ...config
      }
    );
  }

  // Todo: Remove authentication through query params when backend
  // implements the correct way
  getCurrentSession().then(session => {
    if (!session.allowDevAuth) {
      const accessToken = session.getAccessToken().jwtToken;
      const idToken = session.getIdToken().jwtToken;
      setSubscriptionUrl(accessToken, idToken);
    }
  });

  link = new WebSocketLink(subscriptionClient);

  return link;
};

export const queryOrMutationLink = (config = {}) =>
  new ApolloLink((operation, forward) => {
    //no-op
    return forward(operation);
  }).concat(
    new HttpLink({
      uri: process.env.REACT_APP_HTTP_GRAPHQL_URL,
      ...config
    })
  );

export const requestLink = ({ queryOrMutationLink, subscriptionLink }) =>
  ApolloLink.split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === "OperationDefinition" && operation === "subscription";
    },
    subscriptionLink,
    queryOrMutationLink
  );
