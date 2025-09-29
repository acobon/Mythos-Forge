import React, { ChangeEvent } from 'react';
import { Entity } from '../../../types/index';
import { UploadIcon, XIcon } from '../../common/Icons';
import { TextareaWithMentions } from '../../common/TextareaWithMentions';
import { SaveStatus } from '../../../hooks/useDebouncedEntitySave';
import { useEntityActions } from '../../../hooks/useEntityActions';
import { getEntityIcon } from '../../common/iconUtils';
import { useStoredImage } from '../../../hooks/useStoredImage';
import * as idbService from '../../../services/idbService';
import { generateId } from '../../../utils';
import { SaveStatusIndicator } from '../../common/SaveStatusIndicator';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { showDialog } from '../../../state/uiSlice';

const EntityAvatar: React.FC<{ entity: Entity, onUpdate: (updates: Partial<Entity>) => void }> = ({ entity, onUpdate }) => {
    const dispatch = useAppDispatch();
    const imageUrl = useStoredImage(entity.avatar);
    const { entityTypes } = useAppSelector(state => state.bible.present.entities);
    
    const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageId = generateId('img');
            const oldAvatarId = entity.avatar;
            try {
                // First, save the new image
                await idbService.saveImage(imageId, file);
                // Then, update the entity state
                onUpdate({ avatar: imageId });
                // Finally, if there was an old avatar, delete it
                if (oldAvatarId) {
                    await idbService.deleteImage(oldAvatarId);
                }
            } catch (error) {
                console.error("Failed to save or update avatar:", error);
                // If saving new image failed, we might need to clean it up if it was partially saved
                await idbService.deleteImage(imageId); 
                dispatch(showDialog({ title: 'Upload Error', message: 'Could not save the selected image file.' }));
            }
        }
    };

    const handleRemoveAvatar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const oldAvatarId = entity.avatar;
        if (oldAvatarId) {
            try {
                // First, update the entity state to remove the reference
                onUpdate({ avatar: undefined });
                // Then, delete the image file from storage
                await idbService.deleteImage(oldAvatarId);
            } catch (error) {
                console.error("Failed to delete image:", error);
                 dispatch(showDialog({ title: 'Deletion Error', message: 'Could not delete the avatar file. The reference has been removed.' }));
            }
        }
    };
    
    return (
        <div className="relative group w-20 h-20 flex-shrink-0">
            {imageUrl ? (
                <img src={imageUrl} alt={entity.name} className="w-20 h-20 rounded-full object-cover border-2 border-border-color" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-secondary border-2 border-border-color flex items-center justify-center">
                    {getEntityIcon(entity.type, entityTypes, "w-10 h-10 text-text-secondary")}
                </div>
            )}
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <UploadIcon className="w-6 h-6"/>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            {entity.avatar && (
                 <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 p-1 bg-secondary rounded-full text-text-main opacity-0 group-hover:opacity-100 transition-opacity hover:bg-border-color"
                    aria-label="Remove avatar"
                    title="Remove avatar"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

interface EntityHeaderAndDescriptionProps<T extends Entity> {
    entity: T;
    draft: T;
    updateDraft: (field: string, value: any) => void;
    saveStatus: SaveStatus;
}

const EntityHeaderAndDescription = <T extends Entity>({ entity, draft, updateDraft, saveStatus }: EntityHeaderAndDescriptionProps<T>) => {
    const { updateEntity } = useEntityActions();
    const isGloballyProcessing = useAppSelector(state => state.ui.processingStack.length > 0);

    const draftName = draft.name ?? '';
    const draftDescription = draft.description ?? '';
    const isNameInvalid = draftName.trim() === '';

    return (
        <div className="flex-grow">
            <header className="flex items-start space-x-4">
                <EntityAvatar entity={entity} onUpdate={(updates) => updateEntity(entity.id, updates)} />
                <div className="flex-grow">
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => updateDraft('name', e.target.value)}
                            className={`text-3xl font-bold bg-transparent focus:outline-none w-full ${isNameInvalid ? 'text-red-400' : 'text-text-main'}`}
                            disabled={isGloballyProcessing}
                            aria-label="Entity Name"
                        />
                        <div className="flex-shrink-0 h-4 ml-2">
                           <SaveStatusIndicator status={saveStatus} />
                        </div>
                    </div>
                     <TextareaWithMentions
                        value={draftDescription}
                        onValueChange={(value) => updateDraft('description', value)}
                        placeholder="Add a description..."
                        rows={2}
                        wrapperClassName="mt-1"
                        className="w-full bg-transparent text-text-secondary focus:outline-none resize-none leading-tight"
                        disabled={isGloballyProcessing}
                        aria-label="Entity Description"
                    />
                </div>
            </header>
        </div>
    );
};
export default EntityHeaderAndDescription;