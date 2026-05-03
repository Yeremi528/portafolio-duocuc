const LOCAL_URL = 'http://localhost:8080';
const PROD_URL = 'https://go-security-947017986235.southamerica-west1.run.app';

export const URL_BASE = __DEV__ ? LOCAL_URL : PROD_URL;
