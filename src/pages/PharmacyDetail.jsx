import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';

export default function PharmacyDetail() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/pharmacies/${id}`),
      api.get(`/pharmacies/${id}/inventory`),
    ])
      .then(([p, inv]) => {
        setPharmacy(p.data);
        setInventory(inv.data);
      })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    if (!query.trim()) return inventory;
    const q = query.toLowerCase();
    return inventory.filter((row) => {
      const m = row.medicine || {};
      return (
        m.name?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q) ||
        m.sku?.toLowerCase().includes(q)
      );
    });
  }, [inventory, query]);

  if (loading) return <div className="container"><p>Loading pharmacy…</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!pharmacy) return null;

  const [lon, lat] = pharmacy.location?.coordinates || [];
  const totalStock = inventory.reduce((sum, i) => sum + (i.stock || 0), 0);
  const uniqueSkus = inventory.length;

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="detail-hero">
        <div className="detail-hero-inner">
          <Link to="/" className="back-link">← Back to all shops</Link>
          <div className="detail-top">
            <div className="detail-thumb">
              {pharmacy.imageLink ? (
                <img src={pharmacy.imageLink} alt={pharmacy.name} />
              ) : (
                <div className="placeholder-big">💊</div>
              )}
            </div>
            <div className="detail-info">
              <div className="pill">Verified partner</div>
              <h1>{pharmacy.name}</h1>
              <p className="address">📍 {pharmacy.address}</p>
              <div className="detail-meta">
                {pharmacy.rating && (
                  <span className="meta-chip amber">⭐ {pharmacy.rating} ({pharmacy.ratingCount || 0} reviews)</span>
                )}
                {pharmacy.hours && <span className="meta-chip">🕒 {pharmacy.hours}</span>}
                {pharmacy.status && <span className="meta-chip green">● {pharmacy.status}</span>}
              </div>
              <div className="detail-actions">
                {pharmacy.phone && (
                  <a className="btn primary" href={`tel:${pharmacy.phone.replace(/[^+\d]/g, '')}`}>
                    📞 Call {pharmacy.phone}
                  </a>
                )}
                {pharmacy.mapsLink && (
                  <a className="btn ghost" href={pharmacy.mapsLink} target="_blank" rel="noreferrer">
                    Directions ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STAT STRIP ============ */}
      <section className="detail-stats">
        <div className="stat-card">
          <strong>{uniqueSkus}</strong><span>Unique SKUs</span>
        </div>
        <div className="stat-card">
          <strong>{totalStock}</strong><span>Units in stock</span>
        </div>
        <div className="stat-card">
          <strong>{inventory.filter((i) => i.medicine?.prescriptionRequired).length}</strong>
          <span>Prescription items</span>
        </div>
        <div className="stat-card">
          <strong>₹{inventory.length ? Math.min(...inventory.map((i) => i.price || Infinity)) : '—'}</strong>
          <span>Cheapest SKU</span>
        </div>
      </section>

      {/* ============ INVENTORY + MAP ============ */}
      <section className="detail-body">
        <div className="detail-inventory">
          <div className="inv-head">
            <h2>Medicines available</h2>
            <input
              className="inv-search"
              placeholder="Search this shop's inventory…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {inventory.length === 0 ? (
            <div className="empty-state">
              <p>This shop hasn't listed its inventory yet.</p>
              <p className="muted">Call the shop directly to check availability.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>No matches for "{query}".</p></div>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>SKU</th>
                  <th>Strength</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const m = row.medicine || {};
                  const low = row.stock <= 10;
                  return (
                    <tr key={row._id}>
                      <td>
                        <div className="med-name">
                          {m.name}
                          {m.prescriptionRequired && (
                            <span className="rx-tag" title="Prescription required">Rx</span>
                          )}
                        </div>
                        <div className="med-brand">{m.brand} · {m.form}</div>
                      </td>
                      <td className="mono">{row.sku}</td>
                      <td>{m.strength || '—'}</td>
                      <td className="price">₹{row.price ?? m.price ?? '—'}</td>
                      <td>
                        <span className={`stock-badge ${low ? 'low' : 'ok'}`}>
                          {row.stock} {low ? '(low)' : ''}
                        </span>
                      </td>
                      <td>
                        {pharmacy.phone && (
                          <a
                            className="btn ghost small"
                            href={`tel:${pharmacy.phone.replace(/[^+\d]/g, '')}`}
                          >
                            Reserve
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <aside className="detail-side">
          <div className="side-card">
            <h3>Location</h3>
            {lat && lon && (
              <div className="mini-map">
                <MapContainer center={[lat, lon]} zoom={15} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; OSM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lon]}>
                    <Popup>{pharmacy.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
            <p className="small muted">{pharmacy.address}</p>
          </div>

          <div className="side-card">
            <h3>Quick info</h3>
            <ul className="info-list">
              <li><span>Phone</span><strong>{pharmacy.phone || '—'}</strong></li>
              <li><span>Landmark</span><strong>{pharmacy.landmark || '—'}</strong></li>
              <li><span>Hours</span><strong>{pharmacy.hours || '—'}</strong></li>
              <li><span>Rating</span><strong>{pharmacy.rating ? `⭐ ${pharmacy.rating}` : '—'}</strong></li>
            </ul>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
