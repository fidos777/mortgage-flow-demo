'use client';

/**
 * WhatsApp Contact CTA
 * CR-004: Agent Contact CTAs | PRD v3.6.3
 *
 * Quick WhatsApp contact button with pre-built message templates.
 * Tracks contact attempts for audit and follow-up management.
 */

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Phone,
  ChevronDown,
  Check,
  Clock,
  FileText,
  Calendar,
  AlertTriangle,
  Copy,
  ExternalLink,
  History,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type ContactPurpose =
  | 'DOC_REMINDER'
  | 'TAC_CONFIRMATION'
  | 'TAC_RESCHEDULE'
  | 'KJ_REMINDER'
  | 'LO_EXPIRY'
  | 'GENERAL_UPDATE'
  | 'WELCOME';

export interface WhatsAppTemplate {
  id: string;
  purpose: ContactPurpose;
  labelBm: string;
  labelEn: string;
  messageBm: string;
  messageEn: string;
  icon: React.ElementType;
  color: string;
}

export interface ContactAttempt {
  id: string;
  caseId: string;
  purpose: ContactPurpose;
  channel: 'WHATSAPP' | 'CALL' | 'SMS';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED' | 'FAILED';
  createdAt: string;
  notes?: string;
}

export interface BuyerContact {
  name: string;
  phone: string;
  caseRef: string;
  propertyName: string;
  unitCode?: string;
  tacDate?: string;
  tacTime?: string;
  kjDeadline?: string;
  loExpiryDate?: string;
  missingDocs?: string[];
}

interface WhatsAppContactCTAProps {
  buyer: BuyerContact;
  caseId: string;
  locale?: 'bm' | 'en';
  variant?: 'button' | 'dropdown' | 'full';
  onContactAttempt?: (attempt: Omit<ContactAttempt, 'id' | 'createdAt'>) => void;
}

