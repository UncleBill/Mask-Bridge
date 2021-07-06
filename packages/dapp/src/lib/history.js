import { gql, request } from 'graphql-request';

const pageSize = 1000;

const requestsUserQuery = gql`
  query getTransactions($user: String!, $first: Int!, $skip: Int!) {
    requests: transactions(
      where: { address: $user }
      orderBy: id
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      user: address
      txHash: id
      timestamp: created_at
      amount
      token: from_token {
        type
        address
        symbol
        decimals
      }
      fromToken: from_token {
        type
        address
        symbol
        decimals
      }
      toToken: to_token {
        type
        address
        symbol
        decimals
      }
    }
  }
`;

const requestsRecipientQuery = gql`
  query getTransactions($user: String!, $first: Int!, $skip: Int!) {
    requests: transactions(
      where: { address: $user }
      orderBy: id
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      user: address
      txHash: id
      timestamp: created_at
      amount
      token: from_token {
        type
        address
        symbol
        decimals
      }
      fromToken: from_token {
        type
        address
        symbol
        decimals
      }
      toToken: to_token {
        type
        address
        symbol
        decimals
      }
    }
  }
`;

export const getExecutions = () => Promise.resolve({ executions: [] });

export const getRequests = async (user, graphEndpoint) => {
  const [userRequests, recipientRequests] = await Promise.all([
    getRequestsWithQuery(user, graphEndpoint, requestsUserQuery),
    getRequestsWithQuery(user, graphEndpoint, requestsRecipientQuery),
  ]);
  return {
    requests: [...userRequests.requests, ...recipientRequests.requests],
  };
};

export const getRequestsWithQuery = async (user, graphEndpoint, query) => {
  let requests = [];
  let page = 0;
  const first = pageSize;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const data = await request(graphEndpoint, query, {
      user,
      first,
      skip: page * pageSize,
    });
    if (data) {
      requests = data.requests.concat(requests);
    }
    if (!data || data.requests.length < pageSize) break;
    page += 1;
  }

  return { requests };
};

export const combineRequestsWithExecutions = (
  requests,
  otherRequest,
  chainId,
) =>
  requests.map(req => {
    const matchTx = otherRequest.find(tx => tx.txHash === req.txHash);
    return {
      user: req.user,
      chainId,
      timestamp: req.timestamp,
      sendingTx: req.txHash,
      receivingTx: matchTx?.txHash,
      status: !!matchTx,
      amount: req.amount,
      fromToken: req.fromToken,
      toToken: req.toToken,
    };
  });
