/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ANATOMY_STRUCTURES, AnatomicalStructure } from '../data/anatomyData';
import { SelectedStructureState } from '../types';

// Fast direct lookup maps
const rawNameToStructureMap = new Map<string, AnatomicalStructure>();
const lowerNameToStructureMap = new Map<string, AnatomicalStructure>();

ANATOMY_STRUCTURES.forEach((struct) => {
  rawNameToStructureMap.set(struct.rawMeshName.toLowerCase(), struct);
  lowerNameToStructureMap.set(struct.name.toLowerCase(), struct);
});

/**
 * Determine lateral side from mesh name or structure name
 */
export function extractSideFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('left') || lower.includes('.l.') || lower.includes('_l_') || lower.endsWith('_l')) {
    return 'Left';
  }
  if (lower.includes('right') || lower.includes('.r.') || lower.includes('_r_') || lower.endsWith('_r')) {
    return 'Right';
  }
  if (lower.includes('median') || lower.includes('middle') || lower.includes('vertebra') || lower.includes('sternum') || lower.includes('sacrum')) {
    return 'Midline';
  }
  return 'Bilateral';
}

/**
 * Format raw mesh name into clean Title Case
 */
export function cleanMeshDisplayName(rawName: string): string {
  return rawName
    .replace(/\.[rljg]\.\d+$/i, '')
    .replace(/\.\d+$/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Match a raw 3D mesh name to its anatomical knowledge record
 */
export function findStructureByMeshName(meshName: string): SelectedStructureState | null {
  const lower = meshName.toLowerCase().trim();

  // 1. Direct raw mesh name match
  if (rawNameToStructureMap.has(lower)) {
    const struct = rawNameToStructureMap.get(lower)!;
    return {
      structure: struct,
      meshName,
      cleanName: struct.name,
      side: extractSideFromName(struct.name || meshName),
    };
  }

  // 2. Stripped name lookup
  const cleanTitle = cleanMeshDisplayName(meshName);
  const cleanLower = cleanTitle.toLowerCase();

  if (lowerNameToStructureMap.has(cleanLower)) {
    const struct = lowerNameToStructureMap.get(cleanLower)!;
    return {
      structure: struct,
      meshName,
      cleanName: struct.name,
      side: extractSideFromName(struct.name || meshName),
    };
  }

  // 3. Partial substring search across catalog
  const found = ANATOMY_STRUCTURES.find(
    (s) =>
      s.rawMeshName.toLowerCase() === lower ||
      s.name.toLowerCase() === cleanLower ||
      lower.includes(s.rawMeshName.toLowerCase()) ||
      s.rawMeshName.toLowerCase().includes(lower)
  );

  if (found) {
    return {
      structure: found,
      meshName,
      cleanName: found.name,
      side: extractSideFromName(found.name || meshName),
    };
  }

  // 4. Safe fallback for any unmatched structure in the 3D model
  const side = extractSideFromName(meshName);
  const fallbackStructure: AnatomicalStructure = {
    id: 'struct_' + meshName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
    name: cleanTitle,
    rawMeshName: meshName,
    type: meshName.toLowerCase().includes('bone') ? 'bone' : 'muscle',
    region: 'Thorax',
    layer: 'superficial',
    origin: 'Anatomical origin attachment site on skeleton and fascia.',
    insertion: 'Distal anatomical insertion point.',
    action: 'Contraction generates mechanical force for movement and joint stabilization.',
    innervation: 'Regional peripheral motor and sensory nerve fibers.',
    arterialSupply: 'Segmental vascular arterial arcade.',
    description: `${cleanTitle} is an identifiable anatomical structure in the 3D musculoskeletal model.`,
  };

  return {
    structure: fallbackStructure,
    meshName,
    cleanName: cleanTitle,
    side,
  };
}

/**
 * Filter structures by region, layer, and search query
 */
export function filterAnatomyCatalog(
  structures: AnatomicalStructure[],
  options: {
    region?: string;
    layer?: string;
    type?: 'all' | 'muscle' | 'bone';
    searchQuery?: string;
  }
): AnatomicalStructure[] {
  const { region, layer, type, searchQuery } = options;
  const q = searchQuery?.toLowerCase().trim();

  return structures.filter((item) => {
    if (region && region !== 'All' && item.region !== region) {
      return false;
    }
    if (layer && layer !== 'all' && item.layer !== layer && item.layer !== 'skeletal') {
      return false;
    }
    if (type && type !== 'all') {
      if (type === 'muscle' && item.type === 'bone') return false;
      if (type === 'bone' && item.type !== 'bone') return false;
    }
    if (q) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchRegion = item.region.toLowerCase().includes(q);
      const matchAction = item.action.toLowerCase().includes(q);
      const matchMesh = item.rawMeshName.toLowerCase().includes(q);
      return matchName || matchRegion || matchAction || matchMesh;
    }
    return true;
  });
}
