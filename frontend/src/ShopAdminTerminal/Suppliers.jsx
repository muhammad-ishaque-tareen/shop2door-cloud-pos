import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,
  Tags, Moon, Settings, TrendingUp, Boxes, FileBarChart,
  Search, ChevronLeft, ChevronRight, Plus, Edit3, Trash2,
  X, AlertCircle, CheckCircle, Save, Truck, ShoppingBag,
  Phone, Mail, MapPin, ClipboardList, DollarSign, Eye,
  RefreshCw, CheckSquare, XCircle, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/Suppliers.css';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;
const ITEMS_PER_PAGE = 20;

const fmt   = (n)  => `Rs. ${parseFloat(n || 0).toLocaleString()}`;
const hdr   = (tk) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` });
const plain = (tk) => ({ Authorization: `Bearer ${tk}` });

/*  email / phone validation  */
const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPhone = (p) => !p || /^[\d\s\-+()]{7,20}$/.test(p);

/* 
   ADD / EDIT SUPPLIER MODAL */
const SupplierModal = ({ supplier, onClose, onSaved, token }) => {
  const isEdit = !!supplier;
  const [form, setForm] = useState({
    name:           supplier?.name           || '',
    contact_person: supplier?.contact_person || '',
    phone:          supplier?.phone          || '',
    email:          supplier?.email          || '',
    address:        supplier?.address        || '',
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    // client-side validation mirrors backend
    if (!form.name.trim())        { setError('Supplier name is required.');    return; }
    if (!isValidEmail(form.email)){ setError('Invalid email format.');         return; }
    if (!isValidPhone(form.phone)){ setError('Invalid phone number format.');  return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const url    = isEdit
        ? `${API}/api/suppliers/${supplier.supplier_id}`
        : `${API}/api/suppliers`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: hdr(token),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(isEdit ? 'Supplier updated!' : 'Supplier added!');
        setTimeout(() => { onSaved(); onClose(); }, 900);
      } else {
        setError(data.message || 'Failed to save supplier.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally   { setSaving(false); }
  };

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal sup-modal" onClick={e => e.stopPropagation()}>
        <div className="ms-modal-header">
          <h2 className="ms-modal-title">
            <Truck size={17} style={{ marginRight: 8 }} />
            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button className="ms-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ms-modal-body">
          {error   && <div className="ms-modal-error"  ><AlertCircle  size={16}/><span>{error}</span></div>}
          {success && <div className="ms-modal-success"><CheckCircle size={16}/><span>{success}</span></div>}

          <div className="sup-form-grid">
            <div className="ms-form-group sup-full">
              <label className="ms-form-label">Supplier / Company Name <span className="sup-required">*</span></label>
              <input className="ms-form-input" placeholder="e.g. TechWorld Distributors"
                value={form.name} onChange={set('name')} />
            </div>

            <div className="ms-form-group">
              <label className="ms-form-label">Contact Person</label>
              <input className="ms-form-input" placeholder="e.g. Mr. IT"
                value={form.contact_person} onChange={set('contact_person')} />
            </div>

            <div className="ms-form-group">
              <label className="ms-form-label">Phone Number</label>
              <input className="ms-form-input" placeholder="e.g. 0300-0000000"
                value={form.phone} onChange={set('phone')} />
            </div>

            <div className="ms-form-group">
              <label className="ms-form-label">Email Address</label>
              <input className="ms-form-input" type="email" placeholder="e.g. supplier@example.com"
                value={form.email} onChange={set('email')} />
            </div>

            <div className="ms-form-group sup-full">
              <label className="ms-form-label">Address</label>
              <textarea className="ms-form-input sup-textarea" rows={3}
                placeholder="Full address..."
                value={form.address} onChange={set('address')} />
            </div>
          </div>
        </div>

        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ms-btn-save" onClick={handleSave} disabled={saving || !!success}>
            <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL  — now uses transactional backend
══════════════════════════════════════════════════════════════════════════ */
const DeleteModal = ({ supplier, onClose, onDeleted, token }) => {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const handleDelete = async () => {
    setDeleting(true); setError('');
    try {
      const res = await fetch(`${API}/api/suppliers/${supplier.supplier_id}`, {
        method: 'DELETE',
        headers: plain(token),
      });
      if (res.ok) { onDeleted(); onClose(); }
      else { const d = await res.json(); setError(d.message || 'Failed to delete.'); }
    } catch { setError('Network error.'); }
    finally   { setDeleting(false); }
  };

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal sup-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="ms-modal-header sup-delete-header">
          <h2 className="ms-modal-title"><Trash2 size={17} style={{ marginRight: 8 }} /> Delete Supplier</h2>
          <button className="ms-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="ms-modal-body">
          {error && <div className="ms-modal-error"><AlertCircle size={16}/><span>{error}</span></div>}
          <div className="sup-delete-confirm">
            <div className="sup-delete-icon-wrap"><Trash2 size={28} /></div>
            <p className="sup-delete-msg">
              Are you sure you want to delete <strong>{supplier.name}</strong>?
              This will also remove all associated supply orders.
            </p>
          </div>
        </div>
        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sup-btn-delete" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   ADD SUPPLY ORDER MODAL — with backend total recalculation awareness
══════════════════════════════════════════════════════════════════════════ */
const AddOrderModal = ({ supplier, stores, products, onClose, onSaved, token }) => {
  const emptyLine = () => ({
    product_id:      '',
    product_name:    '',
    quantity:        1,
    price:           '',
    showSuggestions: false,
  });

  const [storeId,        setStoreId]        = useState('');
  const [items,          setItems]          = useState([emptyLine()]);
  const [invoiceNumber,  setInvoiceNumber]  = useState('');
  const [notes,          setNotes]          = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');

  const addLine    = () => setItems(i => [...i, emptyLine()]);
  const removeLine = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const setLine    = (idx, key, val) =>
    setItems(i => i.map((it, j) => j === idx ? { ...it, [key]: val } : it));

  const handleDropdownSelect = (idx, productId) => {
    const p = products.find(pr => String(pr.product_id) === productId);
    setItems(i => i.map((it, j) => j !== idx ? it : {
      ...it,
      product_id:   productId,
      product_name: p ? p.name : it.product_name,
      price: it.price === '' && p ? String(p.price) : it.price,
    }));
  };

  const handleProductType = (idx, val) => {
    setItems(i => i.map((it, j) => j !== idx ? it : {
      ...it,
      product_name:    val,
      product_id:      '',
      showSuggestions: val.trim().length > 0,
    }));
  };

  const handlePickSuggestion = (idx, product) => {
    setItems(i => i.map((it, j) => j !== idx ? it : {
      ...it,
      product_id:      String(product.product_id),
      product_name:    product.name,
      price:           it.price === '' ? String(product.price) : it.price,
      showSuggestions: false,
    }));
  };

  // display total (backend will recompute — this is just for UX preview)
  const displayTotal = items.reduce((sum, it) =>
    sum + (parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0), 0);

  const handleSave = async () => {
    if (!storeId)                                      { setError('Please select a store.');                          return; }
    if (items.some(i => !i.product_name.trim()))       { setError('Every line needs a product name.');                return; }
    if (items.some(i => !i.price || parseFloat(i.price) <= 0))
                                                       { setError('Every line needs a valid purchase price > 0.');    return; }
    if (items.some(i => !i.quantity || parseFloat(i.quantity) < 1))
                                                       { setError('Quantity must be at least 1 on every line.');      return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        store_id:       storeId,
        invoice_number: invoiceNumber.trim() || null,
        notes:          notes.trim()         || null,
        // NOTE: backend recalculates total — we still send items so backend can verify
        items: items.map(it => ({
          product_id:   it.product_id || null,
          product_name: it.product_name.trim(),
          quantity:     parseFloat(it.quantity) || 1,
          price:        parseFloat(it.price)    || 0,
        })),
      };
      const res = await fetch(`${API}/api/suppliers/${supplier.supplier_id}/orders`, {
        method:  'POST',
        headers: hdr(token),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Supply order placed! Verified total: ${fmt(data.total)}`);
        setTimeout(() => { onSaved(); onClose(); }, 1200);
      } else {
        setError(data.message || 'Failed to place order.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally  { setSaving(false); }
  };

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal sup-order-modal" onClick={e => e.stopPropagation()}>

        <div className="ms-modal-header">
          <h2 className="ms-modal-title">
            <ShoppingBag size={17} style={{ marginRight: 8 }} />
            New Supply Order: <i> {supplier.name}</i>
          </h2>
          <button className="ms-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ms-modal-body">
          {error   && <div className="ms-modal-error"  ><AlertCircle  size={16}/><span>{error}</span></div>}
          {success && <div className="ms-modal-success"><CheckCircle size={16}/><span>{success}</span></div>}

          {/* Store + Invoice row */}
          <div className="sup-form-grid">
            <div className="ms-form-group">
              <label className="ms-form-label">Store <span className="sup-required">*</span></label>
              <select className="ms-form-input" value={storeId} onChange={e => setStoreId(e.target.value)}>
                <option value=""> Select Store...</option>
                {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.name}</option>)}
              </select>
            </div>

            <div className="ms-form-group">
              <label className="ms-form-label">Invoice / Reference No.</label>
              <input className="ms-form-input" placeholder="e.g. INV-2025-001"
                value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>

            <div className="ms-form-group sup-full">
              <label className="ms-form-label">Notes (optional)</label>
              <input className="ms-form-input" placeholder="Any notes about this order..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Items header */}
          <div className="sup-order-items-header">
            <div>
              <span className="sup-items-label">Order Items :</span>
              <span className="sup-items-hint">  select existing or type a new product</span>
            </div>
            <button className="sup-add-line-btn" onClick={addLine}><Plus size={13}/>  LINE</button>
          </div>

          {/* Line items */}
          <div className="sup-order-lines">
            {items.map((it, idx) => {
              const suggestions = it.product_name.trim().length > 0
                ? products
                    .filter(p => p.name.toLowerCase().includes(it.product_name.toLowerCase()))
                    .slice(0, 6)
                : [];

              return (
                <div key={idx} className="sup-order-line-card">
                  <div className="sup-order-line-row1">
                    <div className="sup-line-col sup-line-col-product">
                      <label className="sup-line-mini-label">
                        Select Existing Product
                        {it.product_id && <span className="sup-linked-badge">✓ linked</span>}
                      </label>
                      <select
                        className="ms-form-input"
                        value={it.product_id}
                        onChange={e => handleDropdownSelect(idx, e.target.value)}
                      >
                        <option value="">Choose from existing products </option>
                        {products.map(p => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.name}  |  Rs. {parseFloat(p.price).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sup-line-col sup-line-col-qty">
                      <label className="sup-line-mini-label">Qty <span className="sup-required">*</span></label>
                      <input type="number" min="1"
                        className="ms-form-input"
                        value={it.quantity}
                        onChange={e => setLine(idx, 'quantity', e.target.value)} />
                    </div>

                    <div className="sup-line-col sup-line-col-price">
                      <label className="sup-line-mini-label">Purchase Price (Rs.) <span className="sup-required">*</span></label>
                      <input type="number" min="0"
                        className="ms-form-input"
                        placeholder="Actual price paid"
                        value={it.price}
                        onChange={e => setLine(idx, 'price', e.target.value)} />
                    </div>

                    <div className="sup-line-col sup-line-col-sub">
                      <label className="sup-line-mini-label">Subtotal</label>
                      <div className="sup-line-subtotal">
                        {fmt((parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0))}
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button className="sup-line-remove" onClick={() => removeLine(idx)} title="Remove line">
                        <X size={14}/>
                      </button>
                    )}
                  </div>

                  <div className="sup-order-line-row2">
                    <div className="sup-product-input-wrap" style={{ flex: 1 }}>
                      <label className="sup-line-mini-label">
                        Product Name <span className="sup-required">*</span>
                        <span className="sup-name-hint">  edit name or type a brand-new product</span>
                      </label>
                      <input
                        className="ms-form-input"
                        placeholder="Any new product not in your list"
                        value={it.product_name}
                        autoComplete="off"
                        onChange={e => handleProductType(idx, e.target.value)}
                        onFocus={() => {
                          if (it.product_name.trim().length > 0)
                            setLine(idx, 'showSuggestions', true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setLine(idx, 'showSuggestions', false), 180)
                        }
                      />
                      {it.showSuggestions && suggestions.length > 0 && (
                        <div className="sup-suggestions-drop">
                          {suggestions.map(p => (
                            <button
                              key={p.product_id}
                              className="sup-suggestion-item"
                              onMouseDown={() => handlePickSuggestion(idx, p)}
                            >
                              <span className="sup-sug-name">{p.name}</span>
                              <span className="sup-sug-price">Rs. {parseFloat(p.price).toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sup-order-total-row">
            <div>
              <span className="sup-order-total-label">Preview Total</span>
              <span className="sup-order-items-count"> ({items.length} item{items.length !== 1 ? 's' : ''})</span>
              <span className="sup-total-note"> — final total verified by server</span>
            </div>
            <span className="sup-order-total-val">{fmt(displayTotal)}</span>
          </div>
        </div>

        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ms-btn-save" onClick={handleSave} disabled={saving || !!success}>
            <Save size={14}/> {saving ? 'Placing Order…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   ORDER STATUS BADGE + ICON helper
══════════════════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const map = {
    received:  { cls: 'sup-ord-received',  Icon: CheckSquare, label: 'Received'  },
    cancelled: { cls: 'sup-ord-cancelled', Icon: XCircle,     label: 'Cancelled' },
    pending:   { cls: 'sup-ord-pending',   Icon: Clock,       label: 'Pending'   },
  };
  const { cls, Icon, label } = map[status] || map.pending;
  return (
    <span className={`sup-order-status-badge ${cls}`}>
      <Icon size={11} style={{ marginRight: 3 }}/>{label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   VIEW ORDERS MODAL — with status update (pending → received / cancelled)
══════════════════════════════════════════════════════════════════════════ */
const OrdersModal = ({ supplier, stores, products, onClose, onRefresh, token }) => {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showAddOrder,  setShowAddOrder]  = useState(false);
  const [expanded,      setExpanded]      = useState(null);
  const [updatingId,    setUpdatingId]    = useState(null);   // order being status-updated
  const [statusError,   setStatusError]   = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/suppliers/${supplier.supplier_id}/orders`, {
        headers: plain(token),
      });
      if (res.ok) setOrders(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [supplier.supplier_id, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Mark order received or cancelled */
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId); setStatusError('');
    try {
      const res = await fetch(
        `${API}/api/suppliers/${supplier.supplier_id}/orders/${orderId}/status`,
        {
          method:  'PUT',
          headers: hdr(token),
          body:    JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        // optimistic update in local state
        setOrders(prev =>
          prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o)
        );
        onRefresh(); // refresh summary cards
      } else {
        setStatusError(data.message || 'Failed to update status.');
      }
    } catch { setStatusError('Network error.'); }
    finally { setUpdatingId(null); }
  };

  return (
    <>
      <div className="ms-modal-overlay" onClick={onClose}>
        <div className="ms-modal sup-orders-modal" onClick={e => e.stopPropagation()}>
          <div className="ms-modal-header">
            <div>
              <h2 className="ms-modal-title"><ClipboardList size={17} style={{ marginRight: 8 }} /> Supply Orders</h2>
              <p className="sup-orders-subtitle">{supplier.name}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="sup-new-order-btn" onClick={() => setShowAddOrder(true)}>
                <Plus size={14} /> New Order
              </button>
              <button className="ms-modal-close" onClick={onClose}><X size={20} /></button>
            </div>
          </div>

          <div className="ms-modal-body sup-orders-body">
            {statusError && (
              <div className="ms-modal-error" style={{ marginBottom: '0.75rem' }}>
                <AlertCircle size={16}/><span>{statusError}</span>
              </div>
            )}

            {loading ? (
              <div className="sup-orders-loading">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="sup-orders-empty">
                <ShoppingBag size={36} />
                <p>No supply orders yet for this supplier.</p>
                <button className="ms-btn-save" style={{ marginTop: '1rem' }}
                  onClick={() => setShowAddOrder(true)}>
                  <Plus size={14} /> Create First Order
                </button>
              </div>
            ) : (
              <div className="sup-orders-list">
                {orders.map(ord => (
                  <div key={ord.order_id} className="sup-order-card">
                    <div className="sup-order-card-header"
                      onClick={() => setExpanded(expanded === ord.order_id ? null : ord.order_id)}>
                      <div className="sup-order-card-left">
                        <span className="sup-order-id">Order #{ord.order_id}</span>
                        <span className="sup-order-store">{ord.store_name || '—'}</span>
                        {ord.invoice_number && (
                          <span className="sup-order-invoice">INV: {ord.invoice_number}</span>
                        )}
                        <StatusBadge status={ord.status || 'pending'} />
                      </div>
                      <div className="sup-order-card-right">
                        <span className="sup-order-total">{fmt(ord.total)}</span>
                        <span className="sup-order-date">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : '—'}
                        </span>
                        <span className="sup-order-chevron">{expanded === ord.order_id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/*  STATUS ACTION BUTTONS  */}
                    {(ord.status === 'pending' || !ord.status) && (
                      <div className="sup-order-actions">
                        <button
                          className="sup-action-btn sup-receive-btn"
                          disabled={updatingId === ord.order_id}
                          onClick={e => { e.stopPropagation(); handleStatusChange(ord.order_id, 'received'); }}
                          title="Mark as Received — will update inventory automatically"
                        >
                          {updatingId === ord.order_id
                            ? <RefreshCw size={13} className="sup-spinning"/>
                            : <CheckSquare size={13}/>}
                          {updatingId === ord.order_id ? ' Updating…' : ' Mark Received'}
                        </button>
                        <button
                          className="sup-action-btn sup-cancel-btn"
                          disabled={updatingId === ord.order_id}
                          onClick={e => { e.stopPropagation(); handleStatusChange(ord.order_id, 'cancelled'); }}
                          title="Cancel this order"
                        >
                          <XCircle size={13}/> Cancel Order
                        </button>
                      </div>
                    )}

                    {ord.status === 'received' && (
                      <div className="sup-order-received-note">
                        <CheckCircle size={13}/> Inventory updated when this order was received.
                      </div>
                    )}

                    {/*  EXPANDED ITEMS TABLE  */}
                    {expanded === ord.order_id && ord.items && (
                      <div className="sup-order-items-table-wrap">
                        {ord.notes && (
                          <p className="sup-order-notes-row"><strong>Notes:</strong> {ord.notes}</p>
                        )}
                        <table className="sup-order-items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Ordered</th>
                              <th>Received</th>
                              <th>Unit Cost</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ord.items.map((it, i) => (
                              <tr key={i}>
                                <td>{it.product_name || '—'}</td>
                                <td>{it.quantity}</td>
                                <td>
                                  {it.quantity_received !== undefined
                                    ? it.quantity_received
                                    : <span style={{ color:'#9ca3af' }}>—</span>}
                                </td>
                                <td>{fmt(it.price)}</td>
                                <td>{fmt((parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ms-modal-footer">
            <button className="ms-btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {showAddOrder && (
        <AddOrderModal
          supplier={supplier}
          stores={stores}
          products={products}
          token={token}
          onClose={() => setShowAddOrder(false)}
          onSaved={() => { fetchOrders(); onRefresh(); }}
        />
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN SUPPLIERS COMPONENT — server-side pagination
══════════════════════════════════════════════════════════════════════════ */
const Suppliers = () => {
  const navigate = useNavigate();
  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // data
  const [suppliers,  setSuppliers]  = useState([]);
  const [stores,     setStores]     = useState([]);
  const [products,   setProducts]   = useState([]);
  const [summary,    setSummary]    = useState({
    total: 0, active_month: 0, total_orders: 0,
    pending_orders: 0, received_orders: 0, total_spent: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // server-side pagination + search
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // modals
  const [editSupplier,   setEditSupplier]   = useState(null);
  const [addOpen,        setAddOpen]        = useState(false);
  const [deleteSupplier, setDeleteSupplier] = useState(null);
  const [ordersSupplier, setOrdersSupplier] = useState(null);

  /* fetch suppliers (server-side paginated + searched) */
  const fetchSuppliers = useCallback(async (pg = 1, q = '') => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: pg, limit: ITEMS_PER_PAGE });
      if (q.trim()) params.set('search', q.trim());

      const res = await fetch(`${API}/api/suppliers?${params}`, { headers: plain(token) });
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.data       || []);
        setTotalPages(json.total_pages || 1);
        setTotalCount(json.total      || 0);
      } else {
        setError('Failed to load suppliers.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  }, [token]);

  /* fetch supporting data */
  const fetchSupporting = useCallback(async () => {
    try {
      const headers = plain(token);
      const [storeRes, prodRes, sumRes] = await Promise.all([
        fetch(`${API}/api/inventory/stores`,  { headers }),
        fetch(`${API}/api/shopproducts`,      { headers }),
        fetch(`${API}/api/suppliers/summary`, { headers }),
      ]);
      if (storeRes.ok) setStores(await storeRes.json());
      if (prodRes.ok)  setProducts(await prodRes.json());
      if (sumRes.ok)   setSummary(await sumRes.json());
    } catch { /* silent */ }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchSuppliers(page, search);
    fetchSupporting();
  }, [fetchSuppliers, fetchSupporting, page, search]);

  useEffect(() => { fetchSuppliers(1, ''); fetchSupporting(); }, [fetchSuppliers, fetchSupporting]);

  /* debounced search */
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchSuppliers(1, search); }, 350);
    return () => clearTimeout(t);
  }, [search, fetchSuppliers]);

  /* page change */
  useEffect(() => { fetchSuppliers(page, search); }, [page]); // eslint-disable-line

  /* outside click */
  useEffect(() => {
    const h = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo ? `${API}${user.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl)
      return <img src={shopLogoUrl} alt={user.shop_name || 'Shop'}
        className="shop-sidebar-logo-img" onError={e => { e.target.style.display='none'; }} />;
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url)
      return <img src={`${API}${user.image_url}`} alt="Profile"
        style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />;
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem   = Math.min(page * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="shop-admin-container">

      {/* SIDEBAR */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">{renderShopLogo()}</div>
        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18}/><span>Dashboard</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18}/><span>Shop Profile</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18}/><span>My Stores</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18}/><span>My Users</span>
          </button>
          <button className="shop-nav-item active">
            <PackageIcon size={18}/><span>Suppliers</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18}/><span>Products</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18}/><span>Categories</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18}/><span>Inventory</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/salesrecords')}>
            <TrendingUp size={18}/><span>Sales Records</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/reportsandanalytics')}>
            <FileBarChart size={18}/><span>Reports & Analytics</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18}/><span>Subscription</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18}/><span>My Profile</span>
          </button>
          <button className="shop-nav-item logout-item" onClick={handleLogOut}>
            <LogOut size={18}/><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">

        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Suppliers</div>
          <div className="shop-header-actions">
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Stores <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">My Stores</h4>
                    {stores.length > 0 ? stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => setShowMenuDropdown(false)}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    )) : <div className="shop-menu-item">No stores found</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="shop-profile-dropdown">
                  <div className="shop-profile-dropdown-header">
                    <div className="shop-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="shop-profile-dropdown-info">
                      <h4 className="shop-profile-name">{user.name || 'Admin'}</h4>
                      <p className="shop-profile-role">{user.role || 'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-details">
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📧</span>
                      <span className="shop-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📱</span>
                      <span className="shop-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn"
                      onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}>
                      <User size={18}/><span>My Profile</span>
                    </button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18}/><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="shop-dashboard-content">

          {/* Page title + Add button */}
          <div className="sup-page-header">
            <div>
              <h1 className="shop-welcome-title">Suppliers</h1>
              <p className="ms-subtitle">Manage vendors, track purchase orders and spending</p>
            </div>
            <button className="sup-add-btn" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add Supplier
            </button>
          </div>

          {/* STAT CARDS — now includes pending + received counts */}
          <div className="sup-stat-cards">
            <div className="sup-stat-card">
              <div className="sup-stat-icon-wrap sup-icon-total"><Truck size={20}/></div>
              <div className="sup-stat-info">
                <p className="sup-stat-label">Total Suppliers</p>
                <p className="sup-stat-value">{summary.total ?? 0}</p>
              </div>
            </div>
            <div className="sup-stat-card">
              <div className="sup-stat-icon-wrap sup-icon-active"><CheckCircle size={20}/></div>
              <div className="sup-stat-info">
                <p className="sup-stat-label">Active This Month</p>
                <p className="sup-stat-value">{summary.active_month ?? 0}</p>
              </div>
            </div>
            <div className="sup-stat-card">
              <div className="sup-stat-icon-wrap sup-icon-orders"><Clock size={20}/></div>
              <div className="sup-stat-info">
                <p className="sup-stat-label">Pending Orders</p>
                <p className="sup-stat-value">{summary.pending_orders ?? 0}</p>
              </div>
            </div>
            <div className="sup-stat-card">
              <div className="sup-stat-icon-wrap sup-icon-spent"><DollarSign size={20}/></div>
              <div className="sup-stat-info">
                <p className="sup-stat-label">Total Spent</p>
                <p className="sup-stat-value">{fmt(summary.total_spent)}</p>
              </div>
            </div>
          </div>

          {/* SUPPLIERS TABLE PANEL */}
          <div className="prod-table-card">

            {/* Filter bar */}
            <div className="sup-filter-bar">
              <div className="prod-search-wrap">
                <Search size={15} className="prod-search-icon"/>
                <input className="prod-search-input" placeholder="Search by name, phone, email, contact…"
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              {search && (
                <button className="sup-clear-search" onClick={() => setSearch('')}>
                  <X size={14}/> Clear
                </button>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="prod-loading">Loading suppliers…</div>
            ) : error ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><AlertCircle size={24}/></div>
                <h3>Error</h3><p>{error}</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><Truck size={24}/></div>
                <h3>No suppliers found</h3>
                <p>{search ? 'Try adjusting your search.' : 'Add your first supplier to get started.'}</p>
                {!search && (
                  <button className="ms-btn-save" style={{ marginTop:'1rem' }}
                    onClick={() => setAddOpen(true)}>
                    <Plus size={14}/> Add Supplier
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="prod-table-wrap">
                  <table className="prod-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Supplier</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map((s, idx) => (
                        <tr key={s.supplier_id}>
                          <td style={{ color:'#9ca3af', fontSize:'0.8125rem' }}>
                            {startItem + idx}
                          </td>
                          <td>
                            <div className="sup-name-cell">
                              <div className="sup-avatar">
                                {s.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="sup-name">{s.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="sup-contact-person">
                              {s.contact_person || <span style={{ color:'#9ca3af' }}>—</span>}
                            </span>
                          </td>
                          <td>
                            {s.phone
                              ? <span className="sup-info-chip"><Phone size={11}/>{s.phone}</span>
                              : <span style={{ color:'#9ca3af' }}>—</span>}
                          </td>
                          <td>
                            {s.email
                              ? <span className="sup-info-chip"><Mail size={11}/>{s.email}</span>
                              : <span style={{ color:'#9ca3af' }}>—</span>}
                          </td>
                          <td>
                            {s.address
                              ? <span className="sup-address-cell"><MapPin size={11}/>{s.address}</span>
                              : <span style={{ color:'#9ca3af' }}>—</span>}
                          </td>
                          <td>
                            <div className="sup-orders-breakdown">
                              <span className="sup-orders-badge">{s.order_count ?? 0} total</span>
                              {(s.pending_orders  > 0) && (
                                <span className="sup-orders-badge sup-badge-pending">{s.pending_orders} pending</span>
                              )}
                              {(s.received_orders > 0) && (
                                <span className="sup-orders-badge sup-badge-received">{s.received_orders} received</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="sup-spent">{fmt(s.total_spent)}</span>
                          </td>
                          <td>
                            <div className="prod-action-btns">
                              <button className="prod-tbl-btn-view sup-tbl-orders"
                                onClick={() => setOrdersSupplier(s)}
                                title="View Orders">
                                <Eye size={13}/> Orders
                              </button>
                              <button className="prod-tbl-btn-edit"
                                onClick={() => setEditSupplier(s)}
                                title="Edit">
                                <Edit3 size={13}/>
                              </button>
                              <button className="sup-tbl-btn-del"
                                onClick={() => setDeleteSupplier(s)}
                                title="Delete">
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — server-side */}
                <div className="prod-table-footer">
                  <span className="prod-pagination-info">
                    {totalCount > 0
                      ? `Showing ${startItem}–${endItem} of ${totalCount} suppliers`
                      : 'No suppliers'}
                  </span>
                  <div className="prod-pagination-btns">
                    <button className="prod-page-btn" disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft size={14}/> Previous
                    </button>
                    <span className="sup-page-indicator">Page {page} of {totalPages}</span>
                    <button className="prod-page-btn" disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {addOpen && (
        <SupplierModal
          supplier={null}
          token={token}
          onClose={() => setAddOpen(false)}
          onSaved={refreshAll}
        />
      )}
      {editSupplier && (
        <SupplierModal
          supplier={editSupplier}
          token={token}
          onClose={() => setEditSupplier(null)}
          onSaved={refreshAll}
        />
      )}
      {deleteSupplier && (
        <DeleteModal
          supplier={deleteSupplier}
          token={token}
          onClose={() => setDeleteSupplier(null)}
          onDeleted={refreshAll}
        />
      )}
      {ordersSupplier && (
        <OrdersModal
          supplier={ordersSupplier}
          stores={stores}
          products={products}
          token={token}
          onClose={() => setOrdersSupplier(null)}
          onRefresh={refreshAll}
        />
      )}
    </div>
  );
};

export default Suppliers;