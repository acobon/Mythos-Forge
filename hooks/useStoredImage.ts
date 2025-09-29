// hooks/useStoredImage.ts
import { useState, useEffect } from 'react';
import * as idbService from '../services/idbService';

export const useStoredImage = (imageId: string | undefined | null): string | null => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;

        const fetchImage = async () => {
            if (!imageId) {
                setImageUrl(null);
                return;
            }
            try {
                const blob = await idbService.getImage(imageId);
                if (blob) {
                    objectUrl = URL.createObjectURL(blob);
                    setImageUrl(objectUrl);
                } else {
                    setImageUrl(null); // Image not found
                }
            } catch (error) {
                console.error('Failed to load image from IDB:', error);
                setImageUrl(null);
            }
        };

        fetchImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId]);

    return imageUrl;
};