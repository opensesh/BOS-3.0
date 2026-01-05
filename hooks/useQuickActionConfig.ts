/**
 * Hook to fetch and manage quick action configuration data from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getChannels,
  getContentSubtypes,
  getGoals,
  getPillars,
  addChannel,
  addGoal,
  addPillar,
  updateChannel,
  updateGoal,
  updatePillar,
  deleteChannel,
  deleteGoal,
  deletePillar,
  type Channel,
  type ContentSubtype,
  type Goal,
  type ContentPillar,
  type CreateChannelInput,
  type CreateGoalInput,
  type CreatePillarInput,
  type UpdateChannelInput,
  type UpdateGoalInput,
  type UpdatePillarInput,
} from '@/lib/supabase/quick-action-service';

export interface QuickActionConfig {
  channels: Channel[];
  contentSubtypes: ContentSubtype[];
  goals: Goal[];
  pillars: ContentPillar[];
  isLoading: boolean;
  error: string | null;
  // CRUD operations
  addChannel: (input: CreateChannelInput) => Promise<Channel | null>;
  updateChannel: (id: string, input: UpdateChannelInput) => Promise<Channel | null>;
  deleteChannel: (id: string) => Promise<boolean>;
  addGoal: (input: CreateGoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, input: UpdateGoalInput) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  addPillar: (input: CreatePillarInput) => Promise<ContentPillar | null>;
  updatePillar: (id: string, input: UpdatePillarInput) => Promise<ContentPillar | null>;
  deletePillar: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useQuickActionConfig(): QuickActionConfig {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contentSubtypes, setContentSubtypes] = useState<ContentSubtype[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all config data
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [channelsData, subtypesData, goalsData, pillarsData] = await Promise.all([
        getChannels(),
        getContentSubtypes(),
        getGoals(),
        getPillars(),
      ]);

      setChannels(channelsData);
      setContentSubtypes(subtypesData);
      setGoals(goalsData);
      setPillars(pillarsData);
    } catch (err) {
      console.error('Error loading quick action config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Channel operations
  const handleAddChannel = useCallback(async (input: CreateChannelInput) => {
    const newChannel = await addChannel(input);
    if (newChannel) {
      setChannels(prev => [...prev, newChannel]);
    }
    return newChannel;
  }, []);

  const handleUpdateChannel = useCallback(async (id: string, input: UpdateChannelInput) => {
    const updated = await updateChannel(id, input);
    if (updated) {
      setChannels(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  }, []);

  const handleDeleteChannel = useCallback(async (id: string) => {
    const success = await deleteChannel(id);
    if (success) {
      setChannels(prev => prev.filter(c => c.id !== id));
    }
    return success;
  }, []);

  // Goal operations
  const handleAddGoal = useCallback(async (input: CreateGoalInput) => {
    const newGoal = await addGoal(input);
    if (newGoal) {
      setGoals(prev => [...prev, newGoal]);
    }
    return newGoal;
  }, []);

  const handleUpdateGoal = useCallback(async (id: string, input: UpdateGoalInput) => {
    const updated = await updateGoal(id, input);
    if (updated) {
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
    }
    return updated;
  }, []);

  const handleDeleteGoal = useCallback(async (id: string) => {
    const success = await deleteGoal(id);
    if (success) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
    return success;
  }, []);

  // Pillar operations
  const handleAddPillar = useCallback(async (input: CreatePillarInput) => {
    const newPillar = await addPillar(input);
    if (newPillar) {
      setPillars(prev => [...prev, newPillar]);
    }
    return newPillar;
  }, []);

  const handleUpdatePillar = useCallback(async (id: string, input: UpdatePillarInput) => {
    const updated = await updatePillar(id, input);
    if (updated) {
      setPillars(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  }, []);

  const handleDeletePillar = useCallback(async (id: string) => {
    const success = await deletePillar(id);
    if (success) {
      setPillars(prev => prev.filter(p => p.id !== id));
    }
    return success;
  }, []);

  return {
    channels,
    contentSubtypes,
    goals,
    pillars,
    isLoading,
    error,
    addChannel: handleAddChannel,
    updateChannel: handleUpdateChannel,
    deleteChannel: handleDeleteChannel,
    addGoal: handleAddGoal,
    updateGoal: handleUpdateGoal,
    deleteGoal: handleDeleteGoal,
    addPillar: handleAddPillar,
    updatePillar: handleUpdatePillar,
    deletePillar: handleDeletePillar,
    refresh: loadConfig,
  };
}

