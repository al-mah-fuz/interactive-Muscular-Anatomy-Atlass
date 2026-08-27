/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnatomicalStructure } from './data/anatomyData';

export type AnatomicalRegion =
  | 'All'
  | 'Head & Neck'
  | 'Thorax'
  | 'Abdomen'
  | 'Pelvis & Perineum'
  | 'Back & Spine'
  | 'Shoulder'
  | 'Arm & Elbow'
  | 'Forearm & Wrist'
  | 'Hand'
  | 'Gluteal Region & Hip'
  | 'Thigh & Knee'
  | 'Leg & Ankle'
  | 'Foot'
  | 'Skeleton';

export type MuscleLayer = 'all' | 'superficial' | 'intermediate' | 'deep';

export interface SystemVisibility {
  muscles: boolean;
  skeleton: boolean;
  tendons: boolean;
}

export type CameraView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'RESET';

export type VisMode = 'normal' | 'transparent' | 'isolated';

export type ShadingMode = 'anatomical' | 'clay' | 'silhouette' | 'wireframe';

export type AppMode = 'atlas' | 'study';

export interface SelectedStructureState {
  structure: AnatomicalStructure;
  meshName: string;
  cleanName: string;
  side: string;
  meshCenter?: [number, number, number];
}
