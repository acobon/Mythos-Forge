
// state/slices/projectSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoryBible, CustomCalendar, MapLayer, TrashedItem } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { removeItem } from '../actions';

interface ProjectState {
    title: string;
    trash: TrashedItem[];
    calendar: CustomCalendar;
    writingGoals: StoryBible['writingGoals'];
    scratchpad: string;
    map: StoryBible['map'];
    writingHistory: StoryBible['writingHistory'];
}

const initialState: ProjectState = {
    title: defaultStoryBible.title,
    trash: defaultStoryBible.trash,
    calendar: defaultStoryBible.calendar,
    writingGoals: defaultStoryBible.writingGoals,
    scratchpad: defaultStoryBible.scratchpad,
    map: defaultStoryBible.map,
    writingHistory: defaultStoryBible.writingHistory,
};

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        updateTitle: (state, action: PayloadAction<string>) => {
            state.title = action.payload;
        },
        updateCalendar: (state, action: PayloadAction<CustomCalendar>) => {
            state.calendar = action.payload;
        },
        updateWritingGoals: (state, action: PayloadAction<StoryBible['writingGoals']>) => {
            state.writingGoals = action.payload;
        },
        updateScratchpad: (state, action: PayloadAction<string>) => {
            state.scratchpad = action.payload;
        },
        updateMapLayers: (state, action: PayloadAction<{ layers: MapLayer[]; baseLayerId: string | null }>) => {
            state.map.layers = action.payload.layers;
            state.map.baseLayerId = action.payload.baseLayerId;
        },
        restoreFromTrash: (state, action: PayloadAction<{ item: TrashedItem; index: number }>) => {
            state.trash.splice(action.payload.index, 1);
        },
        removeFromTrash: (state, action: PayloadAction<number>) => {
            state.trash.splice(action.payload, 1);
        },
        emptyTrash: (state) => {
            state.trash = [];
        },
    },
    extraReducers: (builder) => {
        builder.addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
            state.trash.push(action.payload);
        });
    }
});

export const { 
    updateTitle, 
    updateCalendar, 
    updateWritingGoals, 
    updateScratchpad, 
    updateMapLayers,
    restoreFromTrash,
    removeFromTrash,
    emptyTrash,
} = projectSlice.actions;

export default projectSlice.reducer;
