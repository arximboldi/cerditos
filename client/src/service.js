import axios from 'axios';

export const client = axios.create({baseURL: "/api"});
export const defaultBank = 'olivia';
export const defaultKinds = ['pink', 'lila', 'green', 'yellow'];

client.interceptors.request.use(function (config) {
    document.body.classList.add('loading-indicator');
    return config
}, function (error) {
    return Promise.reject(error);
});

client.interceptors.response.use(function (response) {
    document.body.classList.remove('loading-indicator');
    return response;
}, function (error) {
    document.body.classList.remove('loading-indicator');
    return Promise.reject(error);
});

export function debounce(wait, func, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
