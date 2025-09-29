// state/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { bibleReducer as rootBibleReducer } from './bibleReducer';
import uiReducer from './uiSlice';
import { StoryBible } from '../types/index';
import * as idbService from '../services/idbService';
import { defaultStoryBible } from '../data/defaults';
import { persistenceMiddleware } from './persistenceMiddleware';
import { loadInitialData } from './actions';
import { withHistory } from './history';

const bibleReducer = withHistory(rootBibleReducer);

export const store = configureStore({
  reducer: {
    bible: bibleReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredPaths: ['ui.dialogState.onConfirm', 'ui.dialogState.onClose', 'ui.dialogState.actions', 'ui.modalStack'],
    },
  }).concat(persistenceMiddleware),
});

export { loadInitialData };


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;