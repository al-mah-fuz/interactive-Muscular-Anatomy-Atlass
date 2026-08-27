/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Target,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Droplet,
  FileText,
  Copy,
  Check,
  Bone,
  Layers,
} from 'lucide-react';
import { SelectedStructureState, VisMode } from '../types';

interface MuscleInfoPanelProps {
  selectedStructure: SelectedStructureState | null;
  onDeselect: () => void;
  visMode: VisMode;
  onToggleIsolate: () => void;
  onFocusCamera: () => void;
  onToggleHide: (meshName: string) => void;
  isMeshHidden: boolean;
}

export const MuscleInfoPanel: React.FC<MuscleInfoPanelProps> = ({
  selectedStructure,
  onDeselect,
  visMode,
  onToggleIsolate,
  onFocusCamera,
  onToggleHide,
  isMeshHidden,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');

  if (!selectedStructure) return null;

  const { structure, cleanName, side, meshName } = selectedStructure;
  const isIsolated = visMode === 'isolated';

  const handleCopySummary = () => {
    const summary = `${structure.name} (${side})\nType: ${structure.type}\nRegion: ${structure.region}\nLayer: ${structure.layer}\nOrigin: ${structure.origin}\nInsertion: ${structure.insertion}\nAction: ${structure.action}\nInnervation: ${structure.innervation}\nArterial Supply: ${structure.arterialSupply}\nDescription: ${structure.description}`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id="muscle-info-panel"
      className="w-full md:w-96 max-h-[85vh] md:max-h-[calc(100vh-5rem)] bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col z-30 shadow-2xl backdrop-blur-md transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60">
                {structure.region}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {structure.layer === 'skeletal' ? 'Skeleton' : `${structure.layer} Layer`}
              </span>
              {side && side !== 'Bilateral' && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {side}
                </span>
              )}
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-50 tracking-tight leading-snug">
              {cleanName}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="copy-muscle-info-btn"
              onClick={handleCopySummary}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
              title="Copy Anatomical Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              id="close-info-panel-btn"
              onClick={onDeselect}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
              title="Deselect Structure"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="grid grid-cols-3 gap-1.5 mt-3.5">
          <button
            id="isolate-structure-btn"
            onClick={onToggleIsolate}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              isIsolated
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-900/30'
            }`}
          >
            {isIsolated ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isIsolated ? 'Show All' : 'Isolate'}</span>
          </button>

          <button
            id="hide-structure-btn"
            onClick={() => onToggleHide(meshName)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Hide structure to reveal deeper layers"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>{isMeshHidden ? 'Unhide' : 'Hide'}</span>
          </button>

          <button
            id="focus-camera-btn"
            onClick={onFocusCamera}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 px-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-sky-500 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Anatomy & Action
        </button>
        <button
          onClick={() => setActiveTab('attachments')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'attachments'
              ? 'border-sky-500 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Attachments & Innervation
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
        {activeTab === 'details' ? (
          <>
            {/* Description */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>Anatomical Overview</span>
              </div>
              <p className="leading-relaxed text-slate-300">{structure.description}</p>
            </div>

            {/* Functional Action */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1.5 text-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>Primary Action & Mechanics</span>
              </div>
              <p className="leading-relaxed font-medium text-slate-200">{structure.action}</p>
            </div>

            {/* Region & Layering Hierarchy */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-2 text-xs">
                <Layers className="w-3.5 h-3.5" />
                <span>System Classification</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Type</span>
                  <span className="font-semibold text-slate-200 capitalize">{structure.type}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Depth Layer</span>
                  <span className="font-semibold text-slate-200 capitalize">{structure.layer}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Origin Attachment */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5 text-xs">
                <Bone className="w-3.5 h-3.5" />
                <span>Origin (Proximal Attachment)</span>
              </div>
              <p className="leading-relaxed text-slate-300">{structure.origin}</p>
            </div>

            {/* Insertion Attachment */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1.5 text-xs">
                <Bone className="w-3.5 h-3.5" />
                <span>Insertion (Distal Attachment)</span>
              </div>
              <p className="leading-relaxed text-slate-300">{structure.insertion}</p>
            </div>

            {/* Innervation */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-yellow-400 font-semibold mb-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>Nerve Supply (Innervation)</span>
              </div>
              <p className="leading-relaxed text-slate-300">{structure.innervation}</p>
            </div>

            {/* Blood Supply */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1.5 text-xs">
                <Droplet className="w-3.5 h-3.5" />
                <span>Arterial Vascular Supply</span>
              </div>
              <p className="leading-relaxed text-slate-300">{structure.arterialSupply}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
