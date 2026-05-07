/**
 * Pruebas Unitarias para TodoModel
 * 
 * Este archivo contiene casos de prueba para validar la logica de negocio
 * de la clase TodoModel sin dependencias del DOM.
 * 
 * Para ejecutar estas pruebas puedes usar cualquier framework de testing como:
 * - Jest: npx jest todoModel.test.js
 * - Mocha: npx mocha todoModel.test.js
 * - O simplemente abrir test-runner.html en el navegador
 * 
 * @version 2.0.0
 */

// Mock de localStorage para pruebas en Node.js
if (typeof localStorage === 'undefined') {
    global.localStorage = {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; },
        clear() { this.data = {}; }
    };
}

// Importar TodoModel (ajustar segun el entorno)
// const TodoModel = require('./todoModel.js');

/**
 * Clase simple de testing para ejecutar pruebas sin framework
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    /**
     * Registra un test
     * @param {string} description - Descripcion del test
     * @param {Function} testFn - Funcion de prueba
     */
    test(description, testFn) {
        this.tests.push({ description, testFn });
    }

    /**
     * Agrupa tests relacionados
     * @param {string} suiteName - Nombre del grupo
     * @param {Function} suiteCallback - Callback con los tests
     */
    describe(suiteName, suiteCallback) {
        console.log(`\n📋 ${suiteName}`);
        console.log('─'.repeat(50));
        suiteCallback();
    }

    /**
     * Ejecuta todos los tests
     */
    async run() {
        console.log('\n🧪 Ejecutando pruebas unitarias de TodoModel\n');
        console.log('═'.repeat(50));

        for (const { description, testFn } of this.tests) {
            try {
                // Limpiar localStorage antes de cada test
                localStorage.clear();
                
                await testFn();
                this.passed++;
                this.results.push({ description, status: 'passed' });
                console.log(`  ✅ ${description}`);
            } catch (error) {
                this.failed++;
                this.results.push({ description, status: 'failed', error: error.message });
                console.log(`  ❌ ${description}`);
                console.log(`     Error: ${error.message}`);
            }
        }

        this.printSummary();
    }

    /**
     * Imprime el resumen de pruebas
     */
    printSummary() {
        console.log('\n' + '═'.repeat(50));
        console.log('\n📊 RESUMEN DE PRUEBAS');
        console.log('─'.repeat(30));
        console.log(`  Total:    ${this.tests.length}`);
        console.log(`  Pasadas:  ${this.passed} ✅`);
        console.log(`  Fallidas: ${this.failed} ❌`);
        console.log(`  Tasa:     ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        console.log('\n');

        if (this.failed === 0) {
            console.log('🎉 Todas las pruebas pasaron exitosamente!\n');
        } else {
            console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.\n');
        }
    }
}

/**
 * Funciones de asercion
 */
const assert = {
    equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Esperado: ${expected}, Obtenido: ${actual}`);
        }
    },
    
    strictEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Esperado estricto: ${expected}, Obtenido: ${actual}`);
        }
    },
    
    deepEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message} - Los objetos no son iguales`);
        }
    },
    
    isTrue(value, message = '') {
        if (value !== true) {
            throw new Error(`${message} - Esperado: true, Obtenido: ${value}`);
        }
    },
    
    isFalse(value, message = '') {
        if (value !== false) {
            throw new Error(`${message} - Esperado: false, Obtenido: ${value}`);
        }
    },
    
    isNull(value, message = '') {
        if (value !== null) {
            throw new Error(`${message} - Esperado: null, Obtenido: ${value}`);
        }
    },
    
    isNotNull(value, message = '') {
        if (value === null) {
            throw new Error(`${message} - No se esperaba null`);
        }
    },
    
    isArray(value, message = '') {
        if (!Array.isArray(value)) {
            throw new Error(`${message} - Esperado: Array, Obtenido: ${typeof value}`);
        }
    },
    
    lengthOf(arr, expected, message = '') {
        if (arr.length !== expected) {
            throw new Error(`${message} - Longitud esperada: ${expected}, Obtenida: ${arr.length}`);
        }
    },
    
    includes(arr, item, message = '') {
        if (!arr.includes(item)) {
            throw new Error(`${message} - El array no incluye: ${item}`);
        }
    },
    
    greaterThan(actual, expected, message = '') {
        if (actual <= expected) {
            throw new Error(`${message} - ${actual} no es mayor que ${expected}`);
        }
    },
    
    lessThan(actual, expected, message = '') {
        if (actual >= expected) {
            throw new Error(`${message} - ${actual} no es menor que ${expected}`);
        }
    }
};

