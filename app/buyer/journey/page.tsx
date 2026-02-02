// app/buyer/journey/page.tsx
'use client';

import { useState } from 'react';
import { 
  Upload, CheckCircle, Clock, AlertCircle, ChevronRight, ChevronLeft, 
  FileText, User, CreditCard, Building, Calendar, Camera, RefreshCw, 
  Check, Info, Zap, AlertTriangle
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { useProofLogger } from '@/lib/services/hooks';
import { confidenceToLabel } from '@/lib/orchestrator/permissions';
import { validateUpload, validateDocumentType, formatFileSize } from '@/lib/kuasaturbo/file-validation';

export default function BuyerJourney() {
  // Use service hook instead of direct store access
  const { 
    logDocumentUploaded, 
    logFieldAcknowledged, 
    logTacScheduled,
    logPhaseTransitioned 
  } = useProofLogger();
  
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<Record<string, { name: string; time: Date; size: number } | null>>({ 
    ic: null, slip: null, bank: null, kwsp: null 
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, {
    value: string;
    confidence: number;
    source: string;
  }> | null>(null);
  const [acknowledgedFields, setAcknowledgedFields] = useState<Record<string, boolean>>({});
  const [tacMode, setTacMode] = useState<'preset' | 'custom'>('preset');
  const [tacSlot, setTacSlot] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const steps = [
    { id: 'welcome', title: 'Selamat Datang' },
    { id: 'upload', title: 'Muat Naik Dokumen' },
    { id: 'confirm', title: 'Sahkan Maklumat' },
    { id: 'tac', title: 'Pilih Slot TAC' },
    { id: 'timeline', title: 'Jangkaan Proses' }
  ];

  const docTypes = [
    { key: 'ic', label: 'IC (Depan & Belakang)', icon: User, required: true },
    { key: 'slip', label: 'Slip Gaji Terkini', icon: CreditCard, required: true },
    { key: 'bank', label: 'Penyata Bank (3 bulan)', icon: Building, required: true },
    { key: 'kwsp', label: 'Penyata KWSP', icon: FileText, required: false }
  ];

  // Mock extraction results
  const mockExtraction = {
    nama: { value: 'AHMAD BIN ALI', confidence: 0.98, source: 'IC' },
    no_kp: { value: '880515-14-5678', confidence: 0.99, source: 'IC' },
    gaji_pokok: { value: 'RM 4,500.00', confidence: 0.92, source: 'Slip Gaji' },
    elaun: { value: 'RM 850.00', confidence: 0.88, source: 'Slip Gaji' },
    majikan: { value: 'Kementerian Pendidikan Malaysia', confidence: 0.95, source: 'Slip Gaji' },
    gred: { value: 'DG41', confidence: 0.90, source: 'Slip Gaji' }
  };

  const tacSlots = [
    { id: 1, date: 'Isnin, 3 Feb', time: '10:00 - 10:10 pagi', available: true },
    { id: 2, date: 'Isnin, 3 Feb', time: '10:30 - 10:40 pagi', available: true },
    { id: 3, date: 'Isnin, 3 Feb', time: '2:00 - 2:10 petang', available: false },
    { id: 4, date: 'Selasa, 4 Feb', time: '9:00 - 9:10 pagi', available: true },
    { id: 5, date: 'Selasa, 4 Feb', time: '3:00 - 3:10 petang', available: true },
    { id: 6, date: 'Rabu, 5 Feb', time: '11:00 - 11:10 pagi', available: true }
  ];

  const timeline = [
    { phase: 'Dokumen Sedia', status: 'done', date: 'Hari ini', desc: 'Dokumen dimuat naik & disahkan' },
    { phase: 'TAC & Submission', status: 'current', date: '3 Feb 2026', desc: 'Agent submit ke portal LPPSA' },
    { phase: 'Semakan LPPSA', status: 'pending', date: '~2-4 minggu', desc: 'LPPSA semak permohonan' },
    { phase: 'Surat Tawaran (LO)', status: 'pending', date: '~Mac 2026', desc: 'Jika lulus, LO dikeluarkan' },
    { phase: 'Tandatangan KJ', status: 'pending', date: '~1-2 minggu', desc: 'Ketua Jabatan sahkan identiti' },
    { phase: 'Kelulusan Akhir', status: 'pending', date: '~April 2026', desc: 'Disbursement & SPA completion' }
  ];

  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const requiredCount = docTypes.filter(d => d.required).length;
  const requiredUploaded = docTypes.filter(d => d.required && docs[d.key]).length;
  const readinessPercent = Math.round((requiredUploaded / requiredCount) * 100);

  // PRD Section 21.1: Stage-aware file validation
  const handleUpload = async (key: string, file?: File) => {
    setUploadError(null);
    setUploadWarning(null);
    
    // Simulate file for demo (in real app, this comes from file input)
    const mockFile = file || {
      name: `${key}_document.pdf`,
      type: 'application/pdf',
      size: 1024 * 500, // 500KB
    };
    
    // Validate file against current phase (DOCS_PENDING = evidence required)
    const validation = validateDocumentType(key.toUpperCase(), mockFile, 'DOCS_PENDING');
    
    if (!validation.valid) {
      setUploadError(validation.reason || 'Fail tidak sah');
      return;
    }
    
    if (validation.warning) {
      setUploadWarning(validation.warning);
    }
    
    // Update local state
    setDocs(prev => ({ 
      ...prev, 
      [key]: { 
        name: mockFile.name, 
        time: new Date(),
        size: mockFile.size,
      } 
    }));
    
    // Log proof event via service hook
    await logDocumentUploaded('C001', key);
    
    // Simulate extraction
    if (key === 'slip' || key === 'ic') {
      setTimeout(() => setExtractedData(mockExtraction), 500);
    }
  };

  const handleReupload = (key: string) => {
    const fieldKeys = key === 'ic' ? ['nama', 'no_kp'] : key === 'slip' ? ['gaji_pokok', 'elaun', 'majikan', 'gred'] : [];
    fieldKeys.forEach(k => {
      setAcknowledgedFields(prev => { const n = {...prev}; delete n[k]; return n; });
    });
    handleUpload(key);
  };

  // PRD Section 18.5: Renamed from "confirmField" to "acknowledgeField"
  // "Only humans may confirm correctness" - this is acknowledgment, not confirmation
  const acknowledgeField = async (key: string) => {
    setAcknowledgedFields(prev => ({ ...prev, [key]: true }));
    // Log via service hook
    await logFieldAcknowledged('C001', key);
  };

  const allFieldsAcknowledged = extractedData && Object.keys(extractedData).every(k => acknowledgedFields[k]);
  const tacSelected = tacMode === 'preset' ? tacSlot : (customDate && customTime);

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Permohonan LPPSA</h2>
            <p className="text-slate-500 mb-1">Projek:</p>
            <p className="font-semibold text-slate-700 mb-6">Residensi Harmoni, Unit A-12-03</p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 text-left">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Sediakan dokumen ini:</p>
                  <ul className="space-y-1 text-orange-700">
                    <li>• IC (gambar depan & belakang)</li>
                    <li>• Slip gaji bulan terkini</li>
                    <li>• Penyata bank 3 bulan terakhir</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PRD Disclaimer */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 leading-relaxed">
                Sistem ini membantu menyusun dokumen anda.
                <strong className="text-slate-700"> Tiada kelulusan atau keputusan dibuat oleh sistem.</strong>
              </p>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
            >
              Mula Sekarang <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Muat Naik Dokumen</h2>
            <p className="text-slate-500 text-sm mb-4">Sila muat naik dokumen yang diperlukan</p>

            {/* Progress Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Kesediaan Dokumen</span>
                <span className="text-lg font-bold text-orange-400">{readinessPercent}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
              {readinessPercent < 100 && (
                <p className="text-xs text-slate-400 mt-2">
                  Tinggal {requiredCount - requiredUploaded} dokumen wajib
                </p>
              )}
            </div>

            {/* Document Upload Cards */}
            <div className="space-y-3">
              {docTypes.map(doc => {
                const Icon = doc.icon;
                const uploaded = docs[doc.key];
                return (
                  <div 
                    key={doc.key}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      uploaded 
                        ? 'border-orange-200 bg-orange-50' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        uploaded ? 'bg-orange-500' : 'bg-slate-100'
                      }`}>
                        {uploaded 
                          ? <CheckCircle className="w-5 h-5 text-white" />
                          : <Icon className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {doc.label}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {uploaded && (
                          <p className="text-xs text-slate-500">{uploaded.name}</p>
                        )}
                      </div>
                      {uploaded ? (
                        <button 
                          onClick={() => handleReupload(doc.key)}
                          className="text-orange-500 hover:text-orange-600"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpload(doc.key)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
                        >
                          Muat Naik
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Screenshot Warning for Application Stage */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Nota:</strong> Pada peringkat permohonan penuh, dokumen PDF/scan diperlukan. 
                Screenshot tidak diterima.
              </p>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={requiredUploaded < requiredCount}
              className={`w-full mt-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                requiredUploaded >= requiredCount
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Seterusnya <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Sahkan Maklumat</h2>
            <p className="text-slate-500 text-sm mb-4">Semak data yang diekstrak dari dokumen anda</p>

            {/* PRD Section 22.3: Mandatory Disclaimer */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700 text-center">
                ⚠️ Data ini diekstrak oleh sistem dan memerlukan pengesahan anda.
              </p>
            </div>

            {/* Extracted Fields */}
            {extractedData && (
              <div className="space-y-3">
                {Object.entries(extractedData).map(([key, data]) => {
                  const isAcknowledged = acknowledgedFields[key];
                  // PRD Compliance: Show confidence LABEL not percentage
                  const confidenceLabel = confidenceToLabel(data.confidence);
                  
                  return (
                    <div 
                      key={key}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        isAcknowledged 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="font-semibold text-slate-800">{data.value}</p>
                        </div>
                        {isAcknowledged ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Disahkan</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => acknowledgeField(key)}
                            className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-orange-600"
                          >
                            Sahkan
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Sumber: {data.source}</span>
                        <span>•</span>
                        {/* PRD Compliance: Show label not percentage */}
                        <span className={`px-2 py-0.5 rounded ${
                          confidenceLabel === 'HIGH_CONFIDENCE' 
                            ? 'bg-green-100 text-green-700'
                            : confidenceLabel === 'LOW_CONFIDENCE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {confidenceLabel === 'HIGH_CONFIDENCE' ? 'Keyakinan Tinggi' :
                           confidenceLabel === 'LOW_CONFIDENCE' ? 'Keyakinan Rendah' :
                           'Perlu Semakan'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!allFieldsAcknowledged}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  allFieldsAcknowledged
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Seterusnya <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Pilih Slot TAC</h2>
            <p className="text-slate-500 text-sm mb-4">Pilih masa untuk sesi TAC dengan ejen</p>

            {/* TAC Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Apa itu TAC?</strong> Transaction Authorization Code adalah kod yang anda terima dari LPPSA 
                untuk mengesahkan penghantaran permohonan. Anda perlu online semasa sesi ini.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTacMode('preset')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tacMode === 'preset'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Slot Tersedia
              </button>
              <button
                onClick={() => setTacMode('custom')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tacMode === 'custom'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Cadangkan Masa
              </button>
            </div>

            {tacMode === 'preset' ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tacSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => slot.available && setTacSlot(slot.id)}
                    disabled={!slot.available}
                    className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                      !slot.available
                        ? 'border-slate-100 bg-slate-50 cursor-not-allowed'
                        : tacSlot === slot.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{slot.date}</p>
                        <p className="text-sm text-slate-600">{slot.time}</p>
                      </div>
                      {!slot.available ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Penuh</span>
                      ) : tacSlot === slot.id ? (
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tarikh Cadangan</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Masa Cadangan</label>
                  <select
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Pilih masa</option>
                    <option value="09:00">9:00 - 9:10 pagi</option>
                    <option value="09:30">9:30 - 9:40 pagi</option>
                    <option value="10:00">10:00 - 10:10 pagi</option>
                    <option value="10:30">10:30 - 10:40 pagi</option>
                    <option value="11:00">11:00 - 11:10 pagi</option>
                    <option value="14:00">2:00 - 2:10 petang</option>
                    <option value="15:00">3:00 - 3:10 petang</option>
                    <option value="16:00">4:00 - 4:10 petang</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">
                  Agent akan sahkan ketersediaan dan hubungi anda.
                </p>
              </div>
            )}

            <button 
              onClick={() => setStep(4)}
              disabled={!tacSelected}
              className={`w-full mt-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                tacSelected
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Sahkan Slot <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Dokumen Sedia!</h2>
              <p className="text-slate-500 text-sm">Berikut adalah jangkaan proses permohonan anda</p>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800 rounded-xl p-4 mb-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" /> Jangkaan Timeline
              </h3>
              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'done' ? 'bg-orange-500' :
                        item.status === 'current' ? 'bg-orange-400 animate-pulse' :
                        'bg-slate-600'
                      }`} />
                      {idx < timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-1 ${
                          item.status === 'done' ? 'bg-orange-500' : 'bg-slate-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <p className={`font-medium text-sm ${
                          item.status === 'done' ? 'text-orange-400' :
                          item.status === 'current' ? 'text-white' :
                          'text-slate-400'
                        }`}>{item.phase}</p>
                        <span className={`text-xs ${
                          item.status === 'done' ? 'text-orange-400' :
                          item.status === 'current' ? 'text-orange-300' :
                          'text-slate-500'
                        }`}>{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimate Box */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-5 text-white">
              <p className="text-sm font-medium text-orange-100">Jangkaan Siap</p>
              <p className="text-2xl font-bold">April 2026</p>
              <p className="text-xs text-orange-200 mt-1">
                *Tertakluk kepada kelulusan LPPSA & tandatangan KJ
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Ringkasan Anda</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokumen dimuat naik</span>
                  <span className="font-medium text-slate-800">{uploadedCount} dokumen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maklumat disahkan</span>
                  <span className="font-medium text-slate-800">{Object.keys(acknowledgedFields).length} field</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Slot TAC</span>
                  <span className="font-medium text-slate-800">
                    {tacMode === 'preset' 
                      ? tacSlots.find(s => s.id === tacSlot)?.date + ', ' + tacSlots.find(s => s.id === tacSlot)?.time
                      : customDate + ', ' + customTime
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* PRD Disclaimer */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-600 text-center">
                <strong>Nota:</strong> Timeline ini adalah anggaran sahaja. Keputusan sebenar bergantung kepada LPPSA.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span className="text-white font-bold text-lg">Qontrek</span>
              <span className="text-orange-400 text-xs font-mono">LPPSA</span>
            </div>
            <span className="text-slate-400 text-sm">{step + 1} / {steps.length}</span>
          </div>
          
          {/* Progress */}
          <div className="flex gap-1 mt-3">
            {steps.map((s, i) => (
              <div 
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-orange-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <AuthorityDisclaimer variant="compact" />
      </div>
    </div>
  );
}
