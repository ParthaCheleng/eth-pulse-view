import { useState } from 'react';
import { GasTracker } from '@/components/GasTracker';
import { GasChart } from '@/components/GasChart';
import { SimulationPanel } from '@/components/SimulationPanel';
import { useGasStore } from '@/store/gasStore';

const Index = () => {
  const { mode } = useGasStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Gas Tracker - Always visible */}
        <GasTracker />
        
        {/* Conditional Content Based on Mode */}
        {mode === 'live' ? (
          <GasChart />
        ) : (
          <SimulationPanel />
        )}
      </div>
    </div>
  );
};

export default Index;
