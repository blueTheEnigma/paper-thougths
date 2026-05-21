"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, ShoppingBag, MapPin, Search, ShieldAlert, 
  CheckCircle, ArrowLeft, RefreshCw, Star, Gift, Flame, AlertCircle, 
  TrendingUp, Settings, ExternalLink, Archive, FileText, Shield, X, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function AdminClient({ 
  initialMembers, 
  initialSubmissions, 
  initialOrders, 
  initialPools,
  initialPrompts,
  userPermissions,
  isSuperadmin
}) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState(initialMembers || []);
  const [submissions, setSubmissions] = useState(initialSubmissions || []);
  const [orders] = useState(initialOrders || []);
  const [pools, setPools] = useState(initialPools || []);
  const [prompts, setPrompts] = useState(initialPrompts || []);
  
  // Role adjustment state
  const [selectedMemberForRoles, setSelectedMemberForRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  // Search & Filtering states
  const [memberSearch, setMemberSearch] = useState('');
  const [subFilter, setSubFilter] = useState('All');
  const [subSearch, setSubSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Prompt states
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptDate, setNewPromptDate] = useState('');
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);

  // Loading indicator for action button
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Submissions status update
  const handleUpdateSubStatus = async (submissionId, newStatus) => {
    setActionLoadingId(submissionId);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(prev => prev.map(s => 
          s.id === submissionId ? { ...s, status: newStatus } : s
        ));
      } else {
        setErrorMessage(data.error || 'Failed to update submission status.');
      }
    } catch (err) {
      setErrorMessage('Connection error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create new weekly prompt manually
  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    
    setIsSubmittingPrompt(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptText: newPromptText, 
          activeDate: newPromptDate || undefined 
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrompts(prev => [data.prompt, ...prev]);
        setNewPromptText('');
        setNewPromptDate('');
      } else {
        setErrorMessage(data.error || 'Failed to create weekly prompt.');
      }
    } catch (err) {
      setErrorMessage('Connection error occurred.');
    } finally {
      setIsSubmittingPrompt(false);
    }
  };

  // Toggle roles in current selection state
  const handleToggleRole = (roleKey) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) 
        ? prev.filter(r => r !== roleKey) 
        : [...prev, roleKey]
    );
  };

  // Save selected roles to database via API
  const handleSaveRoles = async () => {
    if (!selectedMemberForRoles) return;
    setIsSavingRoles(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedMemberForRoles.id, 
          permissions: selectedRoles 
        })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.map(m => 
          m.id === selectedMemberForRoles.id 
            ? { ...m, permissions: data.permissions } 
            : m
        ));
        setSelectedMemberForRoles(null);
      } else {
        setErrorMessage(data.error || 'Failed to update user roles.');
      }
    } catch (err) {
      setErrorMessage('Connection error occurred while updating roles.');
    } finally {
      setIsSavingRoles(false);
    }
  };

  // Filter lists
  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.lkid || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = (s.title || '').toLowerCase().includes(subSearch.toLowerCase()) ||
                          (s.author || '').toLowerCase().includes(subSearch.toLowerCase());
    const matchesFilter = subFilter === 'All' || s.status === subFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredOrders = orders.filter(o => 
    (o.orderId || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customerName || o.guestName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.items || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Stats helper calculations
  const totalRevenue = orders.filter(o => o.status === 'Paid').reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalVouchersGifted = members.reduce((sum, m) => sum + (m.vouchersGifted || 0), 0);

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-burgundy uppercase tracking-widest hover:text-accent transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-display text-burgundy">Admin Control Center</h1>
              <p className="text-xs text-ink/50 mt-1">Manage the bi-token economy, weekly submission cycles, and Bookstore ledger.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-burgundy text-cream text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                📁 PostgreSQL Active
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-[24px] border border-sage/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Total Members</span>
              <div className="text-3xl font-display text-burgundy mt-1">{members.length}</div>
            </div>
            <div className="bg-sage/10 p-3 rounded-2xl text-sage"><Users size={20}/></div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-sage/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Active Submissions</span>
              <div className="text-3xl font-display text-burgundy mt-1">{submissions.filter(s => s.status === 'active_batch').length}</div>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl text-burgundy"><BookOpen size={20}/></div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-sage/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Total Revenue</span>
              <div className="text-3xl font-display text-burgundy mt-1">₦{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl text-green-700"><TrendingUp size={20}/></div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-sage/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Vouchers Gifted</span>
              <div className="text-3xl font-display text-burgundy mt-1">{totalVouchersGifted} 📚</div>
            </div>
            <div className="bg-accent/15 p-3 rounded-2xl text-burgundy"><Gift size={20}/></div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-sage/20 mb-8 overflow-x-auto scrollbar-hide gap-6">
          {[
            { id: 'members', label: 'Members Ledger', icon: Users },
            { id: 'submissions', label: 'Submissions Moderation', icon: BookOpen },
            { id: 'orders', label: 'Bookstore Orders', icon: ShoppingBag },
            { id: 'pools', label: 'Chapter Pools', icon: MapPin },
            { id: 'prompts', label: 'Weekly Prompts', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  active 
                    ? 'border-burgundy text-burgundy font-extrabold'
                    : 'border-transparent text-ink/40 hover:text-ink/60'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <div className="bg-burgundy/5 border border-burgundy/15 p-4 rounded-2xl flex items-center gap-3 text-xs text-burgundy font-medium mb-6">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-sage/20 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* 1. MEMBERS LEDGER */}
            {activeTab === 'members' && (
              <motion.div 
                key="members"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <h3 className="font-display text-2xl text-burgundy">Members Directory</h3>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search member, email, LK ID..." 
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full bg-cream/30 border border-sage/20 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-burgundy text-xs placeholder-ink/40 text-ink"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6 sm:-mx-8">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead>
                      <tr className="border-b border-sage/10 text-ink/40 uppercase tracking-wider font-bold">
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Chapter</th>
                        <th className="py-3 px-6">Streak</th>
                        <th className="py-3 px-6">Tokens</th>
                        <th className="py-3 px-6">Spendable</th>
                        <th className="py-3 px-6">Lifetime Leaves</th>
                        <th className="py-3 px-6">Roles</th>
                        <th className="py-3 px-6">Vouchers</th>
                        {isSuperadmin && <th className="py-3 px-6 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/5">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-sage/5 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-ink flex items-center gap-1.5">
                                {m.name}
                                {m.lifetimeLeaves >= 500 && (
                                  <span className="text-accent cursor-help" title="500+ Lifetime Leaves Milestone reached!">
                                    <Star size={12} fill="currentColor" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-ink/40 flex items-center gap-2 mt-0.5">
                                <span className="bg-sage/10 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">{m.lkid}</span>
                                <span>·</span>
                                <span>{m.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-ink/75">{m.chapter || 'Other'}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 font-bold ${m.streak > 0 ? 'text-burgundy' : 'text-ink/40'}`}>
                              <Flame size={12}/> {m.streak}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-burgundy">{(m.milestoneTokens || 0).toFixed(1)}</td>
                          <td className="py-4 px-6 font-medium text-ink/80">{m.spendableLeaves} 🍃</td>
                          <td className="py-4 px-6 font-bold text-ink">
                            <div className="flex items-center gap-2">
                              <span>{m.lifetimeLeaves} 🍃</span>
                              {m.lifetimeLeaves >= 500 && (
                                <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  Milestone Met
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {m.permissions && m.permissions.length > 0 ? (
                                m.permissions.map(p => {
                                  let label = '';
                                  let colorClass = '';
                                  if (p === 'moderate_submissions') {
                                    label = 'Moderator';
                                    colorClass = 'bg-burgundy/10 text-burgundy border-burgundy/20';
                                  } else if (p === 'manage_chapter_events') {
                                    label = 'Planner';
                                    colorClass = 'bg-sage/25 text-sage-800 border-sage/35';
                                  } else if (p === 'view_sales_logs') {
                                    label = 'Sales Rep';
                                    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                  }
                                  return (
                                    <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${colorClass}`}>
                                      {label}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-ink/30 italic text-[10px]">Member</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {m.vouchersGifted > 0 ? (
                              <span className="bg-accent/15 border border-accent/25 text-burgundy font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 text-[10px]">
                                <Gift size={11} /> {m.vouchersGifted} Gifted
                              </span>
                            ) : (
                              <span className="text-ink/30 italic font-mono">-</span>
                            )}
                          </td>
                          {isSuperadmin && (
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  setSelectedMemberForRoles(m);
                                  setSelectedRoles(m.permissions || []);
                                }}
                                className="bg-cream hover:bg-sage/10 text-burgundy border border-burgundy/20 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Settings size={10} /> Edit Roles
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 2. SUBMISSIONS MODERATION */}
            {activeTab === 'submissions' && (
              <motion.div 
                key="submissions"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <h3 className="font-display text-2xl text-burgundy">Manuscript Submission Ledger</h3>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search title, author..." 
                        value={subSearch}
                        onChange={(e) => setSubSearch(e.target.value)}
                        className="bg-cream/30 border border-sage/20 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-burgundy text-xs text-ink placeholder-ink/40 w-44"
                      />
                    </div>
                    
                    <select 
                      value={subFilter}
                      onChange={(e) => setSubFilter(e.target.value)}
                      className="bg-white border border-sage/20 rounded-xl py-2 px-3 focus:outline-none focus:border-burgundy text-xs font-bold text-burgundy"
                    >
                      <option value="All">All Batches</option>
                      <option value="queued">Queued (Saturday drop)</option>
                      <option value="active_batch">Active Batch</option>
                      <option value="archived">Archived</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6 sm:-mx-8">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead>
                      <tr className="border-b border-sage/10 text-ink/40 uppercase tracking-wider font-bold">
                        <th className="py-3 px-6">Manuscript Info</th>
                        <th className="py-3 px-6">Author</th>
                        <th className="py-3 px-6">Date Uploaded</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/5">
                      {filteredSubmissions.map((s) => (
                        <tr key={s.id} className="hover:bg-sage/5 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-ink flex items-center gap-1.5">
                                {s.title}
                                {s.laurel && (
                                  <span className="text-[10px] bg-accent/20 border border-accent/25 text-burgundy px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider scale-95 origin-left">
                                    Weekly Laurel
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-ink/40 mt-1 flex items-center gap-2">
                                <span className="bg-sage/10 px-1.5 py-0.5 rounded font-bold">{s.genre}</span>
                                <span>·</span>
                                <span className="italic line-clamp-1 max-w-[300px]">"{s.logline}"</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-ink/80">{s.author}</td>
                          <td className="py-4 px-6 text-ink/60">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              s.status === 'active_batch' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : s.status === 'queued' 
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : s.status === 'archived'
                                ? 'bg-sage/10 text-sage/80 border border-sage/15'
                                : 'bg-ink/5 text-ink/50'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {actionLoadingId === s.id ? (
                              <span className="text-[10px] text-ink/40 font-mono">Applying...</span>
                            ) : (
                              <>
                                {s.status !== 'active_batch' && (
                                  <button 
                                    onClick={() => handleUpdateSubStatus(s.id, 'active_batch')}
                                    className="bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors"
                                  >
                                    Promote to Active
                                  </button>
                                )}
                                {s.status === 'active_batch' && (
                                  <button 
                                    onClick={() => handleUpdateSubStatus(s.id, 'archived')}
                                    className="bg-sage/10 hover:bg-sage/20 text-ink/80 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 inline-flex"
                                  >
                                    <Archive size={11}/> Archive
                                  </button>
                                )}
                                {s.status === 'active_batch' && (
                                  <button 
                                    onClick={() => handleUpdateSubStatus(s.id, 'queued')}
                                    className="bg-yellow-100 hover:bg-yellow-250 text-yellow-800 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors"
                                  >
                                    Queue Batch
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 3. BOOKSTORE ORDERS */}
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-2xl text-burgundy">Bookstore Sales Logs</h3>
                    <p className="text-[10px] text-ink/40 uppercase tracking-widest font-bold">Ledger Ledger sync</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-cream/30 border border-sage/20 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-burgundy text-xs text-ink placeholder-ink/40 w-44"
                      />
                    </div>
                    
                    <Link 
                      href="/admin/orders" 
                      className="bg-burgundy text-cream text-xs font-bold py-2 px-4 rounded-xl hover:bg-ink transition-colors flex items-center gap-1 text-center justify-center shrink-0"
                    >
                      Full Orders Console <ExternalLink size={12}/>
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-6 sm:-mx-8">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead>
                      <tr className="border-b border-sage/10 text-ink/40 uppercase tracking-wider font-bold">
                        <th className="py-3 px-6">Order ID</th>
                        <th className="py-3 px-6">Customer</th>
                        <th className="py-3 px-6">Items</th>
                        <th className="py-3 px-6">Total</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Sales Rep</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/5">
                      {filteredOrders.slice(0, 15).map((o, idx) => (
                        <tr key={idx} className="hover:bg-sage/5 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-ink">{o.orderId}</td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-ink">{o.customerName || o.guestName}</div>
                              {o.lkid && <div className="text-[10px] text-burgundy font-bold mt-0.5">{o.lkid}</div>}
                            </div>
                          </td>
                          <td className="py-4 px-6 italic text-ink/65 line-clamp-1 max-w-[250px]">{o.items}</td>
                          <td className="py-4 px-6 font-bold text-ink">₦{parseFloat(o.total || 0).toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              o.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-burgundy/10 text-burgundy'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-ink/50 font-medium">{o.salesRep}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 4. CHAPTER POOLS */}
            {activeTab === 'pools' && (
              <motion.div 
                key="pools"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-2xl text-burgundy">Pay It Forward Chapter Pools</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pools.map((p) => {
                    const percent = Math.min(100, (p.balance / p.limit) * 100);
                    return (
                      <div key={p.id} className="bg-cream/20 border border-sage/20 rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-display text-lg text-burgundy flex items-center gap-1.5"><MapPin size={16} className="text-sage" /> {p.chapterName}</h4>
                          <span className="font-mono text-xs font-bold text-ink/60">{p.balance} / {p.limit} Leaves</span>
                        </div>
                        
                        <div className="w-full bg-sage/10 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-sage h-3 rounded-full" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                          <span>{percent.toFixed(0)}% Complete</span>
                          <span>Voucher threshold: {p.limit} Leaves</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 5. WEEKLY PROMPTS */}
            {activeTab === 'prompts' && (
              <motion.div 
                key="prompts"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-2xl text-burgundy">Weekly Writing Prompts</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left form column */}
                  <div className="lg:col-span-1 bg-cream/15 border border-sage/25 p-6 rounded-3xl space-y-4 h-fit">
                    <h4 className="font-bold text-ink text-sm">Add Weekly Prompt</h4>
                    
                    <form onSubmit={handleCreatePrompt} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Prompt Text</label>
                        <textarea
                          required
                          rows={4}
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          placeholder="Enter prompt instructions, guidelines, theme..."
                          className="w-full bg-white border border-sage/25 rounded-xl p-3 focus:outline-none focus:border-burgundy text-xs text-ink placeholder-ink/30 resize-none leading-relaxed"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Active Date (Optional)</label>
                        <input
                          type="date"
                          value={newPromptDate}
                          onChange={(e) => setNewPromptDate(e.target.value)}
                          className="w-full bg-white border border-sage/25 rounded-xl p-3 focus:outline-none focus:border-burgundy text-xs text-burgundy"
                        />
                        <p className="text-[9px] text-ink/40 mt-1">Leave empty to activate immediately.</p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingPrompt}
                        className="w-full bg-burgundy hover:bg-ink text-cream font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50"
                      >
                        {isSubmittingPrompt ? 'Adding...' : 'Publish Weekly Prompt'}
                      </button>
                    </form>
                  </div>

                  {/* Right history list column */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-bold text-ink text-sm">Prompt History</h4>
                    
                    {prompts.length === 0 ? (
                      <div className="bg-sage/5 border border-dashed border-sage/20 p-8 rounded-3xl text-center text-ink/40 text-xs italic">
                        No writing prompts added yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {prompts.map((pr) => (
                          <div key={pr.id} className="bg-cream/10 border border-sage/10 p-5 rounded-2xl space-y-2 hover:bg-cream/20 transition-all">
                            <div className="flex justify-between items-center text-[10px] text-ink/40 font-mono">
                              <span className="bg-burgundy/10 text-burgundy font-bold px-2 py-0.5 rounded">Prompt #{pr.id}</span>
                              <span>Active Date: {pr.activeDate ? new Date(pr.activeDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{pr.promptText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* 6. ROLES EDITOR MODAL (SUPERADMIN ONLY) */}
      <AnimatePresence>
        {selectedMemberForRoles && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemberForRoles(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 border border-sage/20 shadow-2xl z-10 space-y-6"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedMemberForRoles(null)}
                className="absolute top-6 right-6 text-ink/40 hover:text-ink/80 transition-colors p-1.5 hover:bg-cream rounded-full"
              >
                <X size={18} />
              </button>

              {/* Title & Decorative Header */}
              <div className="flex items-center gap-3">
                <div className="bg-burgundy/10 p-3 rounded-2xl text-burgundy">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-burgundy">Access Control</h3>
                  <p className="text-[10px] text-ink/40 uppercase tracking-widest font-semibold mt-0.5">Admin Permissions Portal</p>
                </div>
              </div>

              {/* User details card */}
              <div className="bg-cream/30 border border-sage/10 p-4 rounded-2xl">
                <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                  {selectedMemberForRoles.name}
                  <span className="bg-sage/15 text-[8px] font-mono px-1.5 py-0.5 rounded text-ink/65 uppercase tracking-wide">
                    {selectedMemberForRoles.lkid}
                  </span>
                </div>
                <div className="text-[10px] text-ink/50 mt-1">{selectedMemberForRoles.email}</div>
                <div className="text-[9px] text-burgundy/60 font-medium mt-1 uppercase tracking-wider">
                  Chapter: {selectedMemberForRoles.chapter || 'Other'}
                </div>
              </div>

              {/* Roles Toggles list */}
              <div className="space-y-3">
                {[
                  {
                    key: 'moderate_submissions',
                    title: 'Moderator',
                    desc: 'Grants access to approve/archive submissions and manage weekly prompts.',
                    color: 'border-burgundy'
                  },
                  {
                    key: 'manage_chapter_events',
                    title: 'Events Planner',
                    desc: 'Grants access to organize and update local chapter events & RSVPs.',
                    color: 'border-sage'
                  },
                  {
                    key: 'view_sales_logs',
                    title: 'Sales Representative',
                    desc: 'Grants access to view bookstore orders, sales ledgers, and metrics.',
                    color: 'border-blue-300'
                  }
                ].map((role) => {
                  const checked = selectedRoles.includes(role.key);
                  return (
                    <div 
                      key={role.key}
                      onClick={() => handleToggleRole(role.key)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        checked 
                          ? `${role.color} bg-cream/40 shadow-sm` 
                          : 'border-sage/15 bg-white hover:border-sage/40'
                      }`}
                    >
                      <div className="mt-0.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          checked ? 'bg-burgundy border-burgundy text-cream' : 'border-sage/35 bg-white'
                        }`}>
                          {checked && <CheckCircle size={10} className="stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">{role.title}</div>
                        <div className="text-[10px] text-ink/40 mt-0.5 leading-relaxed">{role.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForRoles(null)}
                  className="flex-1 bg-cream hover:bg-sage/10 text-ink font-bold text-xs py-3 px-4 rounded-xl transition-all border border-sage/20 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingRoles}
                  onClick={handleSaveRoles}
                  className="flex-1 bg-burgundy hover:bg-ink text-cream font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingRoles ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
