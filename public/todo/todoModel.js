/**
 * TodoModel - Clase de lógica de negocio para el gestor de tareas
 * Esta clase está completamente separada del DOM para facilitar las pruebas unitarias
 * 
 * @author Sistema de Gestión de Tareas
 * @version 1.0.0
 */

class TodoModel {
    /**
     * Constructor - Inicializa el modelo con tareas desde localStorage o array vacío
     */
    constructor() {
        this.tasks = this.loadFromStorage();
    }

    /**
     * Genera un ID único para cada tarea
     * @returns {string} ID único basado en timestamp y random
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Valida el texto de una tarea
     * @param {string} text - Texto a validar
     * @returns {Object} Objeto con isValid y message
     */
    validateTaskText(text) {
        if (!text || typeof text !== 'string') {
            return { isValid: false, message: 'El texto de la tarea es requerido' };
        }
        
        const trimmedText = text.trim();
        
        if (trimmedText.length === 0) {
            return { isValid: false, message: 'La tarea no puede estar vacía o contener solo espacios' };
        }
        
        if (trimmedText.length > 500) {
            return { isValid: false, message: 'La tarea no puede exceder 500 caracteres' };
        }
        
        return { isValid: true, message: 'Válido' };
    }

    /**
     * Valida la prioridad de una tarea
     * @param {string} priority - Prioridad a validar
     * @returns {boolean} True si la prioridad es válida
     */
    validatePriority(priority) {
        const validPriorities = ['alta', 'media', 'baja'];
        return validPriorities.includes(priority);
    }

    /**
     * Agrega una nueva tarea
     * @param {string} text - Texto de la tarea
     * @param {string} priority - Prioridad (alta, media, baja)
     * @returns {Object} Resultado de la operación con success, task o error
     */
    addTask(text, priority = 'media') {
        const validation = this.validateTaskText(text);
        
        if (!validation.isValid) {
            return { success: false, error: validation.message };
        }
        
        if (!this.validatePriority(priority)) {
            priority = 'media'; // Valor por defecto si la prioridad no es válida
        }
        
        const newTask = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(newTask); // Agregar al inicio
        this.saveToStorage();
        
        return { success: true, task: newTask };
    }

    /**
     * Obtiene una tarea por su ID
     * @param {string} id - ID de la tarea
     * @returns {Object|null} Tarea encontrada o null
     */
    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    /**
     * Obtiene todas las tareas
     * @returns {Array} Array de todas las tareas
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * Obtiene tareas filtradas por estado
     * @param {string} filter - Filtro a aplicar (all, pending, completed)
     * @returns {Array} Array de tareas filtradas
     */
    getFilteredTasks(filter = 'all') {
        switch (filter) {
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'all':
            default:
                return [...this.tasks];
        }
    }

    /**
     * Alterna el estado de completado de una tarea
     * @param {string} id - ID de la tarea
     * @returns {Object} Resultado de la operación
     */
    toggleTask(id) {
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Edita el texto de una tarea existente
     * @param {string} id - ID de la tarea
     * @param {string} newText - Nuevo texto
     * @returns {Object} Resultado de la operación
     */
    editTask(id, newText) {
        const validation = this.validateTaskText(newText);
        
        if (!validation.isValid) {
            return { success: false, error: validation.message };
        }
        
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        task.text = newText.trim();
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Edita la prioridad de una tarea
     * @param {string} id - ID de la tarea
     * @param {string} newPriority - Nueva prioridad
     * @returns {Object} Resultado de la operación
     */
    editTaskPriority(id, newPriority) {
        if (!this.validatePriority(newPriority)) {
            return { success: false, error: 'Prioridad no válida' };
        }
        
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        task.priority = newPriority;
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Elimina una tarea por su ID
     * @param {string} id - ID de la tarea
     * @returns {Object} Resultado de la operación
     */
    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        const deletedTask = this.tasks.splice(taskIndex, 1)[0];
        this.saveToStorage();
        
        return { success: true, task: deletedTask };
    }

    /**
     * Elimina todas las tareas completadas
     * @returns {Object} Resultado con el número de tareas eliminadas
     */
    deleteCompletedTasks() {
        const completedCount = this.getCompletedCount();
        
        if (completedCount === 0) {
            return { success: false, error: 'No hay tareas completadas para eliminar', deletedCount: 0 };
        }
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveToStorage();
        
        return { success: true, deletedCount: completedCount };
    }

    /**
     * Elimina todas las tareas
     * @returns {Object} Resultado con el número de tareas eliminadas
     */
    deleteAllTasks() {
        const totalCount = this.tasks.length;
        this.tasks = [];
        this.saveToStorage();
        
        return { success: true, deletedCount: totalCount };
    }

    /**
     * Obtiene el contador de tareas pendientes
     * @returns {number} Número de tareas pendientes
     */
    getPendingCount() {
        return this.tasks.filter(task => !task.completed).length;
    }

    /**
     * Obtiene el contador de tareas completadas
     * @returns {number} Número de tareas completadas
     */
    getCompletedCount() {
        return this.tasks.filter(task => task.completed).length;
    }

    /**
     * Obtiene el total de tareas
     * @returns {number} Número total de tareas
     */
    getTotalCount() {
        return this.tasks.length;
    }

    /**
     * Obtiene estadísticas de las tareas
     * @returns {Object} Objeto con estadísticas
     */
    getStats() {
        return {
            total: this.getTotalCount(),
            pending: this.getPendingCount(),
            completed: this.getCompletedCount(),
            highPriority: this.tasks.filter(t => t.priority === 'alta' && !t.completed).length,
            mediumPriority: this.tasks.filter(t => t.priority === 'media' && !t.completed).length,
            lowPriority: this.tasks.filter(t => t.priority === 'baja' && !t.completed).length
        };
    }

    /**
     * Guarda las tareas en localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    /**
     * Carga las tareas desde localStorage
     * @returns {Array} Array de tareas cargadas
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('todoTasks');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
            return [];
        }
    }

    /**
     * Limpia todo el localStorage de tareas
     */
    clearStorage() {
        localStorage.removeItem('todoTasks');
        this.tasks = [];
    }

    /**
     * Ordena las tareas por diferentes criterios
     * @param {string} criteria - Criterio de ordenación (date, priority, alphabetical)
     * @param {string} order - Orden (asc, desc)
     * @returns {Array} Array de tareas ordenadas
     */
    sortTasks(criteria = 'date', order = 'desc') {
        const sortedTasks = [...this.tasks];
        
        switch (criteria) {
            case 'priority':
                const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
                sortedTasks.sort((a, b) => {
                    const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    return order === 'asc' ? -diff : diff;
                });
                break;
            case 'alphabetical':
                sortedTasks.sort((a, b) => {
                    const diff = a.text.localeCompare(b.text);
                    return order === 'asc' ? diff : -diff;
                });
                break;
            case 'date':
            default:
                sortedTasks.sort((a, b) => {
                    const diff = new Date(b.createdAt) - new Date(a.createdAt);
                    return order === 'asc' ? -diff : diff;
                });
                break;
        }
        
        return sortedTasks;
    }
}

// Exportar para uso en módulos (si se usa en entorno de módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoModel;
}
