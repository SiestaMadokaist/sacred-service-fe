import { useState, useEffect } from "react";
import { apiLambda, IAuth, setAuth } from "../api/api";
import { ApiHub } from "../api/hub";

interface MetaMaskError extends Error {
  code?: number;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider & {
      providers?: EthereumProvider[];
    };
  }
}

// Helper function to get MetaMask provider specifically
const getMetaMaskProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined' || !window.ethereum) return null;

  // If there are multiple providers, find MetaMask
  if (window.ethereum.providers?.length) {
    return window.ethereum.providers.find((p) => p.isMetaMask) || null;
  }

  // Otherwise check if the single provider is MetaMask
  return window.ethereum.isMetaMask ? window.ethereum : null;
};

export const useMetaMask = (hub: ApiHub) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const provider = getMetaMaskProvider();

    // Check if MetaMask is installed
    setIsMetaMaskInstalled(!!provider);

    // Check if already connected on mount
    const savedAccount = localStorage.getItem('metamask_account');
    if (savedAccount && provider) {
      setAccount(savedAccount);
    }

    // Listen for account changes
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null);
          localStorage.removeItem('metamask_account');
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          localStorage.setItem('metamask_account', accounts[0]);
        }
      };

      provider.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (provider?.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [account]);

  const connectWallet = async (): Promise<string | null> => {
    const provider = getMetaMaskProvider();

    if (!provider) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      setAccount(address);
      localStorage.setItem('metamask_account', address);

      return address;
    } catch (err) {
      const metamaskError = err as MetaMaskError;
      if (metamaskError.code === 4001) {
        setError('Please connect to MetaMask.');
      } else {
        setError(metamaskError.message || 'An error occurred while connecting to MetaMask.');
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    const provider = getMetaMaskProvider();

    if (!provider || !account) {
      setError('Please connect your wallet first.');
      return null;
    }

    try {
      setError(null);
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account],
      });

      return signature;
    } catch (err) {
      const metamaskError = err as MetaMaskError;
      if (metamaskError.code === 4001) {
        setError('You rejected the signature request.');
      } else {
        setError(metamaskError.message || 'An error occurred while signing the message.');
      }
      return null;
    }
  };

  const loginWithMetaMask = async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setError(null);

      // Step 1: Connect wallet
      const address = account || await connectWallet();
      if (!address) {
        return false;
      }

      // Step 2: Get challenge from server
      const api = apiLambda('/users', hub, { token: '', exp: 0, iat: 0, sub: '', claim: {}, sessionId: '' });
      // const { data: challengeData } = await api.post<{ challenge: string }>('/metamask/challenge', { address });
      // const challenge = challengeData.challenge;
      const challenge = 'login';

      // Step 3: Sign message: {signature: `${challenge}:${Date.now()}`, address: '0x....'}
      const timestamp = Date.now();
      const messageToSign = `${challenge}:${timestamp}`;
      const signature = await signMessage(messageToSign);

      if (!signature) {
        return false;
      }

      // Step 4: Verify signature and get JWT
      const { data: auth } = await api.post<IAuth>('/metamask/verify', {
        address,
        signature,
        timestamp,
        message: messageToSign,
      });

      // Step 5: Set auth token (same as regular login)
      setAuth(auth);

      return true;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred during MetaMask login.');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    localStorage.removeItem('metamask_account');
    setAuth({ token: '', exp: 0, iat: 0, sub: '', claim: {}, sessionId: '' });
  };

  return {
    account,
    isConnecting,
    error,
    connectWallet,
    signMessage,
    loginWithMetaMask,
    disconnect,
    isMetaMaskInstalled,
  };
};
