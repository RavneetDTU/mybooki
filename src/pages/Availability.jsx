import { ChevronLeft, ChevronRight, Info, Loader, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { HolidaysSection } from '../components/HolidaysSection';
import { OperatingHoursSection } from '../components/OperatingHoursSection';
import { SittingSlotsEditor } from '../components/SittingSlotsEditor';
import { SittingsSection } from '../components/SittingsSection';
import apiClient from '../services/api/axios';
import { AVAILABILITY_ENDPOINTS } from '../services/api/endpoints';
import { operatingHoursService } from '../services/operatingHours';
import { sittingService } from '../services/sittings';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateForAPI } from '../utils/dateUtils';
import { compareSittingDisplayOrder, formatTimeShort, validateSlots } from '../utils/sittingSlots';

const MAX_SLOTS_IN_CELL = 3;

const toEditableSlots = (slots) =>
  (slots || [])
    .filter((s) => s.sitting_id != null)
    .map((s) => ({ sitting_id: s.sitting_id, start_time: s.start_time, end_time: s.end_time }));

export function Availability() {
  const { restaurantId } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit modal state
  const [editIsOpen, setEditIsOpen] = useState(true);
  const [editOpenTime, setEditOpenTime] = useState('11:00');
  const [editCloseTime, setEditCloseTime] = useState('22:00');

  // Sittings (shared by the Sittings, Operating Hours and date editor sections)
  const [sittings, setSittings] = useState([]);
  const [sittingsLoading, setSittingsLoading] = useState(true);
  const [sittingsError, setSittingsError] = useState('');
  const [scheduleEpoch, setScheduleEpoch] = useState(0);

  // Month calendar data from the API, keyed by YYYY-MM-DD
  const [monthDays, setMonthDays] = useState({});
  const [overrideDates, setOverrideDates] = useState(new Set());
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState('');

  // One-off date sittings (edit modal)
  const [dateSlots, setDateSlots] = useState([]);
  const [dateHasOverride, setDateHasOverride] = useState(false);
  const [dateSlotsLoading, setDateSlotsLoading] = useState(false);
  const [savingDateSlots, setSavingDateSlots] = useState(false);

  const loadSittings = useCallback(async () => {
    if (!restaurantId) return;
    setSittingsLoading(true);
    setSittingsError('');
    try {
      const { sittings: list, seeded } = await operatingHoursService.ensureDefaultOpenWeek(restaurantId);
      setSittings(list);
      if (seeded) setScheduleEpoch((n) => n + 1);
    } catch (err) {
      console.error('[Availability] Failed to load sittings:', err);
      setSittingsError(err.message || 'Failed to load sittings');
    } finally {
      setSittingsLoading(false);
    }
  }, [restaurantId]);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const loadMonth = useCallback(async () => {
    if (!restaurantId) return;
    const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const from = formatDateForAPI(new Date(year, monthIndex, 1));
    const to = formatDateForAPI(new Date(year, monthIndex + 1, 0));
    setMonthLoading(true);
    setMonthError('');
    try {
      const [days, overrides] = await Promise.all([
        sittingService.getMonthAvailability(restaurantId, monthStr),
        sittingService.getDateSchedules(restaurantId, from, to).catch(() => []),
      ]);
      const byDate = {};
      days.forEach((d) => { byDate[d.date] = d; });
      setMonthDays(byDate);
      setOverrideDates(new Set(overrides.map((o) => o.date)));
    } catch (err) {
      console.error('[Availability] Failed to load month:', err);
      setMonthError(err.message || 'Failed to load availability');
      setMonthDays({});
      setOverrideDates(new Set());
    } finally {
      setMonthLoading(false);
    }
  }, [restaurantId, year, monthIndex]);

  useEffect(() => { loadSittings(); }, [loadSittings]);
  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => {
    if (scheduleEpoch > 0) loadMonth();
  }, [scheduleEpoch, loadMonth]);

  const handleSittingsChanged = async () => {
    await loadSittings();
    loadMonth();
  };

  // Helper functions
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];

    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isOpen: false,
        isCurrentMonth: false,
      });
    }

    // Add current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateForAPI(date);
      const apiDay = monthDays[dateStr];
      const slots = [...(apiDay?.slots || [])].sort(compareSittingDisplayOrder);
      const isOpen = apiDay ? !apiDay.is_closed : false;

      days.push({
        date,
        dateStr,
        isLoaded: Boolean(apiDay),
        isOpen,
        openTime: isOpen ? apiDay.open_time || undefined : undefined,
        closeTime: isOpen ? apiDay.close_time || undefined : undefined,
        slots: isOpen ? slots : [],
        hasOverride: overrideDates.has(dateStr),
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isCurrentMonth: true,
      });
    }

    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isOpen: false,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleDayClick = async (day) => {
    if (!day.isCurrentMonth) return;

    setSelectedDay(day);
    setEditIsOpen(day.isOpen);
    setEditOpenTime(day.openTime || '11:00');
    setEditCloseTime(day.closeTime || '22:00');
    setDateSlots(toEditableSlots(day.slots));
    setDateHasOverride(day.hasOverride);
    setEditModalOpen(true);

    if (!restaurantId) return;
    setDateSlotsLoading(true);
    try {
      const overrides = await sittingService.getDateSchedules(restaurantId, day.dateStr, day.dateStr);
      const override = overrides.find((o) => o.date === day.dateStr);
      setDateHasOverride(Boolean(override));
      if (override) setDateSlots(toEditableSlots(override.slots));
    } catch (err) {
      console.error('[Availability] Failed to load date sittings:', err);
    } finally {
      setDateSlotsLoading(false);
    }
  };

  const handleSaveDateSlots = async () => {
    if (!selectedDay || !restaurantId) return;
    const error = validateSlots(dateSlots, sittings);
    if (error) {
      alert(error);
      return;
    }
    if (dateSlots.length === 0 && !window.confirm('Save with no sittings? No bookings will be accepted on this date.')) return;
    setSavingDateSlots(true);
    try {
      await sittingService.setDateSchedule(restaurantId, selectedDay.dateStr, dateSlots);
      setEditModalOpen(false);
      setSelectedDay(null);
      loadMonth();
    } catch (err) {
      console.error('[Availability] Failed to save date sittings:', err);
      alert(err.message || 'Failed to save sittings for this date. Please try again.');
    } finally {
      setSavingDateSlots(false);
    }
  };

  const handleResetDateSlots = async () => {
    if (!selectedDay || !restaurantId) return;
    if (!window.confirm('Remove the special sittings for this date and use the weekly schedule again?')) return;
    setSavingDateSlots(true);
    try {
      await sittingService.clearDateSchedule(restaurantId, selectedDay.dateStr);
      setEditModalOpen(false);
      setSelectedDay(null);
      loadMonth();
    } catch (err) {
      console.error('[Availability] Failed to reset date sittings:', err);
      alert(err.message || 'Failed to reset this date. Please try again.');
    } finally {
      setSavingDateSlots(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!selectedDay || !restaurantId) return;

    // Format date as YYYY-MM-DD
    const d = selectedDay.date;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const payload = {
      date: dateStr,
      open_time: editIsOpen ? editOpenTime : '',
      close_time: editIsOpen ? editCloseTime : '',
      is_closed: !editIsOpen,
    };

    console.log('[Availability] Saving:', payload);
    setIsSaving(true);
    try {
      const response = await apiClient.post(AVAILABILITY_ENDPOINTS.SET(restaurantId), payload);
      console.log('[Availability] Saved successfully:', response.data);
      setEditModalOpen(false);
      setSelectedDay(null);
      loadMonth();
    } catch (error) {
      console.error('[Availability] Failed to save:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="font-heading font-semibold text-foreground">
            Availability Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your restaurant's open hours and closed dates
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-5">
        {/* Calendar Header */}
        <div className="bg-white border border-border rounded-lg p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">
              {getMonthName(currentDate)}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="px-2 py-1.5 border border-border rounded-md hover:bg-muted/20 hover:border-foreground transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 border border-border rounded-md hover:bg-muted/20 hover:border-foreground transition-all text-xs font-medium"
              >
                Today
              </button>

              <button
                onClick={goToNextMonth}
                className="px-2 py-1.5 border border-border rounded-md hover:bg-muted/20 hover:border-foreground transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 p-2 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Legend:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-foreground">Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-100 border-2 border-red-400 rounded"></div>
              <span className="text-xs text-foreground">Closed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-primary rounded"></div>
              <span className="text-xs text-foreground">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-foreground">Special sittings</span>
            </div>
            {monthLoading && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Loader className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading…</span>
              </div>
            )}
          </div>

          {monthError && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-xs text-red-700">{monthError}</p>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
            {/* Week Day Headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-muted/50 border-b border-r border-border last:border-r-0 px-2 py-2 text-center"
              >
                <span className="text-xs font-semibold text-foreground">
                  {day}
                </span>
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const isLastInRow = (index + 1) % 7 === 0;

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    border-b border-r last:border-b-0 min-h-[85px] p-2 relative
                    ${!day.isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                    ${day.isCurrentMonth && !day.isOpen ? 'bg-red-50 border-red-200' : ''}
                    ${day.isToday ? 'ring-2 ring-primary ring-inset' : ''}
                    ${day.isCurrentMonth ? 'cursor-pointer hover:bg-muted/20' : 'cursor-default'}
                    ${isLastInRow ? 'border-r-0' : 'border-border'}
                    transition-all
                  `}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm ${day.isCurrentMonth
                          ? day.isToday
                            ? 'text-primary'
                            : 'text-foreground'
                          : 'text-muted-foreground'
                        }`}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.isCurrentMonth && day.hasOverride && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full" title="Special sittings on this date"></span>
                    )}
                  </div>

                  {/* Availability Status */}
                  {day.isCurrentMonth && day.isLoaded && (
                    <div className="mt-2">
                      {day.isOpen && day.slots.length > 0 ? (
                        <div className="space-y-0.5">
                          {day.slots.slice(0, MAX_SLOTS_IN_CELL).map((slot, i) => (
                            <div
                              key={`${slot.sitting_id}-${slot.start_time}-${i}`}
                              className="bg-green-500 rounded px-1.5 py-0.5 text-center"
                              title={`${slot.sitting_name}: ${formatTimeShort(slot.start_time)}-${formatTimeShort(slot.end_time)}`}
                            >
                              <div className="text-[10px] font-medium text-white leading-tight truncate">
                                {slot.sitting_name} {formatTimeShort(slot.start_time)}-{formatTimeShort(slot.end_time)}
                              </div>
                            </div>
                          ))}
                          {day.slots.length > MAX_SLOTS_IN_CELL && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{day.slots.length - MAX_SLOTS_IN_CELL} more
                            </div>
                          )}
                        </div>
                      ) : day.isOpen && day.openTime && day.closeTime ? (
                        <div className="bg-green-500 rounded px-1.5 py-1 text-center">
                          <div className="text-[10px] font-medium text-white leading-tight">
                            {formatTimeShort(day.openTime)}-{formatTimeShort(day.closeTime)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold text-red-600 text-center">
                          CLOSED
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <SittingsSection
          sittings={sittings}
          loading={sittingsLoading}
          loadError={sittingsError}
          onReload={handleSittingsChanged}
        />

        <OperatingHoursSection
          sittings={sittings}
          sittingsLoading={sittingsLoading}
          onSaved={loadMonth}
        />

        <HolidaysSection />
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-border max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground">
                  Edit Availability
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDay.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 hover:bg-muted/20 rounded transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Open/Closed Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">
                  Restaurant Status
                </span>
                <button
                  onClick={() => setEditIsOpen(!editIsOpen)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${editIsOpen
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                >
                  {editIsOpen ? 'Open' : 'Closed'}
                </button>
              </div>

              {/* Time Inputs (only if open) */}
              {editIsOpen && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={editOpenTime}
                      onChange={(e) => setEditOpenTime(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={editCloseTime}
                      onChange={(e) => setEditCloseTime(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted/20 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

            {/* Sittings on this date (one-off override of the weekly schedule) */}
            <div className="mt-5 pt-4 border-t border-border space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Sittings on this date</h4>
                  {dateHasOverride && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      SPECIAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dateHasOverride
                    ? 'This date uses special sittings instead of the weekly schedule.'
                    : 'Following the weekly schedule. Change the sittings below to set special sittings for this date only (e.g. Christmas Dinner).'}
                </p>
              </div>

              {dateSlotsLoading || sittingsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading sittings…</span>
                </div>
              ) : sittings.some((s) => s.is_active) ? (
                <SittingSlotsEditor
                  slots={dateSlots}
                  sittings={sittings}
                  onChange={setDateSlots}
                  disabled={savingDateSlots}
                  emptyText="No sittings — no bookings will be accepted on this date"
                />
              ) : (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  Add an active sitting in the Sittings section first.
                </p>
              )}

              <div className="flex items-center gap-3">
                {dateHasOverride && (
                  <button
                    onClick={handleResetDateSlots}
                    disabled={savingDateSlots || dateSlotsLoading}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use weekly schedule
                  </button>
                )}
                <button
                  onClick={handleSaveDateSlots}
                  disabled={savingDateSlots || dateSlotsLoading || sittingsLoading}
                  className="flex-1 px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingDateSlots ? 'Saving…' : 'Save sittings for this date'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}