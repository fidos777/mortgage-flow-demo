// app/buyer/layout.tsx
import { ReactNode } from 'react';

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="role-buyer">
      {children}
    </div>
  );
}
