import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useGasStore } from '@/store/gasStore';
import { Calculator, Zap, DollarSign, Clock, ArrowRight } from 'lucide-react';

export function SimulationPanel() {
  const { 
    simulation, 
    chains, 
    ethUsdPrice, 
    setSimulationInput, 
    calculateSimulation 
  } = useGasStore();

  const [amount, setAmount] = useState(simulation.input.amount);
  const [tokenSymbol, setTokenSymbol] = useState(simulation.input.tokenSymbol);
  const [gasLimit, setGasLimit] = useState(simulation.input.gasLimit.toString());

  // Auto-calculate when inputs change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSimulationInput({
        amount,
        tokenSymbol,
        gasLimit: parseInt(gasLimit) || 21000
      });
      calculateSimulation();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [amount, tokenSymbol, gasLimit, setSimulationInput, calculateSimulation]);

  const getTransactionType = (gasLimit: number) => {
    if (gasLimit <= 21000) return 'Simple Transfer';
    if (gasLimit <= 50000) return 'Token Transfer';
    if (gasLimit <= 100000) return 'DEX Swap';
    if (gasLimit <= 200000) return 'NFT Mint';
    return 'Complex Contract';
  };

  const getCheapestChain = () => {
    if (simulation.results.length === 0) return null;
    return simulation.results.reduce((cheapest, current) => 
      current.gasCostUSD < cheapest.gasCostUSD ? current : cheapest
    );
  };

  const getMostExpensiveChain = () => {
    if (simulation.results.length === 0) return null;
    return simulation.results.reduce((expensive, current) => 
      current.gasCostUSD > expensive.gasCostUSD ? current : expensive
    );
  };

  const cheapest = getCheapestChain();
  const mostExpensive = getMostExpensiveChain();
  const savings = mostExpensive && cheapest ? 
    ((mostExpensive.gasCostUSD - cheapest.gasCostUSD) / mostExpensive.gasCostUSD) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Transaction Simulator
          </CardTitle>
          <CardDescription>
            Compare gas costs across chains for your transaction
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {tokenSymbol}
                </div>
              </div>
            </div>

            {/* Token Symbol */}
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Select value={tokenSymbol} onValueChange={setTokenSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="MATIC">MATIC</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gas Limit */}
            <div className="space-y-2">
              <Label htmlFor="gasLimit">Gas Limit</Label>
              <Input
                id="gasLimit"
                type="number"
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
                placeholder="21000"
              />
              <p className="text-xs text-muted-foreground">
                {getTransactionType(parseInt(gasLimit) || 21000)}
              </p>
            </div>
          </div>

          {/* ETH Price Display */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Current ETH Price:</span>
            <span className="font-mono font-bold text-primary">
              ${ethUsdPrice.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Cost Comparison
              </CardTitle>
              <CardDescription>
                Real-time gas costs across all chains
              </CardDescription>
            </div>
            
            {savings > 0 && cheapest && (
              <Badge variant="default" className="text-success border-success/20">
                Save {savings.toFixed(1)}% on {cheapest.chain}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {simulation.results.map((result, index) => {
              const isCheapest = result.chain === cheapest?.chain;
              const isMostExpensive = result.chain === mostExpensive?.chain;
              
              return (
                <div 
                  key={result.chain}
                  className={`p-4 rounded-lg border transition-all ${
                    isCheapest ? 'border-success/50 bg-success/5' :
                    isMostExpensive ? 'border-error/50 bg-error/5' :
                    'border-border/50 bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: Object.values(chains).find(c => c.name === result.chain)?.color 
                        }}
                      />
                      <div>
                        <h3 className="font-semibold">{result.chain}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {result.estimatedTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg font-mono font-bold">
                          ${result.gasCostUSD.toFixed(6)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.gasCostETH.toFixed(8)} ETH
                      </div>
                    </div>
                    
                    {isCheapest && (
                      <Badge variant="default" className="ml-2 text-success border-success/20">
                        Cheapest
                      </Badge>
                    )}
                    {isMostExpensive && simulation.results.length > 1 && (
                      <Badge variant="destructive" className="ml-2">
                        Most Expensive
                      </Badge>
                    )}
                  </div>
                  
                  {/* Total Transaction Cost */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total ({amount} {tokenSymbol} + Gas)
                      </span>
                      <span className="font-mono font-bold">
                        ${result.totalCostUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {simulation.results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Enter transaction details to see cost comparison</p>
              </div>
            )}
          </div>
          
          {/* Quick Presets */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">Quick Presets:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'ETH Transfer', amount: '0.1', gas: '21000' },
                { label: 'Token Swap', amount: '100', gas: '150000' },
                { label: 'NFT Mint', amount: '0.05', gas: '200000' },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="simulation"
                  size="sm"
                  onClick={() => {
                    setAmount(preset.amount);
                    setGasLimit(preset.gas);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}