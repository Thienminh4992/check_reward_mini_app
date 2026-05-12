import type { FamUser } from "@/db/schema";

export interface FamRegistrationInput {
    email: string;
    telegram_account: string;
    discord_account: string;
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

/**
 * Ít nhất một trong email / telegram_account / discord_account khớp với bản ghi fam_users (theo uid).
 */
export function verifyFamUserMatch(
    fam: FamUser,
    input: FamRegistrationInput
): boolean {
    let matched = false;

    if (fam.email?.trim() && input.email.trim()) {
        if (normalize(fam.email) === normalize(input.email)) {
            matched = true;
        }
    }

    if (fam.telegram_account?.trim() && input.telegram_account.trim()) {
        if (normalize(fam.telegram_account) === normalize(input.telegram_account)) {
            matched = true;
        }
    }

    if (fam.discord_account?.trim() && input.discord_account.trim()) {
        if (normalize(fam.discord_account) === normalize(input.discord_account)) {
            matched = true;
        }
    }

    return matched;
}

export function famRecordHasVerifiableFields(fam: FamUser): boolean {
    return Boolean(
        fam.email?.trim() ||
            fam.telegram_account?.trim() ||
            fam.discord_account?.trim()
    );
}
