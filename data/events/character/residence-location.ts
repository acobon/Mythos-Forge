import type { EventOption } from '../../../types/index';

export const characterResidenceEvents: EventOption[] = [
    { "key": "MOVED", "label": "Moved to a New Residence" },
    { "key": "BOUGHT_HOME", "label": "Bought First Home" },
    { "key": "LOST_HOME", "label": "Lost Home (Disaster/Foreclosure)" },
    { "key": "BECAME_HOMELESS", "label": "Became Homeless" },
    { "key": "IMMIGRATED", "label": "Immigrated to a New Country" },
    { "key": "BECAME_REFUGEE", "label": "Became a Refugee/Asylum Seeker" }
];