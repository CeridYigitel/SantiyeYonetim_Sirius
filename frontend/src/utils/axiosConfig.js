import axios from 'axios';

const api = axios.create();

api.interceptors.response.use(response => {
  // Eğer gelen veri { content: [...] } şeklindeyse, onu { data: [...] } haline getir
  if (response.data && response.data.content !== undefined) {
    response.data = response.data.content;
  }
  return response;
});

export default api;