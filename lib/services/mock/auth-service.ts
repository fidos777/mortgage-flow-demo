// lib/services/mock/auth-service.ts
// Mock Auth Service - simulates authentication for demo mode

import { IAuthService } from '../index';
import { Role } from '@/types/stakeholder';
import { useCaseStore } from '@/lib/store/case-store';

export class MockAuthService implements IAuthService {
  async getCurrentRole(): Promise<Role | null> {
    const store = useCaseStore.getState();
    return store.currentRole;
  }
  
  async switchRole(role: Role): Promise<void> {
    const store = useCaseStore.getState();
    store.setRole(role);
  }
  
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    // Mock OTP verification - always succeeds for demo
    // In production, this would call the actual OTP service
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, any 6-digit OTP is valid
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      return true;
    }
    
    return false;
  }
}
