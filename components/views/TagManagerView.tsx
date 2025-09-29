import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTagActions } from '../../hooks/useTagActions';
import { Tag, ModalType } from '../../types/index';
import { PlusCircleIcon, EditIcon, TrashIcon, TagIcon, SearchIcon, LinkIcon, CheckIcon, XIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { generateTagColor, getTypedObjectValues } from '../../utils';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { useToast } from '../../hooks/useToast';
import { Input, Button, Modal } from '../common/ui/index';
import { pushModal } from '../../state/uiSlice';
import { VariableSizeList as List } from 'react-window';
import { mergeTags } from '../../state/actions';

const TAG_LIST_ITEM_HEIGHT = 48;

const TagManagerView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tags } = useAppSelector(state => state.bible.present.metadata);
  const showConfirm = useConfirmationDialog();
  const { createTag, updateTag, deleteTag } = useTagActions();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [label, setLabel] = useState('');
  const tagsArray = useMemo(() => getTypedObjectValues(tags) as Tag[], [tags]);
  const [color, setColor] = useState(generateTagColor(tagsArray.length));
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [targetMergeTagId, setTargetMergeTagId] = useState<string | null>(null);
  
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setListDimensions({ width, height });
        }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const filteredTags = useMemo(() => {
    const query = debouncedSearchTerm.toLowerCase();
    const sorted = [...tagsArray].sort((a, b) => a.label.localeCompare(b.label));
    if (!query) return sorted;
    return sorted.filter(tag => tag.label.toLowerCase().includes(query));
  }, [tagsArray, debouncedSearchTerm]);
  
  useEffect(() => {
    // Clear selection if filtered tags change
    setSelectedTagIds(new Set());
  }, [debouncedSearchTerm]);

  const handleSelectForEdit = (tag: Tag) => {
    setEditingTag(tag);
    setLabel(tag.label);
    setColor(tag.color);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setLabel('');
    setColor(generateTagColor(tagsArray.length));
    setError('');
  };

  const isLabelUnique = (checkLabel: string, id?: string): boolean => {
    const lowerLabel = checkLabel.trim().toLowerCase();
    return !tagsArray.some(t => t.label.toLowerCase() === lowerLabel && t.id !== id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Tag label cannot be empty.');
      return;
    }
    if (!isLabelUnique(label, editingTag?.id)) {
      setError('A tag with this label already exists.');
      return;
    }

    if (editingTag) {
      updateTag({ ...editingTag, label: label.trim(), color });
      showToast({ type: 'success', message: 'Tag updated!' });
    } else {
      createTag(label.trim(), color);
      showToast({ type: 'success', message: 'Tag created!' });
    }
    handleCancelEdit();
  };

  const handleDelete = (tagId: string, tagName: string) => {
    showConfirm({
      title: "Delete Tag?",
      message: "Are you sure? This will remove the tag from all entities, events, and scenes. This can be undone.",
      onConfirm: () => {
        deleteTag(tagId);
        showToast({ type: 'info', message: `Tag "${tagName}" moved to trash.` });
      }
    });
  };

  const handleShowUsage = (tag: Tag) => {
      dispatch(pushModal({
          type: ModalType.ITEM_USAGE,
          props: { itemId: tag.id, itemName: tag.label, itemType: 'Tag' }
      }));
  };

  const handleToggleSelection = (tagId: string) => {
    setSelectedTagIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) {
            newSet.delete(tagId);
        } else {
            newSet.add(tagId);
        }
        return newSet;
    });
  };

  const handleOpenMergeModal = () => {
    if (selectedTagIds.size !== 2) return;
    setTargetMergeTagId(Array.from(selectedTagIds)[0]);
    setIsMergeModalOpen(true);
  };

  const handleConfirmMerge = () => {
    if (selectedTagIds.size !== 2 || !targetMergeTagId) return;
    const [id1, id2] = Array.from(selectedTagIds);
    const sourceTagId = targetMergeTagId === id1 ? id2 : id1;

    dispatch(mergeTags({ sourceTagId, targetTagId: targetMergeTagId }));
    showToast({ type: 'success', message: 'Tags merged successfully!' });

    setIsMergeModalOpen(false);
    setSelectedTagIds(new Set());
    setTargetMergeTagId(null);
  };
  
  const tagsToMerge = useMemo(() => {
    if (selectedTagIds.size !== 2) return [];
    return Array.from(selectedTagIds).map(id => tags[id]).filter(Boolean);
  }, [selectedTagIds, tags]);

  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const tag = filteredTags[index];
    if (!tag) return null;
    return (
        <div style={style} className="px-2">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group h-full">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedTagIds.has(tag.id)}
                        onChange={() => handleToggleSelection(tag.id)}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        aria-label={`Select tag ${tag.label}`}
                    />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                    <span>{tag.label}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleShowUsage(tag)} title="View Usage"><LinkIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSelectForEdit(tag)}><EditIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id, tag.label)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                </div>
            </div>
        </div>
    );
  }, [filteredTags, selectedTagIds, handleToggleSelection, handleShowUsage, handleSelectForEdit, handleDelete]);

  return (
    <>
      <div className="p-4 md:p-8 h-full flex flex-col">
        <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">Manage Tags</h2>
        <p className="text-text-secondary mb-6 flex-shrink-0">
          Create, edit, and delete tags to organize your world.
        </p>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-semibold text-text-main">All Tags ({filteredTags.length})</h3>
                <Button size="sm" variant="secondary" onClick={handleOpenMergeModal} disabled={selectedTagIds.size !== 2}>Merge Selected</Button>
              </div>
              <div className="relative w-1/2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input type="search" value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} placeholder="Search tags..." className="py-1.5 pl-9 pr-4 text-sm" />
              </div>
            </div>
            <div className="flex-grow" ref={listContainerRef}>
              {filteredTags.length > 0 && listDimensions.height > 0 ? (
                <List
                  height={listDimensions.height}
                  itemCount={filteredTags.length}
                  itemSize={() => TAG_LIST_ITEM_HEIGHT}
                  width={listDimensions.width}
                >
                    {Row}
                </List>
              ) : (
                <EmptyState
                  icon={<TagIcon className="w-16 h-16" />}
                  title={tagsArray.length > 0 ? 'No Tags Found' : 'No Tags Yet'}
                  description={tagsArray.length > 0 ? 'Try a different search term.' : 'Create your first tag using the form on the right.'}
                />
              )}
            </div>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-border-color">
            <h3 className="text-xl font-semibold text-text-main mb-4">{editingTag ? 'Edit Tag' : 'Create New Tag'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tag-label" className="block text-sm font-medium text-text-secondary">Label</label>
                <Input
                  id="tag-label"
                  type="text"
                  value={label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLabel(e.target.value); setError(''); }}
                  placeholder="e.g., House Stark, Betrayal"
                  className="mt-1"
                  error={!!error}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <div>
                <label htmlFor="tag-color" className="block text-sm font-medium text-text-secondary">Color</label>
                <Input
                  id="tag-color"
                  type="color"
                  value={color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                  className="w-full h-10 mt-1 p-1 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" className="flex-grow">
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </Button>
                {editingTag && (
                  <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Tags" size="sm">
        <div className="space-y-4">
            <p>Select which tag to keep. All items from the other tag will be moved to the one you keep. The other tag will be deleted.</p>
            <div className="space-y-2">
                {tagsToMerge.map(tag => (
                    <label key={tag.id} className="flex items-center p-2 bg-primary rounded-md border border-border-color has-[:checked]:border-accent">
                        <input
                            type="radio"
                            name="merge-target"
                            checked={targetMergeTagId === tag.id}
                            onChange={() => setTargetMergeTagId(tag.id)}
                            className="h-4 w-4 text-accent focus:ring-accent"
                        />
                        <span className="ml-3 font-semibold">{tag.label}</span>
                    </label>
                ))}
            </div>
            <div className="flex justify-end pt-2 gap-2">
                <Button variant="ghost" onClick={() => setIsMergeModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleConfirmMerge}>Confirm Merge</Button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default TagManagerView;