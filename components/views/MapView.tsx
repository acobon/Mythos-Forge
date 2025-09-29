import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useEntityActions } from '../../hooks/useEntityActions';
import { LocationEntity, EntityType, MapLayer, Entity } from '../../types/index';
import { MapPinIcon, UploadIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon, PlusCircleIcon, TrashIcon, EyeIcon, EyeOffIcon } from '../common/Icons';
import { useMapActions } from '../../hooks/useMapActions';
import { generateId, getTypedObjectValues } from '../../utils';
import { useNavigation } from '../../hooks/useNavigation';
import { useStoredImage } from '../../hooks/useStoredImage';
import * as idbService from '../../services/idbService';
import { useAppSelector } from '../../state/hooks';

const MapManager: React.FC<{
    layers: MapLayer[];
    baseLayerId: string | null;
    onUpdateLayers: (layers: MapLayer[], newBaseId: string | null) => void;
}> = ({ layers, baseLayerId, onUpdateLayers }) => {

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const imageId = generateId('map-img');
                    try {
                        await idbService.saveImage(imageId, file);
                        const newLayer: MapLayer = {
                            id: generateId('map-layer'),
                            name: file.name.replace(/\.[^/.]+$/, ""),
                            image: imageId,
                            width: img.width,
                            height: img.height,
                            isVisible: true,
                        };
                        const newLayers = [...layers, newLayer];
                        onUpdateLayers(newLayers, baseLayerId || newLayer.id);
                    } catch (err) {
                        console.error("Failed to save map image", err);
                    }
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleVisibility = (id: string) => {
        const newLayers = layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l);
        onUpdateLayers(newLayers, baseLayerId);
    };
    
    const deleteLayer = async (id: string) => {
        const layerToDelete = layers.find(l => l.id === id);
        if (layerToDelete) {
            await idbService.deleteImage(layerToDelete.image);
        }
        const newLayers = layers.filter(l => l.id !== id);
        const newBaseId = (baseLayerId === id) ? (newLayers[0]?.id || null) : baseLayerId;
        onUpdateLayers(newLayers, newBaseId);
    };

    const setAsBaseLayer = (id: string) => {
        onUpdateLayers(layers, id);
    };

    return (
        <div className="absolute top-4 left-4 z-10 w-64 bg-secondary/80 backdrop-blur-sm p-3 rounded-lg border border-border-color shadow-lg">
            <h3 className="font-bold text-text-main mb-2">Map Layers</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {layers.map(layer => (
                    <div key={layer.id} className={`p-2 rounded-md group ${baseLayerId === layer.id ? 'bg-primary' : 'bg-secondary'}`}>
                        <div className="flex items-center justify-between">
                            <span onClick={() => setAsBaseLayer(layer.id)} className={`text-sm cursor-pointer ${layer.isVisible ? 'text-text-main' : 'text-text-secondary line-through'}`}>{layer.name}</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => toggleVisibility(layer.id)}>{layer.isVisible ? <EyeIcon className="w-4 h-4 text-text-secondary"/> : <EyeOffIcon className="w-4 h-4 text-text-secondary"/>}</button>
                                {layers.length > 1 && <button onClick={() => deleteLayer(layer.id)}><TrashIcon className="w-4 h-4 text-text-secondary hover:text-red-500"/></button>}
                            </div>
                        </div>
                        {baseLayerId === layer.id && <div className="text-xs text-accent mt-1">Base Layer for Pins</div>}
                    </div>
                ))}
            </div>
            <label className="cursor-pointer mt-3 w-full text-sm px-3 py-1.5 font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center justify-center">
                <PlusCircleIcon className="w-4 h-4 mr-2" /> Add Layer
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
        </div>
    );
};

const StoredMapImage: React.FC<{ layer: MapLayer; zIndex: number }> = ({ layer, zIndex }) => {
    const imageUrl = useStoredImage(layer.image);
    if (!imageUrl) return null;
    return <img src={imageUrl} className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex }} alt={layer.name} />;
};


