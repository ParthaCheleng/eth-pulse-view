# 🚀 Cross-Chain Gas Tracker

**Real-Time Gas Price Monitoring & Transaction Cost Simulation**

A comprehensive Web3 dashboard that provides real-time gas price tracking across Ethereum, Polygon, and Arbitrum, with transaction cost simulation and live USD pricing from Uniswap V3.

## ✨ Features

### 🔴 **Live Mode**
- **Real-time gas tracking** across 3 major chains using WebSocket connections
- **Live ETH/USD pricing** directly from Uniswap V3 Swap events 
- **Interactive candlestick charts** showing 15-minute gas price volatility
- **Auto-updating dashboard** with 6-second refresh intervals

### ⚡ **Simulation Mode**
- **Transaction cost calculator** for any amount and gas limit
- **Cross-chain comparison** showing cheapest/most expensive options
- **Real-time savings calculation** between chains
- **Smart presets** for common transaction types (transfers, swaps, NFT mints)

### 🎨 **Beautiful UI**
- **Crypto-optimized dark theme** with neon accents and gradients
- **Real-time status indicators** with pulsing animations
- **Responsive design** optimized for all screen sizes
- **Smooth transitions** and hover effects throughout

## 🛠️ Technical Implementation

### **Real-Time Data Architecture**
- **WebSocket Providers**: Direct connections to Ethereum, Polygon, and Arbitrum RPCs
- **Uniswap V3 Integration**: Live ETH/USD pricing from `sqrtPriceX96` values
- **State Management**: Zustand with complex state machine handling live/simulation modes
- **Data Processing**: 15-minute candlestick aggregation with historical data storage

### **Key Complexities Solved**
✅ **Priority Fee Calculation**: Chain-specific gas mechanics (Arbitrum L1 costs, Polygon fee structure)  
✅ **Real-time USD Pricing**: Direct Uniswap V3 event parsing without external APIs  
✅ **WebSocket Management**: Auto-reconnection and error handling for stable connections  
✅ **State Synchronization**: Shared state between chart visualization and gas widgets  
✅ **Gas Simulations**: Accurate cost calculations including base fees and priority fees  

### **Tech Stack**
- **Frontend**: React + TypeScript + Vite
- **Web3**: Ethers.js v6 with WebSocket providers
- **Charts**: Lightweight Charts for candlestick visualization
- **State**: Zustand with middleware for complex state management
- **UI**: shadcn/ui + Tailwind CSS with custom crypto theme
- **Real-time**: WebSocket connections to chain RPCs + Uniswap event monitoring

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd cross-chain-gas-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## 📊 How It Works

### **Gas Price Tracking**
1. WebSocket connections to each chain's RPC endpoint
2. Real-time block monitoring for `baseFeePerGas` extraction
3. Priority fee estimation using `getFeeData()` calls
4. Historical data aggregation for trend analysis

### **USD Price Calculation**
1. Monitor Uniswap V3 ETH/USDC pool (`0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640`)
2. Parse `Swap` events to extract `sqrtPriceX96` values
3. Convert using formula: `price = (sqrtPriceX96²×10¹²) / 2¹⁹²`
4. Real-time price updates every 30 seconds + live event monitoring

### **Transaction Simulation**
1. User inputs: amount, token, gas limit
2. Real-time cost calculation: `(baseFee + priorityFee) × gasLimit × ethPrice`
3. Cross-chain comparison with savings calculation
4. Estimated confirmation time based on priority fee levels

## 🎯 Demo Scenarios

Try these scenarios to see the dashboard in action:

1. **ETH Transfer (21,000 gas)**: Compare simple transfer costs
2. **DEX Swap (150,000 gas)**: See how complex transactions cost more
3. **NFT Mint (200,000 gas)**: Experience high gas limit scenarios
4. **Live Mode**: Watch real-time gas price fluctuations
5. **Chart Analysis**: Observe 15-minute candlestick patterns

## 🌐 Live Demo

**Hosted URL**: [View Live Demo](https://lovable.dev/projects/069657f4-da62-4593-b360-1b952eb31863)

## 📈 Key Metrics Tracked

- **Base Fee**: EIP-1559 base fee per gas (gwei)
- **Priority Fee**: Miner tip for faster inclusion (gwei)  
- **Total Gas Cost**: Combined fee × gas limit in USD
- **ETH/USD Price**: Live price from Uniswap V3
- **Chain Status**: Real-time connection monitoring
- **Transaction Time**: Estimated confirmation time

## 🔧 Configuration

The app uses demo RPC endpoints by default. For production use:

1. Replace RPC URLs in `src/services/web3Service.ts`
2. Add your own Alchemy/Infura API keys
3. Configure environment variables for different chains

## 📚 Architecture Deep Dive

### **Zustand State Machine**
```typescript
interface GasState {
  mode: 'live' | 'simulation';
  chains: { ethereum, polygon, arbitrum };
  ethUsdPrice: number;
  simulation: { input, results };
  // Complex state mutations with history management
}
```

### **Real-time Data Flow**
```
WebSocket → Block Events → Gas Extraction → Zustand Store → UI Updates
Uniswap V3 → Swap Events → Price Calculation → Store → Price Display
```

### **Chart Integration**
- Lightweight Charts for high-performance visualization
- Real-time candlestick data generation from gas history
- 15-minute interval aggregation with OHLC calculation

## 🤝 Contributing

This project demonstrates advanced Web3 frontend development patterns:
- Real-time blockchain data integration
- Complex state management for live/simulation modes  
- Professional UI/UX for crypto applications
- Performance-optimized chart visualizations

Feel free to extend with additional chains, improve gas estimation algorithms, or enhance the visualization features!
