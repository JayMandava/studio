import { Laptop2, Stethoscope } from 'lucide-react';
import type React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-lg font-bold ${className}`}>
      <div className="relative">
        <Laptop2 className="h-6 w-6 text-sidebar-foreground" />
        <Stethoscope className="h-3 w-3 text-sidebar-foreground absolute -bottom-0.5 -right-0.5" />
      </div>
      <span className="font-headline text-sidebar-foreground">HealthTestAI</span>
    </div>
  );
}
