// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones expuestas al renderer process

  // Dashboard
  getDashboardStats: (filters) => ipcRenderer.invoke('db-get-dashboard-stats', filters),

  // Estudiantes
  getStudents: () => ipcRenderer.invoke('db-get-students'),
  addStudent: (studentData) => ipcRenderer.invoke('db-add-student', studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('db-delete-student', studentId),
  getStudentDetail: (studentId) => ipcRenderer.invoke('db-get-student-detail', studentId),
  updateStudent: (studentData) => ipcRenderer.invoke('db-update-student', studentData),

  // Equipamientos
  getEquipment: () => ipcRenderer.invoke('db-get-equipment'),
  addEquipment: (equipmentData) => ipcRenderer.invoke('db-add-equipment', equipmentData),
  deleteEquipment: (equipmentId) => ipcRenderer.invoke('db-delete-equipment', equipmentId),
  getEquipmentDetail: (equipmentId) => ipcRenderer.invoke('db-get-equipment-detail', equipmentId),
  updateEquipment: (equipmentData) => ipcRenderer.invoke('db-update-equipment', equipmentData),

  // Ayudas Técnicas
  getTechnicalAids: () => ipcRenderer.invoke('db-get-technical-aids'),
  addTechnicalAid: (aidData) => ipcRenderer.invoke('db-add-technical-aid', aidData),
  returnTechnicalAid: (returnData) => ipcRenderer.invoke('db-return-technical-aid', returnData),
  updateTechnicalAid: (aidData) => ipcRenderer.invoke('db-update-technical-aid', aidData),
  deleteTechnicalAid: (aidId) => ipcRenderer.invoke('db-delete-technical-aid', aidId),
});
