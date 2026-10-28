import React, { useState } from 'react';
import {
  ClipboardList,
  Building2,
  Calendar,
  Clock,
  Users,
  Shield,
  AlertCircle,
  Check,
  CheckCircle2,
  ArrowRight,
  Info,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../components/Navigation';
import { AssessmentRecord } from '../types';

interface AssignAuditViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
  preselectedFactoryId?: string;
}

export const AssignAuditView: React.FC<AssignAuditViewProps> = ({
  onNavigate,
  preselectedFactoryId,
}) => {
  const { factories, availableOfficers, createAssessmentAssignment } = useApp();

  const [factoryId, setFactoryId] = useState<string>(
    preselectedFactoryId || (factories[0]?.id || '')
  );

  // Default to tomorrow or next business day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState<string>(tomorrowStr);
  const [scheduledTime, setScheduledTime] = useState<string>('09:30 AM');
  const [inspectionType, setInspectionType] =
    useState<AssessmentRecord['inspectionType']>('Routine Annual');
  const [priority, setPriority] = useState<AssessmentRecord['priority']>('Normal');
  const [leadOfficerId, setLeadOfficerId] = useState<string>(
    availableOfficers[0]?.id || ''
  );
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([
    availableOfficers[0]?.id || '',
    availableOfficers[1]?.id || '',
  ]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successAssignment, setSuccessAssignment] = useState<AssessmentRecord | null>(null);

  const selectedFactory = factories.find((f) => f.id === factoryId);

  const toggleOfficerSelection = (officerId: string) => {
    if (selectedOfficerIds.includes(officerId)) {
      // Must keep at least 1 officer
      if (selectedOfficerIds.length <= 1) {
        setErrorMsg('At least one assessing officer is mandatory.');
        return;
      }
      setSelectedOfficerIds(selectedOfficerIds.filter((id) => id !== officerId));
      if (leadOfficerId === officerId) {
        // Change lead officer to remaining
        const remaining = selectedOfficerIds.filter((id) => id !== officerId);
        if (remaining.length > 0) setLeadOfficerId(remaining[0]);
      }
    } else {
      // Maximum 6 persons enforcement as required in prompt!
      if (selectedOfficerIds.length >= 6) {
        setErrorMsg('Maximum 6 assessing officers can be assigned to an inspection team.');
        return;
      }
      setErrorMsg('');
      setSelectedOfficerIds([...selectedOfficerIds, officerId]);
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!factoryId) {
      setErrorMsg('Please select a target factory.');
      return;
    }
    if (!scheduledDate) {
      setErrorMsg('Please select an assessment visit date.');
      return;
    }
    if (selectedOfficerIds.length === 0) {
      setErrorMsg('At least one assessing officer is required.');
      return;
    }
    if (selectedOfficerIds.length > 6) {
      setErrorMsg('Maximum 6 officers allowed per assessment mission.');
      return;
    }

    const newRecord = createAssessmentAssignment({
      factoryId,
      scheduledDate,
      scheduledTime,
      inspectionType,
      priority,
      leadOfficerId: leadOfficerId || selectedOfficerIds[0],
      officerIds: selectedOfficerIds,
      specialInstructions,
    });

    setSuccessAssignment(newRecord);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-200 p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00a8ff]" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Assign Factory Assessment Mission
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Designate lead auditor, assemble assessment team (up to 6 officers), and schedule field dispatch.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-[#e84118] text-[#e84118] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successAssignment ? (
        <div className="bg-white border-2 border-emerald-500 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 uppercase">
                Assessment Mission Successfully Assigned!
              </h3>
              <p className="text-xs text-slate-600">
                Mission order logged for{' '}
                <strong className="text-slate-900">{successAssignment.factoryName}</strong> on{' '}
                <strong className="font-mono text-slate-900">
                  {successAssignment.scheduledDate} ({successAssignment.scheduledTime})
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="bg-[#f5f6fa] p-4 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Inspection Team:</span>
              <span className="font-bold text-slate-800">
                {successAssignment.officers.length} Officers (Lead: {availableOfficers.find(o => o.id === successAssignment.leadOfficerId)?.name})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Checklists Ready:</span>
              <span className="font-bold text-slate-800">
                Checklist A (5 Parts) & Checklist B (3 Parts)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('assessment', successAssignment.id)}
              className="px-5 py-2.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs"
            >
              <span>Launch Assessment Engine Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider"
            >
              View on Calendar
            </button>
            <button
              onClick={() => setSuccessAssignment(null)}
              className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold uppercase"
            >
              Assign Another Factory
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAssign} className="bg-white border-2 border-slate-200 p-6 space-y-6">
          {/* Step 1: Select Factory */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00a8ff]" />
              1. Select Target Manufacturing Facility
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Factory Enterprise *
                </label>
                <select
                  value={factoryId}
                  onChange={(e) => setFactoryId(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff]"
                >
                  {factories.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} — {fac.city} ({fac.sector})
                    </option>
                  ))}
                </select>
              </div>

              {selectedFactory && (
                <div className="bg-[#f5f6fa] border border-slate-200 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Owner:</span>
                    <span className="font-bold text-slate-800">{selectedFactory.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phone:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedFactory.ownerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Risk Level:</span>
                    <span className={`font-bold uppercase ${selectedFactory.riskLevel === 'High' ? 'text-[#e84118]' : 'text-slate-800'}`}>
                      {selectedFactory.riskLevel} Risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Schedule & Mission Parameters */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00a8ff]" />
              2. Mission Schedule & Classification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assessment Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Target Time
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff]"
                >
                  <option value="08:30 AM">08:30 AM (Morning Shift)</option>
                  <option value="09:30 AM">09:30 AM (Standard)</option>
                  <option value="01:00 PM">01:00 PM (Afternoon)</option>
                  <option value="03:00 PM">03:00 PM (Late Shift)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Audit Scope / Type
                </label>
                <select
                  value={inspectionType}
                  onChange={(e) =>
                    setInspectionType(e.target.value as AssessmentRecord['inspectionType'])
                  }
                  className="w-full text-xs border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff]"
                >
                  <option value="Routine Annual">Routine Annual Audit</option>
                  <option value="Initial Certification">Initial Certification</option>
                  <option value="Surprise Audit">Surprise Spot Check</option>
                  <option value="Follow-up Inspection">Follow-up Rectification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Priority Urgency
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as AssessmentRecord['priority'])
                  }
                  className={`w-full text-xs font-bold uppercase border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff] ${
                    priority === 'Urgent' ? 'text-[#e84118]' : 'text-slate-800'
                  }`}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Assessing Officers Team (Max 6 Persons) */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00a8ff]" />
                3. Assemble Assessment Team (Max 6 Officers)
              </h3>
              <span className="text-xs font-mono font-bold text-slate-600">
                Selected:{' '}
                <span
                  className={
                    selectedOfficerIds.length === 6 ? 'text-[#e84118]' : 'text-[#00a8ff]'
                  }
                >
                  {selectedOfficerIds.length} / 6
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Click officers to include in the on-site mission. Designated officers will each be provided an e-signing pad for the official statutory seal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableOfficers.map((officer) => {
                const isSelected = selectedOfficerIds.includes(officer.id);
                const isLead = leadOfficerId === officer.id;

                return (
                  <div
                    key={officer.id}
                    onClick={() => toggleOfficerSelection(officer.id)}
                    className={`p-3 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#00a8ff] bg-[#00a8ff]/5 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-slate-500 font-bold">
                          {officer.badgeNumber}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 bg-[#00a8ff] text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs text-slate-900">{officer.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{officer.role}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {officer.department}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="leadOfficerRadio"
                            checked={isLead}
                            onChange={() => setLeadOfficerId(officer.id)}
                            className="accent-[#00a8ff]"
                          />
                          <span>Lead Auditor</span>
                        </label>
                        {isLead && (
                          <span className="text-[9px] font-extrabold uppercase bg-slate-900 text-white px-1.5 py-0.2">
                            LEAD
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Special Instructions */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">
              4. Special Instructions & Focus Directives
            </h3>
            <textarea
              rows={3}
              placeholder="e.g. Pay special focus to hazardous chemical bunding in storage zone 3, test emergency boiler shutoff valves, verify forklift maintenance log..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              Confirm & Assign Assessment
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
