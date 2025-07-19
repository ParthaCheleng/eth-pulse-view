import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGasStore } from '@/store/gasStore';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export function GasChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Record<string, ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>>>({});
  
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  
  const { chains } = useGasStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: 1,
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: 1,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // Create series for each chain
    Object.entries(chains).forEach(([chainKey, chainData]) => {
      if (chartType === 'candlestick') {
        const series = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickUpColor: '#10b981',
          visible: chainKey === selectedChain,
        });
        seriesRefs.current[chainKey] = series;
      } else {
        const series = chart.addLineSeries({
          color: chainData.color,
          lineWidth: 2,
          visible: chainKey === selectedChain,
        });
        seriesRefs.current[chainKey] = series;
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartType]);

  // Update chart data when store changes
  useEffect(() => {
    if (!chartRef.current) return;

    Object.entries(chains).forEach(([chainKey, chainData]) => {
      const series = seriesRefs.current[chainKey];
      if (!series) return;

      if (chartType === 'candlestick' && chainData.candlestickData.length > 0) {
        (series as ISeriesApi<'Candlestick'>).setData(chainData.candlestickData as any);
      } else if (chartType === 'line' && chainData.history.length > 0) {
        const lineData = chainData.history.map(point => ({
          time: Math.floor(point.timestamp / 1000) as any,
          value: point.totalFee,
        }));
        (series as ISeriesApi<'Line'>).setData(lineData as any);
      }

      // Update visibility
      series.applyOptions({
        visible: chainKey === selectedChain,
      });
    });

    // Fit chart to visible data
    chartRef.current.timeScale().fitContent();
  }, [chains, selectedChain, chartType]);

  const getChainStats = (chainKey: string) => {
    const chainData = chains[chainKey as keyof typeof chains];
    const history = chainData.history;
    
    if (history.length < 2) {
      return { trend: 0, change: 0, isPositive: true };
    }

    const current = history[history.length - 1].totalFee;
    const previous = history[history.length - 2].totalFee;
    const change = ((current - previous) / previous) * 100;
    
    return {
      trend: current,
      change: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Gas Price Volatility
            </CardTitle>
            <CardDescription>
              15-minute intervals • Real-time updates
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex border border-border rounded-lg p-1">
              <Button
                variant={chartType === 'candlestick' ? 'crypto' : 'ghost'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="h-8 px-3"
              >
                Candlestick
              </Button>
              <Button
                variant={chartType === 'line' ? 'crypto' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8 px-3"
              >
                Line
              </Button>
            </div>
          </div>
        </div>
        
        {/* Chain Selector */}
        <div className="flex gap-2">
          {Object.entries(chains).map(([chainKey, chainData]) => {
            const stats = getChainStats(chainKey);
            return (
              <Button
                key={chainKey}
                variant={selectedChain === chainKey ? 'crypto' : 'simulation'}
                size="sm"
                onClick={() => setSelectedChain(chainKey)}
                className="flex-1"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: chainData.color }}
                  />
                  <span>{chainData.name}</span>
                  {stats.trend > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      {stats.isPositive ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-error" />
                      )}
                      <span className={stats.isPositive ? 'text-success' : 'text-error'}>
                        {stats.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        <div ref={chartContainerRef} className="w-full h-96" />
        
        {/* Chart Legend */}
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Green candles/line: Gas prices increased</p>
          <p>• Red candles/line: Gas prices decreased</p>
          <p>• Updates every 15 minutes with live blockchain data</p>
        </div>
      </CardContent>
    </Card>
  );
}