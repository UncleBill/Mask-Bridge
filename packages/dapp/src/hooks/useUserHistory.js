import { useWeb3Context } from 'contexts/Web3Context';
import { useBridgeDirection } from 'hooks/useBridgeDirection';
import { combineRequestsWithExecutions, getRequests } from 'lib/history';
import { useEffect, useState } from 'react';

const txSortFn = (a, b) => b.timestamp - a.timestamp;

export const useUserHistory = () => {
  const { homeChainId, foreignChainId, getGraphEndpoint } =
    useBridgeDirection();
  const { account } = useWeb3Context();
  const [transfers, setTransfers] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return () => undefined;
    let isSubscribed = true;
    async function update() {
      setTransfers();
      setLoading(true);
      const [{ requests: homeRequests }, { requests: foreignRequests }] =
        await Promise.all([
          getRequests(account, getGraphEndpoint(homeChainId)),
          getRequests(account, getGraphEndpoint(foreignChainId)),
        ]);
      const homeTransfers = combineRequestsWithExecutions(
        homeRequests,
        foreignRequests,
        homeChainId,
      );
      const foreignTransfers = combineRequestsWithExecutions(
        foreignRequests,
        homeRequests,
        foreignChainId,
      );
      const homeList = homeTransfers.sort(txSortFn).map(homeTx => {
        const matchTx = foreignTransfers.find(
          tx => tx.txHash === homeTx.txHash,
        );
        return {
          ...homeTx,
          toToken: matchTx.fromToken,
        };
      });
      const foreignList = foreignTransfers.map(foreignTx => {
        const matchTx = foreignTransfers.find(
          tx => tx.txHash === foreignTx.txHash,
        );
        return {
          ...foreignTx,
          toToken: matchTx.fromToken,
        };
      });
      const filteredIds = [];
      const allTransfers = [...homeList, ...foreignList]
        .sort(txSortFn)
        .filter(tx => {
          if (filteredIds.includes(tx.sendingTx)) {
            return false;
          }
          filteredIds.push(tx.sendingTx);
          return true;
        });
      if (isSubscribed) {
        setTransfers(allTransfers);
        setLoading(false);
      }
    }

    update();

    return () => {
      isSubscribed = false;
    };
  }, [homeChainId, foreignChainId, account, getGraphEndpoint]);

  return { transfers, loading };
};
