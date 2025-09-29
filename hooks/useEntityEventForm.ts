import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { Entity, EntityId, HistoricalEvent, FormField, EntityType, StoryBible, InvolvedEntity, EventGroup, Attributes } from '../types';
import { getEventDefinition } from '../data/event-definitions';
import { useConfirmationDialog } from './useConfirmationDialog';
import { useI18n } from './useI18n';

// --- State and Reducer for the Form ---

interface FormState {
    type: string;
    startDateTime: string;
    isOngoing: boolean;
    endDateTime: string;
    notes: string;
    formSchema: FormField[];
    formData: Attributes;
    primaryEntityRoleField: string;
}

type FormAction =
    | { type: 'RESET'; payload: { defaultType: string, defaultDateTime: string } }
    | { type: 'LOAD_EVENT'; payload: { event: HistoricalEvent; schema: FormField[], primaryRole: string } }
    | { type: 'SET_SCHEMA'; payload: { schema: FormField[]; primaryRole: string; defaultDateTime: string } }
    | { type: 'UPDATE_FIELD', payload: { fieldName: string; value: any } }
    | { type: 'SET_START_DATE_TIME', payload: string }
    | { type: 'SET_END_DATE_TIME', payload: string }
    | { type: 'SET_IS_ONGOING', payload: boolean }
    | { type: 'SET_NOTES', payload: string }
    | { type: 'SET_PRIMARY_ROLE', payload: { newRole: string } }
    | { type: 'SET_TYPE', payload: string };

const entityTypeStrings: string[] = [EntityType.CHARACTER, EntityType.LOCATION, EntityType.OBJECT, EntityType.ORGANIZATION];
    
const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'RESET':
             return {
                ...state,
                type: action.payload.defaultType,
                startDateTime: action.payload.defaultDateTime,
                isOngoing: false,
                endDateTime: action.payload.defaultDateTime,
                notes: '',
                formSchema: [],
                formData: {},
                primaryEntityRoleField: '',
            };
        case 'LOAD_EVENT': {
            const loadedFormData: Attributes = { ...action.payload.event.details };
             // Pre-fill role data from involvedEntities
             action.payload.schema.forEach(field => {
                if (entityTypeStrings.includes(field.fieldType)) {
                    const involvement = action.payload.event.involvedEntities.find(
                        inv => inv.entityId === loadedFormData[field.fieldName]
                    );
                    if (involvement) {
                         loadedFormData[`${field.fieldName}_role`] = involvement.role;
                    } else if(field.role) {
                         loadedFormData[`${field.fieldName}_role`] = field.role;
                    }
                }
            });

            return {
                ...state,
                type: action.payload.event.type,
                startDateTime: action.payload.event.startDateTime,
                isOngoing: !!action.payload.event.endDateTime,
                endDateTime: action.payload.event.endDateTime || action.payload.event.startDateTime,
                notes: action.payload.event.notes || '',
                formSchema: action.payload.schema,
                formData: loadedFormData,
                primaryEntityRoleField: action.payload.primaryRole,
            };
        }
        case 'SET_SCHEMA': {
            const initialFormData: Attributes = {};
            action.payload.schema.forEach(field => {
                if(entityTypeStrings.includes(field.fieldType) && field.role){
                    initialFormData[`${field.fieldName}_role`] = field.role;
                }
            });

             return {
                ...state,
                startDateTime: action.payload.defaultDateTime,
                isOngoing: false,
                endDateTime: action.payload.defaultDateTime,
                notes: '',
                formSchema: action.payload.schema,
                formData: initialFormData,
                primaryEntityRoleField: action.payload.primaryRole,
            };
        }
        case 'SET_TYPE':
            return { ...state, type: action.payload };
        case 'UPDATE_FIELD':
            return { ...state, formData: { ...state.formData, [action.payload.fieldName]: action.payload.value } };
        case 'SET_START_DATE_TIME': {
            const newState = { ...state, startDateTime: action.payload };
            if (newState.isOngoing && new Date(newState.endDateTime) < new Date(newState.startDateTime)) {
                newState.endDateTime = newState.startDateTime;
            }
            return newState;
        }
        case 'SET_END_DATE_TIME': {
            const newEndDateTime = action.payload;
            if (new Date(newEndDateTime) < new Date(state.startDateTime)) {
                return { ...state, endDateTime: state.startDateTime };
            }
            return { ...state, endDateTime: newEndDateTime };
        }
        case 'SET_IS_ONGOING': {
            const newState = { ...state, isOngoing: action.payload };
            if (newState.isOngoing && new Date(newState.endDateTime) < new Date(newState.startDateTime)) {
                newState.endDateTime = newState.startDateTime;
            }
            return newState;
        }
        case 'SET_NOTES':
            return { ...state, notes: action.payload };
        case 'SET_PRIMARY_ROLE': {
            const { newRole } = action.payload;
            const oldRole = state.primaryEntityRoleField;

            if (newRole === oldRole) {
                return state;
            }

            const newData = { ...state.formData };
            
            // Swap values between the old and new primary role fields
            const valueInOldField = newData[oldRole];
            const valueInNewField = newData[newRole];
            
            newData[oldRole] = valueInNewField;
            newData[newRole] = valueInOldField;
            
            return { ...state, formData: newData, primaryEntityRoleField: newRole };
        }
        default:
            return state;
    }
}

