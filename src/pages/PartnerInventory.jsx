import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In stock', cls: 'ok' },
  { value: 'out_of_stock', label: 'Out', cls: 'low' },
  { value: 'unknown', label: 'Unknown', cls: 'unk' },
];

function ago(iso) {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function PartnerInventory() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  // sku -> { status?, stock?, price? } — only what the user actually changed.
  const [edits, setEdits] = useState({});

  const load = () => {
    setLoading(true);
    api.get('/partner/inventory')
      .then(({ data }) => { setBoard(data); setEdits({}); })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const locked = board && board.pharmacy.verificationStatus !== 'verified';

  const rows = useMemo(() => {
    if (!board) return [];
    const q = query.trim().toLowerCase();
    return board.items
      .map((i) => ({ ...i, ...edits[i.sku] }))
      .filter((i) => (filter === 'all' ? true : i.status === filter))
      .filter((i) =>
        !q ||
        i.name?.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q)
      );
  }, [board, edits, query, filter]);

  // Recount live so the chips reflect unsaved edits too.
  const summary = useMemo(() => {
    if (!board) return { in_stock: 0, out_of_stock: 0, unknown: 0 };
    return board.items
      .map((i) => ({ ...i, ...edits[i.sku] }))
      .reduce((a, i) => ({ ...a, [i.status]: (a[i.status] || 0) + 1 }),
        { in_stock: 0, out_of_stock: 0, unknown: 0 });
  }, [board, edits]);

  const edit = (sku, patch) =>
    setEdits((e) => ({ ...e, [sku]: { ...e[sku], ...patch } }));

  const dirtyCount = Object.keys(edits).length;

  const save = async () => {
    setSaving(true); setError(''); setNotice('');
    const items = Object.entries(edits).map(([sku, v]) => ({ sku, ...v }));
    try {
      const { data } = await api.put('/partner/inventory', { items });
      setNotice(
        `Saved — ${data.created} created, ${data.updated} updated` +
        (data.rejected?.length ? `, ${data.rejected.length} rejected` : '')
      );
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmAll = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const { data } = await api.post('/partner/inventory/confirm');
      setNotice(`Confirmed ${data.confirmed} rows as still accurate.`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container"><p>Loading stock board…</p></div>;
  if (!board) return <div className="container"><div className="notice error">{error || 'No shop found.'}</div></div>;

  return (
    <div className="container partner">
      <div className="partner-head">
        <div>
          <h2>Stock board</h2>
          <p className="muted">{board.pharmacy.name} · {board.total} SKUs in the catalog</p>
        </div>
        <div className="board-actions">
          <button className="btn ghost" onClick={confirmAll} disabled={locked || saving}>
            Still accurate ✓
          </button>
          <button className="btn primary" onClick={save} disabled={locked || saving || !dirtyCount}>
            {saving ? 'Saving…' : dirtyCount ? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}` : 'Save'}
          </button>
        </div>
      </div>

      {locked && (
        <div className="notice amber">
          <strong>Read-only until verified.</strong>
          <p>
            Your shop is <code>{board.pharmacy.verificationStatus}</code>. An admin must approve your
            licence before you can publish stock — see <Link to="/partner">My shop</Link>.
          </p>
        </div>
      )}
      {notice && <div className="notice green">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <div className="board-bar">
        <input
          className="inv-search"
          placeholder="Search medicine, brand or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          {[
            ['all', `All ${board.total}`],
            ['in_stock', `In stock ${summary.in_stock}`],
            ['out_of_stock', `Out ${summary.out_of_stock}`],
            ['unknown', `Unknown ${summary.unknown}`],
          ].map(([v, label]) => (
            <button
              key={v}
              className={`chip ${filter === v ? 'active' : ''}`}
              onClick={() => setFilter(v)}
            >{label}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state"><p>No SKUs match this filter.</p></div>
      ) : (
        <table className="inv-table board-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Availability</th>
              <th>Qty</th>
              <th>Your price</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dirty = !!edits[r.sku];
              return (
                <tr key={r.sku} className={dirty ? 'dirty' : ''}>
                  <td>
                    <div className="med-name">
                      {r.name}
                      {r.prescriptionRequired && <span className="rx-tag" title="Prescription required">Rx</span>}
                    </div>
                    <div className="med-brand">{r.brand} · {r.strength} · <span className="mono">{r.sku}</span></div>
                  </td>
                  <td>
                    <div className="seg">
                      {STATUS_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          disabled={locked}
                          className={`seg-btn ${o.cls} ${r.status === o.value ? 'on' : ''}`}
                          onClick={() => edit(r.sku, { status: o.value })}
                        >{o.label}</button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number" min="0" className="cell-input"
                      disabled={locked || r.status === 'out_of_stock'}
                      value={r.stock ?? 0}
                      onChange={(e) => edit(r.sku, { stock: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number" min="0" className="cell-input"
                      disabled={locked}
                      value={r.price ?? ''}
                      onChange={(e) => edit(r.sku, { price: e.target.value })}
                    />
                    <span className="small muted"> MRP ₹{r.mrp}</span>
                  </td>
                  <td className="small muted">
                    {ago(r.lastUpdatedAt)}
                    {r.updatedBy && <><br /><em>{r.updatedBy}</em></>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
