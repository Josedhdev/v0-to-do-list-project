/**
 * TodoModel - Clase de lógica de negocio para el gestor de tareas
 * Esta clase está completamente separada del DOM para facilitar las pruebas unitarias
 * 
 * @author Sistema de Gestión de Tareas
 * @version 2.0.0
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
     * Valida una fecha límite
     * @param {string|null} dueDate - Fecha en formato ISO o null
     * @returns {Object} Objeto con isValid y message
     */
    validateDueDate(dueDate) {
        if (!dueDate) {
            return { isValid: true, message: 'Sin fecha límite' };
        }
        
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) {
            return { isValid: false, message: 'Fecha no válida' };
        }
        
        return { isValid: true, message: 'Fecha válida' };
    }

    /**
     * Valida las etiquetas
     * @param {Array} tags - Array de etiquetas
     * @returns {Object} Objeto con isValid y message
     */
    validateTags(tags) {
        if (!Array.isArray(tags)) {
            return { isValid: false, message: 'Las etiquetas deben ser un array' };
        }
        
        if (tags.length > 5) {
            return { isValid: false, message: 'Máximo 5 etiquetas por tarea' };
        }
        
        for (const tag of tags) {
            if (typeof tag !== 'string' || tag.trim().length === 0) {
                return { isValid: false, message: 'Cada etiqueta debe ser texto no vacío' };
            }
            if (tag.length > 20) {
                return { isValid: false, message: 'Cada etiqueta no puede exceder 20 caracteres' };
            }
        }
        
        return { isValid: true, message: 'Etiquetas válidas' };
    }

    /**
     * Agrega una nueva tarea
     * @param {string} text - Texto de la tarea
     * @param {string} priority - Prioridad (alta, media, baja)
     * @param {string|null} dueDate - Fecha límite opcional
     * @param {Array} tags - Etiquetas opcionales
     * @returns {Object} Resultado de la operación con success, task o error
     */
    addTask(text, priority = 'media', dueDate = null, tags = []) {
        const textValidation = this.validateTaskText(text);
        if (!textValidation.isValid) {
            return { success: false, error: textValidation.message };
        }
        
        if (!this.validatePriority(priority)) {
            priority = 'media';
        }
        
        const dueDateValidation = this.validateDueDate(dueDate);
        if (!dueDateValidation.isValid) {
            return { success: false, error: dueDateValidation.message };
        }
        
        const tagsValidation = this.validateTags(tags);
        if (!tagsValidation.isValid) {
            return { success: false, error: tagsValidation.message };
        }
        
        // Limpiar y normalizar etiquetas
        const cleanedTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        const uniqueTags = [...new Set(cleanedTags)];
        
        const newTask = {
            id: this.generateId(),
            text: text.trim(),
            completed: false,
            priority: priority,
            dueDate: dueDate,
            tags: uniqueTags,
            order: this.tasks.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(newTask);
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
     * Busca tareas por texto
     * @param {string} searchText - Texto a buscar
     * @param {string} filter - Filtro de estado actual
     * @returns {Array} Array de tareas que coinciden con la búsqueda
     */
    searchTasks(searchText, filter = 'all') {
        const filteredTasks = this.getFilteredTasks(filter);
        
        if (!searchText || searchText.trim().length === 0) {
            return filteredTasks;
        }
        
        const searchLower = searchText.toLowerCase().trim();
        
        return filteredTasks.filter(task => {
            const textMatch = task.text.toLowerCase().includes(searchLower);
            const tagsMatch = task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower));
            return textMatch || tagsMatch;
        });
    }

    /**
     * Filtra tareas por etiqueta
     * @param {string} tag - Etiqueta a filtrar
     * @param {string} filter - Filtro de estado actual
     * @returns {Array} Array de tareas con la etiqueta
     */
    filterByTag(tag, filter = 'all') {
        const filteredTasks = this.getFilteredTasks(filter);
        
        if (!tag || tag.trim().length === 0) {
            return filteredTasks;
        }
        
        const tagLower = tag.toLowerCase().trim();
        
        return filteredTasks.filter(task => 
            task.tags && task.tags.some(t => t.toLowerCase() === tagLower)
        );
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
     * Edita la fecha límite de una tarea
     * @param {string} id - ID de la tarea
     * @param {string|null} newDueDate - Nueva fecha límite
     * @returns {Object} Resultado de la operación
     */
    editTaskDueDate(id, newDueDate) {
        const validation = this.validateDueDate(newDueDate);
        
        if (!validation.isValid) {
            return { success: false, error: validation.message };
        }
        
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        task.dueDate = newDueDate;
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Edita las etiquetas de una tarea
     * @param {string} id - ID de la tarea
     * @param {Array} newTags - Nuevas etiquetas
     * @returns {Object} Resultado de la operación
     */
    editTaskTags(id, newTags) {
        const validation = this.validateTags(newTags);
        
        if (!validation.isValid) {
            return { success: false, error: validation.message };
        }
        
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        const cleanedTags = newTags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        task.tags = [...new Set(cleanedTags)];
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Agrega una etiqueta a una tarea
     * @param {string} id - ID de la tarea
     * @param {string} tag - Nueva etiqueta
     * @returns {Object} Resultado de la operación
     */
    addTagToTask(id, tag) {
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
            return { success: false, error: 'La etiqueta no puede estar vacía' };
        }
        
        if (tag.length > 20) {
            return { success: false, error: 'La etiqueta no puede exceder 20 caracteres' };
        }
        
        const normalizedTag = tag.trim().toLowerCase();
        
        if (!task.tags) {
            task.tags = [];
        }
        
        if (task.tags.includes(normalizedTag)) {
            return { success: false, error: 'La etiqueta ya existe en esta tarea' };
        }
        
        if (task.tags.length >= 5) {
            return { success: false, error: 'Máximo 5 etiquetas por tarea' };
        }
        
        task.tags.push(normalizedTag);
        task.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        return { success: true, task: task };
    }

    /**
     * Elimina una etiqueta de una tarea
     * @param {string} id - ID de la tarea
     * @param {string} tag - Etiqueta a eliminar
     * @returns {Object} Resultado de la operación
     */
    removeTagFromTask(id, tag) {
        const task = this.getTaskById(id);
        
        if (!task) {
            return { success: false, error: 'Tarea no encontrada' };
        }
        
        if (!task.tags || task.tags.length === 0) {
            return { success: false, error: 'La tarea no tiene etiquetas' };
        }
        
        const normalizedTag = tag.trim().toLowerCase();
        const tagIndex = task.tags.indexOf(normalizedTag);
        
        if (tagIndex === -1) {
            return { success: false, error: 'La etiqueta no existe en esta tarea' };
        }
        
        task.tags.splice(tagIndex, 1);
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
     * Reordena las tareas (Drag and Drop)
     * @param {number} fromIndex - Índice de origen
     * @param {number} toIndex - Índice de destino
     * @returns {Object} Resultado de la operación
     */
    reorderTasks(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.tasks.length) {
            return { success: false, error: 'Índice de origen inválido' };
        }
        
        if (toIndex < 0 || toIndex >= this.tasks.length) {
            return { success: false, error: 'Índice de destino inválido' };
        }
        
        if (fromIndex === toIndex) {
            return { success: true, tasks: this.tasks };
        }
        
        const [movedTask] = this.tasks.splice(fromIndex, 1);
        this.tasks.splice(toIndex, 0, movedTask);
        
        // Actualizar órdenes
        this.tasks.forEach((task, index) => {
            task.order = index;
        });
        
        this.saveToStorage();
        
        return { success: true, tasks: this.tasks };
    }

    /**
     * Reordena usando IDs de tareas
     * @param {string} taskId - ID de la tarea a mover
     * @param {string} targetId - ID de la tarea destino
     * @returns {Object} Resultado de la operación
     */
    reorderTasksById(taskId, targetId) {
        const fromIndex = this.tasks.findIndex(t => t.id === taskId);
        const toIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (fromIndex === -1) {
            return { success: false, error: 'Tarea de origen no encontrada' };
        }
        
        if (toIndex === -1) {
            return { success: false, error: 'Tarea de destino no encontrada' };
        }
        
        return this.reorderTasks(fromIndex, toIndex);
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
     * Calcula el estado de la fecha límite
     * @param {string} dueDate - Fecha límite en ISO
     * @returns {Object} Estado de la fecha { status: 'overdue'|'warning'|'safe'|'none', daysRemaining: number }
     */
    getDueDateStatus(dueDate) {
        if (!dueDate) {
            return { status: 'none', daysRemaining: null };
        }
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { status: 'overdue', daysRemaining: diffDays };
        } else if (diffDays <= 3) {
            return { status: 'warning', daysRemaining: diffDays };
        } else {
            return { status: 'safe', daysRemaining: diffDays };
        }
    }

    /**
     * Obtiene estadísticas completas de las tareas
     * @returns {Object} Objeto con estadísticas detalladas
     */
    getStats() {
        const total = this.getTotalCount();
        const completed = this.getCompletedCount();
        const pending = this.getPendingCount();
        
        const highPriority = this.tasks.filter(t => t.priority === 'alta' && !t.completed).length;
        const mediumPriority = this.tasks.filter(t => t.priority === 'media' && !t.completed).length;
        const lowPriority = this.tasks.filter(t => t.priority === 'baja' && !t.completed).length;
        
        const overdueTasks = this.tasks.filter(t => {
            if (t.completed || !t.dueDate) return false;
            return this.getDueDateStatus(t.dueDate).status === 'overdue';
        }).length;
        
        const warningTasks = this.tasks.filter(t => {
            if (t.completed || !t.dueDate) return false;
            return this.getDueDateStatus(t.dueDate).status === 'warning';
        }).length;
        
        const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Obtener todas las etiquetas únicas
        const allTags = this.tasks.reduce((acc, task) => {
            if (task.tags) {
                task.tags.forEach(tag => {
                    if (!acc[tag]) {
                        acc[tag] = 0;
                    }
                    acc[tag]++;
                });
            }
            return acc;
        }, {});
        
        return {
            total,
            pending,
            completed,
            completionPercentage,
            highPriority,
            mediumPriority,
            lowPriority,
            overdueTasks,
            warningTasks,
            tags: allTags
        };
    }

    /**
     * Obtiene todas las etiquetas únicas usadas
     * @returns {Array} Array de etiquetas únicas
     */
    getAllTags() {
        const tags = new Set();
        this.tasks.forEach(task => {
            if (task.tags) {
                task.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
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
            const tasks = stored ? JSON.parse(stored) : [];
            
            // Migrar tareas antiguas que no tengan los nuevos campos
            return tasks.map(task => ({
                ...task,
                dueDate: task.dueDate || null,
                tags: task.tags || [],
                order: task.order !== undefined ? task.order : 0
            }));
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
     * @param {string} criteria - Criterio de ordenación (date, priority, alphabetical, dueDate)
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
            case 'dueDate':
                sortedTasks.sort((a, b) => {
                    // Tareas sin fecha van al final
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    
                    const diff = new Date(a.dueDate) - new Date(b.dueDate);
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

    /**
     * Exporta todas las tareas a JSON
     * @returns {string} JSON string de las tareas
     */
    exportToJSON() {
        return JSON.stringify(this.tasks, null, 2);
    }

    /**
     * Importa tareas desde JSON
     * @param {string} jsonString - JSON string con las tareas
     * @returns {Object} Resultado de la operación
     */
    importFromJSON(jsonString) {
        try {
            const importedTasks = JSON.parse(jsonString);
            
            if (!Array.isArray(importedTasks)) {
                return { success: false, error: 'El formato debe ser un array de tareas' };
            }
            
            // Validar cada tarea
            for (const task of importedTasks) {
                if (!task.text || typeof task.text !== 'string') {
                    return { success: false, error: 'Cada tarea debe tener un texto válido' };
                }
            }
            
            // Asignar nuevos IDs para evitar conflictos
            const tasksWithNewIds = importedTasks.map(task => ({
                ...task,
                id: this.generateId(),
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dueDate: task.dueDate || null,
                tags: task.tags || [],
                order: task.order !== undefined ? task.order : 0
            }));
            
            this.tasks = [...tasksWithNewIds, ...this.tasks];
            this.saveToStorage();
            
            return { success: true, importedCount: tasksWithNewIds.length };
        } catch (error) {
            return { success: false, error: 'Error al parsear JSON: ' + error.message };
        }
    }
}

// Exportar para uso en módulos (si se usa en entorno de módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoModel;
}
