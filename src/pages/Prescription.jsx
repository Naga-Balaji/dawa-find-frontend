import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';
import { getToken } from '../auth.js';

// Same hard-coded dev location Home uses, so results stay inside the
// seeded Vijayawada pharmacy set.
const TEST_USER_LOCATION = [16.5045, 80.6540];

// Full-size phone photos are 4-6 MB and mostly wasted detail. Downscale
// before upload: smaller payload, fewer image tokens, same legibility.
const MAX_EDGE = 1600;

function compress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const CONFIDENCE_LABEL = { high: 'Clear', medium: 'Fairly clear', low: 'Hard to read' };

function MedicineCard({ item }) {
  const { prescribed, catalog, offers, bestPrice, availableNearby } = item;
  const best = catalog[0];
  const conf = prescribed.confidence || 'medium';

  return (
    <article className="rx-card">
      <div className="rx-card-head">
        <div>
          <h3>
            {prescribed.name || 'Unreadable line'}
            {prescribed.strength && <span className="rx-strength"> {prescribed.strength}</span>}
          </h3>
          {prescribed.brand && <p className="rx-brand">Brand written: {prescribed.brand}</p>}
        </div>
        <span className={`rx-conf ${conf}`}>{CONFIDENCE_LABEL[conf] || conf}</span>
      </div>

      <div className="rx-chips">
        {prescribed.form && <span className="meta-chip">{prescribed.form}</span>}
        {prescribed.dosage && <span className="meta-chip">🕒 {prescribed.dosage}</span>}
        {prescribed.duration && <span className="meta-chip">📅 {prescribed.duration}</span>}
        {prescribed.quantity && <span className="meta-chip"># {prescribed.quantity}</span>}
      </div>

      {best ? (
        <>
          <div className="rx-info">
            <p className="rx-matched">
              Matched to <strong>{best.name}</strong>
              {best.brand ? ` (${best.brand})` : ''} · <code>{best.sku}</code>
              {best.prescriptionRequired && <span className="meta-chip red">Rx only</span>}
            </p>
            {best.description && <p className="rx-desc">{best.description}</p>}
          </div>

          <div className="rx-price-row">
            <div className="rx-price">
              <span className="rx-price-label">
                {bestPrice != null ? 'Best nearby price' : 'Catalogue MRP'}
              </span>
              <strong>₹{bestPrice ?? best.mrp ?? '—'}</strong>
              {bestPrice != null && best.mrp != null && bestPrice < best.mrp && (
                <span className="rx-save">MRP ₹{best.mrp}</span>
              )}
            </div>
            <span className={`rx-stock ${availableNearby ? 'ok' : 'none'}`}>
              {availableNearby
                ? `In stock at ${availableNearby} shop${availableNearby === 1 ? '' : 's'}`
                : 'No nearby stock'}
            </span>
          </div>

          {offers.length > 0 && (
            <ul className="rx-offers">
              {offers.slice(0, 4).map((o) => (
                <li key={`${o.sku}-${o.pharmacy._id}`}>
                  <Link to={`/pharmacy/${o.pharmacy._id}`}>{o.pharmacy.name}</Link>
                  <span className="rx-offer-price">{o.price != null ? `₹${o.price}` : '—'}</span>
                  {o.pharmacy.phone && (
                    <a
                      className="rx-offer-call"
                      href={`tel:${o.pharmacy.phone.replace(/[^+\d]/g, '')}`}
                    >
                      Call
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="notice amber">
          <strong>Not in our catalogue yet</strong>
          <p>
            We couldn't match this to a listed SKU, so we can't quote a price. Ask a nearby
            pharmacy directly, or{' '}
            <Link to="/">search the map</Link> for the name.
          </p>
        </div>
      )}
    </article>
  );
}

export default function Prescription() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [center, setCenter] = useState(TEST_USER_LOCATION);
  const [radius, setRadius] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const signedIn = Boolean(getToken());

  const pickFile = async (file) => {
    if (!file) return;
    setError('');
    setResult(null);
    try {
      setPreview(await compress(file));
      setFileName(file.name);
    } catch (e) {
      setError(e.message);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    pickFile(e.dataTransfer.files?.[0]);
  };

  const analyse = async () => {
    if (!preview) return;
    if (!signedIn) return navigate('/login');

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const [lat, lon] = center;
      const r = await api.post('/ai/prescription', { image: preview, lat, lon, radius });
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview('');
    setFileName('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <main>
      <section className="rx-page">
        <header className="rx-head">
          <span className="pill">✨ AI prescription scan</span>
          <h1>
            Photograph your prescription. <span className="accent">We'll price it.</span>
          </h1>
          <p className="lead">
            Upload a photo and we read every medicine on it, match each one to our catalogue,
            and show what nearby shops charge — so you know the bill before you leave home.
          </p>
        </header>

        <div className="rx-grid">
          {/* ---------- Upload panel ---------- */}
          <div className="rx-upload">
            <div
              className={`rx-drop ${preview ? 'has-image' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => !preview && fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Prescription preview" />
              ) : (
                <>
                  <div className="rx-drop-icon">📄</div>
                  <strong>Drop a photo here, or click to browse</strong>
                  <span className="small">JPEG, PNG or WebP · up to 8 MB</span>
                </>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            {fileName && (
              <p className="rx-filename">
                {fileName}
                <button className="link-btn" onClick={reset}>Remove</button>
              </p>
            )}

            <div className="quick-actions">
              <button className="chip" onClick={() => setCenter(TEST_USER_LOCATION)}>
                📍 Use my location
              </button>
              <label className="radius-select">
                <span>Within</span>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={20000}>20 km</option>
                </select>
              </label>
            </div>

            <button
              className="btn primary rx-analyse"
              onClick={analyse}
              disabled={!preview || loading}
            >
              {loading ? 'Reading prescription…' : signedIn ? 'Read & price it' : 'Sign in to scan'}
            </button>

            {!signedIn && (
              <p className="small muted">
                Scanning needs an account so your prescription stays tied to you.{' '}
                <Link to="/register">Create one</Link>.
              </p>
            )}

            <div className="notice">
              <strong>Your privacy</strong>
              <p>
                The photo is sent to our AI provider to be read, and is not stored on our
                servers afterwards. Never upload someone else's prescription.
              </p>
            </div>
          </div>

          {/* ---------- Results panel ---------- */}
          <div className="rx-results">
            {error && <div className="notice error"><strong>{error}</strong></div>}

            {loading && (
              <div className="rx-skeleton">
                <p>Reading the handwriting, matching medicines, checking nearby stock…</p>
                <div className="bar" /><div className="bar" /><div className="bar short" />
              </div>
            )}

            {!loading && !result && !error && (
              <div className="empty-state">
                <p>
                  Your medicines, dosages and prices will appear here once you upload a
                  prescription.
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="rx-summary">
                  <div>
                    <strong>{result.items.length}</strong>
                    <span>medicine{result.items.length === 1 ? '' : 's'} found</span>
                  </div>
                  <div>
                    <strong>₹{result.estimatedTotal || '—'}</strong>
                    <span>estimated total</span>
                  </div>
                  <div>
                    <strong>{result.unmatched}</strong>
                    <span>not in catalogue</span>
                  </div>
                </div>

                {(result.prescription.doctorName || result.prescription.date) && (
                  <p className="muted rx-meta">
                    {result.prescription.doctorName && <>Dr. {result.prescription.doctorName} </>}
                    {result.prescription.clinicName && <>· {result.prescription.clinicName} </>}
                    {result.prescription.date && <>· {result.prescription.date}</>}
                  </p>
                )}

                {result.items.map((item, i) => (
                  <MedicineCard key={i} item={item} />
                ))}

                {result.prescription.notes?.length > 0 && (
                  <div className="notice">
                    <strong>Other instructions on the page</strong>
                    <ul className="dupe-list">
                      {result.prescription.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}

                <div className="notice amber">
                  <strong>Check before you buy</strong>
                  <p>{result.disclaimer}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
