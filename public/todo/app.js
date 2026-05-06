/**
 * App.js - Controlador de la interfaz de usuario
 * Maneja todas las interacciones del DOM y se comunica con TodoModel
 * 
 * @author Sistema de Gestión de Tareas
 * @version 1.0.0
 */

class TodoApp {
    /**
     * Constructor - Inicializa la aplicación
     */
    constructor() {
        // Instancia del modelo de datos
        this.model = new TodoModel();
        
        // Filtro actual activo
        this.currentFilter = 'all';
        
        // Tarea en edición
        this.editingTaskId = null;
        
        // Caché de elementos del DOM
        this.elements = {};
        
        // Inicializar la aplicación
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    }

    /**
     * Cachea los elementos del DOM para mejor rendimiento
     */
    cacheElements() {
        this.elements = {
            taskForm: document.getElementById('taskForm'),
            taskInput: document.getElementById('taskInput'),
            prioritySelect: document.getElementById('prioritySelect'),
            taskList: document.getElementById('taskList'),
            tasksContainer: document.getElementById('tasksContainer'),
            emptyState: document.getElementById('emptyState'),
            bulkActions: document.getElementById('bulkActions'),
            clearCompletedBtn: document.getElementById('clearCompletedBtn'),
            pendingCount: document.getElementById('pendingCount'),
            completedCount: document.getElementById('completedCount'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            modalConfirm: document.getElementById('modalConfirm'),
            modalCancel: document.getElementById('modalCancel'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    /**
     * Vincula todos los eventos de la aplicación
     */
    bindEvents() {
        // Envío del formulario
        this.elements.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTask();
        });

        // Filtros
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilterChange(btn.dataset.filter);
            });
        });

        // Limpiar completadas
        this.elements.clearCompletedBtn.addEventListener('click', () => {
            this.handleClearCompleted();
        });

        // Eventos del modal
        this.elements.modalCancel.addEventListener('click', () => {
            this.hideModal();
        });

        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });

        // Delegación de eventos para la lista de tareas
        this.elements.taskList.addEventListener('click', (e) => {
            this.handleTaskListClick(e);
        });

        // Evento de teclado para edición
        this.elements.taskList.addEventListener('keydown', (e) => {
            this.handleTaskListKeydown(e);
        });

        // Atajos de teclado globales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.editingTaskId) {
                    this.cancelEdit();
                }
                this.hideModal();
            }
        });
    }

    /**
     * Maneja el agregar una nueva tarea
     */
    handleAddTask() {
        const text = this.elements.taskInput.value;
        const priority = this.elements.prioritySelect.value;

        const result = this.model.addTask(text, priority);

        if (result.success) {
            this.elements.taskInput.value = '';
            this.elements.prioritySelect.value = 'media';
            this.elements.taskInput.focus();
            this.showToast('Tarea agregada correctamente', 'success');
            this.render();
        } else {
            this.showToast(result.error, 'error');
            this.elements.taskInput.focus();
        }
    }

    /**
     * Maneja el cambio de filtro
     * @param {string} filter - Nuevo filtro
     */
    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        this.elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    /**
     * Maneja clicks en la lista de tareas (delegación de eventos)
     * @param {Event} e - Evento de click
     */
    handleTaskListClick(e) {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;

        // Checkbox (completar tarea)
        if (target.closest('.task-checkbox')) {
            this.handleToggleTask(taskId);
            return;
        }

        // Botón editar
        if (target.closest('.edit-btn')) {
            this.startEdit(taskId);
            return;
        }

        // Botón eliminar
        if (target.closest('.delete-btn')) {
            this.handleDeleteTask(taskId);
            return;
        }

        // Guardar edición
        if (target.closest('.save-edit-btn')) {
            this.saveEdit(taskId);
            return;
        }

        // Cancelar edición
        if (target.closest('.cancel-edit-btn')) {
            this.cancelEdit();
            return;
        }
    }

    /**
     * Maneja eventos de teclado en la lista de tareas
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleTaskListKeydown(e) {
        if (e.target.classList.contains('edit-input')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const taskId = e.target.closest('.task-item').dataset.id;
                this.saveEdit(taskId);
            } else if (e.key === 'Escape') {
                this.cancelEdit();
            }
        }
    }

    /**
     * Maneja el toggle de una tarea
     * @param {string} taskId - ID de la tarea
     */
    handleToggleTask(taskId) {
        const result = this.model.toggleTask(taskId);
        
        if (result.success) {
            const status = result.task.completed ? 'completada' : 'pendiente';
            this.showToast(`Tarea marcada como ${status}`, 'success');
            this.render();
        } else {
            this.showToast(result.error, 'error');
        }
    }

    /**
     * Maneja la eliminación de una tarea
     * @param {string} taskId - ID de la tarea
     */
    handleDeleteTask(taskId) {
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        
        if (taskElement) {
            taskElement.classList.add('deleting');
            
            setTimeout(() => {
                const result = this.model.deleteTask(taskId);
                
                if (result.success) {
                    this.showToast('Tarea eliminada', 'success');
                    this.render();
                } else {
                    this.showToast(result.error, 'error');
                    taskElement.classList.remove('deleting');
                }
            }, 300);
        }
    }

    /**
     * Maneja limpiar tareas completadas
     */
    handleClearCompleted() {
        const completedCount = this.model.getCompletedCount();
        
        if (completedCount === 0) {
            this.showToast('No hay tareas completadas para eliminar', 'warning');
            return;
        }

        this.showModal(
            '¿Eliminar tareas completadas?',
            `Se eliminarán ${completedCount} tarea${completedCount > 1 ? 's' : ''} completada${completedCount > 1 ? 's' : ''}. Esta acción no se puede deshacer.`,
            () => {
                const result = this.model.deleteCompletedTasks();
                
                if (result.success) {
                    this.showToast(`${result.deletedCount} tarea${result.deletedCount > 1 ? 's' : ''} eliminada${result.deletedCount > 1 ? 's' : ''}`, 'success');
                    this.render();
                }
            }
        );
    }

    /**
     * Inicia la edición de una tarea
     * @param {string} taskId - ID de la tarea
     */
    startEdit(taskId) {
        if (this.editingTaskId) {
            this.cancelEdit();
        }
        
        this.editingTaskId = taskId;
        this.renderTasks();
        
        // Enfocar el input de edición
        setTimeout(() => {
            const editInput = document.querySelector(`[data-id="${taskId}"] .edit-input`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }

    /**
     * Guarda la edición de una tarea
     * @param {string} taskId - ID de la tarea
     */
    saveEdit(taskId) {
        const editInput = document.querySelector(`[data-id="${taskId}"] .edit-input`);
        
        if (!editInput) return;
        
        const newText = editInput.value;
        const result = this.model.editTask(taskId, newText);
        
        if (result.success) {
            this.editingTaskId = null;
            this.showToast('Tarea actualizada', 'success');
            this.render();
        } else {
            this.showToast(result.error, 'error');
            editInput.focus();
        }
    }

    /**
     * Cancela la edición actual
     */
    cancelEdit() {
        this.editingTaskId = null;
        this.renderTasks();
    }

    /**
     * Renderiza toda la aplicación
     */
    render() {
        this.renderTasks();
        this.renderStats();
        this.renderBulkActions();
    }

    /**
     * Renderiza la lista de tareas
     */
    renderTasks() {
        const tasks = this.model.getFilteredTasks(this.currentFilter);
        
        if (tasks.length === 0) {
            this.elements.taskList.innerHTML = '';
            this.elements.emptyState.classList.remove('hidden');
            this.updateEmptyStateMessage();
        } else {
            this.elements.emptyState.classList.add('hidden');
            this.elements.taskList.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        }
    }

    /**
     * Actualiza el mensaje del estado vacío según el filtro
     */
    updateEmptyStateMessage() {
        const title = this.elements.emptyState.querySelector('.empty-title');
        const subtitle = this.elements.emptyState.querySelector('.empty-subtitle');
        
        switch (this.currentFilter) {
            case 'pending':
                title.textContent = '¡Excelente trabajo!';
                subtitle.textContent = 'No tienes tareas pendientes';
                break;
            case 'completed':
                title.textContent = 'Sin tareas completadas';
                subtitle.textContent = 'Completa algunas tareas para verlas aquí';
                break;
            default:
                title.textContent = 'No tienes tareas';
                subtitle.textContent = 'Agrega tu primera tarea para comenzar';
        }
    }

    /**
     * Crea el HTML de una tarea
     * @param {Object} task - Objeto de tarea
     * @returns {string} HTML de la tarea
     */
    createTaskHTML(task) {
        const isEditing = this.editingTaskId === task.id;
        const createdDate = this.formatDate(task.createdAt);
        
        if (isEditing) {
            return `
                <li class="task-item editing" data-id="${task.id}">
                    <label class="task-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} disabled>
                        <span class="checkmark"></span>
                    </label>
                    <input type="text" class="edit-input" value="${this.escapeHTML(task.text)}" maxlength="500">
                    <div class="edit-actions">
                        <button class="action-btn save-edit-btn" title="Guardar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="action-btn cancel-edit-btn" title="Cancelar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </li>
            `;
        }
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <label class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <p class="task-text">${this.escapeHTML(task.text)}</p>
                    <div class="task-meta">
                        <span class="task-date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${createdDate}
                        </span>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" title="Editar tarea">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn delete" title="Eliminar tarea">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </li>
        `;
    }

    /**
     * Renderiza las estadísticas
     */
    renderStats() {
        const stats = this.model.getStats();
        this.elements.pendingCount.textContent = stats.pending;
        this.elements.completedCount.textContent = stats.completed;
    }

    /**
     * Renderiza las acciones masivas
     */
    renderBulkActions() {
        const completedCount = this.model.getCompletedCount();
        
        if (completedCount > 0) {
            this.elements.bulkActions.classList.remove('hidden');
            this.elements.clearCompletedBtn.textContent = `Eliminar completadas (${completedCount})`;
        } else {
            this.elements.bulkActions.classList.add('hidden');
        }
    }

    /**
     * Muestra el modal de confirmación
     * @param {string} title - Título del modal
     * @param {string} message - Mensaje del modal
     * @param {Function} onConfirm - Callback al confirmar
     */
    showModal(title, message, onConfirm) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalOverlay.classList.add('active');
        
        // Remover listener anterior y agregar nuevo
        const newConfirmBtn = this.elements.modalConfirm.cloneNode(true);
        this.elements.modalConfirm.parentNode.replaceChild(newConfirmBtn, this.elements.modalConfirm);
        this.elements.modalConfirm = newConfirmBtn;
        
        this.elements.modalConfirm.addEventListener('click', () => {
            this.hideModal();
            onConfirm();
        });
    }

    /**
     * Oculta el modal
     */
    hideModal() {
        this.elements.modalOverlay.classList.remove('active');
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast (success, error, warning)
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconSVG = this.getToastIcon(type);
        
        toast.innerHTML = `
            ${iconSVG}
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Cerrar al hacer click
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            this.removeToast(toast);
        }, 3000);
    }

    /**
     * Obtiene el icono SVG para el toast
     * @param {string} type - Tipo de toast
     * @returns {string} SVG del icono
     */
    getToastIcon(type) {
        const icons = {
            success: `
                <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `,
            error: `
                <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            `,
            warning: `
                <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            `
        };
        
        return icons[type] || icons.success;
    }

    /**
     * Remueve un toast
     * @param {HTMLElement} toast - Elemento toast a remover
     */
    removeToast(toast) {
        if (!toast || toast.classList.contains('hiding')) return;
        
        toast.classList.add('hiding');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    /**
     * Formatea una fecha ISO a formato legible
     * @param {string} isoDate - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    formatDate(isoDate) {
        const date = new Date(isoDate);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `Hoy a las ${hours}:${minutes}`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});