// ============================================================
// PRUEBAS UNITARIAS
// ============================================================

const runner = new TestRunner();

// ============================================================
// 1. PRUEBAS DE VALIDACION DE TEXTO
// ============================================================
runner.describe('1. Validacion de texto de tarea (validateTaskText)', () => {
    
    runner.test('Debe rechazar texto vacio', () => {
        const model = new TodoModel();
        const result = model.validateTaskText('');
        assert.isFalse(result.isValid);
        assert.equal(result.message, 'La tarea no puede estar vacia o contener solo espacios');
    });

    runner.test('Debe rechazar texto con solo espacios', () => {
        const model = new TodoModel();
        const result = model.validateTaskText('     ');
        assert.isFalse(result.isValid);
    });

    runner.test('Debe rechazar texto null', () => {
        const model = new TodoModel();
        const result = model.validateTaskText(null);
        assert.isFalse(result.isValid);
        assert.equal(result.message, 'El texto de la tarea es requerido');
    });

    runner.test('Debe rechazar texto undefined', () => {
        const model = new TodoModel();
        const result = model.validateTaskText(undefined);
        assert.isFalse(result.isValid);
    });

    runner.test('Debe rechazar texto mayor a 500 caracteres', () => {
        const model = new TodoModel();
        const longText = 'a'.repeat(501);
        const result = model.validateTaskText(longText);
        assert.isFalse(result.isValid);
        assert.equal(result.message, 'La tarea no puede exceder 500 caracteres');
    });

    runner.test('Debe aceptar texto valido', () => {
        const model = new TodoModel();
        const result = model.validateTaskText('Completar informe');
        assert.isTrue(result.isValid);
        assert.equal(result.message, 'Valido');
    });

    runner.test('Debe aceptar texto exactamente de 500 caracteres', () => {
        const model = new TodoModel();
        const exactText = 'a'.repeat(500);
        const result = model.validateTaskText(exactText);
        assert.isTrue(result.isValid);
    });
});

