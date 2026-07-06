import { useListBibleVerses } from '@workspace/api-client-react';

export const useBibleVerses = (theme?: string) =>
  useListBibleVerses(theme ? { theme } : undefined);
