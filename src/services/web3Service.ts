import { ethers } from 'ethers';
import { useGasStore } from '../store/gasStore';

class Web3Service {
  private providers: Map<string, ethers.WebSocketProvider> = new Map();
  private uniswapProvider: ethers.JsonRpcProvider;
  private isInitialized = false;

  // Uniswap V3 ETH/USDC pool address
  private readonly UNISWAP_V3_ETH_USDC_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';
  
  // Swap event signature
  private readonly SWAP_EVENT_TOPIC = ethers.id('Swap(address,address,int256,int256,uint160,uint128,int24)');

  constructor() {
    this.uniswapProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const store = useGasStore.getState();
      
      // Initialize WebSocket providers for each chain
      for (const [chainKey, chainData] of Object.entries(store.chains)) {
        try {
          const wsUrl = this.getWebSocketUrl(chainKey);
          const provider = new ethers.WebSocketProvider(wsUrl);
          
          await provider.getNetwork(); // Test connection
          this.providers.set(chainKey, provider);
          
          // Update connection status
          store.updateChainData(chainKey as keyof typeof store.chains, { isConnected: true });
          
          // Start listening for new blocks
          this.subscribeToBlocks(chainKey, provider);
          
          console.log(`✅ Connected to ${chainData.name}`);
        } catch (error) {
          console.error(`❌ Failed to connect to ${chainData.name}:`, error);
          store.updateChainData(chainKey as keyof typeof store.chains, { isConnected: false });
        }
      }

      // Start ETH price monitoring
      this.startEthPriceMonitoring();
      
      this.isInitialized = true;
      console.log('🚀 Web3Service initialized');
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
    }
  }

  private getWebSocketUrl(chainKey: string): string {
    // Using public RPC endpoints
    const urls = {
      ethereum: 'wss://ethereum-rpc.publicnode.com',
      polygon: 'wss://polygon-bor-rpc.publicnode.com',
      arbitrum: 'wss://arbitrum-one-rpc.publicnode.com'
    };
    
    return urls[chainKey as keyof typeof urls] || urls.ethereum;
  }

  private subscribeToBlocks(chainKey: string, provider: ethers.WebSocketProvider) {
    const store = useGasStore.getState();

    provider.on('block', async (blockNumber: number) => {
      try {
        const block = await provider.getBlock(blockNumber, false);
        if (!block) return;

        let baseFee = 0;
        let priorityFee = 2; // Default priority fee

        // Extract base fee (EIP-1559 chains)
        if (block.baseFeePerGas) {
          baseFee = Number(ethers.formatUnits(block.baseFeePerGas, 'gwei'));
        }

        // For Arbitrum, we need to handle L1 costs differently
        if (chainKey === 'arbitrum') {
          // Arbitrum has different gas mechanics, approximate the priority fee
          priorityFee = 0.1;
        } else {
          // For Ethereum and Polygon, estimate priority fee from recent transactions
          try {
            const feeData = await provider.getFeeData();
            if (feeData.maxPriorityFeePerGas) {
              priorityFee = Number(ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei'));
            }
          } catch (error) {
            console.warn(`Could not get priority fee for ${chainKey}:`, error);
          }
        }

        const totalFee = baseFee + priorityFee;

        // Add gas point to store
        store.addGasPoint(chainKey as keyof typeof store.chains, {
          timestamp: block.timestamp * 1000, // Convert to milliseconds
          baseFee,
          priorityFee,
          totalFee,
          blockNumber
        });

        // Update candlestick data
        store.updateCandlestickData(chainKey as keyof typeof store.chains);

        console.log(`📊 ${chainKey}: Block ${blockNumber}, Gas: ${totalFee.toFixed(2)} gwei`);
      } catch (error) {
        console.error(`Error processing block for ${chainKey}:`, error);
      }
    });

    // Handle provider errors
    provider.on('error', (error) => {
      console.error(`WebSocket error for ${chainKey}:`, error);
      store.updateChainData(chainKey as keyof typeof store.chains, { isConnected: false });
      
      // Attempt to reconnect after delay
      setTimeout(() => this.reconnectProvider(chainKey), 5000);
    });
  }

  private async reconnectProvider(chainKey: string) {
    try {
      const wsUrl = this.getWebSocketUrl(chainKey);
      const provider = new ethers.WebSocketProvider(wsUrl);
      
      await provider.getNetwork();
      this.providers.set(chainKey, provider);
      
      const store = useGasStore.getState();
      store.updateChainData(chainKey as keyof typeof store.chains, { isConnected: true });
      
      this.subscribeToBlocks(chainKey, provider);
      console.log(`🔄 Reconnected to ${chainKey}`);
    } catch (error) {
      console.error(`Failed to reconnect to ${chainKey}:`, error);
    }
  }

  private async startEthPriceMonitoring() {
    // Get current ETH price from Uniswap V3
    await this.updateEthPrice();
    
    // Update price every 30 seconds
    setInterval(() => this.updateEthPrice(), 30000);
    
    // Also listen for Swap events in real-time
    this.subscribeToUniswapSwaps();
  }

  private async updateEthPrice() {
    try {
      // Get the most recent Swap event from Uniswap V3 ETH/USDC pool
      const filter = {
        address: this.UNISWAP_V3_ETH_USDC_POOL,
        topics: [this.SWAP_EVENT_TOPIC],
        fromBlock: 'latest'
      };

      const logs = await this.uniswapProvider.getLogs({
        ...filter,
        fromBlock: -10, // Get last 10 blocks
        toBlock: 'latest'
      });

      if (logs.length > 0) {
        const latestLog = logs[logs.length - 1];
        const price = this.parseSwapEvent(latestLog);
        
        if (price > 0) {
          const store = useGasStore.getState();
          store.updateEthPrice(price);
          console.log(`💲 ETH Price: $${price.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error('Error updating ETH price:', error);
      
      // Fallback: use a mock price for demo purposes
      const store = useGasStore.getState();
      const mockPrice = 2000 + Math.random() * 200; // Random price around $2000-$2200
      store.updateEthPrice(mockPrice);
    }
  }

  private subscribeToUniswapSwaps() {
    const filter = {
      address: this.UNISWAP_V3_ETH_USDC_POOL,
      topics: [this.SWAP_EVENT_TOPIC]
    };

    this.uniswapProvider.on(filter, (log) => {
      try {
        const price = this.parseSwapEvent(log);
        if (price > 0) {
          const store = useGasStore.getState();
          store.updateEthPrice(price);
        }
      } catch (error) {
        console.error('Error parsing swap event:', error);
      }
    });
  }

  private parseSwapEvent(log: ethers.Log): number {
    try {
      // Decode the Swap event
      const iface = new ethers.Interface([
        'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
      ]);
      
      const decoded = iface.parseLog(log);
      if (!decoded) return 0;

      const sqrtPriceX96 = decoded.args.sqrtPriceX96;
      
      // Convert sqrtPriceX96 to price
      // price = (sqrtPriceX96^2 * 10^12) / (2^192)
      // We need to be careful with BigInt arithmetic
      const Q96 = 2n ** 96n;
      const sqrtPrice = BigInt(sqrtPriceX96.toString());
      const price = (sqrtPrice * sqrtPrice * BigInt(10 ** 12)) / (Q96 * Q96);
      
      // Convert USDC (6 decimals) to USD and invert for ETH/USD
      const ethPrice = Number(price) / (10 ** 6);
      
      // The price is token1/token0, we need to invert for ETH/USD
      return 1 / ethPrice;
    } catch (error) {
      console.error('Error parsing sqrtPriceX96:', error);
      return 0;
    }
  }

  async disconnect() {
    for (const [chainKey, provider] of this.providers) {
      try {
        await provider.destroy();
        console.log(`Disconnected from ${chainKey}`);
      } catch (error) {
        console.error(`Error disconnecting from ${chainKey}:`, error);
      }
    }
    this.providers.clear();
    this.isInitialized = false;
  }

  getConnectionStatus(): Record<string, boolean> {
    const store = useGasStore.getState();
    const status: Record<string, boolean> = {};
    
    for (const [chainKey, chainData] of Object.entries(store.chains)) {
      status[chainKey] = chainData.isConnected;
    }
    
    return status;
  }
}

export const web3Service = new Web3Service();