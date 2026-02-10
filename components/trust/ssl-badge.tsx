// components/trust/ssl-badge.tsx
import { Shield } from 'lucide-react'

export function SSLBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
      <Shield className="w-3.5 h-3.5 text-green-600" />
      <span>SSL Secured</span>
    </div>
  )
}
