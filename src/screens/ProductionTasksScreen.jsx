import React, { useState, useMemo, useRef } from 'react';

function ProductionTasksScreen({ onClose, tasks, onUpdateStatus, onUpdateNotes, onDeleteTask }) {
    const scrollRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [productTypeFilter, setProductTypeFilter] = useState('all');
    const [editingNotes, setEditingNotes] = useState(null);
    const [notesValue, setNotesValue] = useState('');

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pendiente':
                return {
                    label: 'Pendiente',
                    icon: 'schedule',
                    color: 'text-gray-600 bg-gray-50',
                    borderColor: 'border-gray-200'
                };
            case 'produccion':
                return {
                    label: 'Producción',
                    icon: 'construction',
                    color: 'text-primary bg-pink-50',
                    borderColor: 'border-pink-200'
                };
            case 'entretela':
                return {
                    label: 'Entre Tela',
                    icon: 'checkroom',
                    color: 'text-blue-600 bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'lavado':
                return {
                    label: 'Lavado',
                    icon: 'water_drop',
                    color: 'text-cyan-600 bg-cyan-50',
                    borderColor: 'border-cyan-200'
                };
            case 'empaquetado':
                return {
                    label: 'Empaquetado',
                    icon: 'package',
                    color: 'text-orange-600 bg-orange-50',
                    borderColor: 'border-orange-200'
                };
            case 'entregado':
                return {
                    label: 'Entregado',
                    icon: 'check_circle',
                    color: 'text-green-600 bg-green-50',
                    borderColor: 'border-green-200'
                };
            default:
                return {
                    label: 'Desconocido',
                    icon: 'help',
                    color: 'text-gray-600 bg-gray-50',
                    borderColor: 'border-gray-200'
                };
        }
    };

    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'alta':
                return { label: 'Alta', color: 'bg-red-500' };
            case 'media':
                return { label: 'Media', color: 'bg-yellow-500' };
            case 'baja':
                return { label: 'Baja', color: 'bg-green-500' };
            default:
                return { label: 'Media', color: 'bg-yellow-500' };
        }
    };

    // Filtrar tareas
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Filtro por estado
            const statusMatch = activeFilter === 'all' || task.status === activeFilter;

            // Filtro por tipo de prenda
            const typeMatch = productTypeFilter === 'all' || task.productType === productTypeFilter;

            // Búsqueda
            const searchMatch = searchQuery === '' ||
                task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.designName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.colorName?.toLowerCase().includes(searchQuery.toLowerCase());

            return statusMatch && typeMatch && searchMatch;
        });
    }, [tasks, activeFilter, productTypeFilter, searchQuery]);

    // Agrupar tareas por estado
    const tasksByStatus = useMemo(() => {
        const groups = {
            'pendiente': [],
            'produccion': [],
            'entretela': [],
            'lavado': [],
            'empaquetado': [],
            'entregado': []
        };

        filteredTasks.forEach(task => {
            if (groups[task.status]) {
                groups[task.status].push(task);
            }
        });

        return groups;
    }, [filteredTasks]);

    const handleStatusChange = (taskId, currentStatus) => {
        // Ciclo: pendiente -> produccion -> entretela -> lavado -> empaquetado -> entregado
        const nextStatus = {
            'pendiente': 'produccion',
            'produccion': 'lavado',
            'lavado': 'entretela',
            'entretela': 'empaquetado',
            'empaquetado': 'entregado',
            'entregado': 'entregado'
        };

        onUpdateStatus(taskId, nextStatus[currentStatus]);
    };

    const handleSaveNotes = (taskId) => {
        onUpdateNotes(taskId, notesValue);
        setEditingNotes(null);
        setNotesValue('');
    };

    const handleEditNotes = (task) => {
        setEditingNotes(task.id);
        setNotesValue(task.notes || '');
    };

    const stats = useMemo(() => {
        return {
            total: tasks.length,
            pendiente: tasks.filter(t => t.status === 'pendiente').length,
            produccion: tasks.filter(t => t.status === 'produccion').length,
            entretela: tasks.filter(t => t.status === 'entretela').length,
            lavado: tasks.filter(t => t.status === 'lavado').length,
            empaquetado: tasks.filter(t => t.status === 'empaquetado').length,
            entregado: tasks.filter(t => t.status === 'entregado').length
        };
    }, [tasks]);

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col animate-slide-up">
            <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-background-light/95 backdrop-blur-md sticky top-0 z-20 border-b border-pink-100">
                <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 text-text-main transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h2 className="text-text-main text-xl font-bold tracking-tight">To-Do List</h2>
                    <p className="text-xs text-text-muted">Gestión de Producción</p>
                </div>
                <div className="w-10 h-10"></div>
            </header>

            <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-32">
                {/* Estadísticas rápidas - Filtros */}
                <section className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'pendiente' ? 'all' : 'pendiente')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'pendiente' ? 'bg-gray-100 border-gray-400 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xl font-bold text-gray-700">{stats.pendiente}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Pendientes</p>
                    </button>
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'produccion' ? 'all' : 'produccion')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'produccion' ? 'bg-pink-100 border-pink-400 shadow-md' : 'bg-pink-50 border-pink-200'}`}>
                        <p className="text-xl font-bold text-primary">{stats.produccion}</p>
                        <p className="text-[10px] text-primary mt-0.5 font-medium">Producción</p>
                    </button>
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'lavado' ? 'all' : 'lavado')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'lavado' ? 'bg-cyan-100 border-cyan-400 shadow-md' : 'bg-cyan-50 border-cyan-200'}`}>
                        <p className="text-xl font-bold text-cyan-600">{stats.lavado}</p>
                        <p className="text-[10px] text-cyan-600 mt-0.5">Lavado</p>
                    </button>
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'entretela' ? 'all' : 'entretela')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'entretela' ? 'bg-blue-100 border-blue-400 shadow-md' : 'bg-blue-50 border-blue-200'}`}>
                        <p className="text-xl font-bold text-blue-600">{stats.entretela}</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">Entre Tela</p>
                    </button>
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'empaquetado' ? 'all' : 'empaquetado')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'empaquetado' ? 'bg-orange-100 border-orange-400 shadow-md' : 'bg-orange-50 border-orange-200'}`}>
                        <p className="text-xl font-bold text-orange-600">{stats.empaquetado}</p>
                        <p className="text-[10px] text-orange-600 mt-0.5">Empaquetado</p>
                    </button>
                    <button
                        onClick={() => setActiveFilter(activeFilter === 'entregado' ? 'all' : 'entregado')}
                        className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105 ${activeFilter === 'entregado' ? 'bg-green-100 border-green-400 shadow-md' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-xl font-bold text-green-600">{stats.entregado}</p>
                        <p className="text-[10px] text-green-500 mt-0.5">Entregados</p>
                    </button>
                </section>

                {/* Búsqueda */}
                <section>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300">search</span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-soft text-sm text-text-main focus:ring-2 focus:ring-primary/50 placeholder-pink-300/70"
                            placeholder="Buscar tareas..."
                            type="text"
                        />
                    </div>
                </section>

                {/* Filtros de tipo de prenda */}
                <section className="flex gap-3">
                    <button
                        onClick={() => setProductTypeFilter('all')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${productTypeFilter === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-pink-100 hover:bg-pink-50'}`}>
                        Todas
                    </button>
                    <button
                        onClick={() => setProductTypeFilter('musculosa')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${productTypeFilter === 'musculosa' ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-pink-100 hover:bg-pink-50'}`}>
                        Musculosas
                    </button>
                    <button
                        onClick={() => setProductTypeFilter('remera')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${productTypeFilter === 'remera' ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-pink-100 hover:bg-pink-50'}`}>
                        Remeras
                    </button>
                </section>

                {/* Lista de tareas */}
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">checklist</span>
                        <p className="text-text-muted text-sm font-medium">No hay tareas que mostrar</p>
                        <p className="text-text-muted text-xs mt-2">Las tareas aparecerán automáticamente cuando registres ventas</p>
                    </div>
                ) : (
                    <section className="space-y-6">
                        {/* Tareas Producción */}
                        {(activeFilter === 'all' || activeFilter === 'produccion') && tasksByStatus.produccion.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 ml-1">🔨 Producción</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.produccion.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border-2 ${statusConfig.borderColor} transition-all`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.color}`}></div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{formatDate(task.createdAt)}</span>
                                                </div>

                                                {/* Notas/Comentarios */}
                                                {editingNotes === task.id ? (
                                                    <div className="mb-3 space-y-2">
                                                        <textarea
                                                            value={notesValue}
                                                            onChange={(e) => setNotesValue(e.target.value)}
                                                            placeholder="Ej: Musculosa de Sofi, usar hilo rojo..."
                                                            className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-pink-50/50 text-sm text-text-main focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                                            rows="2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveNotes(task.id)}
                                                                className="flex-1 bg-primary text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors">
                                                                Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingNotes(null); setNotesValue(''); }}
                                                                className="flex-1 bg-gray-100 text-text-muted py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : task.notes ? (
                                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                                    Nota:
                                                                </p>
                                                                <p className="text-sm text-yellow-900 italic">"{task.notes}"</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditNotes(task)}
                                                                className="text-yellow-600 hover:text-yellow-700 shrink-0">
                                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditNotes(task)}
                                                        className="mb-3 w-full py-2 px-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-300 hover:text-primary hover:bg-pink-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                                                        <span className="material-symbols-outlined !text-[18px]">add_notes</span>
                                                        <span>Agregar nota</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                        className="flex-1 bg-cyan-50 text-cyan-600 font-semibold py-2.5 px-4 rounded-xl border border-cyan-200 active:scale-[0.98] transition-all hover:bg-cyan-100 flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined !text-[18px]">water_drop</span>
                                                        <span className="text-sm">A Lavado</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás segura de que quieres eliminar esta tarea?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="bg-red-50 text-red-500 font-semibold py-2.5 px-4 rounded-xl border border-red-200 active:scale-[0.98] transition-all hover:bg-red-100">
                                                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tareas Pendientes */}
                        {(activeFilter === 'all' || activeFilter === 'pendiente') && tasksByStatus.pendiente.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3 ml-1">⏳ Pendientes</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.pendiente.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border ${statusConfig.borderColor}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.color}`}></div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{formatDate(task.createdAt)}</span>
                                                </div>

                                                {/* Notas/Comentarios */}
                                                {editingNotes === task.id ? (
                                                    <div className="mb-3 space-y-2">
                                                        <textarea
                                                            value={notesValue}
                                                            onChange={(e) => setNotesValue(e.target.value)}
                                                            placeholder="Ej: Musculosa de Sofi, usar hilo rojo..."
                                                            className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-sm text-text-main focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                                                            rows="2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveNotes(task.id)}
                                                                className="flex-1 bg-gray-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-600 transition-colors">
                                                                Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingNotes(null); setNotesValue(''); }}
                                                                className="flex-1 bg-gray-100 text-text-muted py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : task.notes ? (
                                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                                    Nota:
                                                                </p>
                                                                <p className="text-sm text-yellow-900 italic">"{task.notes}"</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditNotes(task)}
                                                                className="text-yellow-600 hover:text-yellow-700 shrink-0">
                                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditNotes(task)}
                                                        className="mb-3 w-full py-2 px-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                                                        <span className="material-symbols-outlined !text-[18px]">add_notes</span>
                                                        <span>Agregar nota</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                        className="flex-1 bg-pink-50 text-primary font-semibold py-2.5 px-4 rounded-xl border border-pink-200 active:scale-[0.98] transition-all hover:bg-pink-100 flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined !text-[18px]">construction</span>
                                                        <span className="text-sm">Producción</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás segura de que quieres eliminar esta tarea?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="bg-red-50 text-red-500 font-semibold py-2.5 px-4 rounded-xl border border-red-200 active:scale-[0.98] transition-all hover:bg-red-100">
                                                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tareas Lavado */}
                        {(activeFilter === 'all' || activeFilter === 'lavado') && tasksByStatus.lavado.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 mb-3 ml-1">💧 Lavado</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.lavado.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border-2 ${statusConfig.borderColor} transition-all`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.color}`}></div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{formatDate(task.createdAt)}</span>
                                                </div>

                                                {/* Notas/Comentarios */}
                                                {editingNotes === task.id ? (
                                                    <div className="mb-3 space-y-2">
                                                        <textarea
                                                            value={notesValue}
                                                            onChange={(e) => setNotesValue(e.target.value)}
                                                            placeholder="Ej: Musculosa de Sofi, usar hilo rojo..."
                                                            className="w-full px-3 py-2 rounded-xl border border-cyan-200 bg-cyan-50/50 text-sm text-text-main focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                                            rows="2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveNotes(task.id)}
                                                                className="flex-1 bg-cyan-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-cyan-600 transition-colors">
                                                                Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingNotes(null); setNotesValue(''); }}
                                                                className="flex-1 bg-gray-100 text-text-muted py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : task.notes ? (
                                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                                    Nota:
                                                                </p>
                                                                <p className="text-sm text-yellow-900 italic">"{task.notes}"</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditNotes(task)}
                                                                className="text-yellow-600 hover:text-yellow-700 shrink-0">
                                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditNotes(task)}
                                                        className="mb-3 w-full py-2 px-3 rounded-xl border-2 border-dashed border-cyan-300 text-cyan-400 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                                                        <span className="material-symbols-outlined !text-[18px]">add_notes</span>
                                                        <span>Agregar nota</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                        className="flex-1 bg-blue-50 text-blue-600 font-semibold py-2.5 px-4 rounded-xl border border-blue-200 active:scale-[0.98] transition-all hover:bg-blue-100 flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined !text-[18px]">checkroom</span>
                                                        <span className="text-sm">A Entre Tela</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás segura de que quieres eliminar esta tarea?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="bg-red-50 text-red-500 font-semibold py-2.5 px-4 rounded-xl border border-red-200 active:scale-[0.98] transition-all hover:bg-red-100">
                                                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tareas Entre Tela */}
                        {(activeFilter === 'all' || activeFilter === 'entretela') && tasksByStatus.entretela.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 ml-1">👕 Entre Tela</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.entretela.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border-2 ${statusConfig.borderColor} transition-all`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.color}`}></div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{formatDate(task.createdAt)}</span>
                                                </div>

                                                {/* Notas/Comentarios */}
                                                {editingNotes === task.id ? (
                                                    <div className="mb-3 space-y-2">
                                                        <textarea
                                                            value={notesValue}
                                                            onChange={(e) => setNotesValue(e.target.value)}
                                                            placeholder="Ej: Musculosa de Sofi, usar hilo rojo..."
                                                            className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/50 text-sm text-text-main focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                            rows="2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveNotes(task.id)}
                                                                className="flex-1 bg-blue-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                                                                Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingNotes(null); setNotesValue(''); }}
                                                                className="flex-1 bg-gray-100 text-text-muted py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : task.notes ? (
                                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                                    Nota:
                                                                </p>
                                                                <p className="text-sm text-yellow-900 italic">"{task.notes}"</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditNotes(task)}
                                                                className="text-yellow-600 hover:text-yellow-700 shrink-0">
                                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditNotes(task)}
                                                        className="mb-3 w-full py-2 px-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                                                        <span className="material-symbols-outlined !text-[18px]">add_notes</span>
                                                        <span>Agregar nota</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                        className="flex-1 bg-orange-50 text-orange-600 font-semibold py-2.5 px-4 rounded-xl border border-orange-200 active:scale-[0.98] transition-all hover:bg-orange-100 flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined !text-[18px]">package</span>
                                                        <span className="text-sm">Empaquetar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás segura de que quieres eliminar esta tarea?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="bg-red-50 text-red-500 font-semibold py-2.5 px-4 rounded-xl border border-red-200 active:scale-[0.98] transition-all hover:bg-red-100">
                                                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tareas Empaquetado */}
                        {(activeFilter === 'all' || activeFilter === 'empaquetado') && tasksByStatus.empaquetado.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-3 ml-1">📦 Empaquetado</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.empaquetado.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const priorityConfig = getPriorityConfig(task.priority);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border-2 ${statusConfig.borderColor} transition-all`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.color}`}></div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{formatDate(task.createdAt)}</span>
                                                </div>

                                                {/* Notas/Comentarios */}
                                                {editingNotes === task.id ? (
                                                    <div className="mb-3 space-y-2">
                                                        <textarea
                                                            value={notesValue}
                                                            onChange={(e) => setNotesValue(e.target.value)}
                                                            placeholder="Ej: Musculosa de Sofi, usar hilo rojo..."
                                                            className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm text-text-main focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                                            rows="2"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveNotes(task.id)}
                                                                className="flex-1 bg-orange-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors">
                                                                Guardar
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingNotes(null); setNotesValue(''); }}
                                                                className="flex-1 bg-gray-100 text-text-muted py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : task.notes ? (
                                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                                    Nota:
                                                                </p>
                                                                <p className="text-sm text-yellow-900 italic">"{task.notes}"</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditNotes(task)}
                                                                className="text-yellow-600 hover:text-yellow-700 shrink-0">
                                                                <span className="material-symbols-outlined !text-[18px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditNotes(task)}
                                                        className="mb-3 w-full py-2 px-3 rounded-xl border-2 border-dashed border-orange-300 text-orange-400 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                                                        <span className="material-symbols-outlined !text-[18px]">add_notes</span>
                                                        <span>Agregar nota</span>
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                        className="flex-1 bg-green-50 text-green-600 font-semibold py-2.5 px-4 rounded-xl border border-green-200 active:scale-[0.98] transition-all hover:bg-green-100 flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                                        <span className="text-sm">Entregar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás segura de que quieres eliminar esta tarea?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="bg-red-50 text-red-500 font-semibold py-2.5 px-4 rounded-xl border border-red-200 active:scale-[0.98] transition-all hover:bg-red-100">
                                                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tareas Entregadas */}
                        {(activeFilter === 'all' || activeFilter === 'entregado') && tasksByStatus.entregado.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 mb-3 ml-1">✅ Entregados</h3>
                                <div className="space-y-3">
                                    {tasksByStatus.entregado.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const colorCodes = {
                                            azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                            gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                        };

                                        return (
                                            <div key={task.id} className={`bg-white rounded-2xl shadow-soft p-4 border ${statusConfig.borderColor} opacity-75`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.color === 'blanco' ? 'border-2 border-gray-300' : ''}`}
                                                            style={{ backgroundColor: colorCodes[task.color] || '#ccc' }}
                                                        >
                                                            {task.color === 'blanco' && <span className="text-gray-600 text-xs font-bold">{task.sizeName}</span>}
                                                            {task.color !== 'blanco' && <span className="text-white text-xs font-bold">{task.sizeName}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-text-main font-bold text-base leading-tight line-through">{task.title}</h4>
                                                            <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-green-500 !text-[24px]">check_circle</span>
                                                </div>

                                                {/* Mostrar notas si existen */}
                                                {task.notes && (
                                                    <div className="mb-3 bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-3">
                                                        <p className="text-xs font-semibold text-yellow-700/70 mb-1 flex items-center gap-1">
                                                            <span className="material-symbols-outlined !text-[14px]">sticky_note_2</span>
                                                            Nota:
                                                        </p>
                                                        <p className="text-sm text-yellow-900/70 italic line-through">"{task.notes}"</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar esta tarea completada?')) {
                                                                onDeleteTask(task.id);
                                                            }
                                                        }}
                                                        className="text-red-400 hover:text-red-600 transition-colors">
                                                        <span className="material-symbols-outlined !text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default ProductionTasksScreen;