// The custom hook
export const useEntityEventForm = (
    entity: Entity,
    eventToEdit: HistoricalEvent | null | undefined,
    storyBible: StoryBible,
    eventGroups: EventGroup[]
) => {
    const showConfirmDialog = useConfirmationDialog();
    const { t } = useI18n();

    const defaultDateTime = useMemo(() => new Date().toISOString(), []);
    const defaultEventType = useMemo(() => eventGroups[0]?.events[0]?.key || 'OTHER', [eventGroups]);

    const [state, dispatch] = useReducer(formReducer, {
        type: eventToEdit?.type || defaultEventType,
        startDateTime: eventToEdit?.startDateTime || defaultDateTime,
        isOngoing: !!eventToEdit?.endDateTime,
        endDateTime: eventToEdit?.endDateTime || defaultDateTime,
        notes: eventToEdit?.notes || '',
        formSchema: [],
        formData: eventToEdit?.details || {},
        primaryEntityRoleField: '',
    });

    // Effect to load form state when `eventToEdit` changes or for a new event.
    useEffect(() => {
        if (eventToEdit) {
            const eventDef = getEventDefinition(storyBible.customEventSchemas, eventToEdit.type, t);
            const roleFieldSchema = eventDef.schema.find(f => f.primaryEntityRoleFields);
            let primaryRole = '';
            if (roleFieldSchema?.primaryEntityRoleFields) {
                 primaryRole = roleFieldSchema.primaryEntityRoleFields.find(rf => eventToEdit.details[rf] === entity.id) || '';
            }
            dispatch({ type: 'LOAD_EVENT', payload: { event: eventToEdit, schema: eventDef.schema, primaryRole } });
        } else {
            // This is a new event, reset the form.
            dispatch({ type: 'RESET', payload: { defaultType: defaultEventType, defaultDateTime } });
        }
    }, [eventToEdit, entity.id, storyBible.customEventSchemas, defaultEventType, defaultDateTime, t]);


    // Effect to update schema and primary role when event TYPE changes
    useEffect(() => {
        if (!state.type) return;
        if (eventToEdit && eventToEdit.type === state.type) return; // Already handled by LOAD_EVENT

        const eventDef = getEventDefinition(storyBible.customEventSchemas, state.type, t);
        const schema = eventDef.schema;
        
        let primaryRole = '';
        
        const roleFieldSchema = schema.find(f => f.primaryEntityRoleFields);
        if (roleFieldSchema?.primaryEntityRoleFields && roleFieldSchema.primaryEntityRoleFields.length > 0) {
            primaryRole = roleFieldSchema.primaryEntityRoleFields[0];
        }
        dispatch({ type: 'SET_SCHEMA', payload: { schema, primaryRole, defaultDateTime } });
        if(primaryRole) {
            dispatch({ type: 'UPDATE_FIELD', payload: { fieldName: primaryRole, value: entity.id } });
        }
    }, [state.type, entity.id, eventToEdit, storyBible.customEventSchemas, defaultDateTime, t]);
    
    const handleTypeChange = (newType: string) => {
        dispatch({ type: 'SET_TYPE', payload: newType });
    };

    const handlePrimaryRoleChange = useCallback((newRoleField: string) => {
        dispatch({ type: 'SET_PRIMARY_ROLE', payload: { newRole: newRoleField } });
    }, []);

    const getSubmitData = (): {
        type: string;
        startDateTime: string;
        endDateTime?: string;
        notes: string;
        details: Attributes;
        involvedEntities: InvolvedEntity[];
    } | { error: string } => {
        const { startDateTime, isOngoing, endDateTime, notes, formSchema, formData, type } = state;

        if (isOngoing && endDateTime && new Date(endDateTime) < new Date(startDateTime)) {
            return { error: "End date cannot be before start date." };
        }
        const finalEndDateTime = isOngoing ? endDateTime : undefined;

        const detailsToSave: Attributes = {};
        
        const involvedMap = new Map<EntityId, Set<string>>();
        const addRole = (id: EntityId, role: string) => {
            if (!id || !role || !role.trim()) return;
            if (!involvedMap.has(id)) involvedMap.set(id, new Set());
            involvedMap.get(id)!.add(role.trim());
        };
        
        formSchema.forEach(field => {
            const value = formData[field.fieldName];
            if (value !== undefined) {
                if (entityTypeStrings.includes(field.fieldType)) {
                     // This is an entity link. The value is the ID.
                    const role = formData[`${field.fieldName}_role`] as string || field.role;
                    if(value) {
                       addRole(value as EntityId, role || 'Participant');
                       detailsToSave[field.fieldName] = value as string; // Save only the ID in details
                    }
                } else {
                    // This is a regular field (text, textarea, date).
                    detailsToSave[field.fieldName] = value;
                }
            }
        });

        // Ensure the primary entity is included, even if not explicitly in a field
        if (![...involvedMap.keys()].includes(entity.id)) {
            addRole(entity.id, 'Participant');
        }

        const finalInvolvedEntities: InvolvedEntity[] = Array.from(involvedMap.entries()).map(([entityId, roles]) => ({ entityId, role: Array.from(roles).join(', ') }));
        
        return { type, startDateTime: startDateTime, endDateTime: finalEndDateTime, notes, details: detailsToSave, involvedEntities: finalInvolvedEntities };
    }

    return {
        state,
        dispatch,
        handleTypeChange,
        handlePrimaryRoleChange,
        getSubmitData
    };
};
