import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';

// Fix default Leaflet marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Distinct green icon for the "you are here" marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const VIJAYAWADA = [16.5062, 80.6480];
// Hard-coded test location (Benz Circle, Vijayawada) — used instead of
// browser geolocation while developing so we don't drift out of the
// seeded pharmacy area.
const TEST_USER_LOCATION = [16.5045, 80.6540];

function Recenter({ center, radius }) {
  const map = useMap();
  useEffect(() => {
    // Fit the map to the search-radius circle (bounding box = 2*radius square)
    const bounds = L.latLng(center[0], center[1]).toBounds(radius * 2);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [center, radius, map]);
  return null;
}

export default function Home() {
  const [pharmacies, setPharmacies] = useState([]);
  const [medicine, setMedicine] = useState('');
  const [center, setCenter] = useState(VIJAYAWADA);
  const [radius, setRadius] = useState(5000); // metres
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/pharmacies')
      .then((r) => setPharmacies(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  const useMyLocation = () => {
    // TEST MODE: use hard-coded Vijayawada location instead of real geolocation.
    setError('');
    setCenter(TEST_USER_LOCATION);
  };

  const findNearby = async () => {
    try {
      setLoading(true);
      const [lat, lon] = center;
      const r = await api.get('/pharmacies/nearby', { params: { lat, lon, radius } });
      setPharmacies(r.data);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  const findMedicine = async (e) => {
    e?.preventDefault?.();
    if (!medicine.trim()) return;
    try {
      setLoading(true);
      const [lat, lon] = center;
      const r = await api.get('/pharmacies/medicines/nearby', {
        params: { name: medicine, lat, lon, radius },
      });
      // response is inventory rows; extract pharmacies
      const pharms = r.data.map((row) => row.pharmacy).filter(Boolean);
      const seen = new Set();
      const unique = pharms.filter((p) => (seen.has(p._id) ? false : seen.add(p._id)));
      setPharmacies(unique);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero-left">
          <span className="pill">🩺 Vijayawada · Live pharmacy directory</span>
          <h1>Find the right <span className="accent">medicine</span>, near you.</h1>
          <p className="lead">
            Search across nearby medical shops in seconds. See what's in stock,
            compare prices, and get directions — all on one map.
          </p>

          <form className="search-bar" onSubmit={findMedicine}>
            <input
              type="text"
              placeholder="e.g. Paracetamol, Azithromycin, ORS…"
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
            />
            <button className="btn primary" type="submit">Search</button>
          </form>

          <div className="quick-actions">
            <button className="chip" onClick={useMyLocation}>📍 Use my location</button>
            <button className="chip" onClick={findNearby}>🏥 Nearby pharmacies</button>
            <label className="radius-select">
              <span>Radius</span>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
                <option value={50000}>50 km</option>
              </select>
            </label>
          </div>

          <div className="stats">
            <div><strong>{pharmacies.length}</strong><span>on map</span></div>
            <div><strong>{radius / 1000} km</strong><span>search radius</span></div>
            <div><strong>24/7</strong><span>updated</span></div>
          </div>
        </div>

        <div className="hero-map">
          {loading && <div className="map-loading">Loading…</div>}
          <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
            <Recenter center={center} radius={radius} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User's location marker + 5km search radius ring */}
            <Marker position={center} icon={userIcon}>
              <Popup><strong>You are here</strong><br />(test location)</Popup>
            </Marker>
            <Circle center={center} radius={radius} pathOptions={{ color: '#0f766e', fillOpacity: 0.05 }} />

            {pharmacies.map((p) => {
              const coords = p.location?.coordinates;
              if (!coords) return null;
              const [lon, lat] = coords;
              return (
                <Marker key={p._id} position={[lat, lon]}>
                  <Popup>
                    <strong>{p.name}</strong><br />
                    {p.address}<br />
                    {p.phone && <span>📞 {p.phone}<br /></span>}
                    {p.rating && <span>⭐ {p.rating} ({p.ratingCount || 0})</span>}
                    <br />
                    <Link to={`/pharmacy/${p._id}`}>View shop & inventory →</Link>
                    {p.mapsLink && (
                      <>
                        <br />
                        <a href={p.mapsLink} target="_blank" rel="noreferrer">Directions ↗</a>
                      </>
                    )}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </section>

      {error && <div className="error banner">{error}</div>}

      {/* ============ RESULTS / SHOP CARDS ============ */}
      <section className="shops">
        <div className="shops-head">
          <h2>
            {medicine.trim()
              ? `Shops stocking "${medicine}"`
              : 'All medical shops'}
          </h2>
          <span className="count-badge">{pharmacies.length} result{pharmacies.length === 1 ? '' : 's'}</span>
        </div>

        {pharmacies.length === 0 ? (
          <div className="empty-state">
            <p>No pharmacies match your search. Try a different medicine or widen the radius.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {pharmacies.slice(0, 30).map((p) => (
              <article key={p._id} className="shop-card">
                <Link to={`/pharmacy/${p._id}`} className="shop-link">
                  {p.imageLink ? (
                    <div className="shop-img" style={{ backgroundImage: `url(${p.imageLink})` }} />
                  ) : (
                    <div className="shop-img placeholder">💊</div>
                  )}
                </Link>
                <div className="shop-body">
                  <div className="shop-top">
                    <h3><Link to={`/pharmacy/${p._id}`} className="shop-link">{p.name}</Link></h3>
                    {p.rating && (
                      <span className="rating-badge">⭐ {p.rating}</span>
                    )}
                  </div>
                  <p className="shop-addr">{p.address}</p>
                  {p.hours && <p className="shop-hours">🕒 {p.hours}</p>}
                  <div className="shop-actions">
                    <Link className="btn primary small" to={`/pharmacy/${p._id}`}>Explore →</Link>
                    {p.phone && <a className="btn ghost" href={`tel:${p.phone.replace(/[^+\d]/g, '')}`}>📞 Call</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {pharmacies.length > 30 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
            Showing first 30 of {pharmacies.length}. Refine your search to narrow.
          </p>
        )}
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features">
        <h2>Why Dawa-Find?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">📍</div>
            <h3>Nearby, always</h3>
            <p>Auto-detect your location and see every pharmacy within a chosen radius.</p>
          </div>
          <div className="feature-card">
            <div className="icon">💊</div>
            <h3>Real-time SKU search</h3>
            <p>Search by medicine name or brand — we show which shops actually stock it.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🗺️</div>
            <h3>One-tap directions</h3>
            <p>Every pin opens directly in Google Maps for turn-by-turn navigation.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⭐</div>
            <h3>Ratings & hours</h3>
            <p>Compare open hours and ratings before you head out.</p>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <Footer />
    </main>
  );
}
