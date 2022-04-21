export const PORT = process.env.PORT || 3000;
export const DB_NAME = process.env.DB_NAME || 'seattle_demo';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://seattle:seattle_pass@localhost:27017';
export const STORAGE_HOST = process.env.STORAGE_HOST || `http://localhost:${PORT}/store`;
export const HANDLER_HOST = process.env.STORAGE_HOST || `http://localhost:${PORT}/handler`;
