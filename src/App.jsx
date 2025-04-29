import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import esES from 'antd/locale/es_ES'; // Importar localización en español

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage'; // Añadido
import EquipmentPage from './pages/EquipmentPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage'; // Añadido
import TechnicalAidsPage from './pages/TechnicalAidsPage'; // Renombrado
// Importa aquí otras páginas si las necesitas

function App() {
  return (
    <ConfigProvider locale={esES}> {/* Aplicar localización española a Ant Design */}
      <AntdApp> { /* Envolver con el componente App de Ant Design */ }
        <Router> {/* Usamos HashRouter por compatibilidad con Electron */}
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:studentId" element={<StudentDetailPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/equipment/:equipmentId" element={<EquipmentDetailPage />} />
              <Route path="/technical-aids" element={<TechnicalAidsPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App; 