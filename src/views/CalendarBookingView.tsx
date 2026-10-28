import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  ArrowRight,
  X,
  FileCheck2,
  Download,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../components/Navigation';
import { AssessmentRecord } from '../types';
import { downloadAssessmentPDF } from '../utils/pdfGenerator';

interface CalendarBookingViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
}

export const CalendarBookingView: React.FC<CalendarBookingViewProps> = ({
  onNavigate,
}) => {
  const { assessments, factories, availableOfficers, createAssessmentAssignment } = useApp();

  // Current view date (default to current October 2026)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 27));
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-28');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [downloadingCalId, setDownloadingCalId] = useState<string | null>(null);

  const handleDownloadPDF = async (record: AssessmentRecord) => {
    setDownloadingCalId(record.id);
    try {
      const targetFac = factories.find((f) => f.id === record.factoryId);
      await downloadAssessmentPDF(record, targetFac);
    } catch (err) {
      console.error('Failed to download calendar PDF:', err);
    } finally {
      setDownloadingCalId(null);
    }
  };

  // Quick booking state
  const [bookingFactoryId, setBookingFactoryId] = useState<string>(factories[0]?.id || '');
  const [bookingTime, setBookingTime] = useState<string>('09:30 AM');
  const [bookingType, setBookingType] =
    useState<AssessmentRecord['inspectionType']>('Routine Annual');
  const [bookingPriority, setBookingPriority] =
    useState<AssessmentRecord['priority']>('Normal');
  const [bookingLeadOfficer, setBookingLeadOfficer] = useState<string>(
    availableOfficers[0]?.id || ''
  );
  const [bookingNote, setBookingNote] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date(2026, 9, 27));
    setSelectedDateStr('2026-10-27');
  };

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format YYYY-MM-DD
  const formatDayString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Assessments for selected date
  const assessmentsForSelectedDate = assessments.filter(
    (a) => a.scheduledDate === selectedDateStr
  );

  const handleDayClick = (dayStr: string) => {
    setSelectedDateStr(dayStr);
  };

  const handleOpenBooking = (dayStr?: string) => {
    if (dayStr) setSelectedDateStr(dayStr);
    setIsBookingModalOpen(true);
  };

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFactoryId || !selectedDateStr) return;

    createAssessmentAssignment({
      factoryId: bookingFactoryId,
      scheduledDate: selectedDateStr,
      scheduledTime: bookingTime,
      inspectionType: bookingType,
      priority: bookingPriority,
      leadOfficerId: bookingLeadOfficer,
      officerIds: [bookingLeadOfficer, availableOfficers[1]?.id || ''].filter(Boolean),
      specialInstructions: bookingNote,
    });

    setIsBookingModalOpen(false);
    setBookingNote('');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header */}
      <div className="bg-white border-2 border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00a8ff]" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Assessment Visit & Inspection Dispatch Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any day to book a factory audit date, assign field officers, and review scheduled inspections.
          </p>
        </div>

        <button
          onClick={() => handleOpenBooking()}
          className="px-4 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Book Visit on {selectedDateStr}
        </button>
      </div>

      {/* Main Grid: Calendar (Left 8 cols) & Day Agenda (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Table */}
        <div className="lg:col-span-8 bg-white border-2 border-slate-200">
          {/* Calendar Toolbar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#f5f6fa]/60">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={goToToday}
                className="text-[11px] font-bold uppercase px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center font-bold text-[11px] uppercase text-slate-500 bg-slate-50 py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 sm:h-28 bg-[#f5f6fa]/40 p-1" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDayString(dayNum);
              const isSelected = selectedDateStr === dateStr;
              const dayAssessments = assessments.filter((a) => a.scheduledDate === dateStr);
              const isToday = dateStr === '2026-10-27';

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-24 sm:h-28 p-1.5 cursor-pointer transition-colors relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#00a8ff]/10 ring-2 ring-inset ring-[#00a8ff]'
                      : isToday
                      ? 'bg-blue-50/40 hover:bg-slate-50'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'bg-[#00a8ff] text-white px-1.5 py-0.2'
                          : isSelected
                          ? 'text-[#00a8ff]'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayAssessments.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {dayAssessments.length}
                      </span>
                    )}
                  </div>

                  {/* Badges for inspections on this day */}
                  <div className="space-y-1 overflow-y-auto max-h-16 pr-0.5 scrollbar-none">
                    {dayAssessments.slice(0, 2).map((a) => {
                      const isDone = a.status === 'completed';
                      return (
                        <div
                          key={a.id}
                          className={`text-[9px] font-bold p-1 truncate leading-tight uppercase ${
                            isDone
                              ? a.result === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-600'
                                : 'bg-rose-100 text-[#e84118] border-l-2 border-[#e84118]'
                              : a.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800 border-l-2 border-amber-600'
                              : 'bg-blue-100 text-[#00a8ff] border-l-2 border-[#00a8ff]'
                          }`}
                          title={`${a.factoryName} (${a.inspectionType})`}
                        >
                          {a.factoryName}
                        </div>
                      );
                    })}
                    {dayAssessments.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-bold">
                        +{dayAssessments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500" /> Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500" /> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-600" /> Passed Audit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#e84118]" /> False / Failed Audit
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Schedule & Action Agenda */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border-2 border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Target Audit Date
                </span>
                <h3 className="text-base font-black text-slate-900 font-mono">
                  {selectedDateStr}
                </h3>
              </div>
              <button
                onClick={() => handleOpenBooking(selectedDateStr)}
                className="px-2.5 py-1.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Audit
              </button>
            </div>

            {/* List of Visits for this date */}
            {assessmentsForSelectedDate.length === 0 ? (
              <div className="p-6 bg-[#f5f6fa] border border-dashed border-slate-300 text-center space-y-2">
                <CalendarIcon className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No Assessments Booked</div>
                <p className="text-[11px] text-slate-500">
                  No factory inspection teams are dispatched on this date.
                </p>
                <button
                  onClick={() => handleOpenBooking(selectedDateStr)}
                  className="mt-2 text-xs text-[#00a8ff] font-bold hover:underline uppercase"
                >
                  + Schedule Visit Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {assessmentsForSelectedDate.map((rec) => {
                  const targetFac = factories.find((f) => f.id === rec.factoryId);
                  const isDone = rec.status === 'completed';

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 border-2 border-slate-200 hover:border-[#00a8ff] transition-all bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {rec.scheduledTime || '09:00 AM'}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 font-mono ${
                            isDone
                              ? rec.result === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-[#e84118]'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isDone ? rec.result : rec.status}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 line-clamp-1">
                        {rec.factoryName}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{targetFac ? `${targetFac.city}, ${targetFac.province}` : 'Factory Location'}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <Users className="w-3 h-3 text-[#00a8ff]" />
                        <span>{rec.officers.length} Officer team</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        {isDone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(rec);
                            }}
                            disabled={downloadingCalId === rec.id}
                            className="px-2.5 py-1.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                            title="Download formatted audit PDF"
                          >
                            {downloadingCalId === rec.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{downloadingCalId === rec.id ? 'PDF...' : 'PDF'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('assessment', rec.id)}
                          className="flex-1 py-1.5 bg-[#f5f6fa] hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors border border-slate-300"
                        >
                          <span>{isDone ? 'View Report' : 'Open Assessment'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Booking Modal for Selected Date */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Book Factory Assessment Visit
                </h3>
                <p className="text-xs text-slate-500">Date: {selectedDateStr}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickBook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Select Target Factory *
                </label>
                <select
                  value={bookingFactoryId}
                  onChange={(e) => setBookingFactoryId(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-300 p-2.5 bg-white focus:outline-none focus:border-[#00a8ff]"
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 p-2 bg-white focus:outline-none focus:border-[#00a8ff]"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Inspection Scope
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) =>
                      setBookingType(e.target.value as AssessmentRecord['inspectionType'])
                    }
                    className="w-full text-xs border border-slate-300 p-2 bg-white focus:outline-none focus:border-[#00a8ff]"
                  >
                    <option value="Routine Annual">Routine Annual</option>
                    <option value="Initial Certification">Initial Certification</option>
                    <option value="Surprise Audit">Surprise Audit</option>
                    <option value="Follow-up Inspection">Follow-up Inspection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Lead Auditor
                </label>
                <select
                  value={bookingLeadOfficer}
                  onChange={(e) => setBookingLeadOfficer(e.target.value)}
                  className="w-full text-xs border border-slate-300 p-2 bg-white focus:outline-none focus:border-[#00a8ff]"
                >
                  {availableOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Visit Dispatch Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chemical storage ventilation check"
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  className="w-full text-xs border border-slate-300 p-2 bg-[#f5f6fa]/60 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider shadow-xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
