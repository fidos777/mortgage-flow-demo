// __tests__/file-validation.test.ts
// Unit tests for PRD Section 21.1 file validation
// Run with: npx vitest run __tests__/file-validation.test.ts

import { describe, it, expect } from 'vitest';
import { 
  validateUpload, 
  validateDocumentType, 
  isLikelyScreenshot,
  formatFileSize 
} from '../lib/kuasaturbo/file-validation';

describe('File Validation - PRD Section 21.1', () => {
  
  describe('isLikelyScreenshot detection', () => {
    it('should detect small images as screenshots', () => {
      const file = { name: 'document.png', type: 'image/png', size: 200 * 1024 }; // 200KB
      expect(isLikelyScreenshot(file)).toBe(true);
    });

    it('should NOT flag large images as screenshots', () => {
      const file = { name: 'scan.png', type: 'image/png', size: 2 * 1024 * 1024 }; // 2MB
      expect(isLikelyScreenshot(file)).toBe(false);
    });

    it('should detect iPhone screenshot pattern', () => {
      const file = { name: 'IMG_1234.PNG', type: 'image/png', size: 1 * 1024 * 1024 };
      expect(isLikelyScreenshot(file)).toBe(true);
    });

    it('should detect Android screenshot pattern', () => {
      const file = { name: 'Screenshot_20260131_123456.png', type: 'image/png', size: 1 * 1024 * 1024 };
      expect(isLikelyScreenshot(file)).toBe(true);
    });

    it('should detect generic screenshot names', () => {
      const patterns = [
        'screenshot.png',
        'Screen Shot 2026-01-31.png',
        'capture.jpg',
        'snip_123.png',
        'clipboard.png'
      ];
      
      patterns.forEach(name => {
        const file = { name, type: 'image/png', size: 1 * 1024 * 1024 };
        expect(isLikelyScreenshot(file)).toBe(true);
      });
    });

    it('should NOT flag PDFs as screenshots', () => {
      const file = { name: 'screenshot.pdf', type: 'application/pdf', size: 100 * 1024 };
      expect(isLikelyScreenshot(file)).toBe(false);
    });
  });

  describe('validateUpload - Stage-Aware', () => {
    describe('PRESCAN phase (signal allowed)', () => {
      it('should ALLOW screenshots with warning', () => {
        const file = { name: 'screenshot.png', type: 'image/png', size: 200 * 1024 };
        const result = validateUpload(file, 'PRESCAN');
        
        expect(result.valid).toBe(true);
        expect(result.warning).toContain('diterima untuk imbasan awal');
      });

      it('should ALLOW PDFs without warning', () => {
        const file = { name: 'document.pdf', type: 'application/pdf', size: 500 * 1024 };
        const result = validateUpload(file, 'PRESCAN');
        
        expect(result.valid).toBe(true);
        expect(result.warning).toBeUndefined();
      });
    });

    describe('DOCS_PENDING phase (evidence required)', () => {
      it('should BLOCK screenshots', () => {
        const file = { name: 'screenshot.png', type: 'image/png', size: 200 * 1024 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Screenshot tidak diterima');
      });

      it('should ALLOW PDFs', () => {
        const file = { name: 'payslip.pdf', type: 'application/pdf', size: 500 * 1024 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(true);
      });

      it('should ALLOW large scanned images with warning', () => {
        const file = { name: 'ic_scan.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(true);
        expect(result.warning).toContain('PDF disyorkan');
      });
    });

    describe('File size limits', () => {
      it('should REJECT files over 10MB', () => {
        const file = { name: 'huge.pdf', type: 'application/pdf', size: 15 * 1024 * 1024 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('terlalu besar');
      });

      it('should REJECT empty files', () => {
        const file = { name: 'empty.pdf', type: 'application/pdf', size: 0 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('kosong');
      });
    });

    describe('File type restrictions', () => {
      it('should REJECT unsupported file types', () => {
        const file = { name: 'document.docx', type: 'application/vnd.openxmlformats', size: 500 * 1024 };
        const result = validateUpload(file, 'DOCS_PENDING');
        
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('tidak disokong');
      });

      it('should ACCEPT PDF, JPEG, PNG, HEIC', () => {
        const types = [
          { name: 'doc.pdf', type: 'application/pdf' },
          { name: 'photo.jpg', type: 'image/jpeg' },
          { name: 'scan.png', type: 'image/png' },
          { name: 'iphone.heic', type: 'image/heic' },
        ];
        
        types.forEach(({ name, type }) => {
          const file = { name, type, size: 1 * 1024 * 1024 };
          const result = validateUpload(file, 'PRESCAN');
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe('validateDocumentType - Document-specific rules', () => {
    it('should warn for small IC files', () => {
      const file = { name: 'ic.pdf', type: 'application/pdf', size: 30 * 1024 }; // 30KB
      const result = validateDocumentType('IC', file, 'DOCS_PENDING');
      
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('berkualiti rendah');
    });

    it('should prefer PDF for bank statements', () => {
      const file = { name: 'bank.jpg', type: 'image/jpeg', size: 1 * 1024 * 1024 };
      const result = validateDocumentType('BANK', file, 'DOCS_PENDING');
      
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('PDF disyorkan');
    });
  });

  describe('formatFileSize utility', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 500)).toBe('500.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });
});
