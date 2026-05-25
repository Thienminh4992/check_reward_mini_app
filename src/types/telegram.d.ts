// src/types/telegram.d.ts
interface TelegramUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export {};

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: TelegramUser;
                    auth_date?: number;
                    hash?: string;
                };
                ready: () => void;
                expand: () => void;
                openLink: (url: string) => void;
                openTelegramLink: (url: string) => void;
            }
        }
    }
}