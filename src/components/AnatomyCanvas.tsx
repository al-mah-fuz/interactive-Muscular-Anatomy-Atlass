/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CameraView,
  VisMode,
  ShadingMode,
  SelectedStructureState,
  SystemVisibility,
  MuscleLayer,
} from '../types';
import { findStructureByMeshName } from '../utils/helpers';
import { ANATOMY_STRUCTURES } from '../data/anatomyData';

const ANATOMY_PRIMARY_URL =
  'https://raw.githubusercontent.com/al-mah-fuz/Anatomy07/main/anatomy.glb';
const ANATOMY_FALLBACK_URL = '/models/anatomy.glb';

const SKELETON_PRIMARY_URL =
  'https://raw.githubusercontent.com/al-mah-fuz/Anatomy07/main/skeleton.glb';
const SKELETON_FALLBACK_URL = '/models/skeleton.glb';

interface AnatomyCanvasProps {
  onSelectStructure: (structureState: SelectedStructureState | null) => void;
  selectedStructure: SelectedStructureState | null;
  visMode: VisMode;
  systemVisibility: SystemVisibility;
  layerFilter: MuscleLayer;
  hiddenMeshNames: Set<string>;
  transparentMeshNames: Set<string>;
  cameraView: CameraView | null;
  onCameraViewHandled: () => void;
  showLabels: boolean;
  shadingMode: ShadingMode;
  onLoadingProgress: (progress: number) => void;
  onLoadingComplete: () => void;
  onError: (errorMsg: string) => void;
  isolatedMeshName: string | null;
  focusTarget: [number, number, number] | null;
  onFocusHandled: () => void;
}

