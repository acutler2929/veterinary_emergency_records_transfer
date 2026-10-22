import { createContext, useContext } from 'react';
import { recordsApi } from '../services/api';

export const WorkspaceContext = createContext({
  api: recordsApi,
  preview: false,
  prefix: '',
});
export function useWorkspace() {
  return useContext(WorkspaceContext);
}
