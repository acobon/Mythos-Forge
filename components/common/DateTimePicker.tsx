import React, { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { timeZoneOffsets, getWorldDateFromISO, getISOFromWorldDate, getDaysInMonth, formatWorldDate } from '../../utils';
import { CustomCalendar, WorldDate } from '../../types/index';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { useI18n } from '../../hooks/useI18n';
import { useAppSelector } from '../../state/hooks';
import { Input, Select } from './ui';

interface DateTimePickerProps {
  label: string;
  value: string; // ISO string
  onChange: (value: string) => void;
  error?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, error }) => {
  const { t } = useI18n();
  const { calendar: effectiveCalendar } = useAppSelector(state => state.bible.present.project);
  
  const [isOpen, setIsOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState<WorldDate | null>(null);
  const wrapperRef = useRef<HTMLFieldSetElement>(null);
  const uniqueId = useId();

  const isCalendarValid = useMemo(() => 
    effectiveCalendar && effectiveCalendar.months && effectiveCalendar.months.length > 0 && effectiveCalendar.daysOfWeek && effectiveCalendar.daysOfWeek.length > 0, 
  [effectiveCalendar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && !pickerDate) {
      try {
        const initialDate = value ? getWorldDateFromISO(value, effectiveCalendar) : getWorldDateFromISO(effectiveCalendar.presentDate, effectiveCalendar);
        setPickerDate(initialDate);
      } catch (e) {
        console.error("Could not initialize date picker:", e);
        if (isCalendarValid) {
          setPickerDate({
            year: 1, monthIndex: 0, day: 1, hour: 12, minute: 0, offset: '+00:00',
            month: effectiveCalendar.months[0], dayOfWeek: effectiveCalendar.daysOfWeek[0]
          });
        }
      }
    } else if (!isOpen) {
        setPickerDate(null); // Reset when closed
    }
  }, [isOpen, value, effectiveCalendar, isCalendarValid, pickerDate]);

  const handleDateUpdate = useCallback((newDate: WorldDate) => {
    try {
      const newISO = getISOFromWorldDate(newDate, effectiveCalendar);
      if (newISO !== value) {
        onChange(newISO);
      }
      setPickerDate(newDate);
    } catch (e) { console.error("Error generating ISO from picker", e); }
  }, [effectiveCalendar, onChange, value]);
  
  const handleDayClick = (day: number) => {
    if (!pickerDate) return;
    const newDate = { ...pickerDate, day };
    handleDateUpdate(newDate);
    setIsOpen(false);
  };
  
  const handleMonthChange = (direction: 1 | -1) => {
    if (!pickerDate) return;
    let newMonthIndex = pickerDate.monthIndex + direction;
    let newYear = pickerDate.year;

    if (newMonthIndex < 0) {
        newMonthIndex = effectiveCalendar.months.length - 1;
        newYear -= 1;
    } else if (newMonthIndex >= effectiveCalendar.months.length) {
        newMonthIndex = 0;
        newYear += 1;
    }
    setPickerDate(prev => prev ? ({ ...prev, year: newYear, monthIndex: newMonthIndex, month: effectiveCalendar.months[newMonthIndex] }) : null);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pickerDate) return;
    const [hour, minute] = e.target.value.split(':').map(p => parseInt(p, 10));
    handleDateUpdate({ ...pickerDate, hour: isNaN(hour) ? 0 : hour, minute: isNaN(minute) ? 0 : minute });
  };
  
  const handleOffsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if(!pickerDate) return;
      handleDateUpdate({ ...pickerDate, offset: e.target.value });
  };

  const formattedValue = useMemo(() => {
    if (!value || !isCalendarValid) return '';
    try {
      return formatWorldDate(value, effectiveCalendar, { year: true, month: true, day: true, time: true });
    } catch {
      return t('date.invalid');
    }
  }, [value, effectiveCalendar, isCalendarValid, t]);
  
  const calendarGrid = useMemo(() => {
    if (!pickerDate || !isCalendarValid) return { grid: [], monthName: '', year: '' };
    const { year, monthIndex } = pickerDate;
    const month = effectiveCalendar.months[monthIndex];
    const daysInMonth = getDaysInMonth(monthIndex, year, effectiveCalendar);
    let firstDayOfWeekIndex = 0;
    try {
      const firstDayWorldDate = { ...pickerDate, day: 1 };
      const firstDayIso = getISOFromWorldDate(firstDayWorldDate, effectiveCalendar);
      const resolvedFirstDay = getWorldDateFromISO(firstDayIso, effectiveCalendar);
      firstDayOfWeekIndex = effectiveCalendar.daysOfWeek.indexOf(resolvedFirstDay.dayOfWeek || effectiveCalendar.daysOfWeek[0]);
    } catch(e) { /* fallback to 0 */ }
    
    const grid: (number | null)[] = Array(firstDayOfWeekIndex).fill(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    return { grid, monthName: month.name, year };
  }, [pickerDate, effectiveCalendar, isCalendarValid]);

  if (!isCalendarValid) {
    return (
        <fieldset>
            <legend className="block text-sm font-medium text-text-secondary">{label}</legend>
            <div className="mt-1 p-2 bg-primary border border-border-color rounded-md text-sm text-text-secondary">
                {t('date.notConfigured')}
            </div>
        </fieldset>
    );
  }

  return (
    <fieldset ref={wrapperRef} className="relative" aria-describedby={error ? `${uniqueId}-error` : undefined}>
      <legend className="block text-sm font-medium text-text-secondary">{label}</legend>
      <Input
        type="text"
        readOnly
        value={formattedValue || t('date.select')}
        onClick={() => setIsOpen(p => !p)}
        className="cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        error={!!error}
      />
      {isOpen && pickerDate && (
        <div 
            className="absolute top-full left-0 mt-2 w-80 bg-secondary border border-border-color rounded-lg shadow-2xl p-3 z-20 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={t('date.picker.title')}
        >
          <div className="flex justify-between items-center mb-3">
            <button type="button" onClick={() => handleMonthChange(-1)} className="p-1 rounded-full hover:bg-border-color" aria-label={t('date.picker.prevMonth')}><ArrowLeftIcon className="w-5 h-5"/></button>
            <span className="font-semibold text-text-main">{calendarGrid.monthName} {calendarGrid.year}</span>
            <button type="button" onClick={() => handleMonthChange(1)} className="p-1 rounded-full hover:bg-border-color" aria-label={t('date.picker.nextMonth')}><ArrowRightIcon className="w-5 h-5"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary mb-2">
            {effectiveCalendar.daysOfWeek.map(day => <div key={day} className="font-semibold">{day.slice(0, 2)}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.grid.map((day, i) => (
                <div key={i} className="flex justify-center items-center">
                {day ? (
                    <button 
                        type="button" 
                        onClick={() => handleDayClick(day)}
                        className={`w-8 h-8 rounded-full text-sm transition-colors ${
                            day === pickerDate.day 
                                ? 'bg-accent text-white font-bold' 
                                : 'hover:bg-border-color'
                        }`}
                    >
                        {day}
                    </button>
                ) : <div />}
                </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-color">
            <Input
                type="time"
                value={`${String(pickerDate.hour).padStart(2, '0')}:${String(pickerDate.minute).padStart(2, '0')}`}
                onChange={handleTimeChange}
                className="!text-sm"
                aria-label={t('common.time')}
            />
            <Select
                value={pickerDate.offset}
                onChange={handleOffsetChange}
                className="!text-sm"
                aria-label={t('common.timezone')}
            >
              {timeZoneOffsets.map(offset => <option key={offset} value={offset}>UTC {offset}</option>)}
            </Select>
          </div>
        </div>
      )}
      {error && <p id={`${uniqueId}-error`} className="text-red-400 text-xs mt-2">{error}</p>}
    </fieldset>
  );
};