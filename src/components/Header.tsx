/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Maximize2, Minimize2, BookOpen, Layers, RotateCcw, Bone, Activity } from 'lucide-react';
import { ANATOMY_STRUCTURES, AnatomicalStructure } from '../data/anatomyData';
import { AppMode, SelectedStructureState } from '../types';
import { extractSideFromName } from '../utils/helpers';

interface HeaderProps {
  onSelectStructure: (structureState: SelectedStructureState) => void;
  appMode: AppMode;
  onAppModeChange: (mode: AppMode) => void;
  onResetCamera: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectStructure,
  appMode,
  onAppModeChange,
  onResetCamera,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search across all 668 realistic anatomical structures
  const searchResults: AnatomicalStructure[] = searchQuery.trim()
    ? ANATOMY_STRUCTURES.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(query) ||
          item.region.toLowerCase().includes(query) ||
          item.action.toLowerCase().includes(query) ||
          item.rawMeshName.toLowerCase().includes(query)
        );
      }).slice(0, 12)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (e: React.MouseEvent | React.KeyboardEvent, structure: AnatomicalStructure) => {
    e.preventDefault();
    e.stopPropagation();

    onSelectStructure({
      structure,
      meshName: structure.rawMeshName,
      cleanName: structure.name,
      side: extractSideFromName(structure.name || structure.rawMeshName),
    });
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (searchResults.length > 0) {
        const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
        handleSelectResult(e, searchResults[targetIndex]);
      }
      return;
    }

    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header
      id="atlas-header"
      className="h-14 bg-slate-900/95 border-b border-slate-800 text-slate-100 flex items-center justify-between px-3 md:px-5 select-none z-30 shrink-0 backdrop-blur-md"
    >
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-red-900/30 border border-rose-500/30">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-50 flex items-center gap-1.5">
            <span>Anatomy Atlas</span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/50">
              Musculoskeletal
            </span>
          </h1>
        </div>
      </div>

      {/* Global Real Anatomical Search */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-md mx-2 md:mx-6">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            id="structure-search-input"
            type="text"
            placeholder="Search muscles & bones (e.g. Deltoid, Biceps, Femur)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-950/70 text-slate-100 placeholder-slate-400 text-xs md:text-sm pl-9 pr-8 py-1.5 md:py-2 rounded-lg border border-slate-700/80 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchResults.length > 0 && (
          <div
            id="search-results-dropdown"
            className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto backdrop-blur-xl"
          >
            {searchResults.map((item, idx) => (
              <button
                key={item.id}
                id={`search-result-${item.id}`}
                onClick={(e) => handleSelectResult(e, item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/60 last:border-0 text-xs transition-colors ${
                  idx === highlightedIndex
                    ? 'bg-sky-600/30 text-sky-200'
                    : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.type === 'bone' ? (
                    <Bone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  ) : item.type === 'tendon_ligament' ? (
                    <Activity className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-semibold block truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{item.action}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase font-medium">
                    {item.region}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode Switcher & Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Reset Camera View Button */}
        <button
          id="header-reset-cam-btn"
          onClick={onResetCamera}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Study Mode Toggle */}
        <button
          id="study-mode-toggle-btn"
          onClick={() => onAppModeChange(appMode === 'study' ? 'atlas' : 'study')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            appMode === 'study'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30'
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggle Medical Study & Drawing Reference Mode"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Study Mode</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="fullscreen-toggle-btn"
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
