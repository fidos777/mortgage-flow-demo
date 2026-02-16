// app/listing/layout.tsx
import { ReactNode } from 'react';

export default function ListingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="role-listing">
      {children}
    </div>
  );
}
