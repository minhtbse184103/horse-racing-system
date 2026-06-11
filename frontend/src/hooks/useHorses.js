import { useCallback, useEffect, useState } from 'react';
import { createHorse, deleteHorse, getOwnerHorses, updateHorse } from '../services/ownerService';
import { getHorseId } from '../lib';
function getErrorText(error, fallback) {
    return error instanceof Error ? error.message || fallback : fallback;
}
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
        }
        catch (error) {
            setHorseError(getErrorText(error, 'Không thể tải danh sách ngựa.'));
            throw error;
        }
        finally {
            setIsHorsesLoading(false);
        }
    }, []);
    useEffect(() => {
        loadHorses().catch(() => { });
    }, [loadHorses]);
    async function saveHorse(payload, editingHorse) {
        if (editingHorse) {
            const horseId = getHorseId(editingHorse);
            if (!horseId)
                throw new Error('Không tìm thấy mã hồ sơ ngựa.');
            return updateHorse(horseId, payload);
        }
        return createHorse(payload);
    }
    async function removeHorse(horse) {
        const horseId = getHorseId(horse);
        if (!horseId)
            throw new Error('Không tìm thấy mã hồ sơ ngựa.');
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
