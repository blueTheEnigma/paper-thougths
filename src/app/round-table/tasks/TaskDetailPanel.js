"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckSquare, Clock, User, Calendar, Tag, AlertTriangle,
  MessageSquare, Paperclip, Plus, Send, Loader2, Trash2, Download
} from 'lucide-react';
import DepartmentBadge from '@/components/round-table/DepartmentBadge';
import PriorityBadge from '@/components/round-table/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

export default function TaskDetailPanel({ 
  taskId, 
  onClose, 
  onUpdate, 
  departments = [], 
  crewMembers = [], 
  currentCrewMember 
}) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  // Fetch full details of the task
  const fetchTaskDetails = async () => {
    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setTask(data.task);
        setDescription(data.task.description || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleFieldChange = async (fields) => {
    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (data.success) {
        setTask(prev => ({ ...prev, ...fields }));
        onUpdate();
        fetchTaskDetails(); // Reload logs
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText })
      });
      const data = await res.json();
      if (data.success) {
        setTask(prev => ({
          ...prev,
          comments: [...prev.comments, data.comment]
        }));
        setCommentText('');
        onUpdate();
        fetchTaskDetails(); // Reload logs
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Browser limit check (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds the 10MB limit.');
      return;
    }

    setUploadError('');
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setTask(prev => ({
          ...prev,
          attachments: [data.attachment, ...prev.attachments]
        }));
        onUpdate();
        fetchTaskDetails(); // Reload logs
      } else {
        setUploadError(data.error || 'Failed to upload file.');
      }
    } catch (err) {
      console.error(err);
      setUploadError('Failed to connect to server.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTask(prev => ({
          ...prev,
          attachments: prev.attachments.filter(a => a.id !== attachmentId)
        }));
        onUpdate();
        fetchTaskDetails(); // Reload logs
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigneeToggle = async (memberId) => {
    const isAssigned = task.assignees.some(a => a.id === memberId);
    const newAssigneeIds = isAssigned
      ? task.assignees.filter(a => a.id !== memberId).map(a => a.id)
      : [...task.assignees.map(a => a.id), memberId];

    await handleFieldChange({ assigneeIds: newAssigneeIds });
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This action is permanent.')) return;

    try {
      const res = await fetch(`/api/round-table/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!taskId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        />

        {/* Panel Container */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-ink/5"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5 bg-cream/10">
            <div className="flex items-center gap-2">
              <CheckSquare className="text-burgundy" size={18} />
              <span className="font-display font-bold text-base text-burgundy">Task Details</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Creator or Admin can delete */}
              {(task?.created_by === currentCrewMember?.id || currentCrewMember?.role === 'admin') && (
                <button 
                  onClick={handleDeleteTask}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-bold font-sans transition-colors cursor-pointer"
                >
                  Delete Task
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-ink/5 rounded-xl text-ink/65 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-burgundy" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Title */}
              <div className="space-y-1">
                <input 
                  type="text" 
                  value={task.title}
                  onChange={(e) => handleFieldChange({ title: e.target.value })}
                  className="w-full bg-transparent border-0 text-xl font-display font-black text-burgundy tracking-tight focus:outline-none focus:ring-2 focus:ring-burgundy/20 rounded px-1 -mx-1"
                />
              </div>

              {/* Flex grid fields */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-[#FAF7F2] rounded-2xl border border-ink/5">
                {/* Column 1 */}
                <div className="space-y-4">
                  {/* Status Picker */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Status</label>
                    <select 
                      value={task.status}
                      onChange={(e) => handleFieldChange({ status: e.target.value })}
                      className="block w-full bg-white border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-burgundy"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  {/* Priority Picker */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Priority</label>
                    <select 
                      value={task.priority}
                      onChange={(e) => handleFieldChange({ priority: e.target.value })}
                      className="block w-full bg-white border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-burgundy"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {/* Department Owner */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Department Owner</label>
                    <select 
                      value={task.department_id || ''}
                      onChange={(e) => handleFieldChange({ departmentId: e.target.value ? parseInt(e.target.value) : null })}
                      className="block w-full bg-white border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-burgundy"
                    >
                      <option value="">No Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Review Department Owner */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Review Department</label>
                    <select 
                      value={task.review_department_id || ''}
                      onChange={(e) => handleFieldChange({ reviewDepartmentId: e.target.value ? parseInt(e.target.value) : null })}
                      className="block w-full bg-white border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-burgundy"
                    >
                      <option value="">No Review Needed</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date Row */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Due Date</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date"
                      value={task.due_date ? task.due_date.split('T')[0] : ''}
                      onChange={(e) => handleFieldChange({ dueDate: e.target.value || null })}
                      className="bg-white border border-ink/5 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-burgundy"
                    />
                  </div>
                </div>
              </div>

              {/* Assignees Selector */}
              <div className="space-y-2">
                <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Assignees</label>
                <div className="flex flex-wrap gap-2">
                  {crewMembers.map(member => {
                    const isAssigned = task.assignees.some(a => a.id === member.crew_member_id);
                    return (
                      <button
                        key={member.crew_member_id}
                        type="button"
                        onClick={() => handleAssigneeToggle(member.crew_member_id)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold font-sans border transition-all cursor-pointer ${
                          isAssigned 
                            ? 'bg-burgundy/10 text-burgundy border-burgundy/25' 
                            : 'bg-white text-ink/65 border-ink/5 hover:bg-cream/40'
                        }`}
                      >
                        {member.full_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description Details */}
              <div className="space-y-2">
                <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Description</label>
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-ink/10 rounded-2xl p-4 text-xs font-sans text-ink focus:outline-none focus:border-burgundy min-h-[120px]"
                      placeholder="Add details for this task..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setDescription(task.description || '');
                          setIsEditingDesc(false);
                        }}
                        className="text-xs text-ink/60 hover:text-ink px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          handleFieldChange({ description });
                          setIsEditingDesc(false);
                        }}
                        className="bg-burgundy text-cream text-xs px-4 py-1.5 rounded-lg font-bold font-sans hover:bg-ink transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingDesc(true)}
                    className="p-4 bg-cream/10 border border-dashed border-ink/15 rounded-2xl text-xs font-sans text-ink/70 hover:border-burgundy/30 cursor-pointer min-h-[64px]"
                  >
                    {task.description ? (
                      <p className="whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <span className="italic text-ink/30">Add a description...</span>
                    )}
                  </div>
                )}
              </div>

              {/* File Attachments Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                  <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40">Attachments</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-burgundy hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {uploadLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    <span>Upload File</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </div>

                {uploadError && (
                  <p className="text-[10px] text-red-500 font-bold">{uploadError}</p>
                )}

                {task.attachments.length === 0 ? (
                  <p className="text-xs text-ink/30 italic">No attachments uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {task.attachments.map(att => (
                      <div 
                        key={att.id} 
                        className="p-3 bg-[#FAF7F2] border border-ink/5 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate" title={att.file_name}>{att.file_name}</p>
                          <span className="text-[9px] text-ink/40 font-bold">
                            {(att.file_size / 1024).toFixed(1)} KB • {att.uploader_name || 'Uploader'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <a 
                            href={att.file_path} 
                            download 
                            className="p-1 text-ink/50 hover:text-burgundy hover:bg-white rounded-lg transition-colors border border-transparent hover:border-ink/5"
                          >
                            <Download size={14} />
                          </a>
                          <button 
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1 text-ink/50 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-ink/5 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Thread Section */}
              <div className="space-y-4">
                <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40 block border-b border-ink/5 pb-2">
                  Discussion Comments
                </label>

                {/* Comment composer */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-start">
                  <input 
                    type="text" 
                    required
                    disabled={commentLoading}
                    placeholder="Ask a question or leave updates..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-[#FAF7F2] border border-ink/5 rounded-xl px-4 py-2.5 text-xs font-sans text-ink focus:outline-none focus:border-burgundy"
                  />
                  <button 
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="bg-burgundy text-cream p-2.5 rounded-xl hover:bg-ink transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    {commentLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {task.comments.length === 0 ? (
                    <p className="text-xs text-ink/30 italic">No comments yet. Start the conversation!</p>
                  ) : (
                    task.comments.map(c => (
                      <div key={c.id} className="p-3.5 bg-cream/10 border border-ink/5 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-ink">{c.author_name}</span>
                            <span className="text-[9px] text-ink/30 uppercase tracking-widest font-black">
                              ({c.author_role})
                            </span>
                          </div>
                          <span className="text-[9px] text-ink/40 font-bold">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-ink/75 leading-relaxed">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task Log Timeline */}
              <div className="space-y-3">
                <label className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink/40 block border-b border-ink/5 pb-2">
                  Task Audit Log
                </label>
                <div className="space-y-3 font-sans text-xs">
                  {task.activity.length === 0 ? (
                    <p className="text-xs text-ink/30 italic">No events logged yet.</p>
                  ) : (
                    task.activity.map(act => {
                      const time = formatDistanceToNow(new Date(act.created_at), { addSuffix: true });
                      return (
                        <div key={act.id} className="flex items-start gap-2 text-ink/60">
                          <span className="h-1.5 w-1.5 bg-burgundy/40 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="leading-tight">
                            <span className="font-bold text-ink">{act.full_name || 'System'}</span>
                            <span> {act.action.replace('_', ' ')}</span> • <span className="text-[10px] text-ink/40">{time}</span>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
