import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import type React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-lg font-bold ${className}`}>
      <LocalHospitalIcon fontSize="medium" className="h-6 w-6 text-sidebar-foreground" />
      <span className="font-headline text-sidebar-foreground">HealthTestAI</span>
    </div>
  );
}
