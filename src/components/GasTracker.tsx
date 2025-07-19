import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasStore } from '@/store/gasStore';
import { web3Service } from '@/services/web3Service';
import { Activity, Zap, DollarSign, Clock } from 'lucide-react';

export function GasTracker() {
  const { chains, mode, ethUsdPrice, setMode } = useGasStore();

  useEffect(() => {
    // Initialize Web3 service when component mounts
    web3Service.initialize();

    return () => {
      // Cleanup on unmount
      web3Service.disconnect();
    };
  }, []);

  const getGasStatus = (totalFee: number) => {
    if (totalFee < 20) return { status: 'Low', color: 'gas-low', variant: 'success' as const };
    if (totalFee < 50) return { status: 'Medium', color: 'gas-medium', variant: 'warning' as const };
    return { status: 'High', color: 'gas-high', variant: 'destructive' as const };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Gas Tracker
          </h1>
          <p className="text-muted-foreground">
            Real-time gas prices across Ethereum, Polygon, and Arbitrum
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${ethUsdPrice.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">ETH/USD</div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={mode === 'live' ? 'crypto' : 'simulation'}
              onClick={() => setMode('live')}
              size="sm"
            >
              <Activity className="w-4 h-4" />
              Live
            </Button>
            <Button 
              variant={mode === 'simulation' ? 'crypto' : 'simulation'}
              onClick={() => setMode('simulation')}
              size="sm"
            >
              <Zap className="w-4 h-4" />
              Simulate
            </Button>
          </div>
        </div>
      </div>

      {/* Gas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(chains).map(([chainKey, chainData]) => {
          const totalFee = chainData.baseFee + chainData.priorityFee;
          const gasStatus = getGasStatus(totalFee);
          const gasCostUSD = (totalFee * chainData.gasLimit * ethUsdPrice) / 1e9;
          
          return (
            <Card key={chainKey} className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
              {/* Chain gradient overlay */}
              <div className={`absolute inset-0 opacity-5 ${
                chainKey === 'ethereum' ? 'gradient-ethereum' :
                chainKey === 'polygon' ? 'gradient-polygon' :
                'gradient-arbitrum'
              }`} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        chainData.isConnected ? 'bg-success animate-pulse' : 'bg-muted'
                      }`} 
                    />
                    {chainData.name}
                  </CardTitle>
                  <Badge variant={gasStatus.variant} className="font-mono">
                    {gasStatus.status}
                  </Badge>
                </div>
                <CardDescription>
                  Chain ID: {chainData.chainId}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                {/* Gas Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Base Fee</p>
                    <p className="text-lg font-mono font-bold">
                      {chainData.baseFee.toFixed(2)} gwei
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Priority Fee</p>
                    <p className="text-lg font-mono font-bold">
                      {chainData.priorityFee.toFixed(2)} gwei
                    </p>
                  </div>
                </div>
                
                {/* Total Cost */}
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Transfer Cost</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg">
                        ${gasCostUSD.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalFee.toFixed(2)} gwei
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Last Update */}
                {chainData.lastUpdate > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Updated {formatTime(chainData.lastUpdate)}
                  </div>
                )}
                
                {/* Connection Status */}
                {!chainData.isConnected && (
                  <div className="text-xs text-error">
                    ❌ Disconnected - Attempting to reconnect...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}