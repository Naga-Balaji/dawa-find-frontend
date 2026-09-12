import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';

// ============================================================
// WHATSAPP LINK
// ============================================================

function waLink(phone, medicine) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, '');

  if (!digits) return null;

  const withCc =
    digits.length === 10
      ? `91${digits}`
      : digits;

  const msg = medicine?.trim()
    ? `Hi, do you have *${medicine.trim()}* in stock? — via Dawa-Find`
    : `Hi, I'm checking medicine availability — via Dawa-Find`;

  return `https://wa.me/${withCc}?text=${encodeURIComponent(msg)}`;
}

// ============================================================
// LEAFLET ICON FIX
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Green marker for user's location
const userIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ============================================================
// DEFAULT LOCATIONS
// ============================================================

const VIJAYAWADA = [16.5062, 80.6480];

const TEST_USER_LOCATION = [
  16.5045,
  80.6540,
];

// ============================================================
// SAFE API RESPONSE HELPERS
// ============================================================

// Backend responses may be:
//
// [
//   { pharmacy }
// ]
//
// or:
//
// {
//   data: [...]
// }
//
// or:
//
// {
//   items: [...]
// }
//
// or:
//
// {
//   results: [...]
// }
//
// This prevents:
// TypeError: e.map is not a function
function getArrayFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.pharmacies)) {
    return data.pharmacies;
  }

  return [];
}

// Pharmacy-list endpoints should return pharmacies.
// This normalizes the production response safely.
function normalizePharmacies(data) {
  const rows = getArrayFromResponse(data);

  return rows.filter(
    (item) =>
      item &&
      typeof item === 'object'
  );
}

