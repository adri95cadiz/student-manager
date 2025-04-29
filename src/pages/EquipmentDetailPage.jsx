import React from 'react';
import { useParams } from 'react-router-dom';

const EquipmentDetailPage = () => {
  const { equipmentId } = useParams();

  return (
    <div>
      <h1>Detalle del Equipo (ID: {equipmentId})</h1>
      {/* Aquí irá la info del equipo y su historial de préstamos */}
    </div>
  );
};

export default EquipmentDetailPage; 