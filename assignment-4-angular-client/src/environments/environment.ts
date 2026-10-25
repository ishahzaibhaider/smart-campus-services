/**
 * Runtime configuration for the Smart Campus client.
 * The Assignment 3 REST API runs on port 4000 and allows CORS from http://localhost:4200.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api',
  tokenStorageKey: 'scsms.token',
  userStorageKey: 'scsms.user',
};