// Medicine search returns inventory rows containing:
//
// {
//   pharmacy: {...}
// }
//
// This extracts unique pharmacies safely.
function extractPharmaciesFromMedicineResponse(data) {
  const rows = getArrayFromResponse(data);

  const pharmacies = rows
    .map((row) => {
      // Normal inventory response
      if (row?.pharmacy) {
        return row.pharmacy;
      }

      // If backend already returned pharmacies
      if (
        row?._id &&
        row?.location
      ) {
        return row;
      }

      return null;
    })
    .filter(Boolean);

  const seen = new Set();

  return pharmacies.filter((pharmacy) => {
    const id =
      pharmacy?._id ||
      pharmacy?.id;

    if (!id) {
      return false;
    }

    const key = String(id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

// ============================================================
// RECENTER MAP
// ============================================================

function Recenter({
  center,
  radius,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !Array.isArray(center) ||
      center.length < 2
    ) {
      return;
    }

    const lat = Number(center[0]);
    const lon = Number(center[1]);
    const safeRadius =
      Number(radius) || 5000;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return;
    }

    const bounds = L.latLng(
      lat,
      lon
    ).toBounds(
      safeRadius * 2
    );

    map.fitBounds(bounds, {
      padding: [30, 30],
    });
  }, [
    center,
    radius,
    map,
  ]);

  return null;
}

// ============================================================
// HOME PAGE
// ============================================================

export default function Home() {
  const [
    pharmacies,
    setPharmacies,
  ] = useState([]);

  const [
    medicine,
    setMedicine,
  ] = useState('');

  const [
    center,
    setCenter,
  ] = useState(VIJAYAWADA);

  const [
    radius,
    setRadius,
  ] = useState(5000);

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ==========================================================
  // LOAD ALL PHARMACIES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadPharmacies = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await api.get(
            '/pharmacies'
          );

        console.log(
          'Pharmacies API response:',
          response.data
        );

        const list =
          normalizePharmacies(
            response.data
          );

        if (mounted) {
          setPharmacies(list);
        }
      } catch (err) {
        console.error(
          'Failed to load pharmacies:',
          err.response?.data ||
            err
        );

        if (mounted) {
          setPharmacies([]);

          setError(
            err.response?.data
              ?.message ||
              err.message ||
              'Unable to load pharmacies.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPharmacies();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // USE TEST LOCATION
  // ==========================================================

  const useMyLocation = () => {
    setError('');

    setCenter(
      TEST_USER_LOCATION
    );
  };

  // ==========================================================
  // FIND NEARBY PHARMACIES
  // ==========================================================

  const findNearby =
    async () => {
      try {
        setLoading(true);
        setError('');

        const [
          lat,
          lon,
        ] = center;

        const response =
          await api.get(
            '/pharmacies/nearby',
            {
              params: {
                lat,
                lon,
                radius,
              },
            }
          );

        console.log(
          'Nearby pharmacies response:',
          response.data
        );

        const list =
          normalizePharmacies(
            response.data
          );

        setPharmacies(list);

        if (
          list.length === 0
        ) {
          setError(
            'No pharmacies found in this radius.'
          );
        }
      } catch (err) {
        console.error(
          'Nearby pharmacy search failed:',
          err.response?.data ||
            err
        );

        setPharmacies([]);

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            'Unable to find nearby pharmacies.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // WHATSAPP NEAREST PHARMACY
  // ==========================================================

  const askNearestOnWhatsApp =
    () => {
      if (
        !Array.isArray(
          pharmacies
        )
      ) {
        setError(
          'Pharmacy data is unavailable.'
        );

        return;
      }

      const [
        lat,
        lon,
      ] = center;

      const toRad =
        (degrees) =>
          (degrees *
            Math.PI) /
          180;

      const distKm = (
        lat1,
        lon1,
        lat2,
        lon2
      ) => {
        const R = 6371;

        const dLat =
          toRad(
            lat2 - lat1
          );

        const dLon =
          toRad(
            lon2 - lon1
          );

        const s =
          Math.sin(
            dLat / 2
          ) **
            2 +
          Math.cos(
            toRad(lat1)
          ) *
            Math.cos(
              toRad(lat2)
            ) *
            Math.sin(
              dLon / 2
            ) **
              2;

        return (
          2 *
          R *
          Math.asin(
            Math.sqrt(s)
          )
        );
      };

      const withPhone =
        pharmacies
          .filter(
            (pharmacy) =>
              pharmacy?.phone &&
              Array.isArray(
                pharmacy
                  ?.location
                  ?.coordinates
              ) &&
              pharmacy.location
                .coordinates
                .length >= 2
          )
          .map(
            (pharmacy) => {
              const [
                pharmacyLon,
                pharmacyLat,
              ] =
                pharmacy.location
                  .coordinates;

              return {
                pharmacy,
                km: distKm(
                  lat,
                  lon,
                  pharmacyLat,
                  pharmacyLon
                ),
              };
            }
          )
          .sort(
            (a, b) =>
              a.km - b.km
          );

      if (
        withPhone.length ===
        0
      ) {
        setError(
          'No pharmacies with a phone number in the current results.'
        );

        return;
      }

      const nearest =
        withPhone[0]
          .pharmacy;

      const link = waLink(
        nearest.phone,
        medicine
      );

      if (!link) {
        setError(
          'This pharmacy does not have a valid WhatsApp number.'
        );

        return;
      }

      setError('');

      window.open(
        link,
        '_blank',
        'noopener,noreferrer'
      );
    };

  // ==========================================================
  // FIND MEDICINE
  // ==========================================================

  const findMedicine =
    async (event) => {
      event?.preventDefault?.();

      const query =
        medicine.trim();

      if (!query) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [
          lat,
          lon,
        ] = center;

        const response =
          await api.get(
            '/pharmacies/medicines/nearby',
            {
              params: {
                name: query,
                lat,
                lon,
                radius,
              },
            }
          );

        console.log(
          'Medicine API response:',
          response.data
        );

        const uniquePharmacies =
          extractPharmaciesFromMedicineResponse(
            response.data
          );

        setPharmacies(
          uniquePharmacies
        );

        if (
          uniquePharmacies.length ===
          0
        ) {
          setError(
            `No pharmacies found stocking "${query}".`
          );
        }
      } catch (err) {
        console.error(
          'Medicine search failed:',
          err.response?.data ||
            err
        );

        setPharmacies([]);

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            'Unable to search for this medicine.'
        );
      } finally {
        setLoading(false);
      }
    };

  // Always keep rendering safe
  const safePharmacies =
    Array.isArray(
      pharmacies
    )
      ? pharmacies
      : [];

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main>
      {/* ================= HERO ================= */}

      <section className="hero">
        <div className="hero-left">
          <span className="pill">
            🩺 Vijayawada · Live
            pharmacy directory
          </span>

          <h1>
            Find the right{' '}
            <span className="accent">
              medicine
            </span>
            , near you.
          </h1>

          <p className="lead">
            Search across nearby
            medical shops in
            seconds. See what's in
            stock, compare prices,
            and get directions —
            all on one map.
          </p>

          {/* SEARCH */}

          <form
            className="search-bar"
            onSubmit={
              findMedicine
            }
          >
            <input
              type="text"
              placeholder="e.g. Paracetamol, Azithromycin, ORS…"
              value={medicine}
              onChange={(e) =>
                setMedicine(
                  e.target.value
                )
              }
            />

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Searching...'
                : 'Search'}
            </button>

            <button
              type="button"
              className="btn primary"
              style={{
                background:
                  '#25D366',
                borderColor:
                  '#25D366',
              }}
              title="Open WhatsApp for the nearest pharmacy in the results"
              onClick={
                askNearestOnWhatsApp
              }
            >
              💬 Ask nearest
            </button>
          </form>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">
            <button
              type="button"
              className="chip"
              onClick={
                useMyLocation
              }
            >
              📍 Use my location
            </button>

            <button
              type="button"
              className="chip"
              onClick={
                findNearby
              }
            >
              🏥 Nearby pharmacies
            </button>

            <label className="radius-select">
              <span>
                Radius
              </span>

              <select
                value={radius}
                onChange={(e) =>
                  setRadius(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
              >
                <option
                  value={
                    1000
                  }
                >
                  1 km
                </option>

                <option
                  value={
                    2000
                  }
                >
                  2 km
                </option>

                <option
                  value={
                    5000
                  }
                >
                  5 km
                </option>

                <option
                  value={
                    10000
                  }
                >
                  10 km
                </option>

                <option
                  value={
                    20000
                  }
                >
                  20 km
                </option>

                <option
                  value={
                    50000
                  }
                >
                  50 km
                </option>
              </select>
            </label>
          </div>

          {/* STATS */}

          <div className="stats">
            <div>
              <strong>
                {
                  safePharmacies.length
                }
              </strong>

              <span>
                on map
              </span>
            </div>

            <div>
              <strong>
                {radius /
                  1000}{' '}
                km
              </strong>

              <span>
                search radius
              </span>
            </div>

            <div>
              <strong>
                24/7
              </strong>

              <span>
                updated
              </span>
            </div>
          </div>
        </div>

        {/* ================= MAP ================= */}

        <div className="hero-map">
          {loading && (
            <div className="map-loading">
              Loading…
            </div>
          )}

          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={
              false
            }
          >
            <Recenter
              center={center}
              radius={radius}
            />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* USER LOCATION */}

            <Marker
              position={
                center
              }
              icon={userIcon}
            >
              <Popup>
                <strong>
                  You are here
                </strong>

                <br />

                (test location)
              </Popup>
            </Marker>

            <Circle
              center={center}
              radius={radius}
              pathOptions={{
                color:
                  '#0f766e',
                fillOpacity:
                  0.05,
              }}
            />

            {/* PHARMACY MARKERS */}

            {safePharmacies.map(
              (pharmacy) => {
                const coords =
                  pharmacy
                    ?.location
                    ?.coordinates;

                if (
                  !Array.isArray(
                    coords
                  ) ||
                  coords.length <
                    2
                ) {
                  return null;
                }

                const [
                  lon,
                  lat,
                ] = coords;

                if (
                  !Number.isFinite(
                    Number(lat)
                  ) ||
                  !Number.isFinite(
                    Number(lon)
                  )
                ) {
                  return null;
                }

                const id =
                  pharmacy._id ||
                  pharmacy.id;

                return (
                  <Marker
                    key={
                      id ||
                      `${lat}-${lon}`
                    }
                    position={[
                      Number(
                        lat
                      ),
                      Number(
                        lon
                      ),
                    ]}
                  >
                    <Popup>
                      <strong>
                        {pharmacy.name ||
                          'Pharmacy'}
                      </strong>

                      <br />

                      {pharmacy.address && (
                        <>
                          {
                            pharmacy.address
                          }

                          <br />
                        </>
                      )}

                      {pharmacy.phone && (
                        <span>
                          📞{' '}
                          {
                            pharmacy.phone
                          }

                          <br />
                        </span>
                      )}

                      {pharmacy.rating && (
                        <span>
                          ⭐{' '}
                          {
                            pharmacy.rating
                          }{' '}
                          (
                          {pharmacy.ratingCount ||
                            0}
                          )
                        </span>
                      )}

                      <br />

                      {id && (
                        <Link
                          to={`/pharmacy/${id}`}
                        >
                          View shop
                          &amp;
                          inventory →
                        </Link>
                      )}

                      {waLink(
                        pharmacy.phone,
                        medicine
                      ) && (
                        <>
                          <br />

                          <a
                            href={waLink(
                              pharmacy.phone,
                              medicine
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            💬 Ask on
                            WhatsApp
                          </a>
                        </>
                      )}

                      {pharmacy.mapsLink && (
                        <>
                          <br />

                          <a
                            href={
                              pharmacy.mapsLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Directions
                            ↗
                          </a>
                        </>
                      )}
                    </Popup>
                  </Marker>
                );
              }
            )}
          </MapContainer>
        </div>
      </section>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="error banner">
          {error}
        </div>
      )}

      {/* ================= RESULTS ================= */}

      <section className="shops">
        <div className="shops-head">
          <h2>
            {medicine.trim()
              ? `Shops stocking "${medicine}"`
              : 'All medical shops'}
          </h2>

          <span className="count-badge">
            {
              safePharmacies.length
            }{' '}
            result
            {safePharmacies.length ===
            1
              ? ''
              : 's'}
          </span>
        </div>

        {safePharmacies.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No pharmacies match
              your search. Try a
              different medicine or
              widen the radius.
            </p>
          </div>
        ) : (
          <div className="shop-grid">
            {safePharmacies
              .slice(0, 30)
              .map(
                (
                  pharmacy
                ) => {
                  const id =
                    pharmacy._id ||
                    pharmacy.id;

                  return (
                    <article
                      key={
                        id ||
                        pharmacy.name
                      }
                      className="shop-card"
                    >
                      {id ? (
                        <Link
                          to={`/pharmacy/${id}`}
                          className="shop-link"
                        >
                          {pharmacy.imageLink ? (
                            <div
                              className="shop-img"
                              style={{
                                backgroundImage: `url(${pharmacy.imageLink})`,
                              }}
                            />
                          ) : (
                            <div className="shop-img placeholder">
                              💊
                            </div>
                          )}
                        </Link>
                      ) : pharmacy.imageLink ? (
                        <div
                          className="shop-img"
                          style={{
                            backgroundImage: `url(${pharmacy.imageLink})`,
                          }}
                        />
                      ) : (
                        <div className="shop-img placeholder">
                          💊
                        </div>
                      )}

                      <div className="shop-body">
                        <div className="shop-top">
                          <h3>
                            {id ? (
                              <Link
                                to={`/pharmacy/${id}`}
                                className="shop-link"
                              >
                                {pharmacy.name ||
                                  'Pharmacy'}
                              </Link>
                            ) : (
                              pharmacy.name ||
                              'Pharmacy'
                            )}
                          </h3>

                          {pharmacy.rating && (
                            <span className="rating-badge">
                              ⭐{' '}
                              {
                                pharmacy.rating
                              }
                            </span>
                          )}
                        </div>

                        {pharmacy.address && (
                          <p className="shop-addr">
                            {
                              pharmacy.address
                            }
                          </p>
                        )}

                        {pharmacy.hours && (
                          <p className="shop-hours">
                            🕒{' '}
                            {
                              pharmacy.hours
                            }
                          </p>
                        )}

                        <div className="shop-actions">
                          {id && (
                            <Link
                              className="btn primary small"
                              to={`/pharmacy/${id}`}
                            >
                              Explore →
                            </Link>
                          )}

                          {waLink(
                            pharmacy.phone,
                            medicine
                          ) && (
                            <a
                              className="btn primary small"
                              style={{
                                background:
                                  '#25D366',
                                borderColor:
                                  '#25D366',
                              }}
                              href={waLink(
                                pharmacy.phone,
                                medicine
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              💬
                              WhatsApp
                            </a>
                          )}

                          {pharmacy.phone && (
                            <a
                              className="btn ghost"
                              href={`tel:${String(
                                pharmacy.phone
                              ).replace(
                                /[^+\d]/g,
                                ''
                              )}`}
                            >
                              📞 Call
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
          </div>
        )}

        {safePharmacies.length >
          30 && (
          <p
            className="muted"
            style={{
              textAlign:
                'center',
              marginTop: 16,
            }}
          >
            Showing first 30 of{' '}
            {
              safePharmacies.length
            }
            . Refine your search
            to narrow.
          </p>
        )}
      </section>

      {/* ================= FEATURES ================= */}

      <section className="features">
        <h2>
          Why Dawa-Find?
        </h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">
              📍
            </div>

            <h3>
              Nearby, always
            </h3>

            <p>
              Auto-detect your
              location and see every
              pharmacy within a
              chosen radius.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              💊
            </div>

            <h3>
              Real-time SKU search
            </h3>

            <p>
              Search by medicine
              name or brand — we
              show which shops
              actually stock it.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              🗺️
            </div>

            <h3>
              One-tap directions
            </h3>

            <p>
              Every pin opens
              directly in Google
              Maps for turn-by-turn
              navigation.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              ⭐
            </div>

            <h3>
              Ratings &amp; hours
            </h3>

            <p>
              Compare open hours
              and ratings before
              you head out.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <Footer />
    </main>
  );
}