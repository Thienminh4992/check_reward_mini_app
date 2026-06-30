/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix Server Actions + production stability
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },

    // Disable caching cho pages
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

    // Important khi deploy Docker/Nginx
    output: "standalone",

    // Tranh loi asset path khi chay domain
    assetPrefix: undefined,

    // Giup on dinh build giua cac container
    generateEtags: false,
};

export default nextConfig;