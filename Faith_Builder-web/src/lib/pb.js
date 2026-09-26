import PocketBase from 'pocketbase';

// The 'export const' creates a named export, which requires the { } brackets when importing
export const pb = new PocketBase('http://127.0.0.1:8090');