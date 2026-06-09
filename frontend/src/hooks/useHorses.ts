import { useCallback, useEffect, useState } from 'react';
import { createHorse, deleteHorse, getOwnerHorses, updateHorse } from '../services/ownerService';
import { getHorseId } from '../lib';

export function useHorses() {
  const [horses, setHorses] = useState([]);
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
      setHorseError(error.message || 'Không thể tải danh sách ngựa.');
      throw error;
    } finally {
      setIsHorsesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHorses().catch(() => {});
  }, [loadHorses]);

  async function saveHorse(payload, editingHorse) {
    if (editingHorse) {
      return updateHorse(getHorseId(editingHorse), payload);
    }
    return createHorse(payload);
  }

  async function removeHorse(horse) {
    return deleteHorse(getHorseId(horse));
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
