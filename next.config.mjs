/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix Server Actions + production stability
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },

    // Disable caching cho pages quan trọng
    async headers() {
        const noStore = [
            {
                key: "Cache-Control",
                value: "private, no-cache, no-store, must-revalidate",
            },
        ];

        const paths = [
            "/",
            "/login",
            "/register",
            "/home",
            "/reward",
            "/admin",
        ];

        return paths.map((source) => ({
            source,
            headers: noStore,
        }));
    },

    // Quan trọng khi deploy Docker/Nginx
    output: "standalone",

    // tránh lỗi asset path khi chạy domain
    assetPrefix: undefined,

    // giúp ổn định build giữa các container
    generateEtags: false,
};

export default nextConfig;