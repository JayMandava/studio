import { TestTubeDiagonal } from 'lucide-react';
import type React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-lg font-bold ${className}`}>
      <TestTubeDiagonal className="h-6 w-6 text-primary" />
      <span className="font-headline">HealthTestAI</span>
    </div>
  );
}
