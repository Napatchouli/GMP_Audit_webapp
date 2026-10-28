import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  FileCheck2,
  Building2,
  Users,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Printer,
  ChevronDown,
  ChevronUp,
  Camera,
  MessageSquare,
  Award,
  Sparkles,
  Info,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  AssessmentRecord,
  ComplianceStatus,
  Officer,
  ChecklistPart,
  ChecklistItem,
} from '../types';
import { SignaturePadModal } from '../components/SignaturePadModal';
import { TabType } from '../components/Navigation';
import { downloadAssessmentPDF } from '../utils/pdfGenerator';

interface AssessmentEngineViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
  activeAssessmentId?: string;
}

export const AssessmentEngineView: React.FC<AssessmentEngineViewProps> = ({
  onNavigate,
  activeAssessmentId,
}) => {
  const {
    assessments,
    factories,
    availableOfficers,
    updateChecklistItem,
    addOfficerToAssessment,
    removeOfficerFromAssessment,
    saveOfficerSignature,
    saveOwnerSignature,
    finalizeAssessment,
    getAssessmentById,
  } = useApp();

  // Find targeted assessment or pick first in_progress/scheduled, or first available
  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    if (activeAssessmentId && assessments.some((a) => a.id === activeAssessmentId)) {
      return activeAssessmentId;
    }
    const inProgress = assessments.find((a) => a.status === 'in_progress');
    if (inProgress) return inProgress.id;
    const scheduled = assessments.find((a) => a.status === 'scheduled');
    if (scheduled) return scheduled.id;
    return assessments[0]?.id || '';
  });

  const record = getAssessmentById(selectedRecordId);
  const factory = record ? factories.find((f) => f.id === record.factoryId) : null;

  // Active tab inside assessment view: 'checklistA' | 'checklistB' | 'team' | 'verdict'
  const [activeChecklistTab, setActiveChecklistTab] = useState<'A' | 'B' | 'signatures'>('A');
  const [expandedPartA, setExpandedPartA] = useState<number | null>(1);
  const [expandedPartB, setExpandedPartB] = useState<number | null>(1);

  // Officer add dropdown state
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);

  // E-Signature Pad Modal state
  const [signingTarget, setSigningTarget] = useState<{
    type: 'officer' | 'owner';
    officerId?: string;
    signerName: string;
    signerRole: string;
    badgeNumber?: string;
    initialSignature?: string;
  } | null>(null);

  // Owner form inputs
  const [ownerInputName, setOwnerInputName] = useState(factory?.ownerName || '');
  const [ownerInputTitle, setOwnerInputTitle] = useState('Factory Managing Director');

  // Report Modal view
  const [showOfficialReport, setShowOfficialReport] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!record) return;
    setIsDownloadingPDF(true);
    try {
      await downloadAssessmentPDF(record, factory);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Calculate Progress and Real-Time Scores
  const evaluationStats = useMemo(() => {
    if (!record) return { totalItems: 0, completedItems: 0, progressPct: 0, earned: 0, maxPoints: 0, scorePct: 0, hasCriticalFail: false, passCount: 0, failCount: 0, partialCount: 0, naCount: 0 };

    const allItems = [
      ...record.checklistA.flatMap((p) => p.items),
      ...record.checklistB.flatMap((p) => p.items),
    ];

    const totalItems = allItems.length;
    const completedItems = allItems.filter((i) => i.status !== null).length;
    const progressPct = Math.round((completedItems / totalItems) * 100);

    let earned = 0;
    let scorableCount = 0;
    let passCount = 0;
    let failCount = 0;
    let partialCount = 0;
    let naCount = 0;
    let hasCriticalFail = false;

    allItems.forEach((it) => {
      if (it.status === 'pass') {
        earned += 2;
        scorableCount += 1;
        passCount += 1;
      } else if (it.status === 'partial') {
        earned += 1;
        scorableCount += 1;
        partialCount += 1;
      } else if (it.status === 'fail') {
        scorableCount += 1;
        failCount += 1;
        if (it.isCritical) hasCriticalFail = true;
      } else if (it.status === 'na') {
        naCount += 1;
      }
    });

    const maxPoints = Math.max(scorableCount * 2, 1);
    const scorePct = Math.round((earned / maxPoints) * 100);

    return {
      totalItems,
      completedItems,
      progressPct,
      earned,
      maxPoints,
      scorePct,
      hasCriticalFail,
      passCount,
      failCount,
      partialCount,
      naCount,
      isFullyEvaluated: completedItems === totalItems,
    };
  }, [record]);

  if (!record) {
    return (
      <div className="bg-white border-2 border-slate-200 p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">No Assessment Record Selected</h2>
        <p className="text-xs text-slate-500">
          Create an assessment assignment or select one from the dashboard.
        </p>
        <button
          onClick={() => onNavigate('assign')}
          className="px-4 py-2 bg-[#00a8ff] text-white text-xs font-bold uppercase tracking-wider"
        >
          Assign New Assessment
        </button>
      </div>
    );
  }

  const isCompleted = record.status === 'completed';
  const isPass = evaluationStats.scorePct >= 75 && !evaluationStats.hasCriticalFail;

  // Signatures check
  const officersSignedCount = record.officers.filter((o) => !!o.signatureDataUrl).length;
  const isOwnerSigned = !!record.ownerSignature?.signatureDataUrl;
  const allSigned = officersSignedCount === record.officers.length && isOwnerSigned;

  const handleFinalize = () => {
    const updated = finalizeAssessment(record.id);
    if (updated) {
      if (updated.result === 'PASS') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00a8ff', '#4cd137', '#fbc531'],
        });
      }
      setShowOfficialReport(true);
    }
  };

  const handleAddOfficer = (officer: Officer) => {
    addOfficerToAssessment(record.id, officer);
    setShowAddOfficerModal(false);
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (!signingTarget) return;

    if (signingTarget.type === 'officer' && signingTarget.officerId) {
      saveOfficerSignature(record.id, signingTarget.officerId, dataUrl);
    } else if (signingTarget.type === 'owner') {
      saveOwnerSignature(record.id, {
        name: ownerInputName || factory?.ownerName || 'Factory Representative',
        title: ownerInputTitle || 'Managing Director',
        phone: factory?.ownerPhone,
        signatureDataUrl: dataUrl,
        signedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* 1. Header Bar & Record Selector */}
      <div className="bg-white border-2 border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#2f3640] text-white">
                AUDIT ID: {record.id}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 font-mono ${
                  record.status === 'completed'
                    ? record.result === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-[#e84118] border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {record.status === 'completed'
                  ? record.result === 'PASS'
                    ? '✓ COMPLETED: PASS'
                    : '✕ COMPLETED: FALSE / FAIL'
                  : '⚡ LIVE ASSESSMENT IN PROGRESS'}
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                {record.inspectionType}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {record.factoryName}
            </h1>

            {factory && (
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Owner: <strong className="text-slate-800">{factory.ownerName}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="font-mono text-slate-800">{factory.ownerPhone}</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-slate-800">{factory.city}, {factory.province}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Switch Assessment Dropdown */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="text-xs border border-slate-300 px-3 py-2 bg-white font-medium focus:outline-none focus:border-[#00a8ff]"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.status === 'completed' ? `[${a.result}]` : '[ACTIVE]'} {a.factoryName} ({a.scheduledDate})
                </option>
              ))}
            </select>

            {record.status === 'completed' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-3.5 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  title="Download formatted PDF report with e-signatures"
                >
                  {isDownloadingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isDownloadingPDF ? 'Generating...' : 'Download Report'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialReport(true)}
                  className="px-3.5 py-2 bg-[#2f3640] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Certificate & Report</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Real-Time Progress Bar & Statutory Scoring Threshold Banner */}
      <div className="bg-white border-2 border-slate-200 p-5 shadow-xs space-y-4">
        {/* Progress Bar Container */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#00a8ff]" />
                Assessment Progress:
              </span>
              <span className="font-mono font-bold text-[#00a8ff] text-sm">
                {evaluationStats.completedItems} / {evaluationStats.totalItems} Indicators Evaluated
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
              <span className="text-emerald-600 font-bold">✓ {evaluationStats.passCount} Compliant</span>
              <span className="text-amber-600 font-bold">~ {evaluationStats.partialCount} Partial</span>
              <span className="text-[#e84118] font-bold">✕ {evaluationStats.failCount} Non-Compliant</span>
              {evaluationStats.naCount > 0 && <span>• {evaluationStats.naCount} N/A</span>}
            </div>
          </div>

          {/* Flat Striped Progress Bar */}
          <div className="w-full h-4 bg-slate-100 border border-slate-300 overflow-hidden relative">
            <div
              className="h-full bg-[#00a8ff] transition-all duration-300 ease-out flex items-center justify-end pr-1 text-[10px] text-white font-mono font-black select-none"
              style={{ width: `${evaluationStats.progressPct}%` }}
            >
              {evaluationStats.progressPct > 12 && `${evaluationStats.progressPct}%`}
            </div>
          </div>
        </div>

        {/* Live Score & Statutory Pass / False Calculation Box */}
        <div
          className={`p-4 border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            evaluationStats.completedItems === 0
              ? 'border-slate-200 bg-[#f5f6fa]'
              : isPass
              ? 'border-emerald-500 bg-emerald-50/30'
              : 'border-[#e84118] bg-rose-50/30'
          }`}
        >
          {/* Left: Score readout */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 border-2 flex flex-col items-center justify-center font-mono shrink-0 ${
                evaluationStats.completedItems === 0
                  ? 'border-slate-300 bg-white text-slate-400'
                  : isPass
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-[#e84118] bg-[#e84118] text-white'
              }`}
            >
              <span className="text-2xl font-black leading-none">
                {evaluationStats.scorePct}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                Score
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Audit Verdict:
                </span>
                <span
                  className={`text-base font-black uppercase font-mono px-2 py-0.5 ${
                    evaluationStats.completedItems === 0
                      ? 'bg-slate-200 text-slate-600'
                      : isPass
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#e84118] text-white'
                  }`}
                >
                  {evaluationStats.completedItems === 0
                    ? 'INSPECTION PENDING'
                    : isPass
                    ? 'STATUS: PASS'
                    : 'STATUS: FALSE / FAIL'}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                {evaluationStats.hasCriticalFail ? (
                  <span className="text-[#e84118] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    CRITICAL HAZARD FAILURE DETECTED: Disqualifies factory regardless of score!
                  </span>
                ) : evaluationStats.scorePct >= 75 ? (
                  <span>Meets or exceeds 75% statutory compliance requirement.</span>
                ) : (
                  <span>Score is below the mandatory 75% passing threshold.</span>
                )}
              </p>

              <div className="text-[11px] font-mono text-slate-500">
                Points Earned: <strong>{evaluationStats.earned}</strong> / {evaluationStats.maxPoints} pts
              </div>
            </div>
          </div>

          {/* Right: Finalize Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!record.completedAt ? (
              <button
                type="button"
                onClick={handleFinalize}
                disabled={evaluationStats.completedItems < 5}
                className={`px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  evaluationStats.completedItems >= 5
                    ? isPass
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-[#e84118] hover:bg-rose-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Complete Assessment & Issue Verdict</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-bold uppercase">
                  Officially Sealed: {new Date(record.completedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  title="Download formatted audit PDF with captured e-signatures"
                >
                  {isDownloadingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isDownloadingPDF ? 'Generating...' : 'Download Report (PDF)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialReport(true)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  View Certificate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tab Selectors: Checklist A (5 Parts) vs Checklist B (3 Parts) vs Assessing Officers & E-Signatures */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-slate-200 bg-white p-2">
        <button
          onClick={() => setActiveChecklistTab('A')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeChecklistTab === 'A'
              ? 'border-[#00a8ff] text-[#00a8ff] bg-[#00a8ff]/10'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Checklist A (5 Parts)</span>
          <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 font-mono text-[10px]">
            {record.checklistA.flatMap((p) => p.items).filter((i) => i.status !== null).length} / 25
          </span>
        </button>

        <button
          onClick={() => setActiveChecklistTab('B')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeChecklistTab === 'B'
              ? 'border-[#e84118] text-[#e84118] bg-[#e84118]/10'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Checklist B (3 Parts - High Risk)</span>
          <span className="bg-rose-100 text-[#e84118] px-1.5 py-0.2 font-mono text-[10px] font-bold">
            {record.checklistB.flatMap((p) => p.items).filter((i) => i.status !== null).length} / 15
          </span>
        </button>

        <button
          onClick={() => setActiveChecklistTab('signatures')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeChecklistTab === 'signatures'
              ? 'border-[#2f3640] text-[#2f3640] bg-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Assessing Officers (Max 6) & E-Signatures</span>
          <span
            className={`px-1.5 py-0.2 font-mono text-[10px] font-bold ${
              allSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {officersSignedCount}/{record.officers.length} Officers Signed
          </span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB A: Checklist A (5 Parts) */}
      {activeChecklistTab === 'A' && (
        <div className="space-y-4">
          <div className="bg-[#f5f6fa] border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              <strong className="text-slate-900">Checklist A — General Facility & Operational Safety</strong> (5 Distinct Parts: Structural, Environmental, Labor, Electrical/Machinery, Storage)
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Score Value: Compliant = 2 pts, Partial = 1 pt, Non-Compliant = 0 pts
            </div>
          </div>

          <div className="space-y-3">
            {record.checklistA.map((part) => {
              const isExpanded = expandedPartA === part.partNumber;
              const partCompletedCount = part.items.filter((i) => i.status !== null).length;

              return (
                <div key={part.partNumber} className="bg-white border-2 border-slate-200">
                  {/* Part Header */}
                  <div
                    onClick={() => setExpandedPartA(isExpanded ? null : part.partNumber)}
                    className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#00a8ff] text-white flex items-center justify-center font-bold text-xs">
                        P{part.partNumber}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                          Part {part.partNumber}: {part.partTitle}
                        </h3>
                        <p className="text-xs text-slate-500">{part.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-[#f5f6fa] border border-slate-200 px-2.5 py-1">
                        {partCompletedCount} / {part.items.length} Evaluated
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Part Items List */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
                      {part.items.map((item) => (
                        <ChecklistItemRow
                          key={item.id}
                          item={item}
                          onUpdate={(status, notes) =>
                            updateChecklistItem(record.id, 'A', part.partNumber, item.id, status, notes)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB B: Checklist B (3 Parts - High Risk) */}
      {activeChecklistTab === 'B' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border-2 border-[#e84118] p-4 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#e84118] font-bold uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>
                Checklist B — High Risk Protocols, Hazardous Materials & Statutory Compliance (3 Parts)
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-[#e84118] text-white px-2 py-0.5">
              Strict Statutory Rules
            </span>
          </div>

          <div className="space-y-3">
            {record.checklistB.map((part) => {
              const isExpanded = expandedPartB === part.partNumber;
              const partCompletedCount = part.items.filter((i) => i.status !== null).length;

              return (
                <div key={part.partNumber} className="bg-white border-2 border-slate-200">
                  {/* Part Header */}
                  <div
                    onClick={() => setExpandedPartB(isExpanded ? null : part.partNumber)}
                    className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#e84118] text-white flex items-center justify-center font-bold text-xs">
                        B{part.partNumber}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                          Part {part.partNumber}: {part.partTitle}
                        </h3>
                        <p className="text-xs text-slate-500">{part.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-[#f5f6fa] border border-slate-200 px-2.5 py-1">
                        {partCompletedCount} / {part.items.length} Evaluated
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Part Items List */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
                      {part.items.map((item) => (
                        <ChecklistItemRow
                          key={item.id}
                          item={item}
                          onUpdate={(status, notes) =>
                            updateChecklistItem(record.id, 'B', part.partNumber, item.id, status, notes)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB SIGNATURES & TEAM: Assessing Officers (Max 6) & Factory Owner E-Signatures */}
      {activeChecklistTab === 'signatures' && (
        <div className="space-y-6">
          {/* Officers Team Card */}
          <div className="bg-white border-2 border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00a8ff]" />
                  Assessing Officers Team ({record.officers.length} / 6 Persons)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Up to 6 assessing officers can participate. Each officer signs electronically below.
                </p>
              </div>

              {record.officers.length < 6 && (
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(true)}
                  className="px-3 py-1.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Officer ({6 - record.officers.length} left)
                </button>
              )}
            </div>

            {/* Officer Grid with E-Signing Pad Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {record.officers.map((officer, idx) => {
                const isSigned = !!officer.signatureDataUrl;

                return (
                  <div
                    key={officer.id}
                    className={`border-2 p-4 flex flex-col justify-between transition-all ${
                      isSigned
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-slate-200 bg-[#f5f6fa]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono font-bold text-[10px] text-slate-500">
                          OFFICER #{idx + 1} • {officer.badgeNumber}
                        </span>
                        {record.officers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOfficerFromAssessment(record.id, officer.id)}
                            className="text-slate-400 hover:text-[#e84118] p-0.5"
                            title="Remove officer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="font-bold text-sm text-slate-900">{officer.name}</div>
                      <div className="text-xs text-slate-600 font-medium">{officer.role}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{officer.department}</div>

                      {/* Signature Preview Box */}
                      <div className="mt-3 p-2 bg-white border border-slate-300 min-h-[90px] flex flex-col items-center justify-center relative">
                        {isSigned ? (
                          <>
                            <img
                              src={officer.signatureDataUrl}
                              alt="Officer Signature"
                              className="max-h-14 object-contain"
                            />
                            <div className="text-[9px] font-mono text-emerald-700 font-bold mt-1">
                              ✓ Signed {officer.signedAt ? new Date(officer.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-slate-400 text-xs py-2">
                            <PenTool className="w-5 h-5 mx-auto mb-1 opacity-50" />
                            <span>Signature Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setSigningTarget({
                            type: 'officer',
                            officerId: officer.id,
                            signerName: officer.name,
                            signerRole: officer.role,
                            badgeNumber: officer.badgeNumber,
                            initialSignature: officer.signatureDataUrl,
                          })
                        }
                        className={`w-full py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                          isSigned
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#00a8ff] hover:bg-[#0090e0] text-white shadow-xs'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{isSigned ? 'Re-Sign Pad' : 'Launch E-Signing Pad'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Factory Owner / Authorized Representative E-Signature Card */}
          <div className="bg-white border-2 border-slate-200 p-5 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00a8ff]" />
                Factory Owner / Authorized Representative E-Signature
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The factory owner or site safety representative must acknowledge the findings and sign on the canvas pad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Signatory Full Name *
                  </label>
                  <input
                    type="text"
                    value={ownerInputName}
                    onChange={(e) => setOwnerInputName(e.target.value)}
                    placeholder="Factory owner or representative name"
                    className="w-full text-xs font-bold border border-slate-300 p-2 bg-[#f5f6fa]/60 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Signatory Designation / Title
                  </label>
                  <input
                    type="text"
                    value={ownerInputTitle}
                    onChange={(e) => setOwnerInputTitle(e.target.value)}
                    placeholder="e.g. Managing Director / Factory Plant Manager"
                    className="w-full text-xs border border-slate-300 p-2 bg-[#f5f6fa]/60 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 p-2.5">
                  By signing, the factory management acknowledges the findings detailed in Checklist A & B and agrees to statutory rectification periods if applicable.
                </div>
              </div>

              {/* Owner Signature Pad Container */}
              <div className="border-2 border-slate-300 p-4 bg-[#f5f6fa] text-center flex flex-col items-center justify-center min-h-[160px]">
                {record.ownerSignature?.signatureDataUrl ? (
                  <div className="w-full space-y-2">
                    <div className="bg-white border border-slate-300 p-2 flex items-center justify-center min-h-[90px]">
                      <img
                        src={record.ownerSignature.signatureDataUrl}
                        alt="Owner Signature"
                        className="max-h-16 object-contain"
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {record.ownerSignature.name} ({record.ownerSignature.title})
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold">
                      ✓ Acknowledged & Signed {new Date(record.ownerSignature.signedAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <PenTool className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Owner Signature Awaiting</div>
                    <div className="text-[11px] text-slate-500">
                      Hand device to factory owner to sign
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSigningTarget({
                      type: 'owner',
                      signerName: ownerInputName || factory?.ownerName || 'Factory Representative',
                      signerRole: ownerInputTitle || 'Managing Director',
                      initialSignature: record.ownerSignature?.signatureDataUrl,
                    })
                  }
                  className="mt-3 px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>
                    {record.ownerSignature?.signatureDataUrl
                      ? 'Re-Sign Owner Pad'
                      : 'Open Owner E-Signing Pad'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Officer Modal (when team has < 6 persons) */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border-2 border-slate-300 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Add Assessing Officer (Max 6)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select an available certified safety inspector to append to this assessment team:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {availableOfficers
                .filter((off) => !record.officers.some((o) => o.id === off.id))
                .map((officer) => (
                  <div
                    key={officer.id}
                    onClick={() => handleAddOfficer(officer)}
                    className="p-3 border border-slate-200 hover:border-[#00a8ff] hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{officer.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {officer.role} • {officer.badgeNumber}
                      </div>
                    </div>
                    <span className="text-xs text-[#00a8ff] font-bold uppercase">+ Add</span>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="px-4 py-1.5 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Electronic Signature Pad Modal */}
      {signingTarget && (
        <SignaturePadModal
          isOpen={!!signingTarget}
          onClose={() => setSigningTarget(null)}
          onSave={handleSaveSignature}
          title={
            signingTarget.type === 'officer'
              ? 'Assessing Officer Electronic Seal'
              : 'Factory Owner & Representative Signature'
          }
          subtitle="Biometric canvas verification for official audit record"
          signerName={signingTarget.signerName}
          signerRole={signingTarget.signerRole}
          badgeNumber={signingTarget.badgeNumber}
          initialSignature={signingTarget.initialSignature}
        />
      )}

      {/* 5. Official Certificate & Printable Assessment Report Modal */}
      {showOfficialReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border-4 border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-auto text-slate-900 animate-in fade-in zoom-in-95">
            {/* Top Bar for Modal Controls */}
            <div className="flex items-center justify-between no-print border-b border-slate-200 pb-3">
              <span className="font-mono text-xs font-bold text-slate-500">
                OFFICIAL STATUTORY INSPECTION INSTRUMENT
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-3.5 py-1.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  title="Download formatted official assessment PDF report"
                >
                  {isDownloadingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isDownloadingPDF ? 'Generating...' : 'Download Report'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Mode
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialReport(false)}
                  className="px-3 py-1.5 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Report Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
              <div className="font-black text-sm uppercase tracking-widest text-[#00a8ff]">
                MINISTRY OF INDUSTRY & OCCUPATIONAL SAFETY
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                INDUSTRIAL STATUTORY COMPLIANCE ASSESSMENT REPORT
              </h2>
              <div className="text-xs font-mono text-slate-600">
                Certificate Ref: {record.certificateNumber || `VERDICT-${record.id.toUpperCase()}`} • Date:{' '}
                {record.completedAt ? new Date(record.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Verdict Big Box */}
            <div
              className={`p-4 border-4 text-center ${
                record.result === 'PASS'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-[#e84118] bg-rose-50/50'
              }`}
            >
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                OFFICIAL INSPECTION VERDICT
              </div>
              <div
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight mt-1 ${
                  record.result === 'PASS' ? 'text-emerald-700' : 'text-[#e84118]'
                }`}
              >
                {record.result === 'PASS' ? 'COMPLIANCE PASSED (PASS)' : 'STATUTORY AUDIT FALSE / FAILED'}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1 font-mono">
                Aggregate Score: {record.scorePercent}% (Threshold: 75% | Critical Violations: {evaluationStats.hasCriticalFail ? 'YES (Disqualified)' : 'NONE'})
              </div>
            </div>

            {/* Factory & Inspection Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase">Enterprise Name:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{record.factoryName}</div>
                <div className="text-slate-600 mt-0.5">{factory?.address}, {factory?.city}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Facility Owner:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{factory?.ownerName}</div>
                <div className="font-mono text-slate-600 mt-0.5">{factory?.ownerPhone}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Inspection Scope:</span>
                <div className="font-bold text-slate-800">{record.inspectionType}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase">Checklist Base:</span>
                <div className="font-bold text-slate-800">Checklist A (5 Parts) + Checklist B (3 Parts)</div>
              </div>
            </div>

            {/* Findings Breakdown Table */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-slate-800">
                Evaluation Findings Summary
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Compliant</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono">
                    {evaluationStats.passCount}
                  </div>
                </div>
                <div className="p-2 border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Partial</div>
                  <div className="text-lg font-bold text-amber-600 font-mono">
                    {evaluationStats.partialCount}
                  </div>
                </div>
                <div className="p-2 border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Non-Compliant</div>
                  <div className="text-lg font-bold text-[#e84118] font-mono">
                    {evaluationStats.failCount}
                  </div>
                </div>
                <div className="p-2 border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Score Pct</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {record.scorePercent}%
                  </div>
                </div>
              </div>
            </div>

            {/* Official Electronic Signatures Seal Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Authorized Signatures & Seals
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Officers Signatures */}
                {record.officers.map((off, idx) => (
                  <div key={off.id} className="p-2 border border-slate-300 text-center bg-white">
                    <div className="h-16 flex items-center justify-center">
                      {off.signatureDataUrl ? (
                        <img
                          src={off.signatureDataUrl}
                          alt={off.name}
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">[Not Signed]</span>
                      )}
                    </div>
                    <div className="border-t border-slate-200 pt-1">
                      <div className="font-bold text-[11px] text-slate-900">{off.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{off.badgeNumber}</div>
                    </div>
                  </div>
                ))}

                {/* Factory Owner Signature */}
                <div className="p-2 border border-slate-300 text-center bg-white">
                  <div className="h-16 flex items-center justify-center">
                    {record.ownerSignature?.signatureDataUrl ? (
                      <img
                        src={record.ownerSignature.signatureDataUrl}
                        alt="Owner"
                        className="max-h-12 object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">[Owner Signature]</span>
                    )}
                  </div>
                  <div className="border-t border-slate-200 pt-1">
                    <div className="font-bold text-[11px] text-slate-900">
                      {record.ownerSignature?.name || factory?.ownerName || 'Factory Owner'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">Factory Representative</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="text-center text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-3">
              Generated by FactoryAssess Pro • Statutory Assessment Record Stored & Encrypted
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual checklist item row
const ChecklistItemRow: React.FC<{
  item: ChecklistItem;
  onUpdate: (status: ComplianceStatus, notes?: string) => void;
}> = ({ item, onUpdate }) => {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const [notesText, setNotesText] = useState(item.notes || '');

  const handleStatusClick = (st: ComplianceStatus) => {
    onUpdate(st, notesText);
  };

  const handleNotesBlur = () => {
    if (item.status) {
      onUpdate(item.status, notesText);
    }
  };

  return (
    <div
      className={`p-3 border transition-colors ${
        item.status === 'pass'
          ? 'bg-emerald-50/30 border-emerald-200'
          : item.status === 'fail'
          ? 'bg-rose-50/40 border-rose-300'
          : item.status === 'partial'
          ? 'bg-amber-50/30 border-amber-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Item Title & Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.2">
              {item.code}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {item.category}
            </span>
            {item.isCritical && (
              <span className="px-1.5 py-0.2 bg-[#e84118] text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                CRITICAL HAZARD
              </span>
            )}
          </div>

          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
            {item.title}
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* 4 Flat Decision Buttons: Pass, Partial, Fail, N/A */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => handleStatusClick('pass')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
              item.status === 'pass'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            Pass (2)
          </button>

          <button
            type="button"
            onClick={() => handleStatusClick('partial')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
              item.status === 'partial'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:border-amber-500 hover:text-amber-600'
            }`}
          >
            Partial (1)
          </button>

          <button
            type="button"
            onClick={() => handleStatusClick('fail')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
              item.status === 'fail'
                ? 'bg-[#e84118] text-white border-rose-800 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:border-[#e84118] hover:text-[#e84118]'
            }`}
          >
            Fail (0)
          </button>

          <button
            type="button"
            onClick={() => handleStatusClick('na')}
            className={`px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
              item.status === 'na'
                ? 'bg-slate-700 text-white border-slate-800'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            N/A
          </button>

          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 text-slate-400 hover:text-slate-700 border ${
              notesText ? 'border-[#00a8ff] text-[#00a8ff]' : 'border-transparent'
            }`}
            title="Inspector observation note"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Observation Note Input */}
      {showNotes && (
        <div className="mt-2.5 pt-2 border-t border-slate-200/60">
          <textarea
            rows={2}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Field observation notes, non-compliance description, or evidence references..."
            className="w-full text-xs p-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00a8ff]"
          />
        </div>
      )}
    </div>
  );
};