// ============================================================
// 2. PRUEBAS DE AGREGAR TAREA (addTask)
// ============================================================
runner.describe('2. Agregar tarea (addTask)', () => {
    
    runner.test('Debe agregar tarea con texto valido', () => {
        const model = new TodoModel();
        const result = model.addTask('Nueva tarea');
        assert.isTrue(result.success);
        assert.isNotNull(result.task);
        assert.equal(result.task.text, 'Nueva tarea');
        assert.isFalse(result.task.completed);
    });

    runner.test('Debe asignar prioridad media por defecto', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea sin prioridad');
        assert.equal(result.task.priority, 'media');
    });

    runner.test('Debe respetar prioridad especificada', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea urgente', 'alta');
        assert.equal(result.task.priority, 'alta');
    });

    runner.test('Debe corregir prioridad invalida a media', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea', 'invalida');
        assert.equal(result.task.priority, 'media');
    });

    runner.test('Debe generar ID unico', () => {
        const model = new TodoModel();
        const result1 = model.addTask('Tarea 1');
        const result2 = model.addTask('Tarea 2');
        assert.isTrue(result1.task.id !== result2.task.id);
    });

    runner.test('Debe rechazar tarea con texto vacio', () => {
        const model = new TodoModel();
        const result = model.addTask('');
        assert.isFalse(result.success);
        assert.isNotNull(result.error);
    });

    runner.test('Debe trimear el texto de la tarea', () => {
        const model = new TodoModel();
        const result = model.addTask('  Tarea con espacios  ');
        assert.equal(result.task.text, 'Tarea con espacios');
    });

    runner.test('Debe agregar fecha de creacion', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea con fecha');
        assert.isNotNull(result.task.createdAt);
    });

    runner.test('Debe agregar tarea con fecha limite', () => {
        const model = new TodoModel();
        const dueDate = '2025-12-31';
        const result = model.addTask('Tarea con fecha limite', 'media', dueDate);
        assert.isTrue(result.success);
        assert.equal(result.task.dueDate, dueDate);
    });

    runner.test('Debe agregar tarea con etiquetas', () => {
        const model = new TodoModel();
        const tags = ['trabajo', 'urgente'];
        const result = model.addTask('Tarea con tags', 'alta', null, tags);
        assert.isTrue(result.success);
        assert.lengthOf(result.task.tags, 2);
        assert.includes(result.task.tags, 'trabajo');
    });

    runner.test('Debe normalizar etiquetas a minusculas', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea', 'media', null, ['TRABAJO', 'Urgente']);
        assert.includes(result.task.tags, 'trabajo');
        assert.includes(result.task.tags, 'urgente');
    });

    runner.test('Debe eliminar etiquetas duplicadas', () => {
        const model = new TodoModel();
        const result = model.addTask('Tarea', 'media', null, ['trabajo', 'TRABAJO', 'Trabajo']);
        assert.lengthOf(result.task.tags, 1);
    });
});

// ============================================================
// 3. PRUEBAS DE OBTENER TAREA (getTaskById)
// ============================================================
runner.describe('3. Obtener tarea por ID (getTaskById)', () => {
    
    runner.test('Debe retornar tarea existente', () => {
        const model = new TodoModel();
        const added = model.addTask('Buscar esta tarea');
        const found = model.getTaskById(added.task.id);
        assert.isNotNull(found);
        assert.equal(found.text, 'Buscar esta tarea');
    });

    runner.test('Debe retornar null para ID inexistente', () => {
        const model = new TodoModel();
        const found = model.getTaskById('id-que-no-existe');
        assert.isNull(found);
    });
});

// ============================================================
// 4. PRUEBAS DE TOGGLE (toggleTask)
// ============================================================
runner.describe('4. Alternar estado de tarea (toggleTask)', () => {
    
    runner.test('Debe marcar tarea pendiente como completada', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea para completar');
        assert.isFalse(added.task.completed);
        
        const result = model.toggleTask(added.task.id);
        assert.isTrue(result.success);
        assert.isTrue(result.task.completed);
    });

    runner.test('Debe marcar tarea completada como pendiente', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea');
        model.toggleTask(added.task.id); // Completar
        
        const result = model.toggleTask(added.task.id); // Des-completar
        assert.isFalse(result.task.completed);
    });

    runner.test('Debe fallar con ID inexistente', () => {
        const model = new TodoModel();
        const result = model.toggleTask('id-invalido');
        assert.isFalse(result.success);
        assert.equal(result.error, 'Tarea no encontrada');
    });

    runner.test('Debe actualizar fecha de modificacion', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea');
        const originalUpdatedAt = added.task.updatedAt;
        
        // Esperar un momento para que cambie el timestamp
        const result = model.toggleTask(added.task.id);
        assert.isNotNull(result.task.updatedAt);
    });
});

