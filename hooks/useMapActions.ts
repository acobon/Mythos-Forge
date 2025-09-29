

import { useCallback } from 'react';
import { MapLayer } from '../types';
import { useAppDispatch } from '../state/hooks';
import { updateMapLayers as updateMapLayersAction } from '../state/slices/projectSlice';

export const useMapActions = () => {
    const dispatch = useAppDispatch();

    const updateMapLayers = useCallback((layers: MapLayer[], baseLayerId: string | null) => {
        dispatch(updateMapLayersAction({ layers, baseLayerId }));
    }, [dispatch]);

    return { updateMapLayers };
};