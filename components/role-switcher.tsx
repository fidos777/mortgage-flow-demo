// components/role-switcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCaseStore } from '@/lib/store/case-store';
import { Role, ROLE_CONFIG } from '@/types/stakeholder';

const roles: Role[] = ['buyer', 'agent', 'developer'];

export function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRole, setRole, currentCaseId } = useCaseStore();
  
  // Derive current role from path if available
  const pathRole = pathname.split('/')[1] as Role;
  const activeRole = roles.includes(pathRole) ? pathRole : currentRole;

  const handleSwitch = (newRole: Role) => {
    setRole(newRole);
    
    // Smart navigation: preserve case context when possible
    if (currentCaseId && newRole !== 'developer') {
      // Agent and Buyer can view cases
      if (newRole === 'agent') {
        router.push(`/agent/case/${currentCaseId}`);
      } else {
        router.push(`/buyer/journey`);
      }
    } else {
      router.push(`/${newRole}`);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-700/50 rounded-xl p-1">
      {roles.map((role) => {
        const config = ROLE_CONFIG[role];
        const isActive = activeRole === role;
        
        return (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
              transition-all duration-200
              ${isActive
                ? `${config.bgColor} text-white shadow-lg scale-105`
                : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
              }
            `}
            title={config.description}
          >
            <span className="text-base">{config.icon}</span>
            <span className="hidden sm:inline">{config.labelBm}</span>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for mobile
export function RoleSwitcherCompact() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRole, setRole } = useCaseStore();
  
  const pathRole = pathname.split('/')[1] as Role;
  const activeRole = roles.includes(pathRole) ? pathRole : currentRole;

  return (
    <div className="flex items-center gap-1">
      {roles.map((role) => {
        const config = ROLE_CONFIG[role];
        const isActive = activeRole === role;
        
        return (
          <button
            key={role}
            onClick={() => {
              setRole(role);
              router.push(`/${role}`);
            }}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              transition-all duration-200
              ${isActive
                ? `${config.bgColor} text-white shadow-lg`
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }
            `}
            title={`${config.labelBm}: ${config.description}`}
          >
            <span className="text-lg">{config.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