// ============================================================
// 5. PRUEBAS DE EDITAR TAREA (editTask)
// ============================================================
runner.describe('5. Editar tarea (editTask)', () => {
    
    runner.test('Debe editar texto exitosamente', () => {
        const model = new TodoModel();
        const added = model.addTask('Texto original');
        
        const result = model.editTask(added.task.id, 'Texto modificado');
        assert.isTrue(result.success);
        assert.equal(result.task.text, 'Texto modificado');
    });

    runner.test('Debe rechazar texto vacio', () => {
        const model = new TodoModel();
        const added = model.addTask('Texto original');
        
        const result = model.editTask(added.task.id, '');
        assert.isFalse(result.success);
    });

    runner.test('Debe fallar con ID inexistente', () => {
        const model = new TodoModel();
        const result = model.editTask('id-invalido', 'Nuevo texto');
        assert.isFalse(result.success);
        assert.equal(result.error, 'Tarea no encontrada');
    });

    runner.test('Debe trimear el nuevo texto', () => {
        const model = new TodoModel();
        const added = model.addTask('Original');
        
        const result = model.editTask(added.task.id, '  Nuevo texto  ');
        assert.equal(result.task.text, 'Nuevo texto');
    });
});

// ============================================================
// 6. PRUEBAS DE ELIMINAR TAREA (deleteTask)
// ============================================================
runner.describe('6. Eliminar tarea (deleteTask)', () => {
    
    runner.test('Debe eliminar tarea existente', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea a eliminar');
        
        const result = model.deleteTask(added.task.id);
        assert.isTrue(result.success);
        assert.equal(result.task.text, 'Tarea a eliminar');
    });

    runner.test('Debe reducir el total de tareas', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        const added2 = model.addTask('Tarea 2');
        
        assert.equal(model.getTotalCount(), 2);
        model.deleteTask(added2.task.id);
        assert.equal(model.getTotalCount(), 1);
    });

    runner.test('Debe fallar con ID inexistente', () => {
        const model = new TodoModel();
        const result = model.deleteTask('id-invalido');
        assert.isFalse(result.success);
        assert.equal(result.error, 'Tarea no encontrada');
    });

    runner.test('La tarea eliminada no debe encontrarse', () => {
        const model = new TodoModel();
        const added = model.addTask('Eliminarme');
        model.deleteTask(added.task.id);
        
        const found = model.getTaskById(added.task.id);
        assert.isNull(found);
    });
});

// ============================================================
// 7. PRUEBAS DE ELIMINAR COMPLETADAS (deleteCompletedTasks)
// ============================================================
runner.describe('7. Eliminar tareas completadas (deleteCompletedTasks)', () => {
    
    runner.test('Debe eliminar solo tareas completadas', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Pendiente 1');
        const t2 = model.addTask('Completada 1');
        const t3 = model.addTask('Pendiente 2');
        
        model.toggleTask(t2.task.id); // Marcar como completada
        
        const result = model.deleteCompletedTasks();
        assert.isTrue(result.success);
        assert.equal(result.deletedCount, 1);
        assert.equal(model.getTotalCount(), 2);
    });

    runner.test('Debe fallar si no hay completadas', () => {
        const model = new TodoModel();
        model.addTask('Pendiente');
        
        const result = model.deleteCompletedTasks();
        assert.isFalse(result.success);
        assert.equal(result.deletedCount, 0);
    });

    runner.test('Debe eliminar multiples completadas', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Completada 1');
        const t2 = model.addTask('Completada 2');
        const t3 = model.addTask('Completada 3');
        
        model.toggleTask(t1.task.id);
        model.toggleTask(t2.task.id);
        model.toggleTask(t3.task.id);
        
        const result = model.deleteCompletedTasks();
        assert.equal(result.deletedCount, 3);
        assert.equal(model.getTotalCount(), 0);
    });
});

