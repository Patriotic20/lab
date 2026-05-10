import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import type { User } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: ReadonlySet<string>;
    hasPermission: (name: string) => boolean;
    hasAnyPermission: (...names: string[]) => boolean;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const response = await api.get<User>('/user/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (token: string, refreshToken: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        await fetchUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        // Bug#14 fix: always clear loading state on explicit logout
        setIsLoading(false);
    };

    const refreshMe = async () => {
        await fetchUser();
    };

    const isAuthenticated = !!user;

    const permissions = useMemo<ReadonlySet<string>>(() => {
        const set = new Set<string>();
        if (!user) return set;
        for (const role of user.roles ?? []) {
            for (const p of role.permissions ?? []) {
                set.add(p.name);
            }
        }
        return set;
    }, [user]);

    const hasPermission = (name: string) => permissions.has(name);
    const hasAnyPermission = (...names: string[]) => names.some((n) => permissions.has(n));

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                permissions,
                hasPermission,
                hasAnyPermission,
                login,
                logout,
                refreshMe,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
