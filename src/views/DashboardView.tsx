import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Filter,
  Download,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../components/Navigation';
import { downloadAssessmentPDF } from '../utils/pdfGenerator';

interface DashboardViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { factories, assessments } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'unfinished' | 'pass' | 'fail'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (record: (typeof assessments)[0]) => {
    setDownloadingId(record.id);
    try {
      const targetFactory = factories.find((f) => f.id === record.factoryId);
      await downloadAssessmentPDF(record, targetFactory);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Compute metrics
  const totalFactories = factories.length;

  const unfinishedAssessments = assessments.filter(
    (a) => a.status === 'scheduled' || a.status === 'in_progress'
  );

  const completedAssessments = assessments.filter((a) => a.status === 'completed');
  const passedAssessments = completedAssessments.filter((a) => a.result === 'PASS');
  const failedAssessments = completedAssessments.filter((a) => a.result === 'FAIL');

  const totalFinishedCount = completedAssessments.length;
  const passRate =
    totalFinishedCount > 0
      ? Math.round((passedAssessments.length / totalFinishedCount) * 100)
      : 0;

  // Factories that need attention (either unfinished or last audit failed)
  const factoriesRequiringAttention = factories.filter(
    (f) =>
      f.status === 'Flagged' ||
      f.status === 'Under Review' ||
      f.lastAssessmentResult === 'FAIL' ||
      f.lastAssessmentResult === 'PENDING' ||
      !f.lastAssessmentDate
  );

  const filteredAssessments = assessments.filter((a) => {
    if (filterType === 'unfinished') return a.status !== 'completed';
    if (filterType === 'pass') return a.status === 'completed' && a.result === 'PASS';
    if (filterType === 'fail') return a.status === 'completed' && a.result === 'FAIL';
    return true;
  });

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Banner with Flat Styling */}
      <div className="bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00a8ff]" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              Factory Compliance & Audit Operations Monitor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Real-time assessment tracking, inspector allocation, and statutory pass/fail compliance audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('new-factory')}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            + New Factory
          </button>
          <button
            onClick={() => onNavigate('assign')}
            className="px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Assign Audit
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Flat design, punchy borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Factories */}
        <div
          onClick={() => onNavigate('factories')}
          className="bg-white border-2 border-slate-200 hover:border-[#00a8ff] p-4 sm:p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Factories
            </span>
            <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#00a8ff] group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {totalFactories}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{factories.filter((f) => f.status === 'Active').length} active</span>
            <span>•</span>
            <span className="text-[#e84118] font-semibold">{factories.filter((f) => f.status === 'Flagged').length} flagged</span>
          </div>
        </div>

        {/* Not Finished Assessment */}
        <div
          onClick={() => setFilterType('unfinished')}
          className={`bg-white border-2 p-4 sm:p-5 transition-all cursor-pointer group ${
            unfinishedAssessments.length > 0 ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-700">
              Unfinished Audits
            </span>
            <div className="w-8 h-8 bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">
            {unfinishedAssessments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {assessments.filter((a) => a.status === 'in_progress').length} in progress,{' '}
            {assessments.filter((a) => a.status === 'scheduled').length} scheduled
          </div>
        </div>

        {/* Passed Assessments */}
        <div
          onClick={() => setFilterType('pass')}
          className="bg-white border-2 border-slate-200 hover:border-emerald-500 p-4 sm:p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
              Audits Passed
            </span>
            <div className="w-8 h-8 bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">
            {passedAssessments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Pass rate:{' '}
            <span className="font-bold text-emerald-600">{passRate}%</span> of verified
          </div>
        </div>

        {/* Failed / False Assessments (Accent Color: #e84118) */}
        <div
          onClick={() => setFilterType('fail')}
          className={`bg-white border-2 p-4 sm:p-5 transition-all cursor-pointer group ${
            failedAssessments.length > 0 ? 'border-[#e84118] bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#e84118]">
              Audits False / Fail
            </span>
            <div className="w-8 h-8 bg-[#e84118]/15 flex items-center justify-center text-[#e84118]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#e84118] mt-2 font-mono">
            {failedAssessments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mandatory follow-up / corrective action required
          </div>
        </div>
      </div>

      {/* Main Split: Unfinished & Flagged Factories Monitor + Compliance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monitoring Factory Assessments (with filter tabs) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border-2 border-slate-200">
            {/* Header & Tabs */}
            <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f5f6fa]/60">
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#00a8ff]" />
                  Factory Assessment Monitor
                </h2>
                <p className="text-xs text-slate-500">
                  Track in-flight inspections, scheduled visits, and audit verdicts.
                </p>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    filterType === 'all'
                      ? 'bg-[#00a8ff] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({assessments.length})
                </button>
                <button
                  onClick={() => setFilterType('unfinished')}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    filterType === 'unfinished'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unfinished ({unfinishedAssessments.length})
                </button>
                <button
                  onClick={() => setFilterType('pass')}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    filterType === 'pass'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pass ({passedAssessments.length})
                </button>
                <button
                  onClick={() => setFilterType('fail')}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    filterType === 'fail'
                      ? 'bg-[#e84118] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  False/Fail ({failedAssessments.length})
                </button>
              </div>
            </div>

            {/* Assessment Records List */}
            <div className="divide-y divide-slate-200">
              {filteredAssessments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No factory assessments match the selected filter.
                </div>
              ) : (
                filteredAssessments.map((rec) => {
                  const isUnfinished = rec.status !== 'completed';
                  const isPass = rec.result === 'PASS';
                  const isFail = rec.result === 'FAIL';

                  return (
                    <div
                      key={rec.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${
                              rec.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : rec.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : isPass
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-[#e84118] border border-rose-300'
                            }`}
                          >
                            {rec.status === 'in_progress'
                              ? '⚡ In Progress'
                              : rec.status === 'scheduled'
                              ? '📅 Scheduled'
                              : isPass
                              ? '✓ PASSED'
                              : '✕ FALSE / FAILED'}
                          </span>

                          <span className="text-xs font-mono text-slate-400">
                            {rec.inspectionType}
                          </span>

                          {rec.priority === 'Urgent' && (
                            <span className="px-1.5 py-0.2 bg-[#e84118] text-white text-[9px] font-extrabold uppercase tracking-wider">
                              URGENT
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {rec.factoryName}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {rec.scheduledDate} ({rec.scheduledTime || '09:00 AM'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {rec.officers.length} Officer{rec.officers.length > 1 ? 's' : ''} assigned
                          </span>
                          {rec.status === 'completed' && (
                            <span className="font-mono font-bold text-slate-700">
                              Score: {rec.scorePercent}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isUnfinished ? (
                          <button
                            onClick={() => onNavigate('assessment', rec.id)}
                            className="px-3.5 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <span>{rec.status === 'in_progress' ? 'Continue Audit' : 'Start Audit'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownloadPDF(rec)}
                              disabled={downloadingId === rec.id}
                              className="px-2.5 py-1.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                              title="Download PDF Summary Report"
                            >
                              {downloadingId === rec.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>{downloadingId === rec.id ? 'PDF...' : 'PDF'}</span>
                            </button>
                            <button
                              onClick={() => onNavigate('assessment', rec.id)}
                              className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              <span>View Report</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Factories requiring inspection review */}
          <div className="bg-white border-2 border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e84118]" />
                Factories Requiring Attention / Renewal ({factoriesRequiringAttention.length})
              </h3>
              <button
                onClick={() => onNavigate('factories')}
                className="text-xs text-[#00a8ff] font-bold hover:underline uppercase"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {factoriesRequiringAttention.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => onNavigate('factories', f.id)}
                  className="p-3 border border-slate-200 bg-[#f5f6fa]/50 hover:bg-white hover:border-[#00a8ff] transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">{f.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {f.sector} • {f.city}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                      f.lastAssessmentResult === 'FAIL'
                        ? 'bg-rose-100 text-[#e84118]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {f.lastAssessmentResult === 'FAIL' ? 'AUDIT FAILED' : 'PENDING AUDIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Inspection Analytics & Checklist Architecture */}
        <div className="space-y-6">
          {/* Flat Compliance Gauge Card */}
          <div className="bg-white border-2 border-slate-200 p-5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00a8ff]" />
              Compliance Benchmark
            </h3>

            <div className="my-5 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center border-8 border-[#f5f6fa]">
                <div
                  className="absolute inset-0 border-8 border-[#00a8ff]"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${passRate}%, 0 ${passRate}%)`,
                  }}
                />
                <div className="text-center z-10">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {passRate}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Pass Ratio
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Statutory Threshold</span>
                <span className="font-mono font-bold text-slate-900">75% Min Score</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Zero Critical Failures</span>
                <span className="font-mono font-bold text-[#e84118]">Enforced</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Official Signatures</span>
                <span className="font-mono font-bold text-emerald-600">Required (E-Sign)</span>
              </div>
            </div>
          </div>

          {/* Checklist Architecture Info */}
          <div className="bg-white border-2 border-slate-200 p-5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3">
              Standardized Checklists
            </h3>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-[#f5f6fa] border-l-4 border-[#00a8ff]">
                <div className="font-bold text-xs text-slate-900">Checklist A (5 Parts)</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Structural, Environmental, Labor Welfare & PPE, Machinery Guarding, Quality & Storage.
                </p>
                <div className="text-[10px] font-mono text-slate-500 mt-1">25 Scorable Indicators</div>
              </div>

              <div className="p-3 bg-[#f5f6fa] border-l-4 border-[#e84118]">
                <div className="font-bold text-xs text-slate-900">Checklist B (3 Parts)</div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Fire & Emergency, Hazardous Chemicals & HazMat, Statutory Licenses & Documentation.
                </p>
                <div className="text-[10px] font-mono text-[#e84118] font-bold mt-1">
                  15 High-Risk Indicators (Includes Critical Items)
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                onClick={() => onNavigate('assign')}
                className="w-full py-2 bg-[#2f3640] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Schedule New Assessment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
