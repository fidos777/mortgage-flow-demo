// app/agent/layout.tsx
import { ReactNode } from 'react';

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="role-agent">
      {children}
    </div>
  );
}
