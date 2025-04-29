const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

// Determinar la ruta de la base de datos
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
let db; // Variable para mantener la conexión a la BD

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Conectar a la base de datos e inicializarla
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      db.serialize(() => {
        // Crear tabla de estudiantes si no existe
        db.run(`CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          surname TEXT NOT NULL,
          second_surname TEXT,
          nie TEXT UNIQUE,
          student_number TEXT UNIQUE NOT NULL
        )`, (err) => {
          if (err) console.error("Error creating students table", err.message);
        });

        // Crear tabla de equipos si no existe
        db.run(`CREATE TABLE IF NOT EXISTS equipment (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          equipment_number TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          initial_stock INTEGER DEFAULT 1
        )`, (err) => {
           if (err) console.error("Error creating equipment table", err.message);
        });

        // Crear tabla de préstamos si no existe
        db.run(`CREATE TABLE IF NOT EXISTS lendings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          equipment_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          lending_date TEXT NOT NULL,
          return_date TEXT,
          school_year TEXT NOT NULL,
          FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
        )`, (err) => {
           if (err) console.error("Error creating lendings table", err.message);
        });
      });
    }
  });

  createWindow();

  // --- Manejadores IPC para la Base de Datos ---

  // Ejemplo: Obtener todos los estudiantes
  ipcMain.handle('db-get-students', async (event, args) => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM students", [], (err, rows) => {
        if (err) {
          console.error('Error fetching students:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  // Obtener un estudiante por ID con sus préstamos
  ipcMain.handle('db-get-student-detail', async (event, studentId) => {
    return new Promise((resolve, reject) => {
      // Primero obtenemos los datos del estudiante
      db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
        if (err) {
          console.error('Error fetching student:', err.message);
          return reject(err);
        }
        
        if (!student) {
          return reject(new Error('No se encontró el estudiante con el ID proporcionado.'));
        }
        
        // Luego obtenemos los préstamos asociados al estudiante
        const lendingsSql = `
          SELECT 
            l.id, l.quantity, l.lending_date, l.return_date, l.school_year,
            e.id as equipment_id, e.name as equipment_name, e.equipment_number
          FROM lendings l
          JOIN equipment e ON l.equipment_id = e.id
          WHERE l.student_id = ?
          ORDER BY l.lending_date DESC
        `;
        
        db.all(lendingsSql, [studentId], (err, lendings) => {
          if (err) {
            console.error('Error fetching student lendings:', err.message);
            return reject(err);
          }
          
          // Devolvemos estudiante con sus préstamos
          resolve({
            ...student,
            lendings: lendings || []
          });
        });
      });
    });
  });

  // Ejemplo: Añadir un estudiante
  ipcMain.handle('db-add-student', async (event, studentData) => {
    const { name, surname, second_surname, nie, student_number } = studentData;
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO students (name, surname, second_surname, nie, student_number) VALUES (?, ?, ?, ?, ?)`;
      db.run(sql, [name, surname, second_surname, nie, student_number], function(err) {
        if (err) {
          console.error('Error adding student:', err.message);
          reject(err);
        } else {
          // Devuelve el ID del estudiante insertado
          resolve({ id: this.lastID });
        }
      });
    });
  });

  // Ejemplo: Eliminar un estudiante
  ipcMain.handle('db-delete-student', async (event, studentId) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM students WHERE id = ?`;
      db.run(sql, [studentId], function(err) {
        if (err) {
          console.error('Error deleting student:', err.message);
          reject(err);
        } else {
          // Verificar si alguna fila fue afectada para confirmar la eliminación
          if (this.changes > 0) {
            resolve({ success: true, message: 'Estudiante eliminado' });
          } else {
            // Si no se afectaron filas, el ID probablemente no existía
            reject(new Error('No se encontró el estudiante con el ID proporcionado.'));
          }
        }
      });
    });
  });

  // --- Equipos ---
  ipcMain.handle('db-get-equipment', async () => {
    return new Promise((resolve, reject) => {
      // Calculamos el stock disponible restando los préstamos activos
      const sql = `
        SELECT
          e.id,
          e.equipment_number,
          e.name,
          e.initial_stock,
          e.initial_stock - COALESCE(SUM(CASE WHEN (l.return_date IS NULL OR l.return_date > CURRENT_DATE) THEN l.quantity ELSE 0 END), 0) AS available_stock,
          COALESCE(SUM(CASE WHEN (l.return_date IS NULL OR l.return_date > CURRENT_DATE) THEN l.quantity ELSE 0 END), 0) as lended_stock
        FROM equipment e
        LEFT JOIN lendings l ON e.id = l.equipment_id
        GROUP BY e.id, e.equipment_number, e.name, e.initial_stock
        ORDER BY e.name;
      `;
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching equipment:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  // Obtener un equipo por ID con sus préstamos
  ipcMain.handle('db-get-equipment-detail', async (event, equipmentId) => {
    return new Promise((resolve, reject) => {
      // Primero obtenemos los datos del equipo con su stock actual
      const equipmentSql = `
        SELECT
          e.id,
          e.equipment_number,
          e.name,
          e.initial_stock,
          e.initial_stock - COALESCE(SUM(CASE WHEN (l.return_date IS NULL OR l.return_date > CURRENT_DATE) THEN l.quantity ELSE 0 END), 0) AS available_stock,
          COALESCE(SUM(CASE WHEN (l.return_date IS NULL OR l.return_date > CURRENT_DATE) THEN l.quantity ELSE 0 END), 0) as lended_stock
        FROM equipment e
        LEFT JOIN lendings l ON e.id = l.equipment_id
        WHERE e.id = ?
        GROUP BY e.id, e.equipment_number, e.name, e.initial_stock
      `;
      
      db.get(equipmentSql, [equipmentId], (err, equipment) => {
        if (err) {
          console.error('Error fetching equipment:', err.message);
          return reject(err);
        }
        
        if (!equipment) {
          return reject(new Error('No se encontró el equipo con el ID proporcionado.'));
        }
        
        // Luego obtenemos los préstamos asociados al equipo
        const lendingsSql = `
          SELECT 
            l.id, l.quantity, l.lending_date, l.return_date, l.school_year,
            s.id as student_id, s.name as student_name, s.surname as student_surname, s.student_number
          FROM lendings l
          JOIN students s ON l.student_id = s.id
          WHERE l.equipment_id = ?
          ORDER BY l.lending_date DESC
        `;
        
        db.all(lendingsSql, [equipmentId], (err, lendings) => {
          if (err) {
            console.error('Error fetching equipment lendings:', err.message);
            return reject(err);
          }
          
          // Devolvemos equipo con sus préstamos
          resolve({
            ...equipment,
            lendings: lendings || []
          });
        });
      });
    });
  });

  ipcMain.handle('db-add-equipment', async (event, equipmentData) => {
    const { equipment_number, name, initial_stock } = equipmentData;
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO equipment (equipment_number, name, initial_stock) VALUES (?, ?, ?)`;
      db.run(sql, [equipment_number, name, initial_stock || 1], function(err) {
        if (err) {
          console.error('Error adding equipment:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  });

  ipcMain.handle('db-delete-equipment', async (event, equipmentId) => {
    return new Promise((resolve, reject) => {
      // Nota: La FK en lendings tiene ON DELETE CASCADE, así que los préstamos asociados se borrarán.
      const sql = `DELETE FROM equipment WHERE id = ?`;
      db.run(sql, [equipmentId], function(err) {
        if (err) {
          console.error('Error deleting equipment:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            resolve({ success: true, message: 'Equipo eliminado' });
          } else {
            reject(new Error('No se encontró el equipo con el ID proporcionado.'));
          }
        }
      });
    });
  });

  // --- Ayudas Técnicas (Préstamos) ---

  // Función auxiliar para calcular el año escolar (Sep-Sep)
  const getSchoolYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Enero, 8 = Septiembre
    // Si el mes es Septiembre (8) o posterior, el año escolar empieza este año
    // Si es anterior a Septiembre, el año escolar empezó el año anterior
    const startYear = month >= 8 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  ipcMain.handle('db-get-technical-aids', async () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          l.id,
          l.quantity,
          l.lending_date,
          l.return_date,
          l.school_year,
          s.id as student_id,
          s.name as student_name,
          s.surname as student_surname,
          s.student_number,
          e.id as equipment_id,
          e.name as equipment_name,
          e.equipment_number
        FROM lendings l
        JOIN students s ON l.student_id = s.id
        JOIN equipment e ON l.equipment_id = e.id
        ORDER BY l.lending_date DESC;
      `;
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching technical aids:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-technical-aid', async (event, aidData) => {
    const { student_id, equipment_id, quantity, lending_date } = aidData;
    const school_year = getSchoolYear(lending_date);

    return new Promise((resolve, reject) => {
      // 1. Verificar stock disponible antes de insertar
      const checkStockSql = `
        SELECT
          e.initial_stock - COALESCE(SUM(CASE WHEN (l.return_date IS NULL OR l.return_date > CURRENT_DATE) THEN l.quantity ELSE 0 END), 0) AS available_stock
        FROM equipment e
        LEFT JOIN lendings l ON e.id = l.equipment_id AND (l.return_date IS NULL OR l.return_date > CURRENT_DATE)
        WHERE e.id = ?
        GROUP BY e.id;
      `;

      db.get(checkStockSql, [equipment_id], (err, row) => {
        if (err) {
          return reject(new Error(`Error checking stock: ${err.message}`));
        }

        const availableStock = row ? row.available_stock : 0;

        if (availableStock < quantity) {
          return reject(new Error(`Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${quantity}`));
        }

        // 2. Si hay stock, insertar el préstamo
        const insertSql = `INSERT INTO lendings (student_id, equipment_id, quantity, lending_date, school_year) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertSql, [student_id, equipment_id, quantity, lending_date, school_year], function(err) {
          if (err) {
            console.error('Error adding technical aid:', err.message);
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });
    });
  });

  ipcMain.handle('db-return-technical-aid', async (event, { aidId, return_date }) => {
    // Usar la fecha proporcionada o la actual si no se proporciona
    const final_return_date = return_date ? return_date : new Date().toISOString().split('T')[0];
    return new Promise((resolve, reject) => {
      const sql = `UPDATE lendings SET return_date = ? WHERE id = ?`;
      db.run(sql, [final_return_date, aidId], function(err) {
        if (err) {
          console.error('Error returning technical aid:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            resolve({ success: true, message: 'Ayuda técnica devuelta' });
          } else {
            reject(new Error('No se encontró la ayuda técnica pendiente con el ID proporcionado o ya estaba devuelta.'));
          }
        }
      });
    });
  });

  ipcMain.handle('db-update-technical-aid', async (event, { aidId, student_id, equipment_id, quantity, lending_date, return_date }) => {
    // Recalcular año escolar si la fecha de préstamo cambia
    const school_year = getSchoolYear(lending_date);
    // Asegurarse de que return_date sea null si está vacío o inválido
    const final_return_date = return_date && dayjs(return_date).isValid() ? dayjs(return_date).format('YYYY-MM-DD') : null;

    // TODO: Añadir validación de stock compleja si equipment_id o quantity cambian
    //       comparando con el valor original del préstamo.

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE lendings
        SET
          student_id = ?,
          equipment_id = ?,
          quantity = ?,
          lending_date = ?,
          return_date = ?,
          school_year = ?
        WHERE id = ?`;

      db.run(sql, [student_id, equipment_id, quantity, lending_date, final_return_date, school_year, aidId], function(err) {
        if (err) {
          console.error('Error updating technical aid:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            resolve({ success: true, message: 'Ayuda técnica actualizada' });
          } else {
            reject(new Error('No se encontró la ayuda técnica con el ID proporcionado.'));
          }
        }
      });
    });
  });

  ipcMain.handle('db-delete-technical-aid', async (event, aidId) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM lendings WHERE id = ?`;
      db.run(sql, [aidId], function(err) {
        if (err) {
          console.error('Error deleting technical aid:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            resolve({ success: true, message: 'Ayuda técnica eliminada' });
          } else {
            reject(new Error('No se encontró la ayuda técnica con el ID proporcionado.'));
          }
        }
      });
    });
  });

  // --- Fin Manejadores IPC ---

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Cerrar la conexión a la BD aquí, ANTES de app.quit()
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database', err.message);
      } else {
        console.log('Database connection closed.');
      }
      // Salir de la app después de cerrar la BD (o si hubo error al cerrar)
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  } else {
     // Si no hay conexión a la BD, simplemente salir
     if (process.platform !== 'darwin') {
        app.quit();
     }
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
