/**
 * App.js - Controlador de la interfaz de usuario
 * Maneja todas las interacciones del DOM y se comunica con TodoModel
 * 
 * @author Sistema de Gestión de Tareas
 * @version 2.0.0
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
        
        // Búsqueda actual
        this.currentSearch = '';
        
        // Etiqueta filtrada actualmente
        this.currentTagFilter = '';
        
        // Tarea en edición
        this.editingTaskId = null;
        
        // Drag and Drop
        this.draggedElement = null;
        this.draggedTaskId = null;
        
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
            dueDateInput: document.getElementById('dueDateInput'),
            tagsInput: document.getElementById('tagsInput'),
            searchInput: document.getElementById('searchInput'),
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
            toastContainer: document.getElementById('toastContainer'),
            // Estadísticas
            statsPanel: document.getElementById('statsPanel'),
            statTotal: document.getElementById('statTotal'),
            statCompletion: document.getElementById('statCompletion'),
            statHigh: document.getElementById('statHigh'),
            statMedium: document.getElementById('statMedium'),
            statLow: document.getElementById('statLow'),
            statOverdue: document.getElementById('statOverdue'),
            progressBar: document.getElementById('progressBar'),
            // Etiquetas
            tagsList: document.getElementById('tagsList'),
            clearTagFilter: document.getElementById('clearTagFilter')
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

        // Búsqueda en tiempo real
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderTasks();
            });
        }

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

        // Limpiar filtro de etiqueta
        if (this.elements.clearTagFilter) {
            this.elements.clearTagFilter.addEventListener('click', () => {
                this.currentTagFilter = '';
                this.elements.clearTagFilter.classList.add('hidden');
                this.renderTasks();
                this.renderTagsList();
            });
        }

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

        // Drag and Drop eventos
        this.elements.taskList.addEventListener('dragstart', (e) => {
            this.handleDragStart(e);
        });

        this.elements.taskList.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        this.elements.taskList.addEventListener('dragover', (e) => {
            this.handleDragOver(e);
        });

        this.elements.taskList.addEventListener('drop', (e) => {
            this.handleDrop(e);
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
        const dueDate = this.elements.dueDateInput ? this.elements.dueDateInput.value : null;
        const tagsValue = this.elements.tagsInput ? this.elements.tagsInput.value : '';
        
        // Parsear etiquetas separadas por coma
        const tags = tagsValue
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const result = this.model.addTask(text, priority, dueDate || null, tags);

        if (result.success) {
            this.elements.taskInput.value = '';
            this.elements.prioritySelect.value = 'media';
            if (this.elements.dueDateInput) this.elements.dueDateInput.value = '';
            if (this.elements.tagsInput) this.elements.tagsInput.value = '';
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
     * Maneja el filtro por etiqueta
     * @param {string} tag - Etiqueta a filtrar
     */
    handleTagFilter(tag) {
        if (this.currentTagFilter === tag) {
            this.currentTagFilter = '';
            if (this.elements.clearTagFilter) {
                this.elements.clearTagFilter.classList.add('hidden');
            }
        } else {
            this.currentTagFilter = tag;
            if (this.elements.clearTagFilter) {
                this.elements.clearTagFilter.classList.remove('hidden');
            }
        }
        this.renderTasks();
        this.renderTagsList();
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

        // Click en etiqueta
        if (target.closest('.task-tag')) {
            const tag = target.closest('.task-tag').dataset.tag;
            if (tag) {
                this.handleTagFilter(tag);
            }
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
     * Maneja el inicio del Drag
     * @param {DragEvent} e - Evento de drag
     */
    handleDragStart(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        this.draggedElement = taskItem;
        this.draggedTaskId = taskItem.dataset.id;
        
        taskItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskItem.dataset.id);
    }

    /**
     * Maneja el fin del Drag
     * @param {DragEvent} e - Evento de drag
     */
    handleDragEnd(e) {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.classList.remove('dragging');
        }
        
        // Limpiar todas las clases de drag-over
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        this.draggedElement = null;
        this.draggedTaskId = null;
    }

    /**
     * Maneja el Drag Over
     * @param {DragEvent} e - Evento de drag
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const taskItem = e.target.closest('.task-item');
        if (!taskItem || taskItem === this.draggedElement) return;
        
        // Limpiar otras clases drag-over
        document.querySelectorAll('.drag-over').forEach(el => {
            if (el !== taskItem) el.classList.remove('drag-over');
        });
        
        taskItem.classList.add('drag-over');
    }

    /**
     * Maneja el Drop
     * @param {DragEvent} e - Evento de drop
     */
    handleDrop(e) {
        e.preventDefault();
        
        const targetItem = e.target.closest('.task-item');
        if (!targetItem || !this.draggedTaskId) return;
        
        const targetId = targetItem.dataset.id;
        
        if (this.draggedTaskId !== targetId) {
            const result = this.model.reorderTasksById(this.draggedTaskId, targetId);
            
            if (result.success) {
                this.showToast('Tarea reordenada', 'success');
                this.renderTasks();
            }
        }
        
        targetItem.classList.remove('drag-over');
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
            'Eliminar tareas completadas?',
            `Se eliminaran ${completedCount} tarea${completedCount > 1 ? 's' : ''} completada${completedCount > 1 ? 's' : ''}. Esta accion no se puede deshacer.`,
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
        this.renderTagsList();
    }

    /**
     * Renderiza la lista de tareas
     */
    renderTasks() {
        let tasks;
        
        // Aplicar búsqueda si hay texto
        if (this.currentSearch) {
            tasks = this.model.searchTasks(this.currentSearch, this.currentFilter);
        } else if (this.currentTagFilter) {
            tasks = this.model.filterByTag(this.currentTagFilter, this.currentFilter);
        } else {
            tasks = this.model.getFilteredTasks(this.currentFilter);
        }
        
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
        
        if (this.currentSearch) {
            title.textContent = 'Sin resultados';
            subtitle.textContent = `No se encontraron tareas con "${this.currentSearch}"`;
        } else if (this.currentTagFilter) {
            title.textContent = 'Sin tareas';
            subtitle.textContent = `No hay tareas con la etiqueta "${this.currentTagFilter}"`;
        } else {
            switch (this.currentFilter) {
                case 'pending':
                    title.textContent = 'Excelente trabajo!';
                    subtitle.textContent = 'No tienes tareas pendientes';
                    break;
                case 'completed':
                    title.textContent = 'Sin tareas completadas';
                    subtitle.textContent = 'Completa algunas tareas para verlas aqui';
                    break;
                default:
                    title.textContent = 'No tienes tareas';
                    subtitle.textContent = 'Agrega tu primera tarea para comenzar';
            }
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
        const dueDateStatus = this.model.getDueDateStatus(task.dueDate);
        
        // Generar HTML para las etiquetas
        const tagsHTML = task.tags && task.tags.length > 0
            ? task.tags.map(tag => `
                <span class="task-tag ${this.currentTagFilter === tag ? 'active' : ''}" data-tag="${this.escapeHTML(tag)}">
                    ${this.escapeHTML(tag)}
                </span>
            `).join('')
            : '';
        
        // Generar HTML para la fecha límite
        let dueDateHTML = '';
        if (task.dueDate) {
            const dueDateFormatted = this.formatDueDate(task.dueDate);
            let dueDateClass = 'due-date';
            
            if (!task.completed) {
                if (dueDateStatus.status === 'overdue') {
                    dueDateClass += ' overdue';
                } else if (dueDateStatus.status === 'warning') {
                    dueDateClass += ' warning';
                }
            }
            
            dueDateHTML = `
                <span class="${dueDateClass}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${dueDateFormatted}
                </span>
            `;
        }
        
        if (isEditing) {
            return `
                <li class="task-item editing" data-id="${task.id}" draggable="false">
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
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                <div class="drag-handle" title="Arrastrar para reordenar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
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
                        ${dueDateHTML}
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                    ${tagsHTML ? `<div class="task-tags">${tagsHTML}</div>` : ''}
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
     * Renderiza las estadísticas completas
     */
    renderStats() {
        const stats = this.model.getStats();
        
        // Contadores básicos
        this.elements.pendingCount.textContent = stats.pending;
        this.elements.completedCount.textContent = stats.completed;
        
        // Panel de estadísticas
        if (this.elements.statTotal) {
            this.elements.statTotal.textContent = stats.total;
        }
        if (this.elements.statCompletion) {
            this.elements.statCompletion.textContent = `${stats.completionPercentage}%`;
        }
        if (this.elements.statHigh) {
            this.elements.statHigh.textContent = stats.highPriority;
        }
        if (this.elements.statMedium) {
            this.elements.statMedium.textContent = stats.mediumPriority;
        }
        if (this.elements.statLow) {
            this.elements.statLow.textContent = stats.lowPriority;
        }
        if (this.elements.statOverdue) {
            this.elements.statOverdue.textContent = stats.overdueTasks;
        }
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${stats.completionPercentage}%`;
        }
    }

    /**
     * Renderiza la lista de etiquetas disponibles
     */
    renderTagsList() {
        if (!this.elements.tagsList) return;
        
        const allTags = this.model.getAllTags();
        
        if (allTags.length === 0) {
            this.elements.tagsList.innerHTML = '<span class="no-tags">Sin etiquetas</span>';
            return;
        }
        
        this.elements.tagsList.innerHTML = allTags.map(tag => `
            <button class="tag-filter-btn ${this.currentTagFilter === tag ? 'active' : ''}" data-tag="${this.escapeHTML(tag)}">
                ${this.escapeHTML(tag)}
            </button>
        `).join('');
        
        // Vincular eventos de click
        this.elements.tagsList.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleTagFilter(btn.dataset.tag);
            });
        });
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
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                if (diffMinutes < 1) return 'Ahora';
                return `Hace ${diffMinutes} min`;
            }
            return `Hace ${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} dias`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    /**
     * Formatea la fecha límite
     * @param {string} isoDate - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    formatDueDate(isoDate) {
        const date = new Date(isoDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Vencio hace ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Vence hoy';
        } else if (diffDays === 1) {
            return 'Vence manana';
        } else if (diffDays <= 7) {
            return `Vence en ${diffDays} dias`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });
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
