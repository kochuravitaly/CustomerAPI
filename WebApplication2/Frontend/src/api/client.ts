const API_BASE_URL = "";

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const accessToken = localStorage.getItem("accessToken");

    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const error = await response.json();

            if (error?.detail) {
                message = error.detail;
            } else if (error?.title) {
                message = error.title;
            } else if (error?.message) {
                message = error.message;
            }
        } catch {
            // Response was not JSON.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export function getApiUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${API_BASE_URL}${path}`;
}