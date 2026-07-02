/**
 * Wrapper around fetch that auto-redirects to /login on 401 (session expired)
 * and includes credentials (cookies) by default.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    }

    const response = await fetch(path, { ...defaultOptions, ...options })

    // Auto-redirect on 401 (Unauthorized / session expired)
    if (response.status === 401) {
        if (typeof window !== "undefined") {
            window.location.href = "/login"
        }
    }

    return response
}
