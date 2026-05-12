interface TelegramUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        auth_date?: number;
        hash?: string;
    };
    ready: () => void;
    expand: () => void;
}

export {};

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}