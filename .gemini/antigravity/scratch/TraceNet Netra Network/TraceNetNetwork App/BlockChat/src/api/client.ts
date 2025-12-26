import axios from 'axios';

// Configuration
const API_URL = 'https://tracenet-blockchain-136028201808.us-central1.run.app';
// const API_URL = 'http://localhost:3000'; // Uncomment for local development

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
