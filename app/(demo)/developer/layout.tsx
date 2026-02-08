// app/developer/layout.tsx
import { ReactNode } from 'react';

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="role-developer">
      {children}
    </div>
  );
}
