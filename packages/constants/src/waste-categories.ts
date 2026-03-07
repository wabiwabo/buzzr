import { WasteCategory } from '@buzzr/shared-types';

export const WASTE_CATEGORY_LABELS: Record<WasteCategory, string> = {
  [WasteCategory.ORGANIC]: 'Organik',
  [WasteCategory.INORGANIC]: 'Anorganik',
  [WasteCategory.B3]: 'B3 (Bahan Berbahaya & Beracun)',
  [WasteCategory.RECYCLABLE]: 'Daur Ulang',
};
