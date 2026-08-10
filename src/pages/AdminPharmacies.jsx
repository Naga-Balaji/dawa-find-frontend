import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const TABS = ['pending', 'verified', 'rejected', 'unverified'];

export default function AdminPharmacies() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/pharmacies?status=${tab}`),
      api.get('/admin/metrics'),
    ])
      .then(([list, m]) => { setItems(list.data.items); setMetrics(m.data); })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(load, [load]);

  const decide = async (id, decision) => {
    const reason = decision === 'rejected'
      ? window.prompt('Reason for rejection?') || 'Not specified'
      : undefined;
    setBusyId(id);
    try {
      await api.patch(`/admin/pharmacies/${id}/verify`, { decision, reason });
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container partner">
      <div className="partner-head">
        <div>
          <h2>Verification queue</h2>
          <p className="muted">Approve drug licences before a shop can publish stock.</p>
        </div>
      </div>

      {metrics && (
        <div className="detail-stats">
          <div className="stat-card">
            <strong>{metrics.pharmacies.pending || 0}</strong><span>Pending review</span>
          </div>
          <div className="stat-card">
            <strong>{metrics.pharmacies.verified || 0}</strong><span>Verified partners</span>
          </div>
          <div className="stat-card">
            <strong>{metrics.freshness.percentFresh}%</strong><span>Rows fresh &lt;24h</span>
          </div>
          <div className="stat-card">
            <strong>{metrics.freshness.shopsActiveLast24h}</strong><span>Shops active today</span>
          </div>
        </div>
      )}

      {error && <div className="notice error">{error}</div>}

      <div className="filter-chips" style={{ margin: '20px 0' }}>
        {TABS.map((t) => (
          <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty-state"><p>Nothing in <strong>{tab}</strong>.</p></div>
      ) : (
        <table className="inv-table">
          <thead>
            <tr>
              <th>Shop</th><th>Owner</th><th>Licence</th><th>Source</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="med-name"><Link to={`/pharmacy/${p._id}`}>{p.name}</Link></div>
                  <div className="med-brand">{p.address}</div>
                </td>
                <td className="small">
                  {p.owner ? <>{p.owner.name}<br /><span className="muted">{p.owner.email}</span></> : <span className="muted">—</span>}
                </td>
                <td className="mono">{p.licenceNo || '—'}</td>
                <td><span className="meta-chip">{p.source}</span></td>
                <td className="row-actions">
                  {p.verificationStatus !== 'verified' && (
                    <button className="btn primary small" disabled={busyId === p._id}
                      onClick={() => decide(p._id, 'verified')}>Verify</button>
                  )}
                  {p.verificationStatus !== 'rejected' && (
                    <button className="btn ghost small" disabled={busyId === p._id}
                      onClick={() => decide(p._id, 'rejected')}>Reject</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
