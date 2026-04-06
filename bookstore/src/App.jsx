import React, { useState, useEffect, useMemo } from 'react';
import { fetchBooks } from './services/GoogleSheetService';
import { ShoppingCart, BookOpen, Search, Plus, Minus, X, CreditCard, MessageCircle, ChevronRight, ArrowRight } from 'lucide-react';
import './index.css';

export default function App() {
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchBooks().then((data) => {
      setBooks(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const addToCart = (book) => {
    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        return prev.map(item => item.book.id === book.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { book, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.book.id === id) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const price = parseInt(item.book.price) || 0;
    return sum + (price * item.qty);
  }, 0);

  const formatPrice = (amount) => `₦${amount.toLocaleString()}`;
  const WHATSAPP_NUMBER = "2349055433811";
  const CHECKOUT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSchF6OdKRpWyjDZ7NxFLzyuAbaTLmd_11Dnn4eCiKz_HbyKkw/viewform?usp=header";

  const handleCheckout = () => { window.open(CHECKOUT_URL, "_blank"); };
  const handleWhatsapp = () => {
    const message = `Hello, I just placed an order for some books!\nTotal: ${formatPrice(totalPrice)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Divide the books into sections for the UI
  const trendingBooks = books.slice(0, 4);
  const newReleases = books.slice(4, 7);
  
  // Extract up to 6 unique categories from the data for the tabs
  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))].slice(0, 6);
  
  // Bestsellers are the rest of the books, filtered by the active tab
  const bestsellers = books.slice(7).filter(book => activeTab === 'All' || book.category === activeTab);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your bookshelf...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Dark Theme Header & Hero Container */}
      <div className="hero-container">
        <header className="topnav">
          <div className="topnav-brand">
            <BookOpen size={24} color="#F3CA20" />
            <span>PAPER THOUGHTS</span>
          </div>
          <nav className="topnav-links">
            <a href="#" className="active">Home</a>
            <a href="#bestsellers">Categories</a>
            <a href="#">Collections</a>
          </nav>
          <div className="topnav-actions">
            <button className="cart-trigger" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={18} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
            <button className="btn-primary">Sign Up</button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <div className="language-badge">📚 EN / NGN <ChevronRight size={14}/></div>
            <h1>Start Your Reading Adventure <span className="text-highlight">INVEST</span> IN BOOKS TODAY</h1>
            <p>Welcome to our bookstore! Each book you purchase isn't just a story it's a passport to new worlds, exciting adventures, and endless possibilities. Dive into our curated collection.</p>
            <div className="search-bar">
              <Search size={20} color="#6B7280" />
              <input type="text" placeholder="Search book here..." />
              <button className="btn-search">Search</button>
            </div>
          </div>
          
          <div className="hero-trending">
            <div className="trending-header">
              <h3>Trending Now</h3>
              <div className="trending-nav">
                <button className="nav-circle">&lt;</button>
                <button className="nav-circle">&gt;</button>
              </div>
            </div>
            <div className="trending-slider">
              {trendingBooks.map(book => (
                <div className="trending-card" key={book.id}>
                  <img src={book.imageUrl} alt={book.title} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <main className="main-content">
        
        {/* New Releases Section */}
        <section className="section-block">
          <div className="section-header">
            <div>
              <h2>New Releases</h2>
              <p className="section-subtitle">What's new? Browse latest titles in the new releases category to discover your next read!</p>
            </div>
            <a href="#" className="view-all">View all <ChevronRight size={16}/></a>
          </div>
          
          <div className="horizontal-cards-layout">
            {newReleases.map(book => {
              const isSoldOut = book.status?.toUpperCase() === 'SOLD OUT';
              return (
                <div className="h-card" key={book.id}>
                  <div className="h-card-img">
                    <img src={book.imageUrl} alt={book.title} loading="lazy" />
                  </div>
                  <div className="h-card-content">
                    <h4 className="h-card-title">{book.title}</h4>
                    <p className="h-card-author">A novel by {book.author}</p>
                    <div className="h-card-price">
                      <span className="current-price">{formatPrice(book.price)}</span>
                      <span className="old-price">{formatPrice(parseInt(book.price)*1.2)}</span>
                    </div>
                    <button className="btn-dark" onClick={() => addToCart(book)} disabled={isSoldOut}>
                      <ShoppingCart size={14} /> Add to basket
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Bestsellers Section with Tabs */}
        <section className="section-block" id="bestsellers">
          <div className="section-header">
            <h2>Bestsellers Books</h2>
          </div>
          
          <div className="tabs-header">
            <div className="tabs-list">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <a href="#" className="view-all text-sm">All Categories <ChevronRight size={16}/></a>
          </div>

          <div className="vertical-cards-layout">
            {bestsellers.slice(0, 10).map(book => {
              const isSoldOut = book.status?.toUpperCase() === 'SOLD OUT';
              return (
                <div className="v-card" key={book.id}>
                  <div className="v-card-img-wrap">
                    <img src={book.imageUrl} alt={book.title} loading="lazy"/>
                    {isSoldOut && <div className="sold-out-badge">SOLD OUT</div>}
                  </div>
                  <div className="v-card-info">
                    <h4 className="v-card-title">{book.title}</h4>
                    <p className="v-card-author">{book.author}</p>
                  </div>
                  <div className="v-card-footer">
                    <span className="v-card-price">{formatPrice(book.price)}</span>
                    <button className="btn-outline" onClick={() => addToCart(book)} disabled={isSoldOut}>
                      Add to cart
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </main>

      {/* Cart Sidebar */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
          <div className="cart-header">
            <h2><ShoppingCart size={24} /> Your Cart</h2>
            <button className="close-btn" onClick={() => setIsCartOpen(false)}>
              <X size={24} />
            </button>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={64} color="#E5E7EB" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.book.id} className="cart-item">
                  <img src={item.book.imageUrl} alt={item.book.title} className="cart-item-img" />
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.book.title}</div>
                    <div className="cart-item-price">{formatPrice(item.book.price)}</div>
                    <div className="cart-controls">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateQty(item.book.id, -1)}><Minus size={14}/></button>
                        <span>{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.book.id, 1)}><Plus size={14}/></button>
                      </div>
                      <div style={{fontWeight: 600}}>
                        {formatPrice((parseInt(item.book.price)||0) * item.qty)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <button className="checkout-btn" onClick={handleCheckout}>
                <CreditCard size={20} /> Checkout via Form
              </button>
              
              <button 
                className="checkout-btn btn-whatsapp" 
                onClick={handleWhatsapp}
              >
                <MessageCircle size={20} /> Text on WhatsApp
              </button>
              
              <div className="whatsapp-info">
                Please fill the checkout form first, then contact us on WhatsApp!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
