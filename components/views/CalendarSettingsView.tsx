import React, { useState, useReducer, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { updateCalendar } from '../../state/slices/projectSlice';
import { CustomCalendar, WorldEra, WorldMonth } from '../../types/index';
import { PlusCircleIcon, TrashIcon } from '../common/Icons';
import { DateTimePicker } from '../common/DateTimePicker';
import { formatWorldDate } from '../../utils';
import { Input, Button, Select } from '../common/ui';

type CalendarState = CustomCalendar;

type CalendarAction =
  | { type: 'SET_STATE'; payload: CustomCalendar }
  | { type: 'SET_EPOCH'; payload: number }
  | { type: 'SET_PRESENT_DATE'; payload: string }
  | { type: 'ADD_ERA' }
  | { type: 'UPDATE_ERA'; payload: { index: number; era: Partial<WorldEra> } }
  | { type: 'REMOVE_ERA'; payload: number }
  | { type: 'ADD_MONTH' }
  | { type: 'UPDATE_MONTH'; payload: { index: number; month: Partial<WorldMonth> } }
  | { type: 'REMOVE_MONTH'; payload: number }
  | { type: 'ADD_DAY_OF_WEEK' }
  | { type: 'UPDATE_DAY_OF_WEEK'; payload: { index: number; name: string } }
  | { type: 'REMOVE_DAY_OF_WEEK'; payload: number }
  | { type: 'SET_LEAP_DAY_MONTH_INDEX'; payload: number };

const calendarReducer = (state: CalendarState, action: CalendarAction): CalendarState => {
    switch (action.type) {
        case 'SET_STATE': return action.payload;
        case 'SET_EPOCH': return { ...state, epochYear: action.payload };
        case 'SET_PRESENT_DATE': return { ...state, presentDate: action.payload };
        case 'ADD_ERA': return { ...state, eras: [...state.eras, { name: 'New Era', startYear: (state.eras[state.eras.length - 1]?.startYear || 0) + 1000 }] };
        case 'UPDATE_ERA': return { ...state, eras: state.eras.map((era, i) => i === action.payload.index ? { ...era, ...action.payload.era } : era) };
        case 'REMOVE_ERA': return { ...state, eras: state.eras.filter((_, i) => i !== action.payload) };
        case 'ADD_MONTH': return { ...state, months: [...state.months, { name: 'New Month', days: 30 }] };
        case 'UPDATE_MONTH': return { ...state, months: state.months.map((month, i) => i === action.payload.index ? { ...month, ...action.payload.month } : month) };
        case 'REMOVE_MONTH': return { ...state, months: state.months.filter((_, i) => i !== action.payload) };
        case 'ADD_DAY_OF_WEEK': return { ...state, daysOfWeek: [...state.daysOfWeek, 'Newday'] };
        case 'UPDATE_DAY_OF_WEEK': return { ...state, daysOfWeek: state.daysOfWeek.map((day, i) => i === action.payload.index ? action.payload.name : day) };
        case 'REMOVE_DAY_OF_WEEK': return { ...state, daysOfWeek: state.daysOfWeek.filter((_, i) => i !== action.payload) };
        case 'SET_LEAP_DAY_MONTH_INDEX': return { ...state, leapDayMonthIndex: action.payload };
        default: return state;
    }
};

const CalendarSettingsView = () => {
    const dispatch = useAppDispatch();
    const { calendar } = useAppSelector(state => state.bible.present.project);
    const [draft, localDispatch] = useReducer(calendarReducer, calendar);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [previewDate, setPreviewDate] = useState(new Date().toISOString().split('T')[0]);

    const previewFormattedDate = useMemo(() => {
        try {
            const iso = new Date(previewDate).toISOString();
            return formatWorldDate(iso, draft);
        } catch {
            return "Invalid Date or Calendar Setting";
        }
    }, [previewDate, draft]);

    useEffect(() => {
        localDispatch({ type: 'SET_STATE', payload: calendar });
    }, [calendar]);
    
    const handleSave = () => {
        setSaveStatus('saving');
        dispatch(updateCalendar(draft));
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    const safeParseInt = (value: string, fallback: number): number => {
        const num = parseInt(value, 10);
        return isNaN(num) ? fallback : num;
    };

    const handleMonthDaysChange = (index: number, value: string) => {
        localDispatch({
            type: 'UPDATE_MONTH',
            payload: {
                index,
                month: { days: Math.max(1, safeParseInt(value, 1)) }
            }
        });
    };
    
    const handleDayNameChange = (index: number, name: string) => {
        localDispatch({ type: 'UPDATE_DAY_OF_WEEK', payload: { index, name } });
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Calendar Settings</h2>
                    <p className="text-text-secondary mt-1">Define the timekeeping system for your world.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'saving' ? 'Saving...' : (saveStatus === 'saved' ? 'Saved!' : 'Save Changes')}
                </Button>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                {/* Main Settings Column */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Core Settings</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="epoch-year" className="block text-sm font-medium text-text-secondary">Epoch Year</label>
                                <Input id="epoch-year" type="number" value={draft.epochYear} onChange={e => localDispatch({ type: 'SET_EPOCH', payload: safeParseInt(e.target.value, 1) })} className="mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Present Date</label>
                                <DateTimePicker label="" value={draft.presentDate} onChange={v => localDispatch({ type: 'SET_PRESENT_DATE', payload: v })} />
                            </div>
                         </div>
                    </section>

                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Eras</h3>
                        <div className="space-y-2">
                            {draft.eras.map((era, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input type="text" value={era.name} onChange={e => localDispatch({ type: 'UPDATE_ERA', payload: { index, era: { name: e.target.value } } })} placeholder="Era Name" />
                                    <Input type="number" value={era.startYear} onChange={e => localDispatch({ type: 'UPDATE_ERA', payload: { index, era: { startYear: safeParseInt(e.target.value, 1) } } })} placeholder="Start Year" />
                                    {draft.eras.length > 1 && <Button variant="ghost" size="icon" onClick={() => localDispatch({ type: 'REMOVE_ERA', payload: index })}><TrashIcon className="w-4 h-4" /></Button>}
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => localDispatch({ type: 'ADD_ERA' })}><PlusCircleIcon className="w-4 h-4 mr-1"/> Add Era</Button>
                        </div>
                    </section>

                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Months of the Year ({draft.months.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                             {draft.months.map((month, index) => (
                                <div key={index} className="relative group">
                                    <Input type="text" value={month.name} onChange={e => localDispatch({ type: 'UPDATE_MONTH', payload: { index, month: { name: e.target.value } } })} className="mb-1" />
                                    <Input type="number" value={month.days} onChange={e => handleMonthDaysChange(index, e.target.value)} />
                                    <Button variant="ghost" size="icon" onClick={() => localDispatch({ type: 'REMOVE_MONTH', payload: index })} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => localDispatch({ type: 'ADD_MONTH' })} className="mt-3"><PlusCircleIcon className="w-4 h-4 mr-1"/> Add Month</Button>
                         <div className="mt-4">
                            <label htmlFor="leap-month" className="block text-sm font-medium text-text-secondary">Leap Day Month</label>
                             <Select id="leap-month" value={draft.leapDayMonthIndex} onChange={e => localDispatch({ type: 'SET_LEAP_DAY_MONTH_INDEX', payload: Number(e.target.value) })} className="mt-1">
                                {draft.months.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                            </Select>
                        </div>
                    </section>
                     <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Days of the Week ({draft.daysOfWeek.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {draft.daysOfWeek.map((day, index) => (
                                <div key={index} className="relative group">
                                    <Input type="text" value={day} onChange={e => handleDayNameChange(index, e.target.value)} />
                                    <Button variant="ghost" size="icon" onClick={() => localDispatch({ type: 'REMOVE_DAY_OF_WEEK', payload: index })} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => localDispatch({ type: 'ADD_DAY_OF_WEEK' })} className="mt-3"><PlusCircleIcon className="w-4 h-4 mr-1"/> Add Day</Button>
                    </section>
                </div>

                {/* Preview Column */}
                <div className="space-y-4">
                     <section className="bg-secondary p-4 rounded-lg border border-border-color sticky top-4">
                        <h3 className="text-xl font-semibold mb-3">Date Preview</h3>
                        <Input type="date" value={previewDate} onChange={e => setPreviewDate(e.target.value)} className="w-full" />
                        <div className="mt-3 text-center bg-primary p-3 rounded-md border border-border-color">
                            <p className="text-lg font-bold">{previewFormattedDate}</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CalendarSettingsView;