// =============================================================================
// TEMPLATES
// =============================================================================

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'welcome',
    purpose: 'WELCOME',
    labelBm: 'Selamat Datang',
    labelEn: 'Welcome',
    messageBm: `Assalamualaikum {name},

Saya {agentName} dari Snang.my, ejen mortgage untuk permohonan LPPSA anda di {property}.

Ref Kes: {caseRef}

Saya akan membantu anda sepanjang proses ini. Jika ada sebarang soalan, sila hubungi saya.

Terima kasih! 🏠`,
    messageEn: `Hello {name},

I'm {agentName} from Snang.my, your mortgage agent for the LPPSA application at {property}.

Case Ref: {caseRef}

I'll be assisting you throughout this process. Feel free to reach out if you have any questions.

Thank you! 🏠`,
    icon: MessageCircle,
    color: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'doc-reminder',
    purpose: 'DOC_REMINDER',
    labelBm: 'Peringatan Dokumen',
    labelEn: 'Document Reminder',
    messageBm: `Assalamualaikum {name},

Peringatan mesra untuk dokumen permohonan LPPSA anda:

📋 Dokumen diperlukan:
{missingDocs}

Sila muat naik melalui portal Snang.my atau hantar terus kepada saya.

Ref: {caseRef}
Hartanah: {property}`,
    messageEn: `Hello {name},

Friendly reminder about your LPPSA application documents:

📋 Required documents:
{missingDocs}

Please upload via the Snang.my portal or send directly to me.

Ref: {caseRef}
Property: {property}`,
    icon: FileText,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'tac-confirmation',
    purpose: 'TAC_CONFIRMATION',
    labelBm: 'Pengesahan TAC',
    labelEn: 'TAC Confirmation',
    messageBm: `Assalamualaikum {name},

📅 TAC anda telah dijadualkan:
Tarikh: {tacDate}
Masa: {tacTime}

Sila sahkan kehadiran anda dengan reply "OK".

Lokasi: Pejabat LPPSA
Ref: {caseRef}

Jika perlu tukar tarikh, sila maklumkan segera.`,
    messageEn: `Hello {name},

📅 Your TAC has been scheduled:
Date: {tacDate}
Time: {tacTime}

Please confirm your attendance by replying "OK".

Location: LPPSA Office
Ref: {caseRef}

If you need to reschedule, please let me know ASAP.`,
    icon: Calendar,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'tac-reschedule',
    purpose: 'TAC_RESCHEDULE',
    labelBm: 'Jadual Semula TAC',
    labelEn: 'Reschedule TAC',
    messageBm: `Assalamualaikum {name},

TAC anda perlu dijadualkan semula.

Sila pilih tarikh baru yang sesuai:
[ ] Isnin - Jumaat, 9am - 4pm

Reply dengan tarikh dan masa pilihan anda.

Ref: {caseRef}`,
    messageEn: `Hello {name},

Your TAC needs to be rescheduled.

Please select a new suitable date:
[ ] Monday - Friday, 9am - 4pm

Reply with your preferred date and time.

Ref: {caseRef}`,
    icon: Calendar,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'kj-reminder',
    purpose: 'KJ_REMINDER',
    labelBm: 'Peringatan KJ',
    labelEn: 'KJ Reminder',
    messageBm: `⚠️ PENTING - Keputusan Jual (KJ)

Assalamualaikum {name},

Tarikh akhir KJ: {kjDeadline}

Sila tandatangan KJ secepat mungkin untuk mengelakkan kelewatan.

Ref: {caseRef}
Hartanah: {property}`,
    messageEn: `⚠️ IMPORTANT - Sale Decision (KJ)

Hello {name},

KJ deadline: {kjDeadline}

Please sign the KJ as soon as possible to avoid delays.

Ref: {caseRef}
Property: {property}`,
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
  },
  {
    id: 'lo-expiry',
    purpose: 'LO_EXPIRY',
    labelBm: 'LO Hampir Tamat',
    labelEn: 'LO Expiring Soon',
    messageBm: `⏰ URGENT - Letter of Offer

Assalamualaikum {name},

LO anda akan tamat pada: {loExpiryDate}

Tindakan segera diperlukan untuk mengelakkan permohonan dibatalkan.

Sila hubungi saya untuk langkah seterusnya.

Ref: {caseRef}`,
    messageEn: `⏰ URGENT - Letter of Offer

Hello {name},

Your LO expires on: {loExpiryDate}

Immediate action required to avoid application cancellation.

Please contact me for next steps.

Ref: {caseRef}`,
    icon: Clock,
    color: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'general-update',
    purpose: 'GENERAL_UPDATE',
    labelBm: 'Kemaskini Umum',
    labelEn: 'General Update',
    messageBm: `Assalamualaikum {name},

Kemaskini mengenai permohonan LPPSA anda:

[Tulis mesej anda di sini]

Ref: {caseRef}
Hartanah: {property}`,
    messageEn: `Hello {name},

Update regarding your LPPSA application:

[Write your message here]

Ref: {caseRef}
Property: {property}`,
    icon: MessageCircle,
    color: 'bg-slate-100 text-slate-700',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateWhatsAppUrl(phone: string, message: string): string {
  // Remove non-numeric characters and ensure proper format
  const cleanPhone = phone.replace(/\D/g, '');
  // Add Malaysia country code if not present
  const formattedPhone = cleanPhone.startsWith('60')
    ? cleanPhone
    : `60${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

function fillTemplate(template: string, buyer: BuyerContact, agentName: string = 'Ejen Snang'): string {
  return template
    .replace(/{name}/g, buyer.name)
    .replace(/{agentName}/g, agentName)
    .replace(/{property}/g, buyer.propertyName)
    .replace(/{caseRef}/g, buyer.caseRef)
    .replace(/{unitCode}/g, buyer.unitCode || '-')
    .replace(/{tacDate}/g, buyer.tacDate || '[Tarikh TAC]')
    .replace(/{tacTime}/g, buyer.tacTime || '[Masa TAC]')
    .replace(/{kjDeadline}/g, buyer.kjDeadline || '[Tarikh Akhir KJ]')
    .replace(/{loExpiryDate}/g, buyer.loExpiryDate || '[Tarikh Tamat LO]')
    .replace(/{missingDocs}/g, buyer.missingDocs?.map(d => `• ${d}`).join('\n') || '• [Senarai dokumen]');
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WhatsAppContactCTA({
  buyer,
  caseId,
  locale = 'bm',
  variant = 'dropdown',
  onContactAttempt,
}: WhatsAppContactCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState<ContactAttempt[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Reset copied state
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleSelectTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    const message = locale === 'bm' ? template.messageBm : template.messageEn;
    setCustomMessage(fillTemplate(message, buyer));
  };

  const handleSendWhatsApp = () => {
    if (!customMessage) return;

    const url = generateWhatsAppUrl(buyer.phone, customMessage);
    window.open(url, '_blank');

    // Track contact attempt
    if (onContactAttempt && selectedTemplate) {
      onContactAttempt({
        caseId,
        purpose: selectedTemplate.purpose,
        channel: 'WHATSAPP',
        status: 'SENT',
      });
    }

    // Add to recent attempts (local state for demo)
    setRecentAttempts(prev => [
      {
        id: `attempt-${Date.now()}`,
        caseId,
        purpose: selectedTemplate?.purpose || 'GENERAL_UPDATE',
        channel: 'WHATSAPP',
        status: 'SENT',
        createdAt: new Date().toISOString(),
      },
      ...prev.slice(0, 4),
    ]);

    setIsOpen(false);
    setSelectedTemplate(null);
    setCustomMessage('');
  };

  const handleCopyMessage = async () => {
    if (!customMessage) return;
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Simple button variant
  if (variant === 'button') {
    return (
      <button
        onClick={() => {
          const template = WHATSAPP_TEMPLATES.find(t => t.purpose === 'GENERAL_UPDATE')!;
          const message = fillTemplate(locale === 'bm' ? template.messageBm : template.messageEn, buyer);
          const url = generateWhatsAppUrl(buyer.phone, message);
          window.open(url, '_blank');
        }}
        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-green-700 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </button>
    );
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-green-700 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-green-50 border-b border-green-100 px-4 py-3">
            <p className="font-medium text-green-800 text-sm">
              {locale === 'bm' ? 'Hantar WhatsApp kepada' : 'Send WhatsApp to'}
            </p>
            <p className="text-green-700 text-sm">{buyer.name}</p>
          </div>

          {!selectedTemplate ? (
            <>
              {/* Template List */}
              <div className="p-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-slate-500 px-2 mb-2">
                  {locale === 'bm' ? 'Pilih template mesej:' : 'Select message template:'}
                </p>
                {WHATSAPP_TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${template.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {locale === 'bm' ? template.labelBm : template.labelEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Recent Attempts */}
              {recentAttempts.length > 0 && (
                <div className="border-t border-slate-100 p-2">
                  <p className="text-xs text-slate-500 px-2 mb-1 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {locale === 'bm' ? 'Terbaru' : 'Recent'}
                  </p>
                  <div className="space-y-1">
                    {recentAttempts.slice(0, 2).map(attempt => {
                      const template = WHATSAPP_TEMPLATES.find(t => t.purpose === attempt.purpose);
                      return (
                        <div key={attempt.id} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                          <Check className="w-3 h-3 text-green-500" />
                          <span>{locale === 'bm' ? template?.labelBm : template?.labelEn}</span>
                          <span className="text-slate-400">
                            {new Date(attempt.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Message Editor */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setCustomMessage('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    ← {locale === 'bm' ? 'Kembali' : 'Back'}
                  </button>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-medium text-slate-700">
                    {locale === 'bm' ? selectedTemplate.labelBm : selectedTemplate.labelEn}
                  </span>
                </div>

                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                  placeholder={locale === 'bm' ? 'Edit mesej...' : 'Edit message...'}
                />

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={handleCopyMessage}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        {locale === 'bm' ? 'Disalin!' : 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        {locale === 'bm' ? 'Salin' : 'Copy'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendWhatsApp}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {locale === 'bm' ? 'Buka WhatsApp' : 'Open WhatsApp'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default WhatsAppContactCTA;
