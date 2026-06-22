import { useEffect, useState } from 'react';
import { getCurrentUser, getMe, getToken, logout, updateStoredUser } from '../services/authService';
export function useAuth() {
    const [user, setUser] = useState(() => (getToken() ? getCurrentUser() : null));
    function clearAuth() {
        logout();
        setUser(null);
    }
    useEffect(() => {
        let cancelled = false;
        async function refreshCurrentUser() {
            if (!getToken())
                return;
            try {
                const freshUser = await getMe();
                if (cancelled)
                    return;
                updateStoredUser(freshUser);
                setUser(freshUser);
            }
            catch (error) {
                if (!cancelled && (error?.status === 401 || error?.status === 403 || !getToken())) {
                    clearAuth();
                }
            }
        }
        function handleAuthExpired() {
            setUser(null);
        }
        window.addEventListener('auth:expired', handleAuthExpired);
        refreshCurrentUser();
        return () => {
            cancelled = true;
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, []);
    return { user, setUser, clearAuth };
}
