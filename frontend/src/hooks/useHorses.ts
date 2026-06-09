import { useCallback, useEffect, useState } from 'react';
import { createHorse, deleteHorse, getOwnerHorses, updateHorse } from '../services/ownerService';
import { getHorseId } from '../lib';
import type { Horse, HorsePayload } from '../types';

// MERGED FROM ZIP FRONTEND:
// Keeps horse CRUD state aligned with the merged owner horse DTO flow.
function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function useHorses() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isHorsesLoading, setIsHorsesLoading] = useState(true);
  const [horseError, setHorseError] = useState('');

  const loadHorses = useCallback(async () => {
    setIsHorsesLoading(true);
    setHorseError('');

    try {
      const data = await getOwnerHorses();
      const safeData = Array.isArray(data) ? data : [];
      setHorses(safeData);
      return safeData;
    } catch (error) {
      setHorseError(getErrorText(error, 'Không thể tải danh sách ngựa.'));
      throw error;
    } finally {
      setIsHorsesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHorses().catch(() => {});
  }, [loadHorses]);

  async function saveHorse(payload: HorsePayload, editingHorse: Horse | null) {
    if (editingHorse) {
      const horseId = getHorseId(editingHorse);
      if (!horseId) throw new Error('Không tìm thấy mã hồ sơ ngựa.');
      return updateHorse(horseId, payload);
    }
    return createHorse(payload);
  }

  async function removeHorse(horse: Horse) {
    const horseId = getHorseId(horse);
    if (!horseId) throw new Error('Không tìm thấy mã hồ sơ ngựa.');
    return deleteHorse(horseId);
  }

  return {
    horses,
    setHorses,
    isHorsesLoading,
    horseError,
    loadHorses,
    saveHorse,
    removeHorse
  };
}
