import { registerInterceptor } from 'axios-cached-dns-resolve';
import axios from 'axios';

const axiosClient = axios.create();

registerInterceptor(axiosClient);

export { axiosClient as http };
