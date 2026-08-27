/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  Layers,
  ChevronLeft,
  Search,
  Bone,
  Activity,
  Filter,
} from 'lucide-react';
import { ANATOMY_STRUCTURES, AnatomicalStructure } from '../data/anatomyData';
import { AnatomicalRegion, MuscleLayer, SelectedStructureState, SystemVisibility } from '../types';
import { extractSideFromName } from '../utils/helpers';

const REGION_OPTIONS: AnatomicalRegion[] = [
  'All',
  'Head & Neck',
  'Thorax',
  'Abdomen',
  'Pelvis & Perineum',
  'Back & Spine',
  'Shoulder',
  'Arm & Elbow',
  'Forearm & Wrist',
  'Hand',
  'Gluteal Region & Hip',
  'Thigh & Knee',
  'Leg & Ankle',
  'Foot',
  'Skeleton',
];

interface SidebarProps {
  selectedStructure: SelectedStructureState | null;
  onSelectStructure: (structureState: SelectedStructureState) => void;
  activeRegion: AnatomicalRegion;
  onSelectRegion: (region: AnatomicalRegion) => void;
  layerFilter: MuscleLayer;
  onSelectLayer: (layer: MuscleLayer) => void;
  systemVisibility: SystemVisibility;
  onToggleSystem: (system: keyof SystemVisibility) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedStructure,
  onSelectStructure,
  activeRegion,
  onSelectRegion,
  layerFilter,
  onSelectLayer,
  systemVisibility,
  onToggleSystem,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Filter catalog based on region, layer, and local search term
  const filteredStructures = useMemo(() => {
    return ANATOMY_STRUCTURES.filter((s) => {
      // Region match
      const matchRegion = activeRegion === 'All' || s.region === activeRegion;

      // Layer match
      const matchLayer =
        layerFilter === 'all' || s.layer === layerFilter || s.layer === 'skeletal';

      // System match
      if (s.type === 'bone' && !systemVisibility.skeleton) return false;
      if (s.type === 'muscle' && !systemVisibility.muscles) return false;

      // Search query match
      const matchQuery =
        !filterQuery.trim() ||
        s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.rawMeshName.toLowerCase().includes(filterQuery.toLowerCase());

      return matchRegion && matchLayer && matchQuery;
    });
  }, [activeRegion, layerFilter, filterQuery, systemVisibility]);

  const handleStructureClick = (structure: AnatomicalStructure) => {
    onSelectStructure({
      structure,
      meshName: structure.rawMeshName,
      cleanName: structure.name,
      side: extractSideFromName(structure.name || structure.rawMeshName),
    });
  };

  if (isCollapsed) {
    return (
      <div className="h-full bg-slate-900/90 border-r border-slate-800 p-2 flex flex-col items-center justify-start gap-4 z-20">
        <button
          id="expand-sidebar-btn"
          onClick={onToggleCollapse}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Expand Regional Browser"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="writing-vertical text-slate-400 text-xs font-semibold tracking-wider select-none transform rotate-180 uppercase">
          Anatomy Browser
        </div>
      </div>
    );
  }

  return (
    <aside
      id="anatomy-sidebar"
      className="w-72 md:w-80 h-full bg-slate-900/95 border-r border-slate-800 flex flex-col z-20 select-none backdrop-blur-md transition-all duration-300"
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Anatomical Catalog
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {filteredStructures.length}
          </span>
        </div>
        <button
          id="collapse-sidebar-btn"
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Dissection Pills */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-1">
        <span className="text-[11px] text-slate-400 font-semibold uppercase">Layer:</span>
        <div className="flex gap-1">
          {(['all', 'superficial', 'intermediate', 'deep'] as MuscleLayer[]).map((layer) => (
            <button
              key={layer}
              id={`layer-filter-${layer}`}
              onClick={() => onSelectLayer(layer)}
              className={`px-2 py-0.5 text-[10px] rounded font-medium capitalize transition-all ${
                layerFilter === layer
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Region Selector Pills */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-1 mb-1.5 text-[11px] text-slate-400 font-medium">
          <Filter className="w-3 h-3 text-sky-400" />
          <span>Select Anatomical Region</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
          {REGION_OPTIONS.map((region) => {
            const isSelected = activeRegion === region;
            return (
              <button
                key={region}
                id={`region-btn-${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                onClick={() => onSelectRegion(region)}
                className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search/Filter Inside Selected Region */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            id="sidebar-filter-input"
            type="text"
            placeholder={`Filter ${activeRegion} structures...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-950/60 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-800 focus:outline-none focus:border-sky-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Structure List */}
      <div id="sidebar-structure-list" className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredStructures.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No structures match the active filter.
          </div>
        ) : (
          filteredStructures.map((item) => {
            const isSelected = selectedStructure?.meshName.toLowerCase() === item.rawMeshName.toLowerCase();
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => handleStructureClick(item)}
                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-600/80 text-sky-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {item.type === 'bone' ? (
                    <Bone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : item.type === 'tendon_ligament' ? (
                    <Activity className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.layer === 'superficial'
                          ? 'bg-red-400'
                          : item.layer === 'intermediate'
                          ? 'bg-red-600'
                          : 'bg-red-800'
                      }`}
                    />
                  )}
                  <span className="font-semibold truncate">{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase shrink-0">
                  {item.layer === 'skeletal' ? 'Bone' : item.layer}
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
