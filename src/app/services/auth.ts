export interface LoginPayload {
    uid: string;
    password: string;
    initData: string | null;
}

export interface LoginSuccessResponse {
    success: true;
    user: unknown;
}

export interface LoginNeedsRegisterResponse {
    success: false;
    needs_register: true;
}

export interface LoginErrorResponse {
    success: false;
    error: string;
}

export type LoginResponse =
    | LoginSuccessResponse
    | LoginNeedsRegisterResponse
    | LoginErrorResponse;

export async function loginWithUidPassword(
    payload: LoginPayload
): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (data.needs_register === true) {
        return { success: false, needs_register: true };
    }

    if (res.ok && data.success === true) {
        return data as LoginSuccessResponse;
    }

    const err =
        typeof data.error === "string" ? data.error : "Đăng nhập thất bại";
    return { success: false, error: err };
}

export interface RegisterPayload {
    email: string;
    uid: string;
    telegram_account: string;
    discord_account: string;
    password: string;
    initData: string | null;
}

export interface RegisterSuccessResponse {
    success: true;
    user: unknown;
}

export async function registerFamAccount(
    payload: RegisterPayload
): Promise<RegisterSuccessResponse> {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
        const err =
            typeof data.error === "string"
                ? data.error
                : "Đăng ký thất bại";
        throw new Error(err);
    }

    if (data.success === true) {
        return data as RegisterSuccessResponse;
    }

    throw new Error("Đăng ký thất bại");
}
