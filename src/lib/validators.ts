export function isValidEmail(
    email: string
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

export function isValidPhone(
    phone: string
) {
    // VN phone
    return /^(0|\+84)[0-9]{9,10}$/.test(
        phone
    );
}