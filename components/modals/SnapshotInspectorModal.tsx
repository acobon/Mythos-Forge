// components/modals/SnapshotInspectorModal.tsx
import React from 'react';
import { Snapshot } from '../../types/index';

interface SnapshotInspectorModalProps {
    snapshot: Snapshot;
}

const SnapshotInspectorModal: React.FC<SnapshotInspectorModalProps> = ({ snapshot }) => {
    return (
        <div className="h-[70vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Snapshot Details</h3>
            <p className="text-sm text-text-secondary mb-4">
                Created on: {new Date(snapshot.id).toLocaleString()}
            </p>
            <div className="flex-grow overflow-auto bg-primary border border-border-color rounded-md p-2">
                <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(snapshot.data, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default SnapshotInspectorModal;