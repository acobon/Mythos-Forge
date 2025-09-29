import React from 'react';
import { WorldEvent, CustomCalendar } from '../../../types';
import { formatWorldDate } from '../../../utils';
import { XIcon } from '../Icons';
import {
    TIMELINE_POPUP_MAX_CONTENT_HEIGHT_REM,
} from '../../../constants';
import TextWithReferences from '../TextWithReferences';
import { useAppSelector } from '../../../state/hooks';
import FocusTrap from 'focus-trap-react';

interface EventPopupProps {
    event: WorldEvent;
    onEventClick?: (eventId: string) => void;
    onClose: () => void;
    isSticky: boolean;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, onEventClick, onClose, isSticky }) => {
    const { calendar } = useAppSelector(state => state.bible.present.project);

    return (
        <FocusTrap active={isSticky}>
            <div className="bg-primary border border-border-color rounded-lg shadow-2xl p-3 w-full animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-text-main text-sm pr-2">{event.title}</h4>
                    {isSticky && (
                        <button onClick={onClose} className="p-0.5 rounded-full hover:bg-border-color flex-shrink-0" title="Close popup" aria-label="Close event details popup">
                            <XIcon className="w-4 h-4 text-text-secondary"/>
                        </button>
                    )}
                </div>
                <p className="text-xs text-text-secondary mb-2">{formatWorldDate(event.dateTime, calendar)}</p>
                <div 
                    className="text-xs text-text-secondary overflow-y-auto pr-1"
                    style={{ maxHeight: `${TIMELINE_POPUP_MAX_CONTENT_HEIGHT_REM}rem` }}
                >
                    {event.content ? (
                        <TextWithReferences text={event.content} onNavigate={() => {}} />
                    ) : (
                        "No description provided."
                    )}
                </div>
                {onEventClick && (
                    <button 
                        onClick={() => onEventClick(event.id)} 
                        className="mt-2 w-full text-center text-xs text-accent hover:underline"
                    >
                        View Details
                    </button>
                )}
            </div>
        </FocusTrap>
    );
};

export default EventPopup;