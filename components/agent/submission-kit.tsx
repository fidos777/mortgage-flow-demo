'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  FileCheck, 
  FileText, 
  Copy, 
  Shield,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface SubmissionKitProps {
  caseId: string
  buyerName: string
  onComplete?: () => void
}

type Step = 1 | 2 | 3 | 4

export function SubmissionKit({ caseId, buyerName, onComplete }: SubmissionKitProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [tacTimer, setTacTimer] = useState(180)
  const [tacStarted, setTacStarted] = useState(false)
  const [tacCompleted, setTacCompleted] = useState(false)

  const steps = [
    { id: 1, title: 'Readiness Check', icon: FileCheck, description: 'Validate all documents complete' },
    { id: 2, title: 'Draft Preview', icon: FileText, description: 'Review with DRAFT watermark' },
    { id: 3, title: 'Copy-Next Panel', icon: Copy, description: 'Copy fields to official LPPSA portal' },
    { id: 4, title: 'TAC Attestation', icon: Shield, description: 'Declare manual submission (180s timer)' },
  ]

  const startTacTimer = () => {
    setTacStarted(true)
    const interval = setInterval(() => {
      setTacTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTacComplete = () => {
    setTacCompleted(true)
    onComplete?.()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 px-6 py-4 border-b border-neutral-100">
        <h2 className="text-lg font-semibold text-neutral-800">Portal Submission Kit</h2>
        <p className="text-sm text-neutral-500">Kes: {buyerName} ({caseId})</p>
      </div>

      {/* Step Indicators */}
      <div className="px-6 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-primary text-white' :
                    'bg-neutral-100 text-neutral-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-[80px] ${
                    isActive ? 'text-primary font-medium' : 'text-neutral-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-emerald-500' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Readiness Check */}
        {currentStep === 1 && (
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Step 1: Readiness Check</h3>
            <p className="text-neutral-600 mb-4">Validate semua dokumen lengkap sebelum proceed.</p>
            
            <div className="space-y-3 mb-6">
              {[
                { label: 'MyKad (depan & belakang)', status: 'complete' },
                { label: 'Slip gaji (3 bulan)', status: 'complete' },
                { label: 'Penyata bank (3 bulan)', status: 'complete' },
                { label: 'Surat pengesahan majikan', status: 'complete' },
                { label: 'Borang permohonan LPPSA', status: 'complete' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <span className="text-sm text-neutral-700">{doc.label}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Semua dokumen lengkap. Ready to proceed.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Draft Preview */}
        {currentStep === 2 && (
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Step 2: Draft Preview</h3>
            <p className="text-neutral-600 mb-4">Review data sebelum copy ke portal rasmi.</p>
            
            <div className="relative border border-neutral-200 rounded-lg p-6 mb-6">
              {/* DRAFT Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-6xl font-bold text-red-200 rotate-[-30deg] select-none">
                  DRAFT
                </span>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500">Nama Pemohon</label>
                    <p className="font-medium">{buyerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">No. IC</label>
                    <p className="font-medium">880515-XX-XXXX</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Pendapatan Bersih</label>
                    <p className="font-medium">RM 4,500</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Komitmen Bulanan</label>
                    <p className="font-medium">RM 1,200</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">DSR</label>
                    <p className="font-medium text-emerald-600">42.7%</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Projek</label>
                    <p className="font-medium">Residensi Harmoni</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Ini adalah DRAFT sahaja. Sila review dengan teliti sebelum copy ke portal rasmi LPPSA.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Copy-Next Panel */}
        {currentStep === 3 && (
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Step 3: Copy-Next Panel</h3>
            <p className="text-neutral-600 mb-4">Copy setiap field ke portal LPPSA rasmi secara manual.</p>
            
            <div className="space-y-3 mb-6">
              {[
                { label: 'Nama Penuh', value: buyerName },
                { label: 'No. IC', value: '880515-XX-XXXX' },
                { label: 'No. Telefon', value: '012-XXX-XXXX' },
                { label: 'Email', value: 'demo@example.com' },
                { label: 'Alamat', value: 'No. 123, Jalan Demo...' },
                { label: 'Pendapatan', value: 'RM 4,500' },
              ].map((field, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <span className="text-xs text-neutral-500">{field.label}</span>
                    <p className="text-sm font-medium text-neutral-700">{field.value}</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark px-3 py-1.5 bg-primary/10 rounded-lg">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Arahan:</strong> Buka portal LPPSA rasmi di tab baru dan paste setiap field secara manual.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: TAC Attestation */}
        {currentStep === 4 && (
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Step 4: TAC Attestation</h3>
            <p className="text-neutral-600 mb-4">Sahkan bahawa anda telah submit ke portal LPPSA secara manual.</p>
            
            {!tacStarted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <p className="text-neutral-600 mb-6">
                  Klik butang di bawah untuk mulakan timer attestation (180 saat).
                </p>
                <button
                  onClick={startTacTimer}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                >
                  Mulakan TAC Attestation
                </button>
              </div>
            ) : !tacCompleted ? (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-amber-600" />
                </div>
                <p className="text-4xl font-bold text-amber-600 mb-2">{formatTime(tacTimer)}</p>
                <p className="text-neutral-600 mb-6">
                  Sila sahkan selepas submit ke portal LPPSA rasmi.
                </p>
                
                <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm text-neutral-700">
                      Saya mengesahkan bahawa saya telah submit permohonan ini ke portal rasmi LPPSA secara manual. 
                      Tiada submission automatik dilakukan oleh sistem Snang.my.
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleTacComplete}
                  disabled={tacTimer > 170}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    tacTimer > 170 
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  Sahkan Submission
                </button>
                
                {tacTimer > 170 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Sila tunggu sekurang-kurangnya 10 saat sebelum mengesahkan
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-xl font-semibold text-emerald-700 mb-2">TAC Attestation Selesai</h4>
                <p className="text-neutral-600 mb-4">
                  Kes telah ditanda sebagai SUBMITTED.
                </p>
                <p className="text-sm text-neutral-500">
                  Proof event direkod: {new Date().toLocaleString('ms-MY')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {!tacCompleted && (
          <div className="flex justify-between pt-6 border-t border-neutral-100">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelum
            </button>
            
            {currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1) as Step)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Seterusnya
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-100">
        <p className="text-xs text-neutral-500 text-center">
          "AI bantu prepare, MANUSIA submit" — Tiada auto-submission oleh sistem
        </p>
      </div>
    </div>
  )
}
