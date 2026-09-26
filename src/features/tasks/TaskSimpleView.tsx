import React, { useState, useMemo } from 'react';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import Modal from '@/components/Modal';
import { getTodayDateString } from '@/lib/dateUtils';
import { fireConfetti } from '@/lib/confetti';
import EmptyState from '@/components/EmptyState';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export const TaskSimpleView = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, reminders, addReminder, updateReminder, settings } = useShadowTrackerStore();
  
  const simpleTasks = useMemo(() => tasks.filter(t => (t.isSimple || t.dueDate === '') && !t.isSoftDeleted), [tasks]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSev, setFormSev] = useState<'low' | 'medium' | 'high'>('medium');
  const [formDeadline, setFormDeadline] = useState('');
  const [formEnableNotif, setFormEnableNotif] = useState(false);
  const [formNotifTime, setFormNotifTime] = useState('09:00');
  
  const [viewingTask, setViewingTask] = useState<any>(null);

  const openAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormNotes('');
    setFormSev('medium');
    setFormDeadline('');
    setFormEnableNotif(false);
    setFormNotifTime('09:00');
    setIsModalOpen(true);
  };

  const openEdit = (task: any) => {
    setEditingId(task.id);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormNotes(task.additionalDetails || '');
    setFormSev(task.priority || 'medium');
    setFormDeadline(task.dueDate || '');
    
    const existingReminder = reminders.find(r => r.taskId === task.id && r.type === 'task');
    if (existingReminder) {
      setFormEnableNotif(existingReminder.isEnabled);
      setFormNotifTime(existingReminder.time || '09:00');
    } else {
      setFormEnableNotif(false);
      setFormNotifTime('09:00');
    }
    
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      let savedId = editingId;
      if (editingId) {
        await updateTask(editingId, {
          title: formTitle.trim(),
          description: formDesc.trim(),
          additionalDetails: formNotes.trim(),
          priority: formSev,
          dueDate: formDeadline,
        });
      } else {
        const created = await addTask({
          title: formTitle.trim(),
          description: formDesc.trim(),
          additionalDetails: formNotes.trim(),
          priority: formSev,
          dueDate: formDeadline,
          startDate: getTodayDateString(),
          scheduledDate: '',
          categoryId: '',
          isRecurring: false,
          recurrencePattern: null,
          status: 'todo',
          matrixQuadrant: 'not_urgent_important',
          assignee: settings.defaultAssignee || 'Shadow',
          isCompleted: false,
          isSimple: true,
        });
        savedId = created?.id;
      }

      if (savedId) {
        const existing = reminders.find(r => r.taskId === savedId && r.type === 'task');
        if (formEnableNotif) {
          if (existing) {
            await updateReminder(existing.id, {
              title: formTitle.trim(),
              time: formNotifTime,
              isEnabled: true,
              days: [0, 1, 2, 3, 4, 5, 6],
            });
          } else {
            await addReminder({
              title: formTitle.trim(),
              time: formNotifTime,
              days: [0, 1, 2, 3, 4, 5, 6],
              isEnabled: true,
              type: 'task',
              taskId: savedId,
            });
          }
        } else if (existing) {
          await updateReminder(existing.id, { isEnabled: false });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Lucide.Zap size={18} className="text-emerald-500" />
          Simple Tasks
        </h3>
        <button
          onClick={openAdd}
          className="btn-glass-pill active text-xs font-black py-2 px-3 shadow-md flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20"
        >
          <Lucide.Plus size={14} />
          <span>Add Simple Task</span>
        </button>
      </div>

      {simpleTasks.length === 0 ? (
        <EmptyState
          icon="Zap"
          title="No Simple Tasks"
          description="Create quick standalone tasks without the complexity of the main planner."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {simpleTasks.map(task => (
            <div key={task.id} className="tile p-3 rounded-2xl flex flex-col gap-2 relative group hover:shadow-lg transition-all border border-border/40">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => {
                    const willComplete = !task.isCompleted;
                    toggleTaskCompletion(task.id);
                    if (willComplete) fireConfetti();
                  }}
                  className={`shrink-0 mt-0.5 p-1 rounded-full border transition-all ${
                    task.isCompleted
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-surface-elevated text-transparent border-muted-foreground/40 hover:border-emerald-500/50'
                  }`}
                >
                  <Lucide.Check size={14} className={task.isCompleted ? 'opacity-100' : 'opacity-0 hover:opacity-50 text-emerald-500'} />
                </button>
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setViewingTask(task)}
                >
                  <p className={`text-sm font-bold truncate ${task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="text-muted-foreground hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Lucide.Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/30">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                  task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-sky-500/10 text-sky-500'
                }`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Lucide.Calendar size={10} />
                    {task.dueDate}
                  </span>
                )}
                <button onClick={() => openEdit(task)} className="ml-auto text-[10px] font-bold text-primary hover:underline">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Simple Task' : 'New Simple Task'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Task Name <span className="text-rose-500">*</span></label>
            <input
              autoFocus
              maxLength={150}
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full text-sm p-2.5 bg-secondary/30 rounded-xl border border-border/50 focus:border-emerald-500/60 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Description (Optional)</label>
            <input
              maxLength={300}
              type="text"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full text-sm p-2.5 bg-secondary/30 rounded-xl border border-border/50 focus:border-emerald-500/60 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Notes (Optional Markdown)</label>
            <textarea
              maxLength={3000}
              rows={3}
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className="w-full text-sm p-2.5 bg-secondary/30 rounded-xl border border-border/50 focus:border-emerald-500/60 outline-none transition-all resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Severity</label>
              <select
                value={formSev}
                onChange={e => setFormSev(e.target.value as any)}
                className="w-full text-sm p-2.5 bg-secondary/30 rounded-xl border border-border/50 focus:border-emerald-500/60 outline-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Deadline (Optional)</label>
              <input
                type="date"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
                className="w-full text-sm p-2.5 bg-secondary/30 rounded-xl border border-border/50 focus:border-emerald-500/60 outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={formEnableNotif}
                onChange={e => setFormEnableNotif(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500/20 bg-secondary border-border"
              />
              <span className="text-xs font-bold text-foreground">Enable App Notification</span>
            </label>
            {formEnableNotif && (
              <div className="pt-1">
                <NiceTimePicker 
                  value={formNotifTime} 
                  onChange={setFormNotifTime} 
                  label="Notification Time"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80">Cancel</button>
            <button type="submit" disabled={!formTitle.trim()} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">Save Task</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} title="Task Details">
        {viewingTask && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-foreground">{viewingTask.title}</h2>
              {viewingTask.description && <p className="text-sm text-muted-foreground mt-1">{viewingTask.description}</p>}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                viewingTask.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                viewingTask.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                'bg-sky-500/10 text-sky-500'
              }`}>
                Sev: {viewingTask.priority}
              </span>
              {viewingTask.dueDate && (
                <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 rounded-md bg-secondary/50 flex items-center gap-1">
                  <Lucide.Calendar size={12} />
                  Deadline: {viewingTask.dueDate}
                </span>
              )}
            </div>

            {viewingTask.additionalDetails && (
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/40 text-xs">
                <MarkdownRenderer content={viewingTask.additionalDetails} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
