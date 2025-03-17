import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect from root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Your login route */}
        <Route path="/login" element={<Login />} />
        
        {/* ... existing routes ... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App; 