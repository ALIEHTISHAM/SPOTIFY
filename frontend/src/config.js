let API_URL = process.env.REACT_APP_API_URL;
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}
export default API_URL; 