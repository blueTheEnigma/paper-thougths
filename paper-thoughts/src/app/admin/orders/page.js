"use client";
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ShoppingBag, Clock, User, Package, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAIL = "umorgan2001@gmail.com";

export default function AdminOrders() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
      fetchOrders();
    }
  }, [isLoaded, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/list');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Failed to connect to Archive Ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (orderId) => {
    if (!confirm("Confirm payment received? This will mark the order as Paid and ALL associated books as 'Sold Out' on the website.")) return;
    
    try {
      const res = await fetch('/api/orders/finalize', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert("Order Finalized! Books are now marked as Sold Out.");
        fetchOrders();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Failed to connect to Archive Ledger");
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order? This cannot be undone and will NOT revert any stock changes.")) return;
    
    try {
      const res = await fetch('/api/orders/delete', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Failed to delete order");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.lkid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.items?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    paid: orders.filter(o => o.status === 'Paid').length,
    revenue: orders.filter(o => o.status === 'Paid').reduce((acc, o) => acc + (parseInt(o.total) || 0), 0)
  };

  if (!isLoaded) return <div className="min-h-screen bg-cream flex items-center justify-center font-display text-burgundy">Loading Archive...</div>;

  if (user?.primaryEmailAddress?.emailAddress !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-burgundy mb-4" />
        <h1 className="text-3xl font-display text-burgundy mb-2">Unauthorized Access</h1>
        <p className="text-ink/60 mb-6">This section is restricted to the Archive Lore Keeper.</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-display text-burgundy mb-2">Archive Ledger</h1>
              <p className="text-ink/60 italic font-quote">"Managing the literary heartbeat of Paper Thoughts."</p>
            </div>
            <button onClick={fetchOrders} className="text-sm font-bold text-accent hover:text-burgundy transition-colors flex items-center gap-2">
              Refresh Ledger
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-sage/10 shadow-sm">
              <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Orders</div>
              <div className="text-2xl font-display text-burgundy">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-sage/10 shadow-sm">
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Pending</div>
              <div className="text-2xl font-display text-burgundy">{stats.pending}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-sage/10 shadow-sm">
              <div className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mb-1">Paid</div>
              <div className="text-2xl font-display text-burgundy">{stats.paid}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-sage/10 shadow-sm">
              <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Revenue</div>
              <div className="text-2xl font-display text-burgundy">₦{stats.revenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, ID, or items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-sage/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-burgundy transition-colors text-sm"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-sage/20 rounded-xl py-3 px-4 focus:outline-none focus:border-burgundy transition-colors text-sm font-bold text-burgundy"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <div className="w-10 h-10 border-4 border-burgundy/20 border-t-burgundy rounded-full animate-spin mb-4"></div>
            <p className="font-bold tracking-widest uppercase text-xs">Consulting the Ledger...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center">
            <p className="text-red-500 font-bold mb-2">Error Accessing Orders</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/50 border border-sage/20 p-20 rounded-3xl text-center">
            <ShoppingBag size={48} className="mx-auto text-sage/40 mb-4" />
            <p className="text-ink/40 font-quote italic text-lg">No orders found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order, idx) => (
              <div key={idx} className="bg-white border border-sage/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Status & Date */}
                  <div className="md:w-48 flex-shrink-0 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-sage/10 pb-4 md:pb-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink/40 uppercase tracking-widest mb-1">
                      <Clock size={14} /> {new Date(order.date).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-ink/30 font-mono mb-2">
                      {order.orderId}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit ${
                      order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-burgundy/10 text-burgundy'
                    }`}>
                      {order.status}
                    </span>
                    
                    <div className="mt-4 flex flex-col gap-2">
                      {order.status !== 'Paid' && (
                        <button 
                          onClick={() => handleFinalize(order.orderId)}
                          className="text-[10px] bg-ink text-cream py-2 px-3 rounded-lg font-bold hover:bg-accent hover:text-burgundy transition-all text-center"
                        >
                          Mark as Paid
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(order.orderId)}
                        className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest transition-colors py-1"
                      >
                        Delete Order
                      </button>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-ink font-bold">
                        <User size={16} className="text-accent" /> {order.name}
                      </div>
                      {order.salesRep && order.salesRep !== 'System' && (
                        <div className="text-[9px] font-bold text-ink/40 uppercase bg-sage/5 px-2 py-1 rounded">
                          Rep: {order.salesRep}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-ink/60 flex items-center gap-2">
                      <span className="bg-sage/10 px-2 py-0.5 rounded font-mono text-[10px]">{order.lkid}</span>
                    </div>
                    <div className="mt-3 p-3 bg-cream/50 rounded-xl border border-sage/10">
                      <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Package size={12} /> Items Ordered
                      </div>
                      <p className="text-sm text-ink/80 leading-relaxed italic">{order.items}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="md:w-40 flex-shrink-0 flex flex-col justify-center items-end bg-sage/5 -m-6 p-6 md:m-0 md:bg-transparent">
                     <div className="text-xs text-ink/40 line-through">₦{order.subtotal?.toLocaleString()}</div>
                     {order.discount > 0 && (
                       <div className="text-[10px] font-bold text-accent">-₦{order.discount?.toLocaleString()}</div>
                     )}
                     <div className="text-2xl font-display text-burgundy">₦{order.total?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