const MapView: React.FC = () => {
    const map = useAppSelector(state => state.bible.present.project.map);
    const entities = useAppSelector(state => state.bible.present.entities.entities);
    const { selectedId } = useAppSelector(state => state.ui);
    const { updateEntity } = useEntityActions();
    const { updateMapLayers } = useMapActions();
    const { navigateToEntity } = useNavigation();

    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const locations = useMemo(() => 
        (getTypedObjectValues(entities) as Entity[]).filter(e => e.type === EntityType.LOCATION) as LocationEntity[],
        [entities]
    );

    const baseLayer = useMemo(() => map.layers.find(l => l.id === map.baseLayerId), [map]);

    const handleUpdateLayers = (layers: MapLayer[], newBaseId: string | null) => {
        updateMapLayers(layers, newBaseId);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const scaleAmount = 0.1;
        const newScale = e.deltaY > 0 ? view.scale * (1 - scaleAmount) : view.scale * (1 + scaleAmount);
        setView(v => ({...v, scale: Math.max(0.1, Math.min(5, newScale))}));
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggingMarker || (e.target as HTMLElement).closest('.absolute.z-10')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setView(v => ({ ...v, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleMarkerDragStart = (e: React.MouseEvent<HTMLDivElement>, entityId: string) => {
        e.stopPropagation();
        setDraggingMarker(entityId);
    };

    const handleMarkerDrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!draggingMarker || !mapContainerRef.current || !baseLayer) return;
        
        const rect = mapContainerRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const imageWidth = baseLayer.width;
        const imageHeight = baseLayer.height;

        const containerAspect = containerWidth / containerHeight;
        const imageAspect = imageWidth / imageHeight;

        let renderedWidth, renderedHeight, offsetX, offsetY;

        if (imageAspect > containerAspect) {
            renderedWidth = containerWidth;
            renderedHeight = containerWidth / imageAspect;
            offsetX = 0;
            offsetY = (containerHeight - renderedHeight) / 2;
        } else {
            renderedHeight = containerHeight;
            renderedWidth = containerHeight * imageAspect;
            offsetY = 0;
            offsetX = (containerWidth - renderedWidth) / 2;
        }
        
        const pointerX = (e.clientX - rect.left - view.x) / view.scale;
        const pointerY = (e.clientY - rect.top - view.y) / view.scale;

        const imageX = pointerX - offsetX;
        const imageY = pointerY - offsetY;
        
        let xPercent = (imageX / renderedWidth) * 100;
        let yPercent = (imageY / renderedHeight) * 100;
        
        xPercent = Math.max(0, Math.min(100, xPercent));
        yPercent = Math.max(0, Math.min(100, yPercent));

        updateEntity(draggingMarker, { mapCoordinates: { x: xPercent, y: yPercent } });
        setDraggingMarker(null);
    };

    const resetView = () => setView({ x: 0, y: 0, scale: 1 });

    if (map.layers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8">
                <MapPinIcon className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold text-text-main mb-2">Your World Map</h2>
                <p className="max-w-md mb-6">Upload a high-resolution image to serve as your first map layer. You can add more layers for regions, overlays, or different eras later.</p>
                <label className="cursor-pointer px-4 py-2 font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
                    <UploadIcon className="w-5 h-5 mr-2" /> Upload First Map Layer
                    <input type="file" className="hidden" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = async () => {
                                    const imageId = generateId('map-img');
                                    await idbService.saveImage(imageId, file);
                                    const newLayer: MapLayer = {
                                        id: generateId('map-layer'), name: file.name, image: imageId, width: img.width, height: img.height, isVisible: true
                                    };
                                    handleUpdateLayers([newLayer], newLayer.id);
                                };
                                img.src = e.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                        }
                    }} />
                </label>
            </div>
        );
    }
    
    const visibleLayers = map.layers.filter(l => l.isVisible);

    return (
        <div 
            ref={mapContainerRef} 
            className="w-full h-full bg-primary overflow-hidden relative"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDrop={handleMarkerDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <MapManager layers={map.layers} baseLayerId={map.baseLayerId} onUpdateLayers={handleUpdateLayers} />

            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
                <button onClick={() => setView(v => ({...v, scale: Math.min(5, v.scale * 1.2)}))} className="p-2 bg-secondary rounded-md shadow" title="Zoom In"><ZoomInIcon className="w-5 h-5" /></button>
                <button onClick={() => setView(v => ({...v, scale: Math.max(0.1, v.scale / 1.2)}))} className="p-2 bg-secondary rounded-md shadow" title="Zoom Out"><ZoomOutIcon className="w-5 h-5" /></button>
                <button onClick={resetView} className="p-2 bg-secondary rounded-md shadow" title="Reset View"><RefreshCwIcon className="w-5 h-5" /></button>
            </div>
            
            <div 
                className="w-full h-full relative" 
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: 'top left' }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: baseLayer?.width, height: baseLayer?.height }}>
                    {visibleLayers.map((layer, index) => <StoredMapImage key={layer.id} layer={layer} zIndex={index} />)}
                    {baseLayer && locations.map(loc => {
                        if (!loc.mapCoordinates) return null;
                        const isSelected = loc.id === selectedId;
                        return (
                            <div 
                                key={loc.id} 
                                className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
                                style={{ left: `${loc.mapCoordinates.x}%`, top: `${loc.mapCoordinates.y}%`, zIndex: 100 }}
                                onMouseDown={(e) => handleMarkerDragStart(e, loc.id)}
                                onClick={() => navigateToEntity(loc.id)}
                            >
                                <MapPinIcon className={`w-8 h-8 ${isSelected ? 'text-highlight' : 'text-accent'}`} />
                                <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-bold text-text-main bg-secondary/80 px-2 py-0.5 rounded ${isSelected ? '' : 'hidden'}`}>{loc.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MapView;