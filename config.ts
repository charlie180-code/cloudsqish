const config = {
    server: {
        port: 5001,
        url: 'http://127.0.0.1',
        urlPrefix: '/archive/v1',
    },
};

export default config;

export type ServerConfig = {
    port: number;
    url: string;
    urlPrefix: string;
};