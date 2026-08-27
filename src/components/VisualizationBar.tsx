/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Layers,
  Tag,
  Box,
  RotateCcw,
  Bone,
  Eye,
} from 'lucide-react';
import { VisMode, ShadingMode, SystemVisibility, MuscleLayer } from '../types';

interface VisualizationBarProps {
  visMode: VisMode;
  onVisModeChange: (mode: VisMode) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  shadingMode: ShadingMode;
  onShadingModeChange: (mode: ShadingMode) => void;
  systemVisibility: SystemVisibility;
  onToggleSystem: (system: keyof SystemVisibility) => void;
  layerFilter: MuscleLayer;
  onSelectLayer: (layer: MuscleLayer) => void;
  hasSelectedStructure: boolean;
  hiddenCount: number;
  onResetDissection: () => void;
}

export const VisualizationBar: React.FC<VisualizationBarProps> = ({
  visMode,
  onVisModeChange,
  showLabels,
  onToggleLabels,
  shadingMode,
  onShadingModeChange,
  systemVisibility,
  onToggleSystem,
  layerFilter,
  onSelectLayer,
  hasSelectedStructure,
  hiddenCount,
  onResetDissection,
}) => {
  return (
    <div
      id="visualization-bar"
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md select-none max-w-[95vw]"
    >
      {/* System Toggles: Muscles & Skeleton */}
      <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
        <button
          id="toggle-muscles-system-btn"
          onClick={() => onToggleSystem('muscles')}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-all ${
            systemVisibility.muscles
              ? 'bg-red-700 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Muscular System Visibility"
        >
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Muscles</span>
        </button>

        <button
          id="toggle-skeleton-system-btn"
          onClick={() => onToggleSystem('skeleton')}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-all ${
            systemVisibility.skeleton
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Skeletal System Visibility"
        >
          <Bone className="w-3 h-3 text-amber-300" />
          <span>Skeleton</span>
        </button>
      </div>

      {/* Layer Depth Selector */}
      <div className="hidden lg:flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 text-xs">
        {(['all', 'superficial', 'deep'] as MuscleLayer[]).map((layer) => (
          <button
            key={layer}
            id={`vis-layer-${layer}`}
            onClick={() => onSelectLayer(layer)}
            className={`px-2 py-1 rounded-md font-medium capitalize transition-all ${
              layerFilter === layer
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {layer}
          </button>
        ))}
      </div>

      {/* Visibility Mode Toggle (Solid vs X-Ray vs Isolated) */}
      <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
        <button
          id="vis-mode-normal"
          onClick={() => onVisModeChange('normal')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
            visMode === 'normal'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Solid
        </button>
        <button
          id="vis-mode-transparent"
          onClick={() => onVisModeChange('transparent')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
            visMode === 'transparent'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          X-Ray
        </button>
        {hasSelectedStructure && (
          <button
            id="vis-mode-isolated"
            onClick={() => onVisModeChange('isolated')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              visMode === 'isolated'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Isolated
          </button>
        )}
      </div>

      {/* 3D Dynamic Pin Labels Toggle */}
      <button
        id="toggle-3d-labels-btn"
        onClick={onToggleLabels}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
          showLabels
            ? 'bg-sky-950 text-sky-300 border-sky-600/50'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
        }`}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>Labels {showLabels ? 'ON' : 'OFF'}</span>
      </button>

      {/* Shading Style */}
      <div className="hidden sm:flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 text-xs">
        <button
          id="shading-anatomical-btn"
          onClick={() => onShadingModeChange('anatomical')}
          title="Realistic Anatomical Shading"
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'anatomical'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Anatomy
        </button>
        <button
          id="shading-clay-btn"
          onClick={() => onShadingModeChange('clay')}
          title="Sculpting Clay Shading for Drawing Reference"
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'clay'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Clay
        </button>
        <button
          id="shading-wireframe-btn"
          onClick={() => onShadingModeChange('wireframe')}
          title="Topological Wireframe"
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'wireframe'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Wire
        </button>
      </div>

      {/* Reset Dissection / Unhide All button if any structure is hidden or isolated */}
      {(hiddenCount > 0 || visMode === 'isolated' || layerFilter !== 'all') && (
        <button
          id="reset-dissection-btn"
          onClick={onResetDissection}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium bg-amber-950 text-amber-300 border border-amber-800/60 hover:bg-amber-900 transition-all"
          title="Show all hidden layers and reset dissection"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Dissection ({hiddenCount} hidden)</span>
        </button>
      )}
    </div>
  );
};