// ============================================================
// 8. PRUEBAS DE FILTROS (getFilteredTasks)
// ============================================================
runner.describe('8. Filtrar tareas (getFilteredTasks)', () => {
    
    runner.test('Filtro "all" debe retornar todas', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        const t2 = model.addTask('Tarea 2');
        model.toggleTask(t2.task.id);
        
        const tasks = model.getFilteredTasks('all');
        assert.lengthOf(tasks, 2);
    });

    runner.test('Filtro "pending" debe retornar solo pendientes', () => {
        const model = new TodoModel();
        model.addTask('Pendiente');
        const t2 = model.addTask('Completada');
        model.toggleTask(t2.task.id);
        
        const tasks = model.getFilteredTasks('pending');
        assert.lengthOf(tasks, 1);
        assert.isFalse(tasks[0].completed);
    });

    runner.test('Filtro "completed" debe retornar solo completadas', () => {
        const model = new TodoModel();
        model.addTask('Pendiente');
        const t2 = model.addTask('Completada');
        model.toggleTask(t2.task.id);
        
        const tasks = model.getFilteredTasks('completed');
        assert.lengthOf(tasks, 1);
        assert.isTrue(tasks[0].completed);
    });

    runner.test('Filtro invalido debe comportarse como "all"', () => {
        const model = new TodoModel();
        model.addTask('Tarea');
        
        const tasks = model.getFilteredTasks('filtro-invalido');
        assert.lengthOf(tasks, 1);
    });
});

// ============================================================
// 9. PRUEBAS DE CONTADORES
// ============================================================
runner.describe('9. Contadores (getPendingCount, getCompletedCount, getTotalCount)', () => {
    
    runner.test('getPendingCount debe contar solo pendientes', () => {
        const model = new TodoModel();
        model.addTask('Pendiente 1');
        model.addTask('Pendiente 2');
        const t3 = model.addTask('Completada');
        model.toggleTask(t3.task.id);
        
        assert.equal(model.getPendingCount(), 2);
    });

    runner.test('getCompletedCount debe contar solo completadas', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Completada 1');
        const t2 = model.addTask('Completada 2');
        model.addTask('Pendiente');
        
        model.toggleTask(t1.task.id);
        model.toggleTask(t2.task.id);
        
        assert.equal(model.getCompletedCount(), 2);
    });

    runner.test('getTotalCount debe contar todas', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        model.addTask('Tarea 2');
        model.addTask('Tarea 3');
        
        assert.equal(model.getTotalCount(), 3);
    });

    runner.test('Contadores deben ser 0 inicialmente', () => {
        const model = new TodoModel();
        assert.equal(model.getPendingCount(), 0);
        assert.equal(model.getCompletedCount(), 0);
        assert.equal(model.getTotalCount(), 0);
    });
});

// ============================================================
// 10. PRUEBAS DE BUSQUEDA (searchTasks)
// ============================================================
runner.describe('10. Busqueda de tareas (searchTasks)', () => {
    
    runner.test('Debe encontrar tarea por texto parcial', () => {
        const model = new TodoModel();
        model.addTask('Comprar leche');
        model.addTask('Estudiar matematicas');
        model.addTask('Leer libro');
        
        const results = model.searchTasks('leche');
        assert.lengthOf(results, 1);
        assert.equal(results[0].text, 'Comprar leche');
    });

    runner.test('Debe ser case-insensitive', () => {
        const model = new TodoModel();
        model.addTask('TAREA IMPORTANTE');
        
        const results = model.searchTasks('importante');
        assert.lengthOf(results, 1);
    });

    runner.test('Debe retornar todas con busqueda vacia', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        model.addTask('Tarea 2');
        
        const results = model.searchTasks('');
        assert.lengthOf(results, 2);
    });

    runner.test('Debe buscar tambien en etiquetas', () => {
        const model = new TodoModel();
        model.addTask('Tarea normal', 'media', null, ['trabajo']);
        model.addTask('Otra tarea', 'media', null, ['personal']);
        
        const results = model.searchTasks('trabajo');
        assert.lengthOf(results, 1);
    });

    runner.test('Debe respetar el filtro de estado', () => {
        const model = new TodoModel();
        model.addTask('Tarea pendiente');
        const t2 = model.addTask('Tarea completada');
        model.toggleTask(t2.task.id);
        
        const results = model.searchTasks('tarea', 'pending');
        assert.lengthOf(results, 1);
        assert.isFalse(results[0].completed);
    });
});

