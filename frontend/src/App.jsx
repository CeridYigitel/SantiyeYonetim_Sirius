import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; // <-- YENİ EKLENDİ
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Yeni Dashboard rotamızı ekledik */}
        <Route path="/dashboard" element={<Dashboard />} /> 
        
        {/* Saçma bir adrese girilirse login'e at */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;