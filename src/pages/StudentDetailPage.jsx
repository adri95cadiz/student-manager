import React from 'react';
import { useParams } from 'react-router-dom';

const StudentDetailPage = () => {
  const { studentId } = useParams();

  return (
    <div>
      <h1>Detalle del Estudiante (ID: {studentId})</h1>
      {/* Aquí irá la info del estudiante y su historial de préstamos */}
    </div>
  );
};

export default StudentDetailPage; 