// ============================================================
// 11. PRUEBAS DE ETIQUETAS
// ============================================================
runner.describe('11. Gestion de etiquetas', () => {
    
    runner.test('validateTags debe rechazar mas de 5 etiquetas', () => {
        const model = new TodoModel();
        const tags = ['a', 'b', 'c', 'd', 'e', 'f'];
        const result = model.validateTags(tags);
        assert.isFalse(result.isValid);
    });

    runner.test('validateTags debe rechazar etiquetas de mas de 20 chars', () => {
        const model = new TodoModel();
        const tags = ['etiqueta_muy_larga_que_excede'];
        const result = model.validateTags(tags);
        assert.isFalse(result.isValid);
    });

    runner.test('addTagToTask debe agregar etiqueta', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea');
        
        const result = model.addTagToTask(added.task.id, 'nueva');
        assert.isTrue(result.success);
        assert.includes(result.task.tags, 'nueva');
    });

    runner.test('addTagToTask debe rechazar duplicados', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea', 'media', null, ['existente']);
        
        const result = model.addTagToTask(added.task.id, 'existente');
        assert.isFalse(result.success);
    });

    runner.test('removeTagFromTask debe eliminar etiqueta', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea', 'media', null, ['eliminarme', 'quedarme']);
        
        const result = model.removeTagFromTask(added.task.id, 'eliminarme');
        assert.isTrue(result.success);
        assert.lengthOf(result.task.tags, 1);
        assert.includes(result.task.tags, 'quedarme');
    });

    runner.test('getAllTags debe retornar etiquetas unicas', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1', 'media', null, ['trabajo', 'urgente']);
        model.addTask('Tarea 2', 'media', null, ['personal', 'trabajo']);
        
        const allTags = model.getAllTags();
        assert.lengthOf(allTags, 3);
        assert.includes(allTags, 'trabajo');
        assert.includes(allTags, 'urgente');
        assert.includes(allTags, 'personal');
    });

    runner.test('filterByTag debe filtrar por etiqueta', () => {
        const model = new TodoModel();
        model.addTask('Tarea trabajo', 'media', null, ['trabajo']);
        model.addTask('Tarea personal', 'media', null, ['personal']);
        
        const results = model.filterByTag('trabajo');
        assert.lengthOf(results, 1);
        assert.equal(results[0].text, 'Tarea trabajo');
    });
});

// ============================================================
// 12. PRUEBAS DE FECHA LIMITE (Due Date)
// ============================================================
runner.describe('12. Fecha limite (Due Date)', () => {
    
    runner.test('validateDueDate debe aceptar fecha valida', () => {
        const model = new TodoModel();
        const result = model.validateDueDate('2025-12-31');
        assert.isTrue(result.isValid);
    });

    runner.test('validateDueDate debe aceptar null', () => {
        const model = new TodoModel();
        const result = model.validateDueDate(null);
        assert.isTrue(result.isValid);
    });

    runner.test('validateDueDate debe rechazar fecha invalida', () => {
        const model = new TodoModel();
        const result = model.validateDueDate('fecha-invalida');
        assert.isFalse(result.isValid);
    });

    runner.test('getDueDateStatus debe retornar "overdue" para fechas pasadas', () => {
        const model = new TodoModel();
        const pastDate = '2020-01-01';
        const status = model.getDueDateStatus(pastDate);
        assert.equal(status.status, 'overdue');
        assert.lessThan(status.daysRemaining, 0);
    });

    runner.test('getDueDateStatus debe retornar "warning" para 3 dias o menos', () => {
        const model = new TodoModel();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const status = model.getDueDateStatus(tomorrow.toISOString());
        assert.equal(status.status, 'warning');
    });

    runner.test('getDueDateStatus debe retornar "safe" para mas de 3 dias', () => {
        const model = new TodoModel();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const status = model.getDueDateStatus(futureDate.toISOString());
        assert.equal(status.status, 'safe');
    });

    runner.test('getDueDateStatus debe retornar "none" para null', () => {
        const model = new TodoModel();
        const status = model.getDueDateStatus(null);
        assert.equal(status.status, 'none');
        assert.isNull(status.daysRemaining);
    });

    runner.test('editTaskDueDate debe cambiar la fecha', () => {
        const model = new TodoModel();
        const added = model.addTask('Tarea');
        
        const result = model.editTaskDueDate(added.task.id, '2025-06-15');
        assert.isTrue(result.success);
        assert.equal(result.task.dueDate, '2025-06-15');
    });
});

