// components/role-switcher.tsx
// BM-3: Reordered for demo flow (Developer → Buyer → Agent)
// BM-3: Active tab color changed from orange to teal
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCaseStore } from '@/lib/store/case-store';
import { Role, ROLE_CONFIG } from '@/types/stakeholder';

// BM-3: DEMO FLOW ORDER — matches actual data causality:
// 1. Developer creates project → generates invitation links
// 2. Buyer receives link → PDPA consent → PreScan
// 3. Agent manages cases → Portal Kit → submission
const roles: Role[] = ['developer', 'buyer', 'agent'];

// BM-3: Step indicators for demo flow
const ROLE_STEPS: Record<Role, number> = {
  developer: 1,
  buyer: 2,
  agent: 3,
  system: 0,  // System role not shown in UI
};

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
    <div className="flex items-center gap-1">
      {/* BM-3: Demo flow indicator (subtle) */}
      <div className="hidden md:flex items-center gap-1 mr-2">
        {roles.map((role, i) => (
          <div key={`step-${role}`} className="flex items-center">
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeRole === role
                  ? 'bg-snang-teal-600 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {ROLE_STEPS[role]}
            </span>
            {i < roles.length - 1 && (
              <span className="text-slate-300 text-xs mx-0.5">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Role tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
        {roles.map((role) => {
          const config = ROLE_CONFIG[role];
          const isActive = activeRole === role;

          return (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-snang-teal-600 text-white shadow-sm'       /* BM-3: teal active */
                  : 'text-slate-600 hover:text-snang-teal-700 hover:bg-snang-teal-50'
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
    </div>
  );
}

// Compact version for mobile
// BM-3: Updated with teal active state
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
                ? 'bg-snang-teal-600 text-white shadow-lg'   /* BM-3: teal active */
                : 'text-slate-400 hover:bg-snang-teal-50 hover:text-snang-teal-700'
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
