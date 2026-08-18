import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Heart, X, ChevronRight, FolderPlus, Folder, Trash2,
  Plus, GripVertical, Edit2, Check
} from 'lucide-react';
import {
  getAllFavorites, addFavorite, removeFavorite,
  getAllCollections, createCollection, deleteCollection,
  addToCollection, removeFromCollection, renameCollection
} from '../lib/storage';
import { trackUserAction } from '../lib/achievements';

gsap.registerPlugin(useGSAP);

export default function FavoritesBar({
  allCompanies,
  onSelectCompany,
  favoriteIds,
  setFavoriteIds,
  isOpen,
  setIsOpen
}) {
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const drawerRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const cols = await getAllCollections();
    setCollections(cols);
  };

  // GSAP slide-in animation
  useGSAP(() => {
    if (drawerRef.current) {
      gsap.fromTo(drawerRef.current,
        { x: '100%', opacity: 0 },
        { x: isOpen ? '0%' : '100%', opacity: isOpen ? 1 : 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, { dependencies: [isOpen] });

  // Toggle favorite
  const toggleFavorite = useCallback(async (companyId, companyData) => {
    if (favoriteIds.has(companyId)) {
      await removeFavorite(companyId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    } else {
      await addFavorite(companyId, companyData);
      setFavoriteIds(prev => new Set(prev).add(companyId));
    }
  }, [favoriteIds, setFavoriteIds]);

  // Create collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    await createCollection(newCollectionName.trim());
    await trackUserAction('collections_created');
    setNewCollectionName('');
    setShowNewInput(false);
    await loadCollections();
  };

  // Delete collection
  const handleDeleteCollection = async (id) => {
    await deleteCollection(id);
    if (activeCollectionId === id) setActiveCollectionId(null);
    await loadCollections();
  };

  // Rename collection
  const handleRenameCollection = async (id) => {
    if (!editingName.trim()) return;
    await renameCollection(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
    await loadCollections();
  };

  // Add company to a collection
  const handleAddToCollection = async (collectionId, companyId) => {
    await addToCollection(collectionId, companyId);
    await loadCollections();
  };

  // Remove company from a collection
  const handleRemoveFromCollection = async (collectionId, companyId) => {
    await removeFromCollection(collectionId, companyId);
    await loadCollections();
  };

  // Get companies by IDs
  const getCompanyById = (id) => allCompanies.find(c => c.id === id);

  // Get favorite companies
  const favoriteCompanies = allCompanies.filter(c => favoriteIds.has(c.id));

  // Active collection data
  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeCollectionCompanies = activeCollection
    ? activeCollection.companyIds.map(id => getCompanyById(id)).filter(Boolean)
    : [];

  // What to show
  const displayCompanies = activeCollectionId
    ? activeCollectionCompanies
    : favoriteCompanies;
  const displayTitle = activeCollectionId
    ? activeCollection?.name || 'Collection'
    : 'All Favorites';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 brutal-btn px-2 py-4 rounded-l-lg rounded-r-none flex flex-col items-center space-y-1.5 hover:bg-neon-magenta hover:text-white"
        title="Open Favorites"
      >
        <Heart className="w-4 h-4" />
        {favoriteIds.size > 0 && (
          <span className="font-mono-code text-[9px] font-bold bg-neon-magenta text-white px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000000]">
            {favoriteIds.size}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      ref={drawerRef}
      className="fixed right-0 top-0 h-full w-[320px] z-50 brutal-card rounded-none border-r-0 flex flex-col overflow-hidden shadow-[-6px_0px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black p-4">
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-neon-magenta fill-neon-magenta" />
          <span className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
            MY_FAVORITES
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-700 hover:text-black p-1 hover:bg-slate-100 border border-transparent hover:border-black rounded transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Collections list */}
      <div className="border-b-2 border-black p-3 space-y-2 bg-obsidian-dark">
        <div className="flex items-center justify-between">
          <span className="font-mono-code text-[9px] text-slate-700 font-bold uppercase tracking-widest">
            Collections
          </span>
          <button
            onClick={() => setShowNewInput(!showNewInput)}
            className="text-black hover:text-neon-emerald cursor-pointer p-0.5"
            title="New Collection"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New collection input */}
        {showNewInput && (
          <form onSubmit={handleCreateCollection} className="flex items-center space-x-1.5">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="flex-grow brutal-input px-2 py-1 text-[10px] font-mono-code text-black placeholder-slate-500"
              autoFocus
            />
            <button type="submit" className="brutal-btn p-1 hover:bg-neon-emerald">
              <Plus className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* All Favorites button */}
        <button
          onClick={() => setActiveCollectionId(null)}
          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded border-2 border-black transition-all cursor-pointer text-left font-mono-tech text-[10px] font-bold uppercase ${
            !activeCollectionId
              ? 'bg-neon-magenta text-white shadow-[2px_2px_0px_0px_#000000] -translate-x-[0.5px] -translate-y-[0.5px]'
              : 'bg-white text-black shadow-[1px_1px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000]'
          }`}
        >
          <Heart className="w-3 h-3 shrink-0" />
          <span className="truncate">All Favorites ({favoriteIds.size})</span>
        </button>

        {/* Collection buttons */}
        {collections.map(col => (
          <div key={col.id} className="flex items-center space-x-1">
            <button
              onClick={() => setActiveCollectionId(col.id)}
              className={`flex-grow flex items-center space-x-2 px-2.5 py-1.5 rounded border-2 border-black transition-all cursor-pointer text-left font-mono-tech text-[10px] font-bold uppercase ${
                activeCollectionId === col.id
                  ? 'bg-neon-cyan text-black shadow-[2px_2px_0px_0px_#000000] -translate-x-[0.5px] -translate-y-[0.5px]'
                  : 'bg-white text-black shadow-[1px_1px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000]'
              }`}
            >
              <Folder className="w-3 h-3 shrink-0" />
              {editingId === col.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRenameCollection(col.id); }}
                  className="flex-grow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-transparent border-b border-black text-[10px] font-mono-tech outline-none"
                    autoFocus
                    onBlur={() => handleRenameCollection(col.id)}
                  />
                </form>
              ) : (
                <span className="truncate">{col.name} ({col.companyIds.length})</span>
              )}
            </button>
            <button
              onClick={() => { setEditingId(col.id); setEditingName(col.name); }}
              className="text-slate-500 hover:text-black cursor-pointer p-0.5"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDeleteCollection(col.id)}
              className="text-slate-500 hover:text-neon-magenta cursor-pointer p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Display header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
        <span className="font-mono-tech text-[10px] font-bold text-black uppercase tracking-wider">
          {displayTitle}
        </span>
        <span className="font-mono-code text-[9px] text-slate-500 font-bold">
          {displayCompanies.length} items
        </span>
      </div>

      {/* Company list */}
      <div className="flex-grow overflow-y-auto p-3 space-y-2">
        {displayCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="w-8 h-8 text-slate-300 mb-3" />
            <span className="font-mono-tech text-[10px] text-slate-500 font-bold uppercase">
              {activeCollectionId ? 'Collection is empty' : 'No favorites yet'}
            </span>
            <p className="font-mono-code text-[9px] text-slate-400 mt-1.5 max-w-[180px]">
              Click the ♥ on any startup card to save it here.
            </p>
          </div>
        ) : (
          displayCompanies.map(c => {
            const monogram = c.name ? c.name.charAt(0).toUpperCase() : 'Y';
            return (
              <div
                key={c.id}
                className="brutal-card p-2.5 flex items-center space-x-2.5 group cursor-pointer hover:bg-neon-cyan/10 transition-all"
              >
                {/* Mini logo */}
                <div
                  className="w-7 h-7 rounded border border-black flex items-center justify-center overflow-hidden shrink-0 bg-white"
                  onClick={() => onSelectCompany(c)}
                >
                  {c.small_logo_thumb_url ? (
                    <img
                      src={c.small_logo_thumb_url}
                      alt={`${c.name} Logo`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div
                    style={{ display: c.small_logo_thumb_url ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center font-mono-tech text-xs font-bold bg-neon-cyan text-black"
                  >
                    {monogram}
                  </div>
                </div>

                {/* Info */}
                <div
                  className="flex-grow min-w-0 cursor-pointer"
                  onClick={() => onSelectCompany(c)}
                >
                  <span className="font-mono-tech text-[10px] font-extrabold text-black group-hover:text-neon-cyan transition-colors block truncate leading-tight">
                    {c.name}
                  </span>
                  <span className="font-mono-code text-[8px] text-slate-600 block truncate">
                    {c.industry} • {c.batch}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  {activeCollectionId && (
                    <button
                      onClick={() => handleRemoveFromCollection(activeCollectionId, c.id)}
                      className="text-slate-400 hover:text-neon-magenta cursor-pointer p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from collection"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleFavorite(c.id, c)}
                    className="text-neon-magenta cursor-pointer p-0.5"
                    title="Remove from favorites"
                  >
                    <Heart className="w-3.5 h-3.5 fill-neon-magenta" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add to collection dropdown (when viewing All Favorites) */}
      {!activeCollectionId && favoriteCompanies.length > 0 && collections.length > 0 && (
        <div className="border-t-2 border-black p-3 bg-obsidian-dark">
          <span className="font-mono-code text-[9px] text-slate-700 font-bold uppercase block mb-2">
            Quick add selected to collection:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {collections.map(col => (
              <button
                key={col.id}
                onClick={async () => {
                  // Add all favorites to this collection
                  for (const id of favoriteIds) {
                    await addToCollection(col.id, id);
                  }
                  await loadCollections();
                }}
                className="font-mono-tech text-[9px] px-2 py-1 rounded border-2 border-black bg-white hover:bg-neon-cyan transition-all cursor-pointer font-bold uppercase shadow-[1px_1px_0px_0px_#000000]"
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Heart button component for individual CompanyCards.
 */
export function FavoriteButton({ companyId, companyData, favoriteIds, setFavoriteIds }) {
  const isFav = favoriteIds.has(companyId);

  const toggle = async (e) => {
    e.stopPropagation(); // Don't trigger card click
    if (isFav) {
      await removeFavorite(companyId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    } else {
      await addFavorite(companyId, companyData);
      setFavoriteIds(prev => new Set(prev).add(companyId));
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-0.5 transition-all cursor-pointer ${
        isFav ? 'text-neon-magenta scale-110' : 'text-slate-400 hover:text-neon-magenta opacity-0 group-hover:opacity-100'
      }`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-neon-magenta' : ''}`} />
    </button>
  );
}
