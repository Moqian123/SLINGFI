import axios, {AxiosInstance, AxiosRequestConfig,AxiosResponse, AxiosError} from 'axios';

// Set config defaults when creating the instance
const servers:AxiosInstance = axios.create({
    baseURL: 'http://149.104.18.64',
    timeout: 2000,
});

// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN; //请求头
// 添加请求拦截器
servers.interceptors.request.use((config:AxiosRequestConfig) => {
    // 在发送请求之前做些什么
    return config;
}, (error: AxiosError) =>  {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
servers.interceptors.response.use((response: AxiosResponse) => {
    // 对响应数据做点什么
    return response;
}, (error: AxiosError) => {
    // 对响应错误做点什么
    return Promise.reject(error);
});

export const http = {
    post<T = any >(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
        return servers.post(url, data, config)
    },
    get<T = any >(url: string, config?: AxiosRequestConfig): Promise<T>{
        return servers.get(url, config)
    }
}

export default servers
