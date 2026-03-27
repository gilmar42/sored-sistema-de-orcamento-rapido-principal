import { Material } from '../types';

// Lightweight normalization utilities for components/materials.
// Exposed so DataContext and migration UI can share the same logic.
export const tryParseJSON = (v: any) => {
  if (typeof v !== 'string') return null;
  try { return JSON.parse(v); } catch { return null; }
};

export const pickNumber = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[a-zA-Z%\\s]/g, '').trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const findKey = (obj: any, candidates: string[]) => {
  for (const k of candidates) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return undefined;
};

export const normalizeComponent = (comp: any) => {
  if (!comp || typeof comp !== 'object') return comp;

  let sv = comp.sizeValue;

  if (typeof sv === 'string') {
    const parsed = tryParseJSON(sv);
    if (parsed && typeof parsed === 'object') sv = parsed;
  }

  if (Array.isArray(sv) && sv.length > 0) {
    const firstObj = sv.find((x: any) => x && typeof x === 'object') || sv[0];
    sv = firstObj;
  }

  if (sv && typeof sv === 'object') {
    if (sv.dimensions && typeof sv.dimensions === 'object') sv = { ...sv, ...sv.dimensions };
    if (sv.size && typeof sv.size === 'object') sv = { ...sv, ...sv.size };
  }

  const lengthCandidate = findKey(sv, ['lengthValue', 'length', 'l', 'comprimento']);
  const diameterCandidate = findKey(sv, ['diameterValue', 'diameter', 'd', 'diametro', 'diameter_value']);
  const widthCandidate = findKey(sv, ['widthValue', 'width', 'w', 'largura']);

  const lengthUnitCandidate = findKey(sv, ['lengthUnit', 'length_unit', 'lUnit']);
  const diameterUnitCandidate = findKey(sv, ['diameterUnit', 'diameter_unit', 'dUnit']);
  const widthUnitCandidate = findKey(sv, ['widthUnit', 'width_unit', 'wUnit']);

  const rawLengthInput = comp.rawLengthInput ?? findKey(sv, ['rawLengthInput', 'raw_length', 'raw_length_input']) ?? comp.rawLengthInput;
  const rawDiameterInput = comp.rawDiameterInput ?? findKey(sv, ['rawDiameterInput', 'raw_diameter', 'raw_diameter_input']) ?? comp.rawDiameterInput;
  const rawWidthInput = comp.rawWidthInput ?? findKey(sv, ['rawWidthInput', 'raw_width', 'raw_width_input']) ?? comp.rawWidthInput;

  // Build rawSizeString if we can't extract numeric fields
  let rawSizeString: string | undefined = undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { safeStringify } = require('./safeStringify');
    if (sv) {
      if (Array.isArray(sv)) {
        const mapped = sv.map((el: any) => {
          if (el === null || typeof el === 'undefined') return null;
          if (typeof el === 'string' || typeof el === 'number') return String(el);
          try { return safeStringify(el); } catch { try { return String(el); } catch { return null; } }
        }).filter(Boolean);
        if (mapped.length > 0) rawSizeString = mapped.join(' / ');
      } else {
        const s = safeStringify(sv);
        if (typeof s === 'string' && s.trim() !== '' && s !== '[object Object]') rawSizeString = s;
      }
    }
  } catch {
    rawSizeString = undefined;
  }

  return {
    ...comp,
    lengthValue: pickNumber(lengthCandidate) ?? pickNumber(comp.lengthValue) ?? null,
    lengthUnit: (lengthUnitCandidate ?? comp.lengthUnit ?? '') || '',
    diameterValue: pickNumber(diameterCandidate) ?? pickNumber(comp.diameterValue) ?? null,
    diameterUnit: (diameterUnitCandidate ?? comp.diameterUnit ?? '') || '',
    widthValue: pickNumber(widthCandidate) ?? pickNumber(comp.widthValue) ?? null,
    widthUnit: (widthUnitCandidate ?? comp.widthUnit ?? '') || '',
    rawLengthInput,
    rawDiameterInput,
    rawWidthInput,
    rawSizeString,
  } as any;
};

export const normalizeMaterials = (materials: Material[]): Material[] => {
  return Array.isArray(materials) ? materials.map(mat => ({ ...mat, components: Array.isArray(mat.components) ? mat.components.map((c: any) => normalizeComponent(c)) : [] })) : [];
};

export default normalizeMaterials;
