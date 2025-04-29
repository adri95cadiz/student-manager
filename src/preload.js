// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones expuestas al renderer process

  // Estudiantes
  getStudents: () => ipcRenderer.invoke('db-get-students'),
  addStudent: (studentData) => ipcRenderer.invoke('db-add-student', studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('db-delete-student', studentId),

  // Equipos
  getEquipment: () => ipcRenderer.invoke('db-get-equipment'),
  addEquipment: (equipmentData) => ipcRenderer.invoke('db-add-equipment', equipmentData),
  deleteEquipment: (equipmentId) => ipcRenderer.invoke('db-delete-equipment', equipmentId),

  // Ayudas Técnicas
  getTechnicalAids: () => ipcRenderer.invoke('db-get-technical-aids'),
  addTechnicalAid: (aidData) => ipcRenderer.invoke('db-add-technical-aid', aidData),
  returnTechnicalAid: (returnData) => ipcRenderer.invoke('db-return-technical-aid', returnData),
  updateTechnicalAid: (aidData) => ipcRenderer.invoke('db-update-technical-aid', aidData),
  // deleteTechnicalAid: (aidId) => ipcRenderer.invoke('db-delete-technical-aid', aidId), // Se añadirá después

  // Aquí añadiremos más funciones para lendings más adelante
  // getLendings: (filters) => ipcRenderer.invoke('db-get-lendings', filters),
  // addLending: (lendingData) => ipcRenderer.invoke('db-add-lending', lendingData),
  // returnLending: (lendingId) => ipcRenderer.invoke('db-return-lending', lendingId),
});
