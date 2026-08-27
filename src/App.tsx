/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { AnatomyCanvas } from './components/AnatomyCanvas';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MuscleInfoPanel } from './components/MuscleInfoPanel';
import { ViewControls } from './components/ViewControls';
import { VisualizationBar } from './components/VisualizationBar';
import { StudyModeOverlay } from './components/StudyModeOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import {
  AnatomicalRegion,
  CameraView,
  VisMode,
  ShadingMode,
  AppMode,
  SelectedStructureState,
  SystemVisibility,
  MuscleLayer,
} from './types';

export default function App() {
  // Core Anatomical State
  const [selectedStructure, setSelectedStructure] = useState<SelectedStructureState | null>(null);
  const [activeRegion, setActiveRegion] = useState<AnatomicalRegion>('All');
  const [layerFilter, setLayerFilter] = useState<MuscleLayer>('all');
  const [systemVisibility, setSystemVisibility] = useState<SystemVisibility>({
    muscles: true,
    skeleton: true,
    tendons: true,
  });

  // Layer Dissection State (Hidden & Transparent Meshes)
  const [hiddenMeshNames, setHiddenMeshNames] = useState<Set<string>>(new Set());
  const [transparentMeshNames, setTransparentMeshNames] = useState<Set<string>>(new Set());

  // Visualization & Shading State
  const [visMode, setVisMode] = useState<VisMode>('normal');
  const [cameraView, setCameraView] = useState<CameraView | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [shadingMode, setShadingMode] = useState<ShadingMode>('anatomical');
  const [appMode, setAppMode] = useState<AppMode>('atlas');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Loading and Error State
  const [loadingProgress, setLoadingProgress] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Camera Focus Target
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);

  // Handlers
  const handleSelectStructure = useCallback((structureState: SelectedStructureState | null) => {
    setSelectedStructure(structureState);
  }, []);

  const handleToggleIsolate = useCallback(() => {
    if (visMode === 'isolated') {
      setVisMode('normal');
    } else {
      setVisMode('isolated');
    }
  }, [visMode]);

  const handleToggleHide = useCallback((meshName: string) => {
    setHiddenMeshNames((prev) => {
      const next = new Set(prev);
      const lower = meshName.toLowerCase();
      if (next.has(lower)) {
        next.delete(lower);
      } else {
        next.add(lower);
      }
      return next;
    });
  }, []);

  const handleToggleSystem = useCallback((system: keyof SystemVisibility) => {
    setSystemVisibility((prev) => ({
      ...prev,
      [system]: !prev[system],
    }));
  }, []);

  const handleResetDissection = useCallback(() => {
    setHiddenMeshNames(new Set());
    setTransparentMeshNames(new Set());
    setLayerFilter('all');
    setVisMode('normal');
    setSystemVisibility({ muscles: true, skeleton: true, tendons: true });
  }, []);

  const handleFocusCamera = useCallback(() => {
    if (selectedStructure?.meshCenter) {
      setFocusTarget(selectedStructure.meshCenter);
    }
  }, [selectedStructure]);

  const handleResetCamera = useCallback(() => {
    setCameraView('RESET');
    setFocusTarget(null);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Loading Overlay */}
      {isLoading && (
        <LoadingScreen
          progress={loadingProgress}
          error={loadError}
          onRetry={() => {
            setLoadError(null);
            setIsLoading(true);
            setLoadingProgress(10);
          }}
        />
      )}

      {/* Header Bar */}
      <Header
        onSelectStructure={(structureState) => {
          handleSelectStructure(structureState);
          if (structureState.meshCenter) {
            setFocusTarget(structureState.meshCenter);
          }
        }}
        appMode={appMode}
        onAppModeChange={setAppMode}
        onResetCamera={handleResetCamera}
      />

      {/* Main Workspace Area */}
      <main className="relative flex-1 w-full h-full flex overflow-hidden">
        {/* Left Regional Hierarchy Sidebar */}
        <div className="hidden md:block h-full shrink-0">
          <Sidebar
            selectedStructure={selectedStructure}
            onSelectStructure={(structureState) => {
              handleSelectStructure(structureState);
              if (structureState.meshCenter) {
                setFocusTarget(structureState.meshCenter);
              }
            }}
            activeRegion={activeRegion}
            onSelectRegion={setActiveRegion}
            layerFilter={layerFilter}
            onSelectLayer={setLayerFilter}
            systemVisibility={systemVisibility}
            onToggleSystem={handleToggleSystem}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {/* Central 3D Anatomy Canvas */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          <AnatomyCanvas
            onSelectStructure={handleSelectStructure}
            selectedStructure={selectedStructure}
            visMode={visMode}
            systemVisibility={systemVisibility}
            layerFilter={layerFilter}
            hiddenMeshNames={hiddenMeshNames}
            transparentMeshNames={transparentMeshNames}
            cameraView={cameraView}
            onCameraViewHandled={() => setCameraView(null)}
            showLabels={showLabels}
            shadingMode={shadingMode}
            onLoadingProgress={setLoadingProgress}
            onLoadingComplete={() => setIsLoading(false)}
            onError={(msg) => {
              setLoadError(msg);
              setIsLoading(true);
            }}
            isolatedMeshName={
              visMode === 'isolated' && selectedStructure ? selectedStructure.meshName : null
            }
            focusTarget={focusTarget}
            onFocusHandled={() => setFocusTarget(null)}
          />

          {/* Top Visualization Bar */}
          <VisualizationBar
            visMode={visMode}
            onVisModeChange={setVisMode}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((prev) => !prev)}
            shadingMode={shadingMode}
            onShadingModeChange={setShadingMode}
            systemVisibility={systemVisibility}
            onToggleSystem={handleToggleSystem}
            layerFilter={layerFilter}
            onSelectLayer={setLayerFilter}
            hasSelectedStructure={!!selectedStructure}
            hiddenCount={hiddenMeshNames.size}
            onResetDissection={handleResetDissection}
          />

          {/* Anatomical Camera View Presets */}
          <ViewControls
            onSelectView={(v) => {
              if (v === 'RESET') {
                handleResetCamera();
              } else {
                setCameraView(v);
              }
            }}
            activeView={cameraView}
          />
        </div>

        {/* Right Structure Information Panel (Desktop & Mobile drawer) */}
        {selectedStructure && (
          <div className="absolute inset-x-0 bottom-0 md:static md:inset-auto h-auto md:h-full shrink-0 z-30">
            <MuscleInfoPanel
              selectedStructure={selectedStructure}
              onDeselect={() => {
                setSelectedStructure(null);
                if (visMode === 'isolated') {
                  setVisMode('normal');
                }
              }}
              visMode={visMode}
              onToggleIsolate={handleToggleIsolate}
              onFocusCamera={handleFocusCamera}
              onToggleHide={handleToggleHide}
              isMeshHidden={hiddenMeshNames.has(selectedStructure.meshName.toLowerCase())}
            />
          </div>
        )}

        {/* Study Mode Interactive Flashcard / Quiz Overlay */}
        {appMode === 'study' && (
          <StudyModeOverlay
            onSelectStructure={(structureState) => {
              handleSelectStructure(structureState);
              if (structureState.meshCenter) {
                setFocusTarget(structureState.meshCenter);
              }
            }}
            onExitStudyMode={() => setAppMode('atlas')}
          />
        )}
      </main>
    </div>
  );
}
