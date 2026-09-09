import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';
import { getToken } from '../auth.js';
import './Prescription.css';

const TEST_USER_LOCATION = [16.5045, 80.6540];

const MAX_EDGE = 1600;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const CONFIDENCE_LABEL = {
  high: 'Clear',
  medium: 'Fairly clear',
  low: 'Hard to read',
};

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'file') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </svg>
    );
  }

  if (name === 'upload') {
    return (
      <svg {...common}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === 'location') {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.8 2.9 8.6 7 10 4.1-1.4 7-5.2 7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === 'trash') {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  if (name === 'phone') {
    return (
      <svg {...common}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === 'warning') {
    return (
      <svg {...common}>
        <path d="m10.3 3.3-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === 'refresh') {
    return (
      <svg {...common}>
        <path d="M20 11a8.1 8.1 0 0 0-14.9-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 14.9 4L21 14" />
        <path d="M21 19v-5h-5" />
      </svg>
    );
  }

  return null;
}

function compress(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Please select a prescription image.'));
      return;
    }

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowed.includes(file.type)) {
      reject(
        new Error(
          'Please upload a JPG, PNG or WebP image.'
        )
      );
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      reject(
        new Error(
          'The image is larger than 8 MB. Please choose a smaller image.'
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(
        new Error(
          'Could not read the selected file.'
        )
      );

    reader.onload = () => {
      const img = new Image();

      img.onerror = () =>
        reject(
          new Error(
            'That file is not a readable image.'
          )
        );

      img.onload = () => {
        const scale = Math.min(
          1,
          MAX_EDGE /
            Math.max(
              img.width,
              img.height
            )
        );

        const canvas =
          document.createElement('canvas');

        canvas.width = Math.max(
          1,
          Math.round(
            img.width * scale
          )
        );

        canvas.height = Math.max(
          1,
          Math.round(
            img.height * scale
          )
        );

        const context =
          canvas.getContext('2d');

        if (!context) {
          reject(
            new Error(
              'Could not process the image.'
            )
          );
          return;
        }

        context.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(
          canvas.toDataURL(
            'image/jpeg',
            0.85
          )
        );
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   MEDICINE RESULT CARD
   ========================================================= */

function MedicineCard({
  item,
  patientAge,
}) {
  const {
    prescribed = {},
    catalog = [],
    offers = [],
    bestPrice,
    availableNearby,
  } = item || {};

  const best = catalog[0];

  const confidence =
    prescribed.confidence ||
    'medium';

  const unreadable =
    prescribed.name ===
      'Unable to read' ||
    !prescribed.name;

  const dosageUnreadable =
    !prescribed.dosage;

  const safetyInfo =
    Array.isArray(
      prescribed.safetyInfo
    )
      ? prescribed.safetyInfo
      : [];

  const ageCaution =
    prescribed.ageCaution || {
      needsReview: false,
      message: null,
    };

  return (
    <article className="rx2-medicine-card">

      {/* CARD TOP */}

      <div className="rx2-medicine-top">
        <div className="rx2-medicine-number">
          <span>
            Prescription medicine
          </span>
        </div>

        <span
          className={`rx2-confidence ${confidence}`}
        >
          {CONFIDENCE_LABEL[
            confidence
          ] || confidence}
        </span>
      </div>

      {/* MEDICINE NAME */}

      <div className="rx2-medicine-title-row">
        <div>
          <h3>
            {unreadable
              ? 'Unable to read'
              : prescribed.name}
          </h3>

          {prescribed.brand &&
            !unreadable && (
              <p className="rx2-brand">
                Brand written:{' '}
                <strong>
                  {prescribed.brand}
                </strong>
              </p>
            )}
        </div>

        {prescribed.strength &&
          !unreadable && (
            <span className="rx2-strength">
              {prescribed.strength}
            </span>
          )}
      </div>

      {/* UNREADABLE MEDICINE */}

      {unreadable && (
        <div className="rx2-unmatched">
          <div className="rx2-unmatched-icon">
            <Icon
              name="warning"
              size={20}
            />
          </div>

          <div>
            <strong>
              Unable to read
            </strong>

            <p>
              The handwriting for this
              medicine is not clear enough
              to identify it reliably.
              Please check the original
              prescription or ask a
              pharmacist.
            </p>
          </div>
        </div>
      )}

      {/* PRESCRIBED DETAILS */}

      {!unreadable && (
        <div className="rx2-details">

          {prescribed.form && (
            <div className="rx2-detail">
              <span className="rx2-detail-label">
                Form
              </span>

              <strong>
                {prescribed.form}
              </strong>
            </div>
          )}

          <div className="rx2-detail">
            <span className="rx2-detail-label">
              Dosage
            </span>

            <strong>
              {prescribed.dosage ||
                'Unable to read'}
            </strong>
          </div>

          {prescribed.duration && (
            <div className="rx2-detail">
              <span className="rx2-detail-label">
                Duration
              </span>

              <strong>
                {prescribed.duration}
              </strong>
            </div>
          )}

          {prescribed.quantity && (
            <div className="rx2-detail">
              <span className="rx2-detail-label">
                Quantity
              </span>

              <strong>
                {prescribed.quantity}
              </strong>
            </div>
          )}

        </div>
      )}

      {/* DOSAGE UNREADABLE WARNING */}

      {!unreadable &&
        dosageUnreadable && (
          <div className="rx2-unmatched">

            <div className="rx2-unmatched-icon">
              <Icon
                name="warning"
                size={20}
              />
            </div>

            <div>
              <strong>
                Unable to read the dosage
              </strong>

              <p>
                The dosage instructions
                could not be read
                confidently from the
                prescription. Please
                verify the original
                prescription before using
                the medicine.
              </p>
            </div>

          </div>
        )}

      {/* =====================================================
          AGE / HIGH-DOSE ALERT
          ===================================================== */}

      {!unreadable &&
        ageCaution.needsReview && (
          <div className="rx2-disclaimer">

            <div className="rx2-disclaimer-icon">
              <Icon
                name="warning"
                size={19}
              />
            </div>

            <div>
              <strong>
                Age / dose review recommended
              </strong>

              <p>
                This medicine or its dosage
                needs additional review for
                a patient aged{' '}
                <strong>
                  {patientAge} years
                </strong>
                . The scan alone cannot
                determine whether the dose is
                appropriate.
              </p>

              {ageCaution.message && (
                <p
                  style={{
                    marginTop: '6px',
                  }}
                >
                  {ageCaution.message}
                </p>
              )}

              <p
                style={{
                  marginTop: '6px',
                  fontWeight: 600,
                }}
              >
                Confirm the medicine name and
                prescribed dose with a
                pharmacist or doctor.
              </p>
            </div>

          </div>
        )}

      {/* =====================================================
          MEDICINE SAFETY INFORMATION
          ===================================================== */}

      {!unreadable &&
        safetyInfo.length > 0 && (
          <div className="rx2-notes">

            <div className="rx2-notes-icon">
              <Icon
                name="shield"
                size={18}
              />
            </div>

            <div>
              <strong>
                Medicine safety information
              </strong>

              <ul>
                {safetyInfo.map(
                  (
                    message,
                    index
                  ) => (
                    <li key={index}>
                      {message}
                    </li>
                  )
                )}
              </ul>
            </div>

          </div>
        )}

      {/* =====================================================
          CATALOGUE MATCH
          ===================================================== */}

      {!unreadable && best ? (
        <div className="rx2-match">

          <div className="rx2-match-header">

            <div>
              <span className="rx2-section-eyebrow">
                Catalogue match
              </span>

              <h4>
                {best.name}
              </h4>

              {best.brand && (
                <p>
                  {best.brand}
                </p>
              )}
            </div>

            {best.prescriptionRequired && (
              <span className="rx2-rx-badge">
                Prescription required
              </span>
            )}

          </div>

          {best.description && (
            <p className="rx2-description">
              {best.description}
            </p>
          )}

          {/* PRICE */}

          <div className="rx2-price-area">

            <div>
              <span className="rx2-price-label">
                {bestPrice != null
                  ? 'Best nearby price'
                  : 'Catalogue MRP'}
              </span>

              <div className="rx2-price">
                ₹
                {bestPrice ??
                  best.mrp ??
                  '—'}

                {bestPrice != null &&
                  best.mrp != null &&
                  bestPrice <
                    best.mrp && (
                    <span>
                      MRP ₹{best.mrp}
                    </span>
                  )}
              </div>
            </div>

            <div
              className={`rx2-stock ${
                availableNearby
                  ? 'available'
                  : 'unavailable'
              }`}
            >
              <span className="rx2-stock-dot" />

              {availableNearby
                ? `${availableNearby} nearby ${
                    availableNearby === 1
                      ? 'pharmacy'
                      : 'pharmacies'
                  }`
                : 'No nearby stock'}
            </div>

          </div>

          {/* PHARMACY LIST */}

          {offers.length > 0 && (
            <div className="rx2-pharmacies">

              <div className="rx2-pharmacy-heading">
                Nearby pharmacies
              </div>

              {offers
                .slice(0, 4)
                .map((offer) => {
                  const pharmacy =
                    offer.pharmacy;

                  if (!pharmacy) {
                    return null;
                  }

                  return (
                    <div
                      className="rx2-pharmacy"
                      key={`${offer.sku}-${pharmacy._id}`}
                    >

                      <div className="rx2-pharmacy-info">

                        <Link
                          to={`/pharmacy/${pharmacy._id}`}
                        >
                          {pharmacy.name}
                        </Link>

                        <span>
                          {offer.price != null
                            ? `₹${offer.price}`
                            : 'Price unavailable'}
                        </span>

                      </div>

                      {pharmacy.phone && (
                        <a
                          className="rx2-call"
                          href={`tel:${pharmacy.phone.replace(
                            /[^+\d]/g,
                            ''
                          )}`}
                        >
                          <Icon
                            name="phone"
                            size={15}
                          />

                          Call
                        </a>
                      )}

                    </div>
                  );
                })}

            </div>
          )}

        </div>
      ) : !unreadable ? (
        <div className="rx2-unmatched">

          <div className="rx2-unmatched-icon">
            <Icon
              name="search"
              size={20}
            />
          </div>

          <div>
            <strong>
              Not found in our catalogue
            </strong>

            <p>
              We could read this medicine,
              but could not match it to a
              listed Dawa-Find medicine.
              Ask a nearby pharmacy for
              assistance.
            </p>
          </div>

        </div>
      ) : null}

    </article>
  );
}

/* =========================================================
   EMPTY RESULTS
   ========================================================= */

function EmptyResults() {
  return (
    <div className="rx2-empty">

      <div className="rx2-empty-icon">
        <Icon
          name="file"
          size={34}
        />
      </div>

      <h3>
        Your prescription results
        will appear here
      </h3>

      <p>
        Upload a clear prescription
        image, enter the patient's
        age, and scan it to identify
        medicines and check nearby
        availability.
      </p>

      <div className="rx2-feature-list">

        <div>
          <Icon
            name="check"
            size={17}
          />
          <span>
            Medicine identification
          </span>
        </div>

        <div>
          <Icon
            name="check"
            size={17}
          />
          <span>
            Age safety review
          </span>
        </div>

        <div>
          <Icon
            name="check"
            size={17}
          />
          <span>
            Nearby stock
          </span>
        </div>

        <div>
          <Icon
            name="check"
            size={17}
          />
          <span>
            Pharmacy prices
          </span>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function Prescription() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [preview, setPreview] =
    useState('');

  const [fileName, setFileName] =
    useState('');

  const [
    patientAge,
    setPatientAge,
  ] = useState('');

  const [center, setCenter] =
    useState(
      TEST_USER_LOCATION
    );

  const [radius, setRadius] =
    useState(5000);

  const [loading, setLoading] =
    useState(false);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [result, setResult] =
    useState(null);

  const signedIn =
    Boolean(getToken());

  /* =======================================================
     FILE
     ======================================================= */

  const pickFile = async (
    file
  ) => {
    if (!file) return;

    setError('');
    setResult(null);

    try {
      const compressed =
        await compress(file);

      setPreview(compressed);
      setFileName(file.name);
    } catch (e) {
      setError(e.message);
    }
  };

  const onDrop = async (
    event
  ) => {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer
        .files?.[0];

    await pickFile(file);
  };

  /* =======================================================
     ANALYSE
     ======================================================= */

  const analyse = async () => {
    if (!signedIn) {
      navigate('/login');
      return;
    }

    if (!preview) {
      setError(
        'Please upload your prescription first.'
      );
      return;
    }

    const age =
      Number(patientAge);

    if (
      patientAge === '' ||
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      setError(
        'Please enter a valid patient age between 0 and 120.'
      );
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const [lat, lon] =
        center;

      const response =
        await api.post(
          '/ai/prescription',
          {
            image: preview,
            age,
            lat,
            lon,
            radius,
          }
        );

      setResult(
        response.data
      );
    } catch (e) {
      setError(
        e.response?.data
          ?.message ||
          e.message ||
          'Could not analyse the prescription.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     RESET
     ======================================================= */

  const reset = () => {
    setPreview('');
    setFileName('');
    setPatientAge('');
    setResult(null);
    setError('');

    if (fileRef.current) {
      fileRef.current.value =
        '';
    }
  };

  const ageWarningCount =
    result?.ageWarnings || 0;

  const unreadableCount =
    result?.unreadableCount ||
    0;

  const verification =
    result?.verification || null;

  const visualReview =
    verification?.visualReview || null;

  const minimaxReview =
    verification?.minimaxReview || null;

  const integrity =
    verification?.integrity || null;

  const verificationStatus =
    verification?.status ||
    (visualReview?.classification === 'needs_manual_review'
      ? 'manual_review'
      : visualReview?.classification === 'likely_clinical_document'
        ? 'no_obvious_concerns'
        : 'unable_to_determine');

  const verificationLabel =
    verification?.label ||
    (verificationStatus === 'manual_review'
      ? 'Manual review recommended'
      : verificationStatus === 'no_obvious_concerns'
        ? 'No obvious visual concerns detected'
        : 'Unable to verify from image alone');

  const verificationTone =
    verificationStatus === 'manual_review'
      ? 'warning'
      : verificationStatus === 'no_obvious_concerns'
        ? 'good'
        : 'neutral';

  const resultPatientAge =
    result?.patient?.age ?? patientAge;

  const fingerprint =
    integrity?.hash
      ? `${integrity.hash.slice(0, 12)}…${integrity.hash.slice(-12)}`
      : null;

  /* =======================================================
     UI
     ======================================================= */

  return (
    <main className="rx2-page">

      <section className="rx2-container">

        {/* HEADER */}

        <header className="rx2-header">

          <div className="rx2-ai-badge">
            <span className="rx2-ai-dot" />
            AI Prescription Scanner
          </div>

          <h1>
            Understand your
            prescription.
            <span>
              {' '}Find medicines nearby.
            </span>
          </h1>

          <p>
            Upload a prescription
            and Dawa-Find will identify
            readable medicines, review
            age-related cautions, and
            search nearby pharmacies
            for stock and prices.
          </p>

        </header>

        {/* STEPS */}

        <div className="rx2-steps">

          <div className="rx2-step active">
            <span>1</span>

            <div>
              <strong>
                Upload
              </strong>

              <small>
                Prescription photo
              </small>
            </div>
          </div>

          <div className="rx2-step-line" />

          <div className="rx2-step">
            <span>2</span>

            <div>
              <strong>
                Patient details
              </strong>

              <small>
                Age for safety checks
              </small>
            </div>
          </div>

          <div className="rx2-step-line" />

          <div className="rx2-step">
            <span>3</span>

            <div>
              <strong>
                Find medicines
              </strong>

              <small>
                Stock & prices
              </small>
            </div>
          </div>

        </div>

        {/* MAIN */}

        <div className="rx2-layout">

          {/* LEFT */}

          <div className="rx2-left">

            {/* UPLOAD */}

            <section className="rx2-panel">

              <div className="rx2-panel-heading">

                <div className="rx2-heading-icon">
                  <Icon
                    name="file"
                    size={21}
                  />
                </div>

                <div>
                  <h2>
                    Upload prescription
                  </h2>

                  <p>
                    Use a clear photo of
                    the complete
                    prescription.
                  </p>
                </div>

              </div>

              <div
                className={`rx2-dropzone ${
                  preview
                    ? 'has-preview'
                    : ''
                } ${
                  dragging
                    ? 'dragging'
                    : ''
                }`}
                onDragOver={(
                  event
                ) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() =>
                  setDragging(false)
                }
                onDrop={onDrop}
                onClick={() =>
                  !preview &&
                  fileRef.current?.click()
                }
              >

                {preview ? (
                  <div className="rx2-preview">

                    <img
                      src={preview}
                      alt="Prescription preview"
                    />

                    <div className="rx2-preview-overlay">
                      <button
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          fileRef.current?.click();
                        }}
                      >
                        Change image
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="rx2-upload-content">

                    <div className="rx2-upload-icon">
                      <Icon
                        name="upload"
                        size={30}
                      />
                    </div>

                    <h3>
                      Drop your
                      prescription here
                    </h3>

                    <p>
                      or click to choose
                      an image
                    </p>

                    <span>
                      JPG, PNG or WebP
                      {' · '}
                      Max 8 MB
                    </span>

                    <button
                      type="button"
                      className="rx2-browse"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        fileRef.current?.click();
                      }}
                    >
                      Choose prescription
                    </button>

                  </div>
                )}

              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(
                  event
                ) =>
                  pickFile(
                    event.target
                      .files?.[0]
                  )
                }
              />

              {fileName && (
                <div className="rx2-file-row">

                  <div className="rx2-file-info">

                    <div className="rx2-file-icon">
                      <Icon
                        name="file"
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        {fileName}
                      </strong>

                      <span>
                        Ready to scan
                      </span>
                    </div>

                  </div>

                  <button
                    type="button"
                    className="rx2-remove"
                    onClick={reset}
                    aria-label="Remove prescription"
                  >
                    <Icon
                      name="trash"
                      size={17}
                    />
                  </button>

                </div>
              )}

            </section>

            {/* PATIENT AGE */}

            <section className="rx2-panel">

              <div className="rx2-panel-heading">

                <div className="rx2-heading-icon purple">
                  <Icon
                    name="user"
                    size={21}
                  />
                </div>

                <div>
                  <h2>
                    Patient details
                  </h2>

                  <p>
                    Age helps identify
                    medicines that may
                    require additional
                    dosage attention.
                  </p>
                </div>

              </div>

              <div className="rx2-age-box">

                <label htmlFor="patient-age">
                  Patient age
                  <span>*</span>
                </label>

                <div className="rx2-age-input">

                  <input
                    id="patient-age"
                    type="number"
                    min="0"
                    max="120"
                    value={patientAge}
                    onChange={(
                      event
                    ) => {
                      setPatientAge(
                        event.target
                          .value
                      );

                      setError('');
                    }}
                    placeholder="Enter age"
                  />

                  <span>
                    years
                  </span>

                </div>

                <p>
                  Age is used only to
                  highlight medicines
                  that may need
                  additional
                  professional dosage
                  verification.
                </p>

              </div>

            </section>

            {/* LOCATION */}

            <section className="rx2-panel rx2-location-panel">

              <div className="rx2-location-row">

                <div className="rx2-heading-icon green">
                  <Icon
                    name="location"
                    size={21}
                  />
                </div>

                <div className="rx2-location-content">

                  <h2>
                    Nearby pharmacies
                  </h2>

                  <p>
                    Choose how far you'd
                    like us to search.
                  </p>

                  <div className="rx2-location-controls">

                    <button
                      type="button"
                      className="rx2-location-button"
                      onClick={() =>
                        setCenter(
                          TEST_USER_LOCATION
                        )
                      }
                    >
                      <Icon
                        name="location"
                        size={16}
                      />

                      Use my location
                    </button>

                    <label className="rx2-radius">

                      <span>
                        Within
                      </span>

                      <select
                        value={radius}
                        onChange={(
                          event
                        ) =>
                          setRadius(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                      >
                        <option value={1000}>
                          1 km
                        </option>

                        <option value={2000}>
                          2 km
                        </option>

                        <option value={5000}>
                          5 km
                        </option>

                        <option value={10000}>
                          10 km
                        </option>

                        <option value={20000}>
                          20 km
                        </option>
                      </select>

                    </label>

                  </div>

                </div>

              </div>

            </section>

            {/* SCAN */}

            <button
              type="button"
              className="rx2-scan-button"
              onClick={analyse}
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="rx2-spinner" />

                  Reading prescription...
                </>
              ) : (
                <>
                  <span className="rx2-scan-sparkle">
                    ✦
                  </span>

                  {signedIn
                    ? 'Scan prescription'
                    : 'Sign in to scan'}

                  <Icon
                    name="arrow"
                    size={20}
                  />
                </>
              )}

            </button>

            {!signedIn && (
              <p className="rx2-login-note">
                Scanning requires an
                account.
                <Link to="/login">
                  {' '}Sign in
                </Link>
                {' '}or
                <Link to="/register">
                  {' '}create one
                </Link>
                .
              </p>
            )}

            {/* PRIVACY */}

            <div className="rx2-privacy">

              <div className="rx2-privacy-icon">
                <Icon
                  name="shield"
                  size={19}
                />
              </div>

              <div>
                <strong>
                  Your privacy matters
                </strong>

                <p>
                  Your prescription image is
                  processed for analysis.
                  Avoid uploading unrelated
                  personal information and
                  review the original
                  prescription before acting
                  on scanned results.
                </p>
              </div>

            </div>

          </div>

          {/* ===================================================
              RIGHT RESULTS
              =================================================== */}

          <div className="rx2-results">

            {/* ERROR */}

            {error && (
              <div className="rx2-error">

                <div>
                  <Icon
                    name="warning"
                    size={20}
                  />
                </div>

                <div>
                  <strong>
                    Something went wrong
                  </strong>

                  <p>
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setError('')
                  }
                >
                  ×
                </button>

              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="rx2-loading">

                <div className="rx2-loading-icon">
                  <span className="rx2-loading-pulse" />

                  <Icon
                    name="search"
                    size={27}
                  />
                </div>

                <h2>
                  Reading your
                  prescription
                </h2>

                <p>
                  We're reading the
                  handwriting, checking
                  safety information,
                  matching medicines and
                  looking for nearby
                  stock.
                </p>

                <div className="rx2-loading-steps">

                  <div>
                    <span className="rx2-loader-dot active" />
                    Reading prescription
                  </div>

                  <div>
                    <span className="rx2-loader-dot" />
                    Checking age safety
                  </div>

                  <div>
                    <span className="rx2-loader-dot" />
                    Finding pharmacies
                  </div>

                </div>

              </div>
            )}

            {!loading &&
              !result &&
              !error && (
                <EmptyResults />
              )}

            {/* RESULTS */}

            {!loading &&
              result && (
                <div className="rx2-result-content">

                  {/* HEADER */}

                  <div className="rx2-result-header">

                    <div>

                      <div className="rx2-success-label">
                        <span>
                          <Icon
                            name="check"
                            size={14}
                          />
                        </span>

                        Prescription scanned
                      </div>

                      <h2>
                        Medicine results
                      </h2>

                      {(result
                        .prescription
                        ?.doctorName ||
                        result
                          .prescription
                          ?.clinicName ||
                        result
                          .prescription
                          ?.date) && (
                        <p>
                          {result
                            .prescription
                            .doctorName &&
                            `${
                              /^dr\.?\s/i.test(result.prescription.doctorName)
                                ? result.prescription.doctorName
                                : `Dr. ${result.prescription.doctorName}`
                            }`}

                          {result
                            .prescription
                            .clinicName &&
                            ` · ${result.prescription.clinicName}`}

                          {result
                            .prescription
                            .date &&
                            ` · ${result.prescription.date}`}
                        </p>
                      )}

                    </div>

                    <button
                      type="button"
                      className="rx2-new-scan"
                      onClick={reset}
                    >
                      <Icon
                        name="refresh"
                        size={16}
                      />

                      New scan
                    </button>

                  </div>

                  {/* SUMMARY */}

                  <div className="rx2-summary">

                    <div className="rx2-summary-item">
                      <span className="rx2-summary-value">
                        {result.items
                          ?.length ||
                          0}
                      </span>

                      <span className="rx2-summary-label">
                        Medicines found
                      </span>
                    </div>

                    <div className="rx2-summary-divider" />

                    <div className="rx2-summary-item">
                      <span className="rx2-summary-value">
                        ₹
                        {result.estimatedTotal ??
                          '—'}
                      </span>

                      <span className="rx2-summary-label">
                        Estimated total
                      </span>
                    </div>

                    <div className="rx2-summary-divider" />

                    <div className="rx2-summary-item">
                      <span className="rx2-summary-value">
                        {ageWarningCount}
                      </span>

                      <span className="rx2-summary-label">
                        Safety alerts
                      </span>
                    </div>

                  </div>

                  {/* DOCUMENT REVIEW */}

                  {verification && (
                    <section
                      className={`rx2-verification ${verificationTone}`}
                    >
                      <div className="rx2-verification-head">
                        <div
                          className={`rx2-verification-icon ${verificationTone}`}
                        >
                          <Icon
                            name={
                              verificationTone === 'good'
                                ? 'shield'
                                : 'warning'
                            }
                            size={20}
                          />
                        </div>

                        <div className="rx2-verification-title">
                          <span>
                            Prescription document review
                          </span>

                          <h3>
                            {verificationLabel}
                          </h3>

                          <p>
                            Image review can flag visual
                            concerns, but it cannot prove
                            who issued a prescription or
                            whether it was AI-generated.
                          </p>
                        </div>
                      </div>

                      {(visualReview?.signals?.length > 0 ||
                        visualReview?.digitalManipulationSignals?.length > 0) && (
                        <div className="rx2-verification-grid">
                          {visualReview?.signals?.length > 0 && (
                            <div className="rx2-review-box">
                              <strong>
                                Visual observations
                              </strong>

                              <ul>
                                {visualReview.signals.map(
                                  (signal, index) => (
                                    <li key={`visual-${index}`}>
                                      {signal}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {visualReview?.digitalManipulationSignals?.length > 0 && (
                            <div className="rx2-review-box warning">
                              <strong>
                                Items to review
                              </strong>

                              <ul>
                                {visualReview.digitalManipulationSignals.map(
                                  (signal, index) => (
                                    <li key={`manipulation-${index}`}>
                                      {signal}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {minimaxReview?.available && (
                        <div className="rx2-secondary-review">
                          <div>
                            <span>
                              Independent text review
                            </span>

                            <strong>
                              {minimaxReview.assessment === 'review_recommended'
                                ? 'Review recommended'
                                : minimaxReview.assessment === 'consistent'
                                  ? 'No major contradiction detected'
                                  : 'Insufficient information'}
                            </strong>
                          </div>

                          {minimaxReview.reasons?.length > 0 && (
                            <ul>
                              {minimaxReview.reasons.map(
                                (reason, index) => (
                                  <li key={`minimax-${index}`}>
                                    {reason}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )}

                      {fingerprint && (
                        <div className="rx2-fingerprint">
                          <div>
                            <span>
                              Upload fingerprint (SHA-256)
                            </span>

                            <code title={integrity.hash}>
                              {fingerprint}
                            </code>
                          </div>

                          <p>
                            This fingerprint identifies
                            the exact uploaded image
                            bytes. It does not prove
                            doctor or clinic authenticity.
                          </p>
                        </div>
                      )}
                    </section>
                  )}

                  {/* AGE */}

                  <div className="rx2-age-result">

                    <div className="rx2-age-result-icon">
                      <Icon
                        name="user"
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Patient age:{' '}
                        {resultPatientAge}{' '}
                        years
                      </strong>

                      <span>
                        Used for
                        additional
                        age-related
                        dosage review.
                      </span>
                    </div>

                  </div>

                  {/* GLOBAL WARNING SUMMARY */}

                  {ageWarningCount >
                    0 && (
                    <div className="rx2-disclaimer">

                      <div className="rx2-disclaimer-icon">
                        <Icon
                          name="warning"
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          {ageWarningCount}{' '}
                          medicine
                          {ageWarningCount ===
                          1
                            ? ''
                            : 's'}{' '}
                          need additional
                          attention
                        </strong>

                        <p>
                          Dawa-Find found
                          possible
                          age-related
                          dosage cautions.
                          Review the
                          highlighted
                          medicine cards
                          below.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* UNREADABLE SUMMARY */}

                  {unreadableCount >
                    0 && (
                    <div className="rx2-unmatched">

                      <div className="rx2-unmatched-icon">
                        <Icon
                          name="warning"
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          Some handwriting
                          could not be read
                          confidently
                        </strong>

                        <p>
                          {unreadableCount}{' '}
                          result
                          {unreadableCount ===
                          1
                            ? ''
                            : 's'}{' '}
                          require checking
                          against the
                          original
                          prescription.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* MEDICINES */}

                  <div className="rx2-medicine-list">

                    {result.items?.map(
                      (
                        item,
                        index
                      ) => (
                        <MedicineCard
                          key={`${
                            item
                              .prescribed
                              ?.name ||
                            'medicine'
                          }-${index}`}
                          item={item}
                          patientAge={
                            resultPatientAge
                          }
                        />
                      )
                    )}

                  </div>

                  {/* PRESCRIPTION NOTES */}

                  {result
                    .prescription
                    ?.notes
                    ?.length >
                    0 && (
                    <div className="rx2-notes">

                      <div className="rx2-notes-icon">
                        <Icon
                          name="file"
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          Other
                          instructions
                          on the
                          prescription
                        </strong>

                        <ul>
                          {result.prescription.notes.map(
                            (
                              note,
                              index
                            ) => (
                              <li
                                key={
                                  index
                                }
                              >
                                {note}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                    </div>
                  )}

                  {/* DISCLAIMER */}

                  {result.disclaimer && (
                    <div className="rx2-disclaimer">

                      <div className="rx2-disclaimer-icon">
                        <Icon
                          name="warning"
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          Important
                        </strong>

                        <p>
                          {
                            result.disclaimer
                          }
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              )}

          </div>

        </div>

      </section>

      <Footer />

    </main>
  );
}
