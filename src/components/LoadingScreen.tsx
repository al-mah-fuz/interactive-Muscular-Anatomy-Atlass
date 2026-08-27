/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  error: string | null;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, error, onRetry }) => {
  return (
    <div
      id="anatomy-loading-screen"
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg select-none px-4"
    >
      <div className="w-full max-w-md text-center flex flex-col items-center">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-2xl shadow-red-900/40 border border-rose-500/30 animate-pulse">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-sky-500 rounded-full shadow-lg">
            <Activity className="w-3.5 h-3.5 text-white animate-bounce" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
          Loading 3D Anatomy...
        </h2>

        {error ? (
          <div className="bg-rose-950/70 border border-rose-800/80 p-4 rounded-xl text-rose-200 text-xs text-left w-full space-y-2 mt-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Model Loading Error</span>
            </div>
            <p className="leading-relaxed text-rose-300/80 break-words font-mono text-[11px]">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full space-y-3 mt-1">
            <p className="text-xs text-slate-400 font-medium">
              Loading 3D Anatomy Models ({progress}%)
            </p>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 rounded-full shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${Math.max(progress, 8)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 tracking-wide">
              Parsing anatomical scene graph and structures...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
