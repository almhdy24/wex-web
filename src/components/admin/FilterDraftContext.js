import { createContext, useContext } from 'react';

export const FilterDraftContext = createContext(null);

export function useFilterDraft() {
  return useContext(FilterDraftContext);
}

export default FilterDraftContext;
