"use client";
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Users, Search, UserPlus, ShieldAlert, 
  Settings, Trash2, CheckCircle, Loader2, X, Plus
} from 'lucide-react';
import DepartmentBadge from '@/components/round-table/DepartmentBadge';

export default function CrewPage() {
  const { user } = useUser();
  const [crew, setCrew] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search candidates state
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form states
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCrewData = async () => {
    try {
      const res = await fetch('/api/round-table/crew');
      const data = await res.json();
      if (data.success) {
        setCrew(data.crew);
        setDepartments(data.departments);
        
        // Find caller's own crew member profile
        if (user) {
          const self = data.crew.find(c => c.email.toLowerCase() === user.primaryEmailAddress?.emailAddress.toLowerCase());
          setCurrentMember(self);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCrewData();
    }
  }, [user]);

  // Search candidates for promotion
  const handleSearchCandidates = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCandidates([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/round-table/crew?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/round-table/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCandidate.id,
          role: selectedRole,
          departmentIds: selectedDepts
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setSelectedCandidate(null);
        setSearchQuery('');
        setCandidates([]);
        setSelectedDepts([]);
        setSelectedRole('member');
        fetchCrewData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/round-table/crew', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewMemberId: editingMember.crew_member_id,
          role: selectedRole,
          departmentIds: selectedDepts
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setEditingMember(null);
        setSelectedDepts([]);
        setSelectedRole('member');
        fetchCrewData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (crewMemberId) => {
    if (!confirm('Are you sure you want to deactivate this crew member? They will lose access to the Round Table.')) return;

    try {
      const res = await fetch(`/api/round-table/crew?crewMemberId=${crewMemberId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchCrewData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDeptSelection = (deptId) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const canManage = currentMember?.role === 'admin' || currentMember?.role === 'lead' || currentMember?.isSuperadmin;

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-burgundy" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Promote Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-burgundy tracking-tight">Crew Roster</h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 mt-0.5">
            Internal workers directory and access management
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-burgundy hover:bg-ink text-cream text-xs px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer w-fit"
          >
            <UserPlus size={14} />
            <span>Add Crew Member</span>
          </button>
        )}
      </div>

      {/* Roster Table */}
      <div className="parchment-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="border-b border-ink/5 text-[10px] font-black uppercase tracking-widest text-ink/40">
                <th className="py-3 px-2">Crew Member</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Global Role</th>
                <th className="py-3 px-2">Departments</th>
                <th className="py-3 px-2">Joined</th>
                {canManage && <th className="py-3 px-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-xs text-ink/80">
              {crew.map((member) => (
                <tr key={member.crew_member_id} className="hover:bg-cream/20 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-ink">
                    {member.full_name}
                    {member.lk_id && (
                      <span className="block text-[9px] text-ink/40 font-bold mt-0.5">{member.lk_id}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-2">{member.email}</td>
                  <td className="py-3.5 px-2">
                    <span className={`inline-flex items-center gap-1 font-sans font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-[9px] border ${
                      member.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' :
                      member.role === 'lead' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {member.departments && member.departments.length > 0 ? (
                        member.departments.map(d => (
                          <DepartmentBadge key={d.id} name={d.name} size="sm" />
                        ))
                      ) : (
                        <span className="text-ink/30 italic text-[10px]">No departments</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-ink/50 font-bold">
                    {new Date(member.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-2 text-right space-x-1.5 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setSelectedRole(member.role);
                          setSelectedDepts(member.departments.map(d => d.id));
                          setShowEditModal(true);
                        }}
                        disabled={member.email === user.primaryEmailAddress?.emailAddress}
                        className="p-1.5 hover:bg-ink/5 text-ink/50 hover:text-burgundy rounded-lg transition-colors border border-transparent hover:border-ink/5 cursor-pointer disabled:opacity-40"
                        title="Edit member"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(member.crew_member_id)}
                        disabled={member.email === user.primaryEmailAddress?.emailAddress}
                        className="p-1.5 hover:bg-red-50 text-ink/50 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer disabled:opacity-40"
                        title="Deactivate access"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Crew Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => {
            setShowAddModal(false);
            setSelectedCandidate(null);
            setCandidates([]);
            setSearchQuery('');
          }} />
          <div className="relative bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-ink/5 m-4 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <h3 className="font-display font-black text-lg text-burgundy">Promote Crew Member</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-ink/5 rounded-lg text-ink/50 hover:text-ink cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Candidate Search Bar */}
            {!selectedCandidate ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    placeholder="Search PT members by name/email..."
                    value={searchQuery}
                    onChange={(e) => handleSearchCandidates(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl pl-9 pr-4 py-2.5 text-xs font-sans text-ink focus:outline-none focus:border-burgundy"
                  />
                </div>

                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-burgundy" />
                  </div>
                ) : (
                  <div className="divide-y divide-ink/5 max-h-48 overflow-y-auto">
                    {candidates.map(candidate => (
                      <div 
                        key={candidate.id}
                        onClick={() => setSelectedCandidate(candidate)}
                        className="flex items-center justify-between p-2.5 hover:bg-cream/40 rounded-xl transition-all cursor-pointer"
                      >
                        <div className="text-xs">
                          <p className="font-bold text-ink">{candidate.full_name}</p>
                          <p className="text-[10px] text-ink/50 mt-0.5">{candidate.email}</p>
                        </div>
                        <Plus size={14} className="text-burgundy" />
                      </div>
                    ))}
                    {searchQuery && candidates.length === 0 && (
                      <p className="text-center py-4 text-xs text-ink/40 italic">No matching members found.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Selected Candidate Promotion Form
              <form onSubmit={handlePromoteSubmit} className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-[#FAF7F2] border border-ink/5 rounded-2xl">
                  <p className="font-bold text-ink text-sm">{selectedCandidate.full_name}</p>
                  <p className="text-[10px] text-ink/50 mt-0.5">{selectedCandidate.email}</p>
                  <button 
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-burgundy hover:underline mt-2 block cursor-pointer"
                  >
                    Change user
                  </button>
                </div>

                {/* Role Choice */}
                <div className="space-y-1">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Global CRM Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option value="member">Member (Regular access)</option>
                    <option value="lead">Lead (Can assign tasks/manage roster)</option>
                    <option value="admin">Admin (Full administrative privileges)</option>
                  </select>
                </div>

                {/* Departments Checkboxes */}
                <div className="space-y-2">
                  <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px] block">Departments Membership</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {departments.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDeptSelection(d.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                          selectedDepts.includes(d.id)
                            ? 'bg-burgundy/5 text-burgundy border-burgundy/25'
                            : 'bg-white text-ink/65 border-ink/5 hover:bg-cream/40'
                        }`}
                      >
                        <span>{d.name}</span>
                        {selectedDepts.includes(d.id) && <CheckCircle size={12} className="text-burgundy" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-ink/5 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedCandidate(null);
                      setSelectedDepts([]);
                    }}
                    className="text-ink/65 hover:text-ink px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-burgundy text-cream font-sans font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl hover:bg-ink transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    <span>Promote Member</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Crew Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-ink/5 m-4 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-2">
              <h3 className="font-display font-black text-lg text-burgundy">Edit Crew Access</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-ink/5 rounded-lg text-ink/50 hover:text-ink cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-[#FAF7F2] border border-ink/5 rounded-2xl">
                <p className="font-bold text-ink text-sm">{editingMember.full_name}</p>
                <p className="text-[10px] text-ink/50 mt-0.5">{editingMember.email}</p>
              </div>

              {/* Role Choice */}
              <div className="space-y-1">
                <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px]">Global CRM Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-ink/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-burgundy"
                >
                  <option value="member">Member (Regular access)</option>
                  <option value="lead">Lead (Can assign tasks/manage roster)</option>
                  <option value="admin">Admin (Full administrative privileges)</option>
                </select>
              </div>

              {/* Departments Checkboxes */}
              <div className="space-y-2">
                <label className="font-bold text-ink/50 uppercase tracking-widest text-[9px] block">Departments Membership</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {departments.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDeptSelection(d.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        selectedDepts.includes(d.id)
                          ? 'bg-burgundy/5 text-burgundy border-burgundy/25'
                          : 'bg-white text-ink/65 border-ink/5 hover:bg-cream/40'
                      }`}
                    >
                      <span>{d.name}</span>
                      {selectedDepts.includes(d.id) && <CheckCircle size={12} className="text-burgundy" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-ink/5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setSelectedDepts([]);
                  }}
                  className="text-ink/65 hover:text-ink px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-burgundy text-cream font-sans font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl hover:bg-ink transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