export const AnatomyCanvas: React.FC<AnatomyCanvasProps> = ({
  onSelectStructure,
  selectedStructure,
  visMode,
  systemVisibility,
  layerFilter,
  hiddenMeshNames,
  transparentMeshNames,
  cameraView,
  onCameraViewHandled,
  showLabels,
  shadingMode,
  onLoadingProgress,
  onLoadingComplete,
  onError,
  isolatedMeshName,
  focusTarget,
  onFocusHandled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group hierarchy:
  // scene -> rootGroup (handles Z-up to Y-up orientation) -> modelContainer (centered & scaled) -> anatomyGroup & skeletonGroup
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const modelContainerRef = useRef<THREE.Group | null>(null);
  const anatomyGroupRef = useRef<THREE.Group | null>(null);
  const skeletonGroupRef = useRef<THREE.Group | null>(null);

  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const meshCentersRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const meshLayerMapRef = useRef<Map<string, string>>(new Map());

  const defaultCameraStateRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 }>({
    pos: new THREE.Vector3(0, 0, 2.5),
    target: new THREE.Vector3(0, 0, 0),
  });

  const selectedStructureRef = useRef<SelectedStructureState | null>(selectedStructure);
  selectedStructureRef.current = selectedStructure;

  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [labelScreenPos, setLabelScreenPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Camera transition animation ref
  const cameraAnimationRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);

  // Populate anatomical catalog map
  useEffect(() => {
    ANATOMY_STRUCTURES.forEach((struct) => {
      meshLayerMapRef.current.set(struct.rawMeshName.toLowerCase(), struct.layer);
    });
  }, []);

  // Initialize Three.js Scene and Load Models
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    console.log('[AnatomyCanvas] Initializing Three.js Viewport. Canvas Dimensions:', {
      width,
      height,
      devicePixelRatio: window.devicePixelRatio,
    });

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 500);
    camera.position.set(0, 0, 2.5);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    console.log('[AnatomyCanvas] WebGL Renderer mounted:', {
      rendererWidth: renderer.domElement.width,
      rendererHeight: renderer.domElement.height,
      cameraNear: camera.near,
      cameraFar: camera.far,
      cameraFov: camera.fov,
    });

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.15;
    controls.maxDistance = 10.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Comprehensive Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    mainKeyLight.position.set(4, 6, 5);
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.95);
    fillLight.position.set(-4, 3, 4);
    scene.add(fillLight);

    const rimBackLight = new THREE.DirectionalLight(0xfef08a, 1.1);
    rimBackLight.position.set(0, 4, -5);
    scene.add(rimBackLight);

    const floorBounce = new THREE.DirectionalLight(0xffffff, 0.45);
    floorBounce.position.set(0, -5, 2);
    scene.add(floorBounce);

    // Root Group: Rotate Z-up GLB coordinates to Y-up Three.js coordinates
    const rootGroup = new THREE.Group();
    rootGroup.rotation.x = -Math.PI / 2;
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // Inner Model Container
    const modelContainer = new THREE.Group();
    rootGroup.add(modelContainer);
    modelContainerRef.current = modelContainer;

    const anatomyGroup = new THREE.Group();
    const skeletonGroup = new THREE.Group();
    modelContainer.add(anatomyGroup);
    modelContainer.add(skeletonGroup);
    anatomyGroupRef.current = anatomyGroup;
    skeletonGroupRef.current = skeletonGroup;

    const loader = new GLTFLoader();
    let loadedCount = 0;
    const totalFiles = 2;
    const progressMap = { anatomy: 0, skeleton: 0 };

    const updateCombinedProgress = () => {
      const combined = Math.round((progressMap.anatomy + progressMap.skeleton) / 2);
      onLoadingProgress(combined);
    };

    const processMeshesAndFrameCamera = () => {
      console.log('[AnatomyCanvas] Calculating model bounding box and camera framing...');

      // Force world matrix update to ensure accurate geometry bounding calculation
      scene.updateMatrixWorld(true);

      // Compute raw bounds inside modelContainer (in model coordinate space)
      const rawBox = new THREE.Box3().setFromObject(modelContainer);
      const rawCenter = rawBox.getCenter(new THREE.Vector3());
      const rawSize = rawBox.getSize(new THREE.Vector3());

      console.log('[AnatomyCanvas] Raw Model Bounds:', {
        min: rawBox.min.toArray(),
        max: rawBox.max.toArray(),
        center: rawCenter.toArray(),
        size: rawSize.toArray(),
      });

      // Center modelContainer within rootGroup
      modelContainer.position.set(-rawCenter.x, -rawCenter.y, -rawCenter.z);

      // Normalize scale so human anatomy is ~1.8 units tall
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
      if (maxDim > 10) {
        // Model in millimeters (~1670mm)
        const scaleFactor = 1.8 / maxDim;
        rootGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        console.log('[AnatomyCanvas] Applied normalization scale factor:', scaleFactor);
      }

      // Update world matrices after centering and scaling
      scene.updateMatrixWorld(true);

      // Compute world bounding box after transformation
      const worldBox = new THREE.Box3().setFromObject(rootGroup);
      const worldCenter = worldBox.getCenter(new THREE.Vector3());
      const worldSize = worldBox.getSize(new THREE.Vector3());
      const worldMaxDim = Math.max(worldSize.x, worldSize.y, worldSize.z);

      console.log('[AnatomyCanvas] World Transformed Bounds:', {
        worldCenter: worldCenter.toArray(),
        worldSize: worldSize.toArray(),
        worldMaxDim,
      });

      // Cache center of each individual mesh in world coordinates
      meshesRef.current.forEach((mesh, name) => {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          const localCenter = new THREE.Vector3();
          mesh.geometry.boundingBox.getCenter(localCenter);
          const worldCenterPt = localCenter.clone().applyMatrix4(mesh.matrixWorld);
          meshCentersRef.current.set(name.toLowerCase(), worldCenterPt);
        }
      });

      // Frame Camera mathematically to ensure entire human anatomy is clearly visible
      const fovRad = (camera.fov * Math.PI) / 180;
      const cameraDistance = Math.max((worldMaxDim / (2 * Math.tan(fovRad / 2))) * 1.15, 2.2);

      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(worldCenter.x, worldCenter.y, worldCenter.z);
      controls.target.copy(worldCenter);
      controls.update();

      defaultCameraStateRef.current = {
        pos: new THREE.Vector3(0, 0, cameraDistance),
        target: worldCenter.clone(),
      };

      console.log('[AnatomyCanvas] Camera configured and model framed:', {
        cameraPosition: camera.position.toArray(),
        cameraTarget: controls.target.toArray(),
        cameraDistance,
      });

      onLoadingComplete();
    };

    // Helper to load GLTF with fallback
    const loadModelWithFallback = (
      primaryUrl: string,
      fallbackUrl: string,
      modelType: 'anatomy' | 'skeleton',
      onSuccess: (gltf: any) => void
    ) => {
      console.log(`[AnatomyCanvas] Loading ${modelType} started from: ${primaryUrl}`);

      loader.load(
        primaryUrl,
        (gltf) => {
          console.log(`[AnatomyCanvas] Loading ${modelType} completed successfully from primary URL.`);
          onSuccess(gltf);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const p = Math.round((xhr.loaded / xhr.total) * 100);
            progressMap[modelType] = p;
            updateCombinedProgress();
          }
        },
        (err) => {
          console.warn(
            `[AnatomyCanvas] Primary URL failed for ${modelType} (${primaryUrl}), trying local fallback (${fallbackUrl})...`,
            err
          );
          loader.load(
            fallbackUrl,
            (gltf) => {
              console.log(`[AnatomyCanvas] Loading ${modelType} completed from fallback URL.`);
              onSuccess(gltf);
            },
            (xhr) => {
              if (xhr.total > 0) {
                const p = Math.round((xhr.loaded / xhr.total) * 100);
                progressMap[modelType] = p;
                updateCombinedProgress();
              }
            },
            (fallbackErr) => {
              console.error(`[AnatomyCanvas] Failed to load ${modelType} from fallback URL:`, fallbackErr);
              onError(`Failed to load ${modelType} model (${primaryUrl}). Please verify network or file access.`);
            }
          );
        }
      );
    };

    // 1. Load Anatomy (Exposed Musculature & Tendons)
    loadModelWithFallback(
      ANATOMY_PRIMARY_URL,
      ANATOMY_FALLBACK_URL,
      'anatomy',
      (gltf) => {
        const model = gltf.scene;
        anatomyGroup.add(model);

        let objectCount = 0;
        let meshCount = 0;
        const objectNames: string[] = [];

        model.traverse((child) => {
          objectCount++;
          if ((child as THREE.Mesh).isMesh) {
            meshCount++;
            const mesh = child as THREE.Mesh;
            const lowerName = mesh.name.toLowerCase();
            objectNames.push(mesh.name);

            // Create authentic realistic anatomical materials
            const isTendon =
              lowerName.includes('tendon') ||
              lowerName.includes('retinaculum') ||
              lowerName.includes('aponeurosis') ||
              lowerName.includes('membrane') ||
              lowerName.includes('ligament');

            const anatomicalMaterial = new THREE.MeshStandardMaterial({
              color: isTendon ? new THREE.Color('#e2e8f0') : new THREE.Color('#a8282b'),
              roughness: isTendon ? 0.3 : 0.45,
              metalness: 0.05,
              side: THREE.DoubleSide,
            });

            mesh.material = anatomicalMaterial;
            mesh.userData.origMaterial = anatomicalMaterial;
            mesh.userData.meshName = mesh.name;
            mesh.userData.isBone = false;
            mesh.userData.isTendon = isTendon;

            meshesRef.current.set(lowerName, mesh);
          }
        });

        console.log('[AnatomyCanvas] Anatomy Model Loaded:', {
          url: ANATOMY_PRIMARY_URL,
          scenesCount: gltf.scenes ? gltf.scenes.length : 1,
          totalObjects: objectCount,
          totalMeshes: meshCount,
          sampleObjectNames: objectNames.slice(0, 15),
        });

        loadedCount++;
        progressMap.anatomy = 100;
        updateCombinedProgress();

        if (loadedCount === totalFiles) {
          processMeshesAndFrameCamera();
        }
      }
    );

    // 2. Load Skeleton (Articulated Bone System)
    loadModelWithFallback(
      SKELETON_PRIMARY_URL,
      SKELETON_FALLBACK_URL,
      'skeleton',
      (gltf) => {
        const model = gltf.scene;
        skeletonGroup.add(model);

        let objectCount = 0;
        let meshCount = 0;
        const objectNames: string[] = [];

        model.traverse((child) => {
          objectCount++;
          if ((child as THREE.Mesh).isMesh) {
            meshCount++;
            const mesh = child as THREE.Mesh;
            const lowerName = mesh.name.toLowerCase();
            objectNames.push(mesh.name);

            const boneMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#f5f4ef'),
              roughness: 0.55,
              metalness: 0.02,
              side: THREE.DoubleSide,
            });

            mesh.material = boneMaterial;
            mesh.userData.origMaterial = boneMaterial;
            mesh.userData.meshName = mesh.name;
            mesh.userData.isBone = true;
            mesh.userData.isTendon = false;

            meshesRef.current.set(lowerName, mesh);
          }
        });

        console.log('[AnatomyCanvas] Skeleton Model Loaded:', {
          url: SKELETON_PRIMARY_URL,
          scenesCount: gltf.scenes ? gltf.scenes.length : 1,
          totalObjects: objectCount,
          totalMeshes: meshCount,
          sampleObjectNames: objectNames.slice(0, 15),
        });

        loadedCount++;
        progressMap.skeleton = 100;
        updateCombinedProgress();

        if (loadedCount === totalFiles) {
          processMeshesAndFrameCamera();
        }
      }
    );

    // Render & Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation
      if (cameraAnimationRef.current && cameraAnimationRef.current.active) {
        const anim = cameraAnimationRef.current;
        const now = performance.now();
        const progress = Math.min((now - anim.startTime) / anim.duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);
        controls.update();

        if (progress >= 1) {
          anim.active = false;
        }
      } else {
        controls.update();
      }

      renderer.render(scene, camera);

      // Update 3D on-screen pinpoint label
      const currentSelected = selectedStructureRef.current;
      if (currentSelected && cameraRef.current && container) {
        const center = meshCentersRef.current.get(currentSelected.meshName.toLowerCase());
        if (center) {
          const screenPos = center.clone().project(cameraRef.current);
          const isBehind = screenPos.z > 1;
          const currentW = container.clientWidth || width;
          const currentH = container.clientHeight || height;
          const x = ((screenPos.x + 1) * currentW) / 2;
          const y = ((-screenPos.y + 1) * currentH) / 2;
          setLabelScreenPos({
            x,
            y,
            visible: !isBehind && x >= 0 && x <= currentW && y >= 0 && y <= currentH,
          });
        }
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Raycaster & Touch/Mouse Interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pointerDownPos = { x: 0, y: 0 };
    let isDragging = false;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      pointerDownPos = { x: clientX, y: clientY };
      isDragging = false;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dist = Math.hypot(clientX - pointerDownPos.x, clientY - pointerDownPos.y);
      if (dist > 8) {
        isDragging = true;
      }

      // Pointer hover preview for desktop
      if (!('touches' in e) && rootGroupRef.current && cameraRef.current) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, cameraRef.current);
        const intersects = raycaster.intersectObjects(rootGroupRef.current.children, true);

        if (intersects.length > 0) {
          const hit = intersects.find((i) => (i.object as THREE.Mesh).isMesh && i.object.visible);
          if (hit) {
            const structureInfo = findStructureByMeshName(hit.object.name);
            setHoveredName(structureInfo ? structureInfo.cleanName : hit.object.name);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredName(null);
        container.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (isDragging) return;
      if (!rootGroupRef.current || !cameraRef.current) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      const rect = container.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObjects(rootGroupRef.current.children, true);

      if (intersects.length > 0) {
        const hit = intersects.find((i) => (i.object as THREE.Mesh).isMesh && i.object.visible);
        if (hit) {
          const mesh = hit.object as THREE.Mesh;
          const structureState = findStructureByMeshName(mesh.name);
          if (structureState) {
            const center = meshCentersRef.current.get(mesh.name.toLowerCase());
            if (center) {
              structureState.meshCenter = [center.x, center.y, center.z];
            }
            onSelectStructure(structureState);
            return;
          }
        }
      }
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    container.addEventListener('touchend', onPointerUp);

    return () => {
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mouseup', onPointerUp);

      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      container.removeEventListener('touchend', onPointerUp);
    };
  }, [onSelectStructure]);

  // Handle Layered Visibility, Transparency, Isolation, Shading & Highlighting
  useEffect(() => {
    if (meshesRef.current.size === 0) return;

    const selectedMeshName = selectedStructure ? selectedStructure.meshName.toLowerCase() : null;
    const isolatedTargetName = isolatedMeshName ? isolatedMeshName.toLowerCase() : null;

    // Materials
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38bdf8'), // Sky Blue Accent
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.15,
      side: THREE.DoubleSide,
      wireframe: shadingMode === 'wireframe',
    });

    const clayMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e2e8f0'),
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
      wireframe: shadingMode === 'wireframe',
    });

    const silhouetteMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#090d16'),
      emissive: new THREE.Color('#38bdf8'),
      emissiveIntensity: 0.45,
      roughness: 0.6,
      side: THREE.DoubleSide,
      wireframe: shadingMode === 'wireframe',
    });

    meshesRef.current.forEach((mesh, name) => {
      const isSelected = selectedMeshName === name;
      const isIsolatedTarget = isolatedTargetName === name;
      const isBone = mesh.userData.isBone;
      const isTendon = mesh.userData.isTendon;
      const isHiddenByUser = hiddenMeshNames.has(name);
      const isTransparentByUser = transparentMeshNames.has(name);
      const structureLayer = meshLayerMapRef.current.get(name) || 'superficial';

      // 1. Check System Visibility (Muscles vs Skeleton)
      if (isBone && !systemVisibility.skeleton) {
        mesh.visible = false;
        return;
      }
      if (!isBone && !isTendon && !systemVisibility.muscles) {
        mesh.visible = false;
        return;
      }
      if (isTendon && !systemVisibility.tendons && !systemVisibility.muscles) {
        mesh.visible = false;
        return;
      }

      // 2. Check Muscle Layer Filter (all / superficial / intermediate / deep)
      if (!isBone && layerFilter !== 'all') {
        if (layerFilter === 'superficial' && structureLayer !== 'superficial') {
          mesh.visible = false;
          return;
        }
        if (layerFilter === 'intermediate' && structureLayer === 'deep') {
          mesh.visible = false;
          return;
        }
        if (layerFilter === 'deep' && structureLayer === 'superficial') {
          mesh.visible = false;
          return;
        }
      }

      // 3. Check Manual User Hide
      if (isHiddenByUser && !isSelected) {
        mesh.visible = false;
        return;
      }

      // 4. Handle Isolated Mode
      if (visMode === 'isolated' && isolatedTargetName) {
        if (isIsolatedTarget || isSelected) {
          mesh.visible = true;
          mesh.material = highlightMaterial;
        } else {
          mesh.visible = false;
        }
        return;
      }

      // Normal visibility
      mesh.visible = true;

      // 5. If selected, apply glowing highlight material
      if (isSelected) {
        mesh.material = highlightMaterial;
        return;
      }

      // 6. Handle Shading Modes
      if (shadingMode === 'clay') {
        mesh.material = clayMaterial;
      } else if (shadingMode === 'silhouette') {
        mesh.material = silhouetteMaterial;
      } else {
        // Anatomical materials
        const orig = mesh.userData.origMaterial as THREE.MeshStandardMaterial;
        if (orig) {
          if (visMode === 'transparent' || isTransparentByUser) {
            const transMat = orig.clone();
            transMat.transparent = true;
            transMat.opacity = 0.16;
            transMat.depthWrite = false;
            transMat.wireframe = shadingMode === 'wireframe';
            mesh.material = transMat;
          } else {
            if (shadingMode === 'wireframe') {
              const wfMat = orig.clone();
              wfMat.wireframe = true;
              mesh.material = wfMat;
            } else {
              mesh.material = orig;
            }
          }
        }
      }
    });
  }, [
    selectedStructure,
    visMode,
    isolatedMeshName,
    shadingMode,
    systemVisibility,
    layerFilter,
    hiddenMeshNames,
    transparentMeshNames,
  ]);

  // Smooth Camera Animation Helper
  const animateCameraTo = useCallback(
    (targetPos: THREE.Vector3, targetLookAt: THREE.Vector3, duration = 800) => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraAnimationRef.current = {
        active: true,
        startPos: cameraRef.current.position.clone(),
        endPos: targetPos,
        startTarget: controlsRef.current.target.clone(),
        endTarget: targetLookAt,
        startTime: performance.now(),
        duration,
      };
    },
    []
  );

  // Automatically Focus Camera on Selected Structure
  useEffect(() => {
    if (!selectedStructure || !cameraRef.current || !controlsRef.current || meshesRef.current.size === 0)
      return;

    const selectedMeshName = selectedStructure.meshName.toLowerCase();
    const mesh = meshesRef.current.get(selectedMeshName);

    if (mesh) {
      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) {
        const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.08);

        const desiredDistance = Math.min(Math.max(maxDim * 3.2, 0.35), 1.4);

        const currentDir = cameraRef.current.position.clone().sub(controlsRef.current.target);
        if (currentDir.lengthSq() < 0.0001) {
          currentDir.set(0, 0, 1);
        }
        currentDir.normalize();

        const newCameraPos = center.clone().add(currentDir.multiplyScalar(desiredDistance));
        animateCameraTo(newCameraPos, center, 750);
      }
    }
  }, [selectedStructure, animateCameraTo]);

  // Handle Camera View Presets
  useEffect(() => {
    if (!cameraView || !cameraRef.current || !controlsRef.current) return;

    const currentTarget = controlsRef.current.target.clone();
    const distance = cameraRef.current.position.distanceTo(currentTarget) || 2.5;

    let targetPos = new THREE.Vector3();
    let targetCenter = defaultCameraStateRef.current.target.clone();

    switch (cameraView) {
      case 'FRONT':
        targetPos.set(targetCenter.x, targetCenter.y, targetCenter.z + distance);
        break;
      case 'BACK':
        targetPos.set(targetCenter.x, targetCenter.y, targetCenter.z - distance);
        break;
      case 'LEFT':
        targetPos.set(targetCenter.x - distance, targetCenter.y, targetCenter.z);
        break;
      case 'RIGHT':
        targetPos.set(targetCenter.x + distance, targetCenter.y, targetCenter.z);
        break;
      case 'TOP':
        targetPos.set(targetCenter.x, targetCenter.y + distance, targetCenter.z + 0.001);
        break;
      case 'BOTTOM':
        targetPos.set(targetCenter.x, targetCenter.y - distance, targetCenter.z + 0.001);
        break;
      case 'RESET':
        targetPos = defaultCameraStateRef.current.pos.clone();
        targetCenter = defaultCameraStateRef.current.target.clone();
        break;
    }

    animateCameraTo(targetPos, targetCenter, 700);
    onCameraViewHandled();
  }, [cameraView, animateCameraTo, onCameraViewHandled]);

  // Handle Focus Target from UI
  useEffect(() => {
    if (!focusTarget || !cameraRef.current || !controlsRef.current) return;
    const [tx, ty, tz] = focusTarget;
    const targetVec = new THREE.Vector3(tx, ty, tz);

    const currentOffset = cameraRef.current.position.clone().sub(controlsRef.current.target).normalize();
    const desiredDistance = 0.6;
    const newCameraPos = targetVec.clone().add(currentOffset.multiplyScalar(desiredDistance));

    animateCameraTo(newCameraPos, targetVec, 800);
    onFocusHandled();
  }, [focusTarget, animateCameraTo, onFocusHandled]);

  return (
    <div
      ref={containerRef}
      id="anatomy-viewport"
      className="relative w-full h-full select-none outline-none overflow-hidden touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* 3D Dynamic Floating Label for Selected Structure */}
      {showLabels && selectedStructure && labelScreenPos.visible && (
        <div
          id="muscle-3d-pin-label"
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75"
          style={{
            left: `${labelScreenPos.x}px`,
            top: `${labelScreenPos.y - 12}px`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 bg-slate-900/90 text-sky-300 backdrop-blur-md rounded-md shadow-lg border border-sky-500/40 text-xs font-semibold tracking-wide flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block" />
              <span>{selectedStructure.cleanName}</span>
              {selectedStructure.side && selectedStructure.side !== 'Bilateral' && (
                <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-1 py-0.5 rounded">
                  {selectedStructure.side}
                </span>
              )}
            </div>
            <div className="w-0.5 h-3 bg-sky-400/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          </div>
        </div>
      )}

      {/* Hover preview tooltip at cursor */}
      {hoveredName && !selectedStructure && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10 px-3 py-1.5 bg-slate-900/85 text-slate-200 backdrop-blur-md rounded-full border border-slate-700 text-xs font-medium tracking-wide shadow-md">
          {hoveredName}
        </div>
      )}
    </div>
  );
};
