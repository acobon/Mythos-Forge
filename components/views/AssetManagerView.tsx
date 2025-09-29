
// components/views/AssetManagerView.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from '../../state/hooks';
import * as idbService from '../../services/idbService';
import { StoryBible, Entity, MapLayer } from '../../types/index';
import { ImageIcon, TrashIcon, UploadIcon } from '../common/Icons';
import EmptyState from '../common/EmptyState';
import { Spinner } from '../common/Spinner';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { Button } from '../common/ui';
import { generateId } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { selectFullStoryBible } from '../../state/selectors';

const scanForUsedImageIds = (storyBible: StoryBible): Map<string, string[]> => {
    const usageMap = new Map<string, string[]>();
    
    const addUsage = (id: string, use: string) => {
        if (!usageMap.has(id)) {
            usageMap.set(id, []);
        }
        usageMap.get(id)!.push(use);
    };

    Object.values(storyBible.entities).forEach((entity: Entity) => {
        if (entity.avatar) addUsage(entity.avatar, `Avatar for: ${entity.name}`);
    });
    
    (storyBible.map.layers || []).forEach((layer: MapLayer) => {
        if (layer.image) addUsage(layer.image, `Map Layer: ${layer.name}`);
    });
    
    return usageMap;
};

const AssetManagerView: React.FC = () => {
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const [images, setImages] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const showConfirm = useConfirmationDialog();
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useI18n();

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        const imageBlobs = await idbService.getAllImages();
        const imageUrls = new Map<string, string>();
        imageBlobs.forEach((blob, id) => {
            imageUrls.set(id, URL.createObjectURL(blob));
        });
        setImages(imageUrls);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchImages();
        
        return () => {
            images.forEach(url => URL.revokeObjectURL(url));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const imageUsageMap = useMemo(() => scanForUsedImageIds(storyBible), [storyBible]);
    
    const allImageIds = useMemo(() => Array.from(images.keys()), [images]);
    const unusedImages = useMemo(() => allImageIds.filter(id => !imageUsageMap.has(id)), [allImageIds, imageUsageMap]);

    const handleDelete = useCallback((id: string) => {
        showConfirm({
            title: t('assetManager.delete.title'),
            message: t('assetManager.delete.message'),
            onConfirm: async () => {
                await idbService.deleteImage(id);
                // Optimistic UI update
                const urlToRevoke = images.get(id);
                if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
                setImages(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
            }
        });
    }, [images, showConfirm, t]);
    
    const handleDeleteUnused = useCallback(() => {
        if (unusedImages.length === 0) return;
        showConfirm({
            title: t('assetManager.deleteUnused.title', { count: unusedImages.length }),
            message: t('assetManager.deleteUnused.message'),
            onConfirm: async () => {
                await Promise.all(unusedImages.map((id: string) => idbService.deleteImage(id)));
                // Optimistic UI update for all unused images
                setImages(prev => {
                    const newMap = new Map(prev);
                    unusedImages.forEach((id: string) => {
                        const urlToRevoke = newMap.get(id);
                        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
                        newMap.delete(id);
                    });
                    return newMap;
                });
            }
        });
    }, [unusedImages, showConfirm, t]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageId = generateId('img');
            try {
                await idbService.saveImage(imageId, file);
                await fetchImages(); // Refetch is okay for additions
            } catch (err) {
                console.error("Failed to save asset image", err);
            }
        }
        if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">{t('assetManager.title')}</h2>
                    <p className="text-text-secondary mt-1">{t('assetManager.description')}</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="secondary" onClick={() => uploadInputRef.current?.click()}>
                        <UploadIcon className="w-5 h-5 mr-2" /> {t('assetManager.upload')}
                        <input type="file" ref={uploadInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteUnused} disabled={unusedImages.length === 0}>
                        <TrashIcon className="w-5 h-5 mr-2" /> {t('assetManager.deleteUnused.button', { count: unusedImages.length })}
                    </Button>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto bg-secondary p-4 rounded-lg border border-border-color">
                {images.size > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {allImageIds.map(id => {
                            const usage = imageUsageMap.get(id);
                            const isUsed = !!usage;
                            const tooltipContent = isUsed ? usage.join('\n') : t('assetManager.tooltip.unused');

                            return (
                                <div key={id} title={tooltipContent} className={`relative group border-2 rounded-lg overflow-hidden ${isUsed ? 'border-transparent' : 'border-red-500/50'}`}>
                                    <img src={images.get(id)} alt={id} className="w-full h-32 object-cover bg-primary" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <p className="text-xs text-white break-all">{id}</p>
                                        <div className="flex justify-end items-end">
                                             <Button size="icon" variant="destructive" onClick={() => handleDelete(id as string)} className="!p-1.5 h-auto" aria-label={t('assetManager.delete.label')}>
                                                <TrashIcon className="w-4 h-4"/>
                                             </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={<ImageIcon className="w-16 h-16" />}
                        title={t('assetManager.empty.title')}
                        description={t('assetManager.empty.description')}
                    />
                )}
            </div>
        </div>
    );
};

export default AssetManagerView;
