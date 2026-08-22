import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    login as loginApi,
    logout as logoutApi,
    refreshToken as refreshTokenApi,
    type LoginRequest,
} from "../api/authApi";

interface AuthContextValue {
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);

function getTokenPayload(
    token: string
): Record<string, unknown> | null {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const base64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );

        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function getRole(
    token: string | null
): string | null {
    if (!token) {
        return null;
    }

    const payload = getTokenPayload(token);

    if (!payload) {
        return null;
    }

    const roleClaim =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    const oldRoleClaim =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role";

    const role =
        payload[roleClaim] ??
        payload[oldRoleClaim] ??
        payload["role"];

    if (Array.isArray(role)) {
        return role.length > 0
            ? String(role[0])
            : null;
    }

    return role !== undefined && role !== null
        ? String(role)
        : null;
}

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("accessToken")
    );

    const [refreshToken, setRefreshToken] =
        useState<string | null>(
            () => localStorage.getItem("refreshToken")
        );

    const [isLoading, setIsLoading] =
        useState(true);

    const saveTokens = useCallback(
        (
            newToken: string,
            newRefreshToken: string
        ) => {
            localStorage.setItem(
                "accessToken",
                newToken
            );

            localStorage.setItem(
                "refreshToken",
                newRefreshToken
            );

            setToken(newToken);
            setRefreshToken(newRefreshToken);
        },
        []
    );

    const clearTokens = useCallback(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        setToken(null);
        setRefreshToken(null);
    }, []);

    const login = useCallback(
        async (request: LoginRequest) => {
            const response = await loginApi(request);

            /*
             * IMPORTANT:
             * The backend returns:
             *
             * {
             *     token: "...",
             *     refreshToken: "..."
             * }
             *
             * NOT accessToken.
             */
            saveTokens(
                response.token,
                response.refreshToken
            );
        },
        [saveTokens]
    );

    const logout = useCallback(async () => {
        const currentRefreshToken =
            localStorage.getItem("refreshToken");

        try {
            if (currentRefreshToken) {
                await logoutApi(
                    currentRefreshToken
                );
            }
        } finally {
            clearTokens();
        }
    }, [clearTokens]);

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            const storedRefreshToken =
                localStorage.getItem("refreshToken");

            const storedAccessToken =
                localStorage.getItem("accessToken");

            if (storedAccessToken) {
                if (!cancelled) {
                    setIsLoading(false);
                }

                return;
            }

            if (!storedRefreshToken) {
                if (!cancelled) {
                    setIsLoading(false);
                }

                return;
            }

            try {
                const response =
                    await refreshTokenApi({
                        refreshToken:
                            storedRefreshToken,
                    });

                if (!cancelled) {
                    saveTokens(
                        response.token,
                        response.refreshToken
                    );
                }
            } catch {
                if (!cancelled) {
                    clearTokens();
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            cancelled = true;
        };
    }, [
        clearTokens,
        saveTokens,
    ]);

    const isAdmin =
        getRole(token) === "Admin";

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            refreshToken,
            isAuthenticated:
                token !== null,
            isLoading,
            isAdmin,
            login,
            logout,
        }),
        [
            token,
            refreshToken,
            isLoading,
            isAdmin,
            login,
            logout,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}