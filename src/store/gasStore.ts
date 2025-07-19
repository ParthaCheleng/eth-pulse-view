import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GasPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
  totalFee: number;
  blockNumber: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChainData {
  name: string;
  rpcUrl: string;
  chainId: number;
  baseFee: number;
  priorityFee: number;
  gasLimit: number;
  isConnected: boolean;
  lastUpdate: number;
  history: GasPoint[];
  candlestickData: CandlestickData[];
  color: string;
}

export interface SimulationInput {
  amount: string;
  tokenSymbol: string;
  gasLimit: number;
}

export interface SimulationResult {
  chain: string;
  gasCostETH: number;
  gasCostUSD: number;
  totalCostUSD: number;
  estimatedTime: string;
}

export interface GasState {
  mode: 'live' | 'simulation';
  ethUsdPrice: number;
  lastEthPriceUpdate: number;
  
  chains: {
    ethereum: ChainData;
    polygon: ChainData;
    arbitrum: ChainData;
  };
  
  simulation: {
    input: SimulationInput;
    results: SimulationResult[];
  };
  
  // Actions
  setMode: (mode: 'live' | 'simulation') => void;
  updateChainData: (chain: keyof GasState['chains'], data: Partial<ChainData>) => void;
  addGasPoint: (chain: keyof GasState['chains'], point: GasPoint) => void;
  updateEthPrice: (price: number) => void;
  setSimulationInput: (input: SimulationInput) => void;
  calculateSimulation: () => void;
  updateCandlestickData: (chain: keyof GasState['chains']) => void;
}

const HISTORY_LIMIT = 100; // Keep last 100 data points
const CANDLESTICK_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

const initialChainData: Omit<ChainData, 'name' | 'rpcUrl' | 'chainId' | 'color'> = {
  baseFee: 0,
  priorityFee: 0,
  gasLimit: 21000,
  isConnected: false,
  lastUpdate: 0,
  history: [],
  candlestickData: []
};

export const useGasStore = create<GasState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'live',
    ethUsdPrice: 0,
    lastEthPriceUpdate: 0,
    
    chains: {
      ethereum: {
        ...initialChainData,
        name: 'Ethereum',
        rpcUrl: 'wss://eth-mainnet.ws.alchemyapi.io/v2/demo',
        chainId: 1,
        color: '#627EEA'
      },
      polygon: {
        ...initialChainData,
        name: 'Polygon',
        rpcUrl: 'wss://polygon-mainnet.ws.alchemyapi.io/v2/demo',
        chainId: 137,
        color: '#8247E5'
      },
      arbitrum: {
        ...initialChainData,
        name: 'Arbitrum',
        rpcUrl: 'wss://arb-mainnet.ws.alchemyapi.io/v2/demo',
        chainId: 42161,
        color: '#2D374B'
      }
    },
    
    simulation: {
      input: {
        amount: '0.1',
        tokenSymbol: 'ETH',
        gasLimit: 21000
      },
      results: []
    },
    
    setMode: (mode) => set({ mode }),
    
    updateChainData: (chain, data) => set((state) => ({
      chains: {
        ...state.chains,
        [chain]: {
          ...state.chains[chain],
          ...data,
          lastUpdate: Date.now()
        }
      }
    })),
    
    addGasPoint: (chain, point) => set((state) => {
      const chainData = state.chains[chain];
      const newHistory = [...chainData.history, point].slice(-HISTORY_LIMIT);
      
      return {
        chains: {
          ...state.chains,
          [chain]: {
            ...chainData,
            history: newHistory,
            baseFee: point.baseFee,
            priorityFee: point.priorityFee,
            lastUpdate: Date.now()
          }
        }
      };
    }),
    
    updateEthPrice: (price) => set({
      ethUsdPrice: price,
      lastEthPriceUpdate: Date.now()
    }),
    
    setSimulationInput: (input) => set((state) => ({
      simulation: {
        ...state.simulation,
        input
      }
    })),
    
    calculateSimulation: () => {
      const state = get();
      const { chains, ethUsdPrice, simulation } = state;
      const { amount, gasLimit } = simulation.input;
      
      const results: SimulationResult[] = Object.entries(chains).map(([chainKey, chainData]) => {
        const totalGasFee = (chainData.baseFee + chainData.priorityFee) * gasLimit;
        const gasCostETH = totalGasFee / 1e9; // Convert from gwei to ETH
        const gasCostUSD = gasCostETH * ethUsdPrice;
        const transactionValueUSD = parseFloat(amount) * ethUsdPrice;
        const totalCostUSD = gasCostUSD + transactionValueUSD;
        
        // Estimate confirmation time based on gas price level
        let estimatedTime = '~2 mins';
        if (chainData.priorityFee < 1) estimatedTime = '~5 mins';
        else if (chainData.priorityFee > 5) estimatedTime = '~30 secs';
        
        return {
          chain: chainData.name,
          gasCostETH,
          gasCostUSD,
          totalCostUSD,
          estimatedTime
        };
      });
      
      set((state) => ({
        simulation: {
          ...state.simulation,
          results
        }
      }));
    },
    
    updateCandlestickData: (chain) => {
      const state = get();
      const chainData = state.chains[chain];
      const { history } = chainData;
      
      if (history.length < 2) return;
      
      // Group data by 15-minute intervals
      const intervals = new Map<number, GasPoint[]>();
      
      history.forEach(point => {
        const intervalTime = Math.floor(point.timestamp / CANDLESTICK_INTERVAL) * CANDLESTICK_INTERVAL;
        if (!intervals.has(intervalTime)) {
          intervals.set(intervalTime, []);
        }
        intervals.get(intervalTime)!.push(point);
      });
      
      // Convert to candlestick format
      const candlestickData: CandlestickData[] = Array.from(intervals.entries())
        .map(([time, points]) => {
          const fees = points.map(p => p.totalFee);
          return {
            time: time / 1000, // Convert to seconds for lightweight-charts
            open: fees[0],
            high: Math.max(...fees),
            low: Math.min(...fees),
            close: fees[fees.length - 1]
          };
        })
        .sort((a, b) => a.time - b.time);
      
      set((state) => ({
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            candlestickData
          }
        }
      }));
    }
  }))
);