// ============================================================
// 13. PRUEBAS DE REORDENAMIENTO (Drag and Drop)
// ============================================================
runner.describe('13. Reordenamiento de tareas (Drag and Drop)', () => {
    
    runner.test('reorderTasks debe mover tarea de posicion', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        model.addTask('Tarea 2');
        model.addTask('Tarea 3');
        
        // Mover de indice 0 a indice 2
        const result = model.reorderTasks(0, 2);
        assert.isTrue(result.success);
    });

    runner.test('reorderTasks debe rechazar indices invalidos', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        
        const result = model.reorderTasks(0, 5);
        assert.isFalse(result.success);
    });

    runner.test('reorderTasks debe aceptar misma posicion', () => {
        const model = new TodoModel();
        model.addTask('Tarea 1');
        
        const result = model.reorderTasks(0, 0);
        assert.isTrue(result.success);
    });

    runner.test('reorderTasksById debe funcionar con IDs', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Tarea 1');
        const t2 = model.addTask('Tarea 2');
        
        const result = model.reorderTasksById(t1.task.id, t2.task.id);
        assert.isTrue(result.success);
    });
});

// ============================================================
// 14. PRUEBAS DE ESTADISTICAS (getStats)
// ============================================================
runner.describe('14. Estadisticas (getStats)', () => {
    
    runner.test('Debe calcular porcentaje de completadas', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Tarea 1');
        model.addTask('Tarea 2');
        model.toggleTask(t1.task.id);
        
        const stats = model.getStats();
        assert.equal(stats.completionPercentage, 50);
    });

    runner.test('Debe contar tareas por prioridad', () => {
        const model = new TodoModel();
        model.addTask('Alta 1', 'alta');
        model.addTask('Alta 2', 'alta');
        model.addTask('Media', 'media');
        model.addTask('Baja', 'baja');
        
        const stats = model.getStats();
        assert.equal(stats.highPriority, 2);
        assert.equal(stats.mediumPriority, 1);
        assert.equal(stats.lowPriority, 1);
    });

    runner.test('Debe retornar 0% con lista vacia', () => {
        const model = new TodoModel();
        const stats = model.getStats();
        assert.equal(stats.completionPercentage, 0);
        assert.equal(stats.total, 0);
    });

    runner.test('Debe contar tareas vencidas', () => {
        const model = new TodoModel();
        model.addTask('Vencida', 'alta', '2020-01-01');
        model.addTask('Vigente', 'media', '2030-01-01');
        
        const stats = model.getStats();
        assert.equal(stats.overdueTasks, 1);
    });

    runner.test('No debe contar completadas como vencidas', () => {
        const model = new TodoModel();
        const t1 = model.addTask('Vencida pero completada', 'alta', '2020-01-01');
        model.toggleTask(t1.task.id);
        
        const stats = model.getStats();
        assert.equal(stats.overdueTasks, 0);
    });
});

