import {
  Badge,
  Button,
  Flex,
  Image,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import MetamaskFox from 'assets/metamask-fox.svg';
import { useSettings } from 'contexts/SettingsContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { useBridgeDirection } from 'hooks/useBridgeDirection';
import { WalletFilledIcon } from 'icons/WalletFilledIcon';
import { NON_ETH_CHAIN_IDS } from 'lib/constants';
import {
  getNetworkName,
  getWalletProviderName,
  handleWalletError,
  logError,
} from 'lib/helpers';
import { addChainToMetaMask, switchToChain } from 'lib/metamask';
import React, { useCallback } from 'react';

export const ConnectWeb3 = () => {
  const {
    homeChainId,
    foreignChainId,
    label: bridgeLabel,
    getBridgeChainId,
  } = useBridgeDirection();
  const { queryToken } = useSettings();
  const queryChainId = queryToken ? queryToken.chainId : null;
  const { connectWeb3, loading, account, ethersProvider } = useWeb3Context();
  const toast = useToast();

  const showError = useCallback(
    msg => {
      if (msg) {
        toast({
          title: 'Error',
          description: msg,
          status: 'error',
          isClosable: 'true',
        });
      }
    },
    [toast],
  );

  const switchChain = useCallback(
    async chainId => {
      try {
        if (NON_ETH_CHAIN_IDS.includes(chainId)) {
          await addChainToMetaMask({ chainId });
        } else {
          await switchToChain({ chainId });
        }
      } catch (metamaskError) {
        logError({ metamaskError });
        handleWalletError(metamaskError, showError);
      }
    },
    [showError],
  );

  const renderChain = useCallback(
    (chainId, connect = true) => {
      const networkName = getNetworkName(chainId);
      const isWalletMetamask =
        getWalletProviderName(ethersProvider) === 'metamask';

      return isWalletMetamask && connect ? (
        <Tooltip label={`Click to switch to ${networkName}`} position="auto">
          <Badge
            display="inline-flex"
            alignItems="center"
            py={1}
            px={2}
            m={1}
            borderRadius={5}
            size="1"
            cursor="pointer"
            colorScheme="blue"
            onClick={() => switchChain(chainId)}
          >
            <Image boxSize={5} src={MetamaskFox} mr={2} />
            {networkName}
          </Badge>
        </Tooltip>
      ) : (
        <Text
          as="span"
          fontWeight="bold"
          textTransform="uppercase"
          fontSize="0.9rem"
          color="black"
        >
          {' '}
          {networkName}
        </Text>
      );
    },
    [switchChain, ethersProvider],
  );

  const renderBridgeLabel = useCallback(
    () => (
      <Text
        as="span"
        fontWeight="bold"
        textTransform="uppercase"
        fontSize="0.9rem"
      >
        {bridgeLabel}
      </Text>
    ),
    [bridgeLabel],
  );

  const renderHelperBox = useCallback(() => {
    if (queryChainId && [homeChainId, foreignChainId].includes(queryChainId)) {
      return (
        <Text color="greyText" mb={4} textAlign="center">
          Please switch to {renderChain(queryChainId)} for bridging your tokens
          to {renderChain(getBridgeChainId(queryChainId), false)}
        </Text>
      );
    }
    return (
      <Text color="greyText" mb={4} textAlign="center">
        To access the {renderBridgeLabel()} Mask Bridge, please switch to
        {renderChain(foreignChainId)}
      </Text>
    );
  }, [
    queryChainId,
    homeChainId,
    foreignChainId,
    renderBridgeLabel,
    renderChain,
    getBridgeChainId,
  ]);

  return (
    <Flex
      background="white"
      boxShadow="0px 1rem 2rem rgba(204, 218, 238, 0.8)"
      borderRadius="8px"
      direction="column"
      align="center"
      w="calc(100% - 2rem)"
      p="2rem"
      maxW="27.5rem"
      mx={4}
    >
      <Flex
        bg={account && !loading ? 'red.500' : 'blue.500'}
        borderRadius="50%"
        p="1rem"
        justify="center"
        align="center"
        color="white"
        mb={4}
      >
        <WalletFilledIcon boxSize="1.75rem" />
      </Flex>
      {loading ? (
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Connecting Wallet
        </Text>
      ) : (
        <>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            {account ? `Switch your network` : 'Connect Wallet'}
          </Text>

          {!account ? (
            <Text color="greyText" mb={4} textAlign="center">
              To get started, connect your wallet
            </Text>
          ) : (
            renderHelperBox()
          )}
        </>
      )}
      {account && !loading ? (
        <Button
          onClick={() => switchChain(foreignChainId)}
          colorScheme="blue"
          px={12}
          borderRadius={20}
        >
          Switch to {getNetworkName(foreignChainId)}
        </Button>
      ) : (
        <Button
          onClick={connectWeb3}
          colorScheme="blue"
          px={12}
          isLoading={loading}
          borderRadius={20}
        >
          Connect
        </Button>
      )}
    </Flex>
  );
};
