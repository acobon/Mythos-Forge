import React from 'react';
import { LocationEntity } from '../../../types';
import { useNavigation } from '../../../hooks/useNavigation';
import { MapPinIcon } from '../../common/Icons';
import { useI18n } from '../../../hooks/useI18n';

const MapPosition: React.FC<{ entity: LocationEntity }> = ({ entity }) => {
    const { navigateToView } = useNavigation();
    const { t } = useI18n();
    const { mapCoordinates } = entity;

    const goToMap = () => {
        navigateToView('map');
        // The map view can use the selectedId from UI state to focus on this entity.
    };

    return (
        <section>
            <h3 className="text-xl font-semibold">{t('locationDetail.map.title')}</h3>
            <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color flex items-center justify-between">
                {mapCoordinates ? (
                    <div>
                        <span className="text-sm font-semibold text-text-secondary">{t('locationDetail.map.positionSet')}</span>
                        <p className="text-text-main font-mono text-sm">X: {mapCoordinates.x.toFixed(2)}%, Y: {mapCoordinates.y.toFixed(2)}%</p>
                    </div>
                ) : (
                    <p className="text-text-secondary">{t('locationDetail.map.notPlaced')}</p>
                )}
                <button onClick={goToMap} className="px-3 py-1 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {mapCoordinates ? t('locationDetail.map.adjust') : t('locationDetail.map.place')}
                </button>
            </div>
        </section>
    );
};

export default MapPosition;
