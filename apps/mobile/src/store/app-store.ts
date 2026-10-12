import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateProjectInput, PlanId } from '@quellenklar/shared';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createProject,
  deleteProject,
  duplicateProject,
  renameProject,
  setArchived,
  type Clock,
  type LocalProject,
  type ProjectResult,
} from './projects-logic';

const clock: Clock = {
  now: () => new Date().toISOString(),
  uuid: () => randomUUID(),
};

export type SaveState = 'saved' | 'saving' | 'error';

/**
 * Speicherstatus in einem eigenen, nicht persistierten Store – sonst würde jede
 * Statusänderung selbst wieder einen Speichervorgang auslösen.
 */
export const useSaveStatus = create<{ state: SaveState }>(() => ({ state: 'saved' }));

interface AppState {
  hydrated: boolean;
  onboardingCompleted: boolean;
  /** Ohne Anmeldung gilt der kostenlose Tarif. */
  plan: PlanId;
  projects: LocalProject[];

  completeOnboarding: () => void;
  resetOnboarding: () => void;
  addProject: (input: CreateProjectInput) => ProjectResult;
  renameProject: (id: string, name: string) => ProjectResult;
  duplicateProject: (id: string) => ProjectResult;
  archiveProject: (id: string, archived: boolean) => ProjectResult;
  deleteProject: (id: string) => void;
  clearLocalData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const apply = (result: ProjectResult): ProjectResult => {
        if (result.ok) set({ projects: result.projects });
        return result;
      };
      return {
        hydrated: false,
        onboardingCompleted: false,
        plan: 'free',
        projects: [],

        completeOnboarding: () => set({ onboardingCompleted: true }),
        resetOnboarding: () => set({ onboardingCompleted: false }),
        addProject: (input) => apply(createProject(get().projects, input, get().plan, clock)),
        renameProject: (id, name) => apply(renameProject(get().projects, id, name, clock)),
        duplicateProject: (id) => apply(duplicateProject(get().projects, id, get().plan, clock)),
        archiveProject: (id, archived) =>
          apply(setArchived(get().projects, id, archived, get().plan, clock)),
        deleteProject: (id) => set({ projects: deleteProject(get().projects, id) }),
        clearLocalData: () => set({ projects: [], onboardingCompleted: false }),
      };
    },
    {
      name: 'quellenklar-app',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (key) => AsyncStorage.getItem(key),
        setItem: async (key, value) => {
          useSaveStatus.setState({ state: 'saving' });
          try {
            await AsyncStorage.setItem(key, value);
            useSaveStatus.setState({ state: 'saved' });
          } catch (error) {
            useSaveStatus.setState({ state: 'error' });
            throw error;
          }
        },
        removeItem: (key) => AsyncStorage.removeItem(key),
      })),
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        projects: state.projects,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);
