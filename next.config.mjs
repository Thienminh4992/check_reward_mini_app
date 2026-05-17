/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        const noStore = [
            {
                key: "Cache-Control",
                value: "private, no-cache, no-store, must-revalidate",
            },
        ];
        const paths = ["/", "/login", "/register", "/home", "/reward", "/admin"];
        return paths.map((source) => ({
            source,
            headers: noStore,
        }));
    },
};

export default nextConfig;