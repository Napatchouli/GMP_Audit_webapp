import React, { useState } from 'react';
import {
  Building2,
  Search,
  Phone,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  Plus,
  Clock,
  History,
  CheckCircle,
  XCircle,
  FileBadge,
  Filter,
  X,
  Download,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Factory, AssessmentRecord } from '../types';
import { TabType } from '../components/Navigation';
import { downloadAssessmentPDF } from '../utils/pdfGenerator';
import { createChecklistATemplate, createChecklistBTemplate } from '../data/mockData';

interface FactoriesViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
  selectedFactoryId?: string;
}

export const FactoriesView: React.FC<FactoriesViewProps> = ({
  onNavigate,
  selectedFactoryId,
}) => {
  const { factories, assessments, availableOfficers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [downloadingHistId, setDownloadingHistId] = useState<string | null>(null);
  const [activeProfileFactory, setActiveProfileFactory] = useState<Factory | null>(() => {
    if (selectedFactoryId) {
      return factories.find((f) => f.id === selectedFactoryId) || factories[0] || null;
    }
    return factories[0] || null;
  });

  const handleDownloadHistoryPDF = async (hist: Factory['assessmentHistory'][0]) => {
    setDownloadingHistId(hist.id);
    try {
      let targetRecord = assessments.find((a) => a.id === hist.assessmentId);
      if (!targetRecord && activeProfileFactory) {
        // Fallback reconstructed assessment record for archived history
        targetRecord = {
          id: hist.assessmentId || `archived_${hist.id}`,
          factoryId: activeProfileFactory.id,
          factoryName: activeProfileFactory.name,
          scheduledDate: hist.date,
          status: 'completed',
          inspectionType: (hist.type as any) || 'Routine Annual',
          priority: 'Normal',
          leadOfficerId: availableOfficers[0]?.id || 'off_001',
          officers: [availableOfficers[0] || { id: 'off_01', name: hist.leadOfficer, role: 'Lead Inspector', badgeNumber: 'INSP-CERT' }],
          checklistA: createChecklistATemplate().map(p => ({
            ...p,
            items: p.items.map(it => ({ ...it, status: hist.result === 'PASS' ? 'pass' : 'partial' })),
          })),
          checklistB: createChecklistBTemplate().map(p => ({
            ...p,
            items: p.items.map(it => ({ ...it, status: hist.result === 'PASS' ? 'pass' : 'fail' })),
          })),
          scorePercent: hist.scorePercent,
          totalPoints: Math.round(hist.scorePercent * 0.8),
          maxPoints: 80,
          result: hist.result,
          findingsCount: { pass: Math.round(hist.scorePercent * 0.35), partial: 4, fail: hist.result === 'PASS' ? 0 : 6, na: 0 },
          specialInstructions: hist.summary,
          certificateNumber: hist.certificateNumber,
          createdAt: `${hist.date}T08:00:00Z`,
          completedAt: `${hist.date}T16:00:00Z`,
        };
      }
      if (targetRecord) {
        await downloadAssessmentPDF(targetRecord, activeProfileFactory);
      }
    } catch (err) {
      console.error('Failed to download history PDF', err);
    } finally {
      setDownloadingHistId(null);
    }
  };

  const filteredFactories = factories.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = sectorFilter === 'All' || f.sector === sectorFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pass' && f.lastAssessmentResult === 'PASS') ||
      (statusFilter === 'Fail' && f.lastAssessmentResult === 'FAIL') ||
      (statusFilter === 'Pending' &&
        (!f.lastAssessmentResult || f.lastAssessmentResult === 'PENDING'));

    return matchesSearch && matchesSector && matchesStatus;
  });

  const sectors = [
    'All',
    'Automotive & Metal',
    'Textile & Garment',
    'Food & Beverage',
    'Chemical & Plastics',
    'Electronics & Hardware',
    'Wood & Paper',
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header bar */}
      <div className="bg-white border-2 border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00a8ff]" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Factory Profiles & Inspection Records
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Directory of registered manufacturing facilities and statutory compliance history.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-factory')}
          className="px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Factory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search factory name, owner, license, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-[#00a8ff] bg-[#f5f6fa]/50 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-xs border border-slate-300 px-3 py-2 bg-white font-medium focus:outline-none focus:border-[#00a8ff]"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                Sector: {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 px-3 py-2 bg-white font-medium focus:outline-none focus:border-[#00a8ff]"
          >
            <option value="All">Audit Status: All</option>
            <option value="Pass">Audit Status: PASS</option>
            <option value="Fail">Audit Status: FAIL</option>
            <option value="Pending">Audit Status: PENDING / UNREVIEWED</option>
          </select>

          {(searchQuery || sectorFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSectorFilter('All');
                setStatusFilter('All');
              }}
              className="text-xs text-slate-500 hover:text-[#e84118] font-bold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split: Factory List (left) & Factory Profile Review (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Factory Directory Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider px-1">
            <span>Showing {filteredFactories.length} Factories</span>
            <span>Click to Review Profile</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredFactories.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 p-8 text-center text-xs text-slate-500">
                No factories match your search criteria.
              </div>
            ) : (
              filteredFactories.map((fac) => {
                const isSelected = activeProfileFactory?.id === fac.id;
                const isPass = fac.lastAssessmentResult === 'PASS';
                const isFail = fac.lastAssessmentResult === 'FAIL';

                return (
                  <div
                    key={fac.id}
                    onClick={() => setActiveProfileFactory(fac)}
                    className={`bg-white border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00a8ff] bg-[#00a8ff]/5 shadow-xs'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-800'
                                : isFail
                                ? 'bg-rose-100 text-[#e84118]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPass ? 'PASS' : isFail ? 'FAIL' : 'PENDING AUDIT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {fac.registrationNumber}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {fac.name}
                        </h3>

                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.ownerName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-mono text-[11px] truncate">
                            {fac.ownerPhone}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {fac.city}, {fac.province}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 uppercase ${
                            fac.riskLevel === 'High' || fac.riskLevel === 'Critical'
                              ? 'bg-rose-50 text-[#e84118] border border-rose-200'
                              : fac.riskLevel === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {fac.riskLevel} Risk
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {fac.assessmentHistory.length} audit{fac.assessmentHistory.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Factory Profile Review */}
        <div className="lg:col-span-7">
          {activeProfileFactory ? (
            <div className="bg-white border-2 border-slate-200 shadow-xs">
              {/* Profile Top Banner */}
              <div className="relative bg-[#2f3640] text-white p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#00a8ff] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        {activeProfileFactory.sector}
                      </span>
                      <span className="text-slate-300 font-mono text-xs">
                        Reg: {activeProfileFactory.registrationNumber}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      {activeProfileFactory.name}
                    </h2>

                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00a8ff]" />
                      {activeProfileFactory.address}, {activeProfileFactory.city},{' '}
                      {activeProfileFactory.province} {activeProfileFactory.postalCode}
                    </p>
                  </div>

                  {/* Actions for this factory */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('assign', activeProfileFactory.id)}
                      className="px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Assign Assessment
                    </button>
                    <button
                      onClick={() => onNavigate('new-factory')}
                      className="px-4 py-2 border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      New Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Details Sections */}
              <div className="p-6 space-y-6">
                {/* 1. Owner & Operational Contacts */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00a8ff]" />
                    Owner & Facility Contacts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f5f6fa] p-4 border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Factory Owner
                      </span>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">
                        {activeProfileFactory.ownerName}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Direct Telephone
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#00a8ff]" />
                        {activeProfileFactory.ownerPhone}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Contact Email
                      </span>
                      <div className="font-mono text-xs text-slate-800 mt-0.5 truncate">
                        {activeProfileFactory.ownerEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Facility Operational Data & Coordinates */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#00a8ff]" />
                    Facility Parameters & Location
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border border-slate-200 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Workforce Size
                      </span>
                      <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                        {activeProfileFactory.employeeCount} Personnel
                      </div>
                    </div>
                    <div className="p-3 border border-slate-200 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Established Year
                      </span>
                      <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                        {activeProfileFactory.establishedYear}
                      </div>
                    </div>
                    <div className="p-3 border border-slate-200 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Risk Rating
                      </span>
                      <div
                        className={`text-base font-bold uppercase mt-0.5 ${
                          activeProfileFactory.riskLevel === 'High'
                            ? 'text-[#e84118]'
                            : 'text-slate-800'
                        }`}
                      >
                        {activeProfileFactory.riskLevel}
                      </div>
                    </div>
                    <div className="p-3 border border-slate-200 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Operating License
                      </span>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                        {activeProfileFactory.operatingLicenseNo}
                      </div>
                    </div>
                  </div>

                  {/* GPS & Map Pin Preview Bar */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#e84118]" />
                      <span>
                        GPS Coordinates:{' '}
                        <span className="font-mono font-bold text-slate-800">
                          {activeProfileFactory.coordinates.lat.toFixed(4)}° N,{' '}
                          {activeProfileFactory.coordinates.lng.toFixed(4)}° E
                        </span>
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeProfileFactory.coordinates.lat},${activeProfileFactory.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00a8ff] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open in Field Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 3. History of Assessments */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#00a8ff]" />
                      History of Assessments ({activeProfileFactory.assessmentHistory.length})
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Statutory Audit Trail
                    </span>
                  </div>

                  {activeProfileFactory.assessmentHistory.length === 0 ? (
                    <div className="p-6 bg-[#f5f6fa] border border-dashed border-slate-300 text-center">
                      <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 font-bold">
                        No previous completed assessments recorded.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        This facility is pending an initial statutory certification or baseline inspection.
                      </p>
                      <button
                        onClick={() => onNavigate('assign', activeProfileFactory.id)}
                        className="mt-3 px-3.5 py-1.5 bg-[#00a8ff] text-white text-xs font-bold uppercase tracking-wider"
                      >
                        Schedule First Assessment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeProfileFactory.assessmentHistory.map((hist) => {
                        const isPass = hist.result === 'PASS';
                        return (
                          <div
                            key={hist.id}
                            className={`p-4 border-2 ${
                              isPass ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                    isPass ? 'bg-emerald-600 text-white' : 'bg-[#e84118] text-white'
                                  }`}
                                >
                                  {isPass ? 'PASSED' : 'FALSE / FAILED'}
                                </span>
                                <span className="font-bold text-xs text-slate-800">
                                  {hist.type}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-xs font-mono text-slate-500">
                                  {hist.date}
                                </span>
                              </div>

                              <div className="font-mono text-xs font-bold text-slate-800">
                                Score: <span className={isPass ? 'text-emerald-700' : 'text-[#e84118]'}>{hist.scorePercent}%</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 mt-2 font-medium">
                              {hist.summary}
                            </p>

                            <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                              <span>Lead Officer: <strong className="text-slate-700">{hist.leadOfficer}</strong></span>
                              <div className="flex items-center gap-2">
                                {hist.certificateNumber && (
                                  <span className="font-mono font-semibold text-emerald-700 flex items-center gap-1">
                                    <FileBadge className="w-3.5 h-3.5" />
                                    {hist.certificateNumber}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadHistoryPDF(hist);
                                  }}
                                  disabled={downloadingHistId === hist.id}
                                  className="px-2 py-1 bg-white hover:bg-[#00a8ff] hover:text-white border border-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                  title="Download formatted audit PDF"
                                >
                                  {downloadingHistId === hist.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3 text-[#00a8ff] group-hover:text-white" />
                                  )}
                                  <span>{downloadingHistId === hist.id ? 'PDF...' : 'PDF Report'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 p-12 text-center text-slate-500 text-xs">
              Select a factory from the list to review its profile and assessment history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