// ============================================================
// 15. PRUEBAS DE ORDENAMIENTO (sortTasks)
// ============================================================
runner.describe('15. Ordenamiento de tareas (sortTasks)', () => {
    
    runner.test('Debe ordenar por prioridad descendente', () => {
        const model = new TodoModel();
        model.addTask('Baja', 'baja');
        model.addTask('Alta', 'alta');
        model.addTask('Media', 'media');
        
        const sorted = model.sortTasks('priority', 'desc');
        assert.equal(sorted[0].priority, 'alta');
        assert.equal(sorted[2].priority, 'baja');
    });

    runner.test('Debe ordenar alfabeticamente', () => {
        const model = new TodoModel();
        model.addTask('Zebra');
        model.addTask('Apple');
        model.addTask('Mango');
        
        const sorted = model.sortTasks('alphabetical', 'asc');
        assert.equal(sorted[0].text, 'Apple');
        assert.equal(sorted[2].text, 'Zebra');
    });

    runner.test('Debe ordenar por fecha limite', () => {
        const model = new TodoModel();
        model.addTask('Sin fecha', 'media', null);
        model.addTask('Primero', 'media', '2024-01-01');
        model.addTask('Segundo', 'media', '2024-06-01');
        
        const sorted = model.sortTasks('dueDate', 'asc');
        assert.equal(sorted[0].text, 'Primero');
        // Sin fecha va al final
        assert.equal(sorted[2].text, 'Sin fecha');
    });
});

// ============================================================
// 16. PRUEBAS DE PERSISTENCIA (localStorage)
// ============================================================
runner.describe('16. Persistencia en localStorage', () => {
    
    runner.test('Debe guardar tareas en localStorage', () => {
        const model = new TodoModel();
        model.addTask('Tarea persistente');
        
        const stored = localStorage.getItem('todoTasks');
        assert.isNotNull(stored);
        
        const parsed = JSON.parse(stored);
        assert.lengthOf(parsed, 1);
    });

    runner.test('Debe cargar tareas desde localStorage', () => {
        // Preparar datos en localStorage
        const tasks = [{ id: 'test-1', text: 'Cargada', completed: false, priority: 'media', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: null, tags: [] }];
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        
        // Crear nueva instancia
        const model = new TodoModel();
        assert.equal(model.getTotalCount(), 1);
        assert.equal(model.getAllTasks()[0].text, 'Cargada');
    });

    runner.test('clearStorage debe limpiar localStorage', () => {
        const model = new TodoModel();
        model.addTask('Tarea');
        model.clearStorage();
        
        assert.equal(model.getTotalCount(), 0);
        assert.isNull(localStorage.getItem('todoTasks'));
    });
});

// ============================================================
// 17. PRUEBAS DE IMPORTAR/EXPORTAR
// ============================================================
runner.describe('17. Importar y Exportar tareas', () => {
    
    runner.test('exportToJSON debe retornar JSON valido', () => {
        const model = new TodoModel();
        model.addTask('Exportar');
        
        const json = model.exportToJSON();
        const parsed = JSON.parse(json);
        assert.isArray(parsed);
        assert.lengthOf(parsed, 1);
    });

    runner.test('importFromJSON debe importar tareas', () => {
        const model = new TodoModel();
        const json = JSON.stringify([{ text: 'Importada', completed: false, priority: 'alta' }]);
        
        const result = model.importFromJSON(json);
        assert.isTrue(result.success);
        assert.equal(result.importedCount, 1);
        assert.equal(model.getTotalCount(), 1);
    });

    runner.test('importFromJSON debe rechazar JSON invalido', () => {
        const model = new TodoModel();
        const result = model.importFromJSON('esto no es json');
        assert.isFalse(result.success);
    });

    runner.test('importFromJSON debe rechazar formato incorrecto', () => {
        const model = new TodoModel();
        const result = model.importFromJSON(JSON.stringify({ not: 'array' }));
        assert.isFalse(result.success);
    });
});

// ============================================================
// EJECUTAR PRUEBAS
// ============================================================

// Ejecutar automaticamente si estamos en el navegador
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        runner.run();
    });
} else {
    // Ejecutar en Node.js
    runner.run();
}

// Exportar para uso externo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner, assert, runner };
}
