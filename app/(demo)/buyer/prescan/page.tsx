// app/buyer/prescan/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight, ChevronLeft, Check, Shield, User, Briefcase,
  DollarSign, Clock, Camera, AlertTriangle, CheckCircle, XCircle,
  Info, Zap, FileText, ArrowRight, Loader2, Mail, Phone, Calculator,
  Plus, Minus, HelpCircle, Share2, Download
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { calculateReadiness, getReadinessBandConfig, getComponentFeedback, ReadinessInputs } from '@/lib/kuasaturbo/readiness-score';
import { useProofLogger } from '@/lib/services/hooks';
import { useTranslation } from '@/lib/i18n';
import { useConsentGuard } from '@/lib/hooks/useConsentGuard';
import { ConsentSummary } from '@/components/consent';

// Wrapper component to handle Suspense for useSearchParams
export default function PreScanPage() {
  return (
    <Suspense fallback={<PreScanLoading />}>
      <PreScanFlow />
    </Suspense>
  );
}

function PreScanLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-snang-teal-600 animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function PreScanFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();

  // PDPA Consent Guard - Sprint 0 Integration
  const {
    isChecking: isCheckingConsent,
    hasConsent: hasPdpaConsent,
    isGateEnabled,
    consentedTypes,
    consentedAt,
  } = useConsentGuard({
    redirectOnMissing: true,
    returnUrl: '/buyer/prescan',
  });

  // Developer branding from URL params
  const [developerLogo, setDeveloperLogo] = useState<string | null>(null);
  const developerName = searchParams?.get('dev') || '';
  const projectFromUrl = searchParams?.get('project') || '';

  // Load developer logo from localStorage if flagged in URL
  useEffect(() => {
    if (searchParams?.get('logo') === 'stored') {
      const storedLogo = localStorage.getItem('developerLogo');
      if (storedLogo) {
        setDeveloperLogo(storedLogo);
      }
    }
  }, [searchParams]);
  // Use service hook instead of direct store access
  const { logReadinessComputed, logPhaseTransitioned } = useProofLogger();
  
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateReadiness> | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);

  // New: Dual verification
  const [verificationMethod, setVerificationMethod] = useState<'otp' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // New: Commitment calculator
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcIncome, setCalcIncome] = useState('');
  const [calcDeductions, setCalcDeductions] = useState<{name: string; amount: string}[]>([
    { name: 'Pinjaman Kereta', amount: '' },
    { name: 'PTPTN', amount: '' },
  ]);
  const [calcResult, setCalcResult] = useState<{total: number; dsr: number; band: string} | null>(null);
  
  const [answers, setAnswers] = useState<ReadinessInputs>({
    employmentType: '',
    employmentScheme: '',
    incomeRange: '',
    serviceYears: '',
    existingLoan: '',
    ageRange: '',
    commitmentRange: '',
    hasUpload: false
  });

  const propertyInfo = {
    name: 'Residensi Harmoni',
    unit: 'A-12-03',
    price: 'RM 450,000',
    type: 'Apartment (Subsale)',
    agent: 'Ahmad Razif'
  };

  // Dynamic labels based on selected language
  const employmentTypes = [
    { value: 'tetap', label: t('employment.type.permanent') },
    { value: 'kontrak', label: t('employment.type.contract') }
  ];

  const employmentSchemes = [
    { value: 'persekutuan', label: t('employment.scheme.federal') },
    { value: 'negeri', label: t('employment.scheme.state') },
    { value: 'berkanun', label: t('employment.scheme.statutory') },
    { value: 'pbt', label: t('employment.scheme.local') }
  ];

  const incomeRanges = [
    { value: '2000-3000', label: 'RM 2,000 - RM 3,000' },
    { value: '3001-4000', label: 'RM 3,001 - RM 4,000' },
    { value: '4001-5000', label: 'RM 4,001 - RM 5,000' },
    { value: '5001-6000', label: 'RM 5,001 - RM 6,000' },
    { value: '6001-8000', label: 'RM 6,001 - RM 8,000' },
    { value: '8001+', label: lang === 'bm' ? 'RM 8,001 ke atas' : 'RM 8,001 and above' }
  ];

  const serviceYearsOptions = [
    { value: '0-2', label: t('employment.years.less3') },
    { value: '3-4', label: t('employment.years.3to4') },
    { value: '5+', label: t('employment.years.5plus') }
  ];

  const commitmentRanges = [
    { value: '0-30', label: t('commitment.range.30') },
    { value: '31-40', label: t('commitment.range.31to40') },
    { value: '41-50', label: t('commitment.range.41to50') },
    { value: '51+', label: t('commitment.range.51plus') }
  ];

  const ageRanges = [
    { value: 'below35', label: t('additional.age.below35') },
    { value: '35-49', label: t('additional.age.35to49') },
    { value: '50-55', label: t('additional.age.50to55') },
    { value: '56+', label: t('additional.age.56plus') }
  ];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const sendOtp = () => {
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp.join('').length === 6) {
      setStep(2);
    }
  };

  const sendEmailLink = () => {
    if (email.includes('@')) {
      setEmailSent(true);
      // Simulate email link click after 2 seconds for demo
      setTimeout(() => setStep(2), 2000);
    }
  };

  // Commitment Calculator functions
  const addDeduction = () => {
    setCalcDeductions([...calcDeductions, { name: '', amount: '' }]);
  };

  const removeDeduction = (index: number) => {
    setCalcDeductions(calcDeductions.filter((_, i) => i !== index));
  };

  const updateDeduction = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...calcDeductions];
    updated[index][field] = value;
    setCalcDeductions(updated);
  };

  const calculateDSR = () => {
    const income = parseFloat(calcIncome) || 0;
    const totalDeductions = calcDeductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    if (income > 0) {
      const dsr = (totalDeductions / income) * 100;
      let band = '0-30';
      if (dsr > 50) band = '51+';
      else if (dsr > 40) band = '41-50';
      else if (dsr > 30) band = '31-40';

      setCalcResult({ total: totalDeductions, dsr, band });
    }
  };

  const applyCalculatorResult = () => {
    if (calcResult) {
      setAnswers({ ...answers, commitmentRange: calcResult.band });
      setShowCalculator(false);
    }
  };

  // Helper to get contributing factors for result display
  const getContributingFactors = () => {
    const factors: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];

    // Employment
    if (answers.employmentType === 'tetap') {
      factors.push({ type: 'positive', text: t('factor.permanent') });
    } else if (answers.employmentType === 'kontrak') {
      factors.push({ type: 'negative', text: t('factor.contract') });
    }

    // Service years
    if (answers.serviceYears === '5+') {
      factors.push({ type: 'positive', text: t('factor.years5plus') });
    } else if (answers.serviceYears === '0-2') {
      factors.push({ type: 'negative', text: t('factor.yearsLess3') });
    }

    // Income
    if (['6001-8000', '8001+'].includes(answers.incomeRange)) {
      factors.push({ type: 'positive', text: t('factor.incomeHigh') });
    } else if (['2000-3000', '3001-4000'].includes(answers.incomeRange)) {
      factors.push({ type: 'neutral', text: t('factor.incomeModerate') });
    }

    // Commitment
    if (answers.commitmentRange === '0-30') {
      factors.push({ type: 'positive', text: t('factor.commitmentLow') });
    } else if (['41-50', '51+'].includes(answers.commitmentRange)) {
      factors.push({ type: 'negative', text: t('factor.commitmentHigh') });
    } else if (answers.commitmentRange === '31-40') {
      factors.push({ type: 'neutral', text: t('factor.commitmentModerate') });
    }

    // Age
    if (answers.ageRange === '56+') {
      factors.push({ type: 'negative', text: t('factor.age56plus') });
    } else if (answers.ageRange === '50-55') {
      factors.push({ type: 'neutral', text: t('factor.age50to55') });
    }

    // Existing loan
    if (answers.existingLoan === 'yes') {
      factors.push({ type: 'negative', text: t('factor.existingLoan') });
    } else if (answers.existingLoan === 'no') {
      factors.push({ type: 'positive', text: t('factor.noExistingLoan') });
    }

    return factors;
  };

  // Get summary labels
  const getSummaryLabels = () => ({
    employmentType: answers.employmentType === 'tetap' ? t('employment.type.permanent') : t('employment.type.contract'),
    employmentScheme: employmentSchemes.find(s => s.value === answers.employmentScheme)?.label || '-',
    serviceYears: serviceYearsOptions.find(s => s.value === answers.serviceYears)?.label || '-',
    incomeRange: incomeRanges.find(r => r.value === answers.incomeRange)?.label || '-',
    existingLoan: answers.existingLoan === 'yes' ? t('income.existing.yes') : t('income.existing.no'),
    commitmentRange: commitmentRanges.find(r => r.value === answers.commitmentRange)?.label || '-',
    ageRange: ageRanges.find(r => r.value === answers.ageRange)?.label || '-',
  });

  const calculateResult = async () => {
    setProcessing(true);
    setStep(7); // Go to processing step

    setTimeout(async () => {
      const readinessResult = calculateReadiness(answers);
      setResult(readinessResult);

      // Get component-level feedback for guidance
      const componentFeedback = getComponentFeedback(answers);
      setFeedback(componentFeedback);

      // Log proof event via service hook
      await logReadinessComputed('C001', readinessResult.band);

      // Also log phase transition
      await logPhaseTransitioned('C001', 'PRESCAN', 'PRESCAN_COMPLETE');

      setProcessing(false);
      setStep(8); // Go to result step
    }, 2500);
  };

  const renderStep = () => {
    switch(step) {
      case 0: // Welcome
        return (
          <div className="text-center py-4">
            {/* Developer Branding - if from invitation link */}
            {developerName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  {developerLogo ? (
                    <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={developerLogo} alt={developerName} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-snang-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-7 h-7 text-snang-teal-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{t('branding.sentBy', { name: developerName })}</p>
                    <p className="text-xs text-slate-500">{t('branding.sentBySubtitle')}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-400">
                    <Shield className="w-3 h-3 inline mr-1" />
                    {t('branding.verifySource', { name: developerName })}
                  </p>
                </div>
              </div>
            )}

            <div className="w-20 h-20 bg-gradient-to-br from-snang-teal-600 to-snang-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-snang-teal-500/30">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('prescan.title')}</h2>
            <p className="text-slate-500 text-sm mb-4">{t('prescan.subtitle')}</p>
            
            {/* Property Info */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 mb-2">{t('prescan.property.label')}</p>
              <p className="font-semibold text-slate-800">{propertyInfo.name}</p>
              <p className="text-sm text-slate-600">{propertyInfo.unit} • {propertyInfo.price}</p>
              <p className="text-xs text-slate-500 mt-1">{propertyInfo.type}</p>
            </div>

            {/* What this is */}
            <div className="bg-snang-teal-50 border border-snang-teal-200 rounded-xl p-4 mb-4 text-left">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-snang-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-snang-teal-800">
                  <p className="font-semibold mb-1">{t('prescan.info.title')}</p>
                  <p className="text-snang-teal-700">
                    {t('prescan.info.desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* PRD Disclaimer - CRITICAL */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-red-700 text-center">
                <strong>⚠️ {lang === 'bm' ? 'PENAFIAN' : 'DISCLAIMER'}:</strong> {t('prescan.disclaimer')}
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-snang-teal-500/30 hover:shadow-xl transition-all"
            >
              {t('prescan.start')} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 1: // Authorization - Dual Verification
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-snang-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{t('auth.title')}</h2>
              <p className="text-slate-500 text-sm">{t('auth.subtitle')}</p>
            </div>

            {/* PDPA Consent Status - Sprint 0 CR-010 */}
            {/* Old checkbox replaced with PDPA consent summary */}
            {isGateEnabled && hasPdpaConsent && consentedTypes.length > 0 ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-teal-800">
                      {lang === 'bm' ? 'Persetujuan PDPA Diberikan' : 'PDPA Consent Granted'}
                    </p>
                    {consentedAt && (
                      <p className="text-xs text-teal-600">
                        {lang === 'bm' ? 'Diberikan pada' : 'Granted on'}: {new Date(consentedAt).toLocaleString(lang === 'bm' ? 'ms-MY' : 'en-US')}
                      </p>
                    )}
                  </div>
                </div>
                <ConsentSummary
                  consents={consentedTypes.map(type => ({ type, granted: true, grantedAt: consentedAt || undefined }))}
                  locale={lang === 'bm' ? 'bm' : 'en'}
                  compact={true}
                  showTimestamps={false}
                />
              </div>
            ) : !isGateEnabled ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      {lang === 'bm' ? 'Mod Demo Aktif' : 'Demo Mode Active'}
                    </p>
                    <p className="text-xs text-amber-600">
                      {lang === 'bm'
                        ? 'Gerbang PDPA dilangkau dalam mod demo'
                        : 'PDPA gate bypassed in demo mode'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-snang-teal-600 focus:ring-snang-teal-500"
                  />
                  <span className="text-sm text-slate-700">
                    {t('auth.consent')}
                    <span className="text-slate-500 block mt-1 text-xs">
                      {t('auth.consent.note')}
                    </span>
                  </span>
                </label>
              </div>
            )}

            {/* Verification Method Selection */}
            {/* Show verification methods if: PDPA consent given OR legacy consent checkbox checked OR demo mode */}
            {(hasPdpaConsent || consent || !isGateEnabled) && !verificationMethod && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">{t('auth.method.label')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setVerificationMethod('otp')}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 text-left hover:border-snang-teal-300 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-snang-teal-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-snang-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t('auth.otp.title')}</p>
                      <p className="text-sm text-slate-500">{t('auth.otp.desc')}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setVerificationMethod('email')}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 text-left hover:border-snang-teal-300 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-snang-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t('auth.email.title')}</p>
                      <p className="text-sm text-slate-500">{t('auth.email.desc')}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* OTP Method */}
            {verificationMethod === 'otp' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.phone.label')}</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      defaultValue="012-3456789"
                      className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-snang-teal-500 focus:outline-none"
                      disabled={otpSent}
                    />
                    <button
                      onClick={sendOtp}
                      disabled={otpSent}
                      className={`px-6 rounded-xl font-medium ${
                        otpSent
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-snang-teal-600 text-white hover:bg-snang-teal-700'
                      }`}
                    >
                      {otpSent ? t('auth.sent') : t('auth.send.otp')}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.otp.enter')}</label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="w-12 h-14 border-2 border-slate-200 rounded-xl text-center text-xl font-bold focus:border-snang-teal-500 focus:outline-none"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      {t('auth.otp.sent.note')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setVerificationMethod(null)}
                    className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold"
                  >
                    {t('auth.change.method')}
                  </button>
                  <button
                    onClick={verifyOtp}
                    disabled={otp.join('').length !== 6}
                    className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                      otp.join('').length === 6
                        ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {t('auth.verify')} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Email Method */}
            {verificationMethod === 'email' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.email.label')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-snang-teal-500 focus:outline-none"
                    disabled={emailSent}
                  />
                </div>

                {!emailSent ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVerificationMethod(null)}
                      className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold"
                    >
                      {t('auth.change.method')}
                    </button>
                    <button
                      onClick={sendEmailLink}
                      disabled={!email.includes('@')}
                      className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                        email.includes('@')
                          ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {t('auth.send.link')} <Mail className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <Loader2 className="w-8 h-8 text-snang-teal-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-blue-800 font-medium">{t('auth.link.sent')} {email}</p>
                      <p className="text-xs text-snang-teal-600 mt-1">{t('auth.link.click')}</p>
                      <p className="text-xs text-snang-teal-600 mt-2">⏱️ {t('auth.link.valid')}</p>
                    </div>
                    <p className="text-xs text-slate-500">{t('auth.waiting')}</p>
                  </div>
                )}
              </>
            )}

            {/* Show consent required message only if: no PDPA consent AND no legacy consent AND gate enabled */}
            {!hasPdpaConsent && !consent && isGateEnabled && (
              <button
                disabled
                className="w-full py-4 rounded-xl font-semibold bg-slate-100 text-slate-400"
              >
                {t('auth.consent.required')}
              </button>
            )}
          </div>
        );

      case 2: // Employment
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('employment.title')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('employment.subtitle')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('employment.type.label')}</label>
                <div className="space-y-2">
                  {employmentTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setAnswers({...answers, employmentType: type.value as 'tetap' | 'kontrak'})}
                      className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                        answers.employmentType === type.value
                          ? 'border-snang-teal-500 bg-snang-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-slate-800">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('employment.scheme.label')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {employmentSchemes.map(scheme => (
                    <button
                      key={scheme.value}
                      onClick={() => setAnswers({...answers, employmentScheme: scheme.value})}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        answers.employmentScheme === scheme.value
                          ? 'border-snang-teal-500 bg-snang-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800">{scheme.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('employment.years.label')}</label>
                <div className="space-y-2">
                  {serviceYearsOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers({...answers, serviceYears: opt.value})}
                      className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                        answers.serviceYears === opt.value
                          ? 'border-snang-teal-500 bg-snang-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(3)}
              disabled={!answers.employmentType || !answers.employmentScheme || !answers.serviceYears}
              className={`w-full mt-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                answers.employmentType && answers.employmentScheme && answers.serviceYears
                  ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {t('common.next')} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 3: // Income
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('income.title')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('income.subtitle')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('income.range.label')}</label>
                <div className="space-y-2">
                  {incomeRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setAnswers({...answers, incomeRange: range.value})}
                      className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                        answers.incomeRange === range.value
                          ? 'border-snang-teal-500 bg-snang-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800">{range.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('income.existing.label')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAnswers({...answers, existingLoan: 'no'})}
                    className={`border-2 rounded-xl p-4 text-center transition-all ${
                      answers.existingLoan === 'no'
                        ? 'border-snang-teal-500 bg-snang-teal-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{t('income.existing.no')}</p>
                  </button>
                  <button
                    onClick={() => setAnswers({...answers, existingLoan: 'yes'})}
                    className={`border-2 rounded-xl p-4 text-center transition-all ${
                      answers.existingLoan === 'yes'
                        ? 'border-snang-teal-500 bg-snang-teal-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{t('income.existing.yes')}</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> {t('common.back')}
              </button>
              <button 
                onClick={() => setStep(4)}
                disabled={!answers.incomeRange || !answers.existingLoan}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  answers.incomeRange && answers.existingLoan
                    ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {t('common.next')} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 4: // Commitment with Calculator
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('commitment.title')}</h2>
            <p className="text-slate-500 text-sm mb-4">{t('commitment.subtitle')}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                {t('commitment.info')}
              </p>
            </div>

            {/* Calculator Toggle */}
            {!showCalculator && (
              <button
                onClick={() => setShowCalculator(true)}
                className="w-full mb-4 border-2 border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-snang-teal-300 hover:bg-snang-teal-50 transition-all"
              >
                <div className="flex items-center justify-center gap-2 text-slate-600">
                  <Calculator className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('commitment.calculator.prompt')}</span>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            )}

            {/* Calculator Modal */}
            {showCalculator && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-snang-teal-600" />
                    {t('commitment.calculator.title')}
                  </h3>
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Income Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('commitment.calculator.income')}</label>
                  <input
                    type="number"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(e.target.value)}
                    placeholder={t('commitment.calculator.income.placeholder')}
                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-snang-teal-500 focus:outline-none"
                  />
                </div>

                {/* Deductions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('commitment.calculator.deductions')}</label>
                  <div className="space-y-2">
                    {calcDeductions.map((deduction, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={deduction.name}
                          onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                          placeholder={t('common.type')}
                          className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-snang-teal-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={deduction.amount}
                          onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
                          placeholder="RM"
                          className="w-24 border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-snang-teal-500 focus:outline-none"
                        />
                        {calcDeductions.length > 1 && (
                          <button
                            onClick={() => removeDeduction(index)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addDeduction}
                    className="mt-2 text-sm text-snang-teal-600 hover:text-snang-teal-600 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> {t('commitment.calculator.add')}
                  </button>
                </div>

                {/* Calculate Button */}
                <button
                  onClick={calculateDSR}
                  disabled={!calcIncome}
                  className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium mb-3 disabled:bg-slate-300"
                >
                  {t('commitment.calculator.calculate')}
                </button>

                {/* Result */}
                {calcResult && (
                  <div className={`rounded-lg p-3 mb-3 ${
                    calcResult.dsr <= 30 ? 'bg-green-50 border border-green-200' :
                    calcResult.dsr <= 40 ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">{t('commitment.calculator.total')}</span>
                      <span className="font-bold text-slate-800">RM {calcResult.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{t('commitment.calculator.your.dsr')}</span>
                      <span className={`font-bold text-lg ${
                        calcResult.dsr <= 30 ? 'text-green-600' :
                        calcResult.dsr <= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {calcResult.dsr.toFixed(1)}%
                        {calcResult.dsr <= 30 ? ` ✅ ${t('commitment.calculator.healthy')}` :
                         calcResult.dsr <= 40 ? ` ⚠️ ${t('commitment.calculator.moderate')}` : ` ❌ ${t('commitment.calculator.high')}`}
                      </span>
                    </div>
                  </div>
                )}

                {calcResult && (
                  <button
                    onClick={applyCalculatorResult}
                    className="w-full bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-2 rounded-lg font-medium"
                  >
                    {t('commitment.calculator.apply')} ({commitmentRanges.find(r => r.value === calcResult.band)?.label})
                  </button>
                )}
              </div>
            )}

            {/* Manual Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('commitment.range.label')} {showCalculator && <span className="text-slate-400 font-normal">{t('commitment.range.manual')}</span>}
              </label>
              <div className="space-y-2">
                {commitmentRanges.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setAnswers({...answers, commitmentRange: range.value})}
                    className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                      answers.commitmentRange === range.value
                        ? 'border-snang-teal-500 bg-snang-teal-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{range.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> {t('common.back')}
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!answers.commitmentRange}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  answers.commitmentRange
                    ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {t('common.next')} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 5: // Enhance (Optional)
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('additional.title')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('additional.subtitle')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('additional.age.label')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ageRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setAnswers({...answers, ageRange: range.value})}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        answers.ageRange === range.value
                          ? 'border-snang-teal-500 bg-snang-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800">{range.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('additional.upload.label')} <span className="text-slate-400 font-normal">{t('additional.upload.optional')}</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">{t('additional.upload.desc')}</p>
                  <p className="text-xs text-slate-400 mb-3">{t('additional.upload.note')}</p>
                  <button
                    onClick={() => setAnswers({...answers, hasUpload: true})}
                    className={`px-6 py-2 rounded-lg text-sm font-medium ${
                      answers.hasUpload
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {answers.hasUpload ? `✓ ${t('additional.upload.done')}` : t('additional.upload.button')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> {t('common.back')}
              </button>
              <button
                onClick={() => setStep(6)}
                className="flex-1 bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-snang-teal-500/30"
              >
                {t('summary.title')} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 6: // Summary Step (NEW)
        const summaryLabels = getSummaryLabels();
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('summary.title')}</h2>
            <p className="text-slate-500 text-sm mb-4">{t('summary.subtitle')}</p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.employment.type')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.employmentType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.employment.scheme')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.employmentScheme}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.employment.years')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.serviceYears}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.income.range')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.incomeRange}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.existing.loan')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.existingLoan}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">{t('summary.commitment')}</span>
                  <span className="text-sm font-medium text-slate-800">{summaryLabels.commitmentRange}</span>
                </div>
                {answers.ageRange && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-slate-500">{t('summary.age')}</span>
                    <span className="text-sm font-medium text-slate-800">{summaryLabels.ageRange}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Summary */}
            <div className="bg-snang-teal-50 border border-snang-teal-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-snang-teal-600 mb-1">{t('summary.property')}</p>
              <p className="font-semibold text-snang-teal-800">{propertyInfo.name}</p>
              <p className="text-sm text-snang-teal-700">{propertyInfo.unit} • {propertyInfo.price}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 text-center">
                <Info className="w-3 h-3 inline mr-1" />
                {t('summary.note')}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(5)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> {t('summary.edit')}
              </button>
              <button
                onClick={calculateResult}
                className="flex-1 bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-snang-teal-500/30"
              >
                {t('summary.generate')} <Zap className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 7: // Processing
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-snang-teal-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('processing.title')}</h2>
            <p className="text-slate-500 text-sm mb-6">{t('processing.subtitle')}</p>

            <div className="space-y-2 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{t('processing.employment')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{t('processing.income')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('processing.generating')}</span>
              </div>
            </div>
          </div>
        );

      case 8: // Result with Contributing Factors
        if (!result) return null;

        const bandConfig = getReadinessBandConfig(result.band);
        const IconComponent = result.band === 'ready' ? CheckCircle : result.band === 'caution' ? AlertTriangle : XCircle;
        const contributingFactors = getContributingFactors();
        const timestamp = new Date().toLocaleString('ms-MY', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return (
          <div className="text-center">
            <div className={`w-20 h-20 ${bandConfig.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <IconComponent className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-1">{result.label}</h2>
            <p className="text-slate-500 text-sm mb-4">{result.guidance}</p>

            {/* PRD Section 16.3: Display Prohibition - NO SCORE SHOWN */}
            <div className={`${bandConfig.bgLight} border ${bandConfig.borderColor} rounded-xl p-4 mb-4`}>
              <p className={`text-sm ${bandConfig.textColor}`}>
                {t('result.signal.note')}
              </p>
            </div>

            {/* Contributing Factors - NEW */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 font-semibold mb-3">{t('result.factors.title')}</p>
              <div className="space-y-2">
                {contributingFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {factor.type === 'positive' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : factor.type === 'negative' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`${
                      factor.type === 'positive' ? 'text-green-700' :
                      factor.type === 'negative' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {factor.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamp - NEW */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 text-center">
                <Clock className="w-3 h-3 inline mr-1" />
                {t('result.generated')} {timestamp}
              </p>
              <p className="text-xs text-snang-teal-600 text-center mt-1">
                {t('result.valid.until')}
              </p>
            </div>

            {/* Property Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 mb-2">{t('common.property')}:</p>
              <p className="font-semibold text-slate-800">{propertyInfo.name}</p>
              <p className="text-sm text-slate-600">{propertyInfo.unit} • {propertyInfo.price}</p>
            </div>

            {/* Next Steps */}
            <div className="bg-slate-800 rounded-xl p-4 mb-4 text-left">
              <p className="text-snang-teal-500 text-xs font-semibold mb-2">{t('result.next.title')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white">
                  <span className="w-5 h-5 bg-snang-teal-600 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>{t('result.next.step1')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>{t('result.next.step2')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>{t('result.next.step3')}</span>
                </div>
              </div>
            </div>

            {/* Share/Save Buttons - NEW */}
            <div className="flex gap-2 mb-4">
              <button className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <Download className="w-4 h-4" />
                {t('result.save')}
              </button>
              <button className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <Share2 className="w-4 h-4" />
                {t('result.share')}
              </button>
            </div>

            {/* Disclaimer - PRD CRITICAL */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700">
                <strong>{lang === 'bm' ? 'PENAFIAN' : 'DISCLAIMER'}:</strong> {t('result.disclaimer')}
              </p>
            </div>

            <button
              onClick={() => router.push('/buyer/journey')}
              className="w-full bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-snang-teal-500/30"
            >
              {t('result.continue')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  // Show loading state while checking PDPA consent
  if (isCheckingConsent) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-sm">
            {lang === 'bm' ? 'Menyemak status persetujuan...' : 'Checking consent status...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-snang-teal-700 to-snang-teal-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && step < 6 && (
                <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span className="text-white font-bold text-lg">Qontrek</span>
              <span className="text-snang-teal-500 text-xs font-mono">PRESCAN</span>
            </div>
            {step < 7 && <span className="text-slate-400 text-sm">{Math.min(step + 1, 7)} / 7</span>}
          </div>

          {step < 7 && (
            <div className="flex gap-1 mt-3">
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-snang-teal-600' : 'bg-slate-700'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">{renderStep()}</div>

        {/* Footer */}
        <AuthorityDisclaimer variant="compact" />
      </div>
    </div>
  );
}
