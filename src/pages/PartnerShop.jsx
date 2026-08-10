import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../api/client.js';
import { getUser, setSession, getToken } from '../auth.js';

const VIJAYAWADA = [16.5062, 80.648];

// Click anywhere on the map to place the shop pin.
function LocationPicker({ position, onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return <Marker position={position} draggable eventHandlers={{
    dragend: (e) => { const { lat, lng } = e.target.getLatLng(); onPick([lat, lng]); },
  }} />;
}

const BADGE = {
  pending: { cls: 'amber', label: '⏳ Awaiting admin verification' },
  verified: { cls: 'green', label: '✓ Verified partner' },
  rejected: { cls: 'red', label: '✗ Rejected' },
  unverified: { cls: '', label: 'Unverified' },
};

export default function PartnerShop() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [pos, setPos] = useState(VIJAYAWADA);
  const [form, setForm] = useState({
    name: '', address: '', landmark: '', phone: '', hours: '', licenceNo: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api.get('/partner/shop')
      .then(({ data }) => {
        setShop(data);
        setForm({
          name: data.name || '', address: data.address || '', landmark: data.landmark || '',
          phone: data.phone || '', hours: data.hours || '', licenceNo: data.licenceNo || '',
        });
        const [lon, lat] = data.location?.coordinates || [];
        if (lat && lon) setPos([lat, lon]);
      })
      .catch((e) => {
        // NO_SHOP is the expected state for a partner who hasn't registered yet.
        if (e.response?.data?.code !== 'NO_SHOP') setError(e.response?.data?.message || e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setDuplicates([]); setSaving(true);
    const body = { ...form, lat: pos[0], lon: pos[1] };
    try {
      if (shop) {
        const { data } = await api.patch('/partner/shop', body);
        setShop(data);
        setNotice('Shop profile updated.');
      } else {
        const { data } = await api.post('/partner/shop', body);
        setShop(data.pharmacy);
        setDuplicates(data.possibleDuplicates || []);
        setNotice('Shop registered. An admin must verify your licence before you can publish stock.');
        // Refresh the cached user so the navbar knows a shop now exists.
        const me = await api.get('/auth/me');
        setSession(getToken(), me.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container"><p>Loading…</p></div>;

  const badge = BADGE[shop?.verificationStatus] || BADGE.unverified;

  return (
    <div className="container partner">
      <div className="partner-head">
        <div>
          <h2>{shop ? 'My shop' : 'Register your shop'}</h2>
          <p className="muted">
            {shop
              ? 'Keep these details current — customers see them on the map.'
              : `Signed in as ${getUser()?.name}. Register once; an admin verifies your licence.`}
          </p>
        </div>
        {shop && <span className={`meta-chip ${badge.cls}`}>{badge.label}</span>}
      </div>

      {shop?.verificationStatus === 'pending' && (
        <div className="notice amber">
          <strong>Verification pending.</strong>
          <p>You can browse your stock board, but publishing availability is locked until an admin approves your licence.</p>
        </div>
      )}
      {shop?.verificationStatus === 'rejected' && (
        <div className="notice error">
          <strong>Licence rejected.</strong>
          <p>{shop.rejectionReason || 'No reason given.'} Update your licence number below to resubmit.</p>
        </div>
      )}
      {shop?.verificationStatus === 'verified' && (
        <div className="notice green">
          <strong>You're live.</strong>
          <p>Head to the <Link to="/partner/inventory">stock board</Link> to publish what you have.</p>
        </div>
      )}

      {notice && <div className="notice">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      {duplicates.length > 0 && (
        <div className="notice amber">
          <strong>{duplicates.length} similar shop{duplicates.length === 1 ? '' : 's'} already on the map nearby.</strong>
          <ul className="dupe-list">
            {duplicates.map((d) => (
              <li key={d._id}><strong>{d.name}</strong> — {d.address} <em>({d.source})</em></li>
            ))}
          </ul>
          <p className="small muted">Your registration went through. Flag this to an admin if it's the same shop.</p>
        </div>
      )}

      <form className="form partner-form" onSubmit={submit}>
        <label>Shop name<input value={form.name} onChange={set('name')} required /></label>
        <label>Address<input value={form.address} onChange={set('address')} required /></label>
        <label>Landmark<input value={form.landmark} onChange={set('landmark')} placeholder="Opp. Benz Circle" /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} placeholder="+91 9000000001" required /></label>
        <label>Opening hours<input value={form.hours} onChange={set('hours')} placeholder="Mon - Sun :- 8:00 am - 11:00 pm" /></label>
        <label>
          Drug licence number
          <input value={form.licenceNo} onChange={set('licenceNo')} placeholder="AP/20B/1234" required />
          {shop && <span className="small muted">Changing this resets verification to pending.</span>}
        </label>

        <div className="picker">
          <span className="picker-label">
            Shop location — click or drag the pin
            <code>{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</code>
          </span>
          <div className="picker-map">
            <MapContainer center={pos} zoom={14} scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker position={pos} onPick={setPos} />
            </MapContainer>
          </div>
        </div>

        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : shop ? 'Save changes' : 'Register shop'}
        </button>
      </form>
    </div>
  );
}
