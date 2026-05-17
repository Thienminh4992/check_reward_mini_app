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

type LoginApiResponse =
    | {
    success: true;
    user: unknown;
}
    | {
    success: false;
    needs_register: true;
}
    | {
    success: false;
    error: string;
};

export async function loginWithUidPassword(
    payload: LoginPayload
): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data: LoginApiResponse = await res.json();
    if (data.success) {
        return data;
    }

    if ("needs_register" in data && data.needs_register) {
        return data;
    }

    if ("error" in data) {
        return {
            success: false,
            error: data.error,
        };
    }

    return {
        success: false,
        error: "Đăng nhập thất bại",
    };
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

export interface RegisterErrorResponse {
    success: false;
    error: string;
}

export type RegisterResponse =
    | RegisterSuccessResponse
    | RegisterErrorResponse;

type RegisterApiResponse =
    | {
    success: true;
    user: unknown;
}
    | {
    success: false;
    error: string;
};

export async function registerFamAccount(
    payload: RegisterPayload
): Promise<RegisterSuccessResponse> {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data: RegisterApiResponse = await res.json();

    if (!data.success) {
        throw new Error(data.error || "Đăng ký thất bại");
    }

    return data;
}