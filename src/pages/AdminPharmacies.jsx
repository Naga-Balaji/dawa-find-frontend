import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const TABS = ['pending', 'verified', 'rejected', 'unverified'];

const TAB_LABELS = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

const TAB_ICONS = {
  pending: '⏳',
  verified: '✓',
  rejected: '✕',
  unverified: '⚠',
};

export default function AdminPharmacies() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/admin/pharmacies?status=${tab}`),
      api.get('/admin/metrics'),
    ])
      .then(([list, m]) => {
        setItems(list.data.items || []);
        setMetrics(m.data);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            'Unable to load admin data.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  // =========================================================
  // VERIFY / REJECT PHARMACY
  // =========================================================
  const decide = async (id, decision) => {
    let reason;

    if (decision === 'rejected') {
      reason =
        window.prompt(
          'Enter the reason for rejecting this pharmacy application:'
        ) || 'Not specified';
    }

    setBusyId(id);
    setError('');

    try {
      await api.patch(`/admin/pharmacies/${id}/verify`, {
        decision,
        reason,
      });

      await load();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Unable to update pharmacy verification status.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = metrics?.pharmacies?.pending || 0;
  const verifiedCount = metrics?.pharmacies?.verified || 0;
  const rejectedCount = metrics?.pharmacies?.rejected || 0;
  const unverifiedCount = metrics?.pharmacies?.unverified || 0;
  const totalCount = metrics?.pharmacies?.total || 0;

  const freshnessPercent = metrics?.freshness?.percentFresh || 0;
  const activeShops = metrics?.freshness?.shopsActiveLast24h || 0;

  const verificationRate =
    totalCount > 0
      ? Math.round((verifiedCount / totalCount) * 100)
      : 0;

  const attentionCount = pendingCount + unverifiedCount;

  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* ================= HEADER ================= */}
        <section className="admin-header">
          <div className="admin-header-left">
            <div className="admin-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span>Admin Dashboard</span>
            </div>

            <div className="admin-title-row">
              <div className="admin-title-icon">
                🛡️
              </div>

              <div>
                <h1>Admin Dashboard</h1>

                <p>
                  Monitor pharmacy verification, partner registrations,
                  and platform activity.
                </p>
              </div>
            </div>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={load}
            disabled={loading}
          >
            <span className={loading ? 'refresh-spin' : ''}>
              ↻
            </span>

            {loading
              ? 'Refreshing...'
              : 'Refresh Dashboard'}
          </button>
        </section>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="admin-alert admin-alert-error">
            <span className="admin-alert-icon">
              ⚠
            </span>

            <div>
              <strong>
                Something went wrong
              </strong>

              <p>{error}</p>
            </div>

            <button
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* ================= PHARMACY OVERVIEW ================= */}
        <section className="admin-section">

          <div className="admin-section-heading">
            <div>
              <span className="admin-section-label">
                PLATFORM MONITORING
              </span>

              <h2>
                Pharmacy Overview
              </h2>

              <p>
                Current verification status of registered pharmacies.
              </p>
            </div>
          </div>

          <div className="admin-stat-grid">

            {/* TOTAL */}
            <div className="admin-stat-card total">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  🏪
                </div>

                <span className="admin-stat-label">
                  Total Pharmacies
                </span>
              </div>

              <strong>{totalCount}</strong>

              <span className="admin-stat-description">
                All pharmacy records
              </span>
            </div>

            {/* PENDING */}
            <div className="admin-stat-card pending">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  ⏳
                </div>

                <span className="admin-stat-label">
                  Pending Requests
                </span>
              </div>

              <strong>{pendingCount}</strong>

              <span className="admin-stat-description">
                Waiting for review
              </span>
            </div>

            {/* UNVERIFIED */}
            <div className="admin-stat-card unverified">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  ⚠
                </div>

                <span className="admin-stat-label">
                  Unverified
                </span>
              </div>

              <strong>{unverifiedCount}</strong>

              <span className="admin-stat-description">
                Not verified yet
              </span>
            </div>

            {/* VERIFIED */}
            <div className="admin-stat-card verified">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  ✓
                </div>

                <span className="admin-stat-label">
                  Verified Pharmacies
                </span>
              </div>

              <strong>{verifiedCount}</strong>

              <span className="admin-stat-description">
                Approved partners
              </span>
            </div>

            {/* REJECTED */}
            <div className="admin-stat-card rejected">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  ✕
                </div>

                <span className="admin-stat-label">
                  Rejected
                </span>
              </div>

              <strong>{rejectedCount}</strong>

              <span className="admin-stat-description">
                Rejected applications
              </span>
            </div>

          </div>

          {/* ================= HEALTH METRICS ================= */}
          <div className="admin-health-grid">

            <div className="admin-health-card">
              <div className="health-icon blue">
                📊
              </div>

              <div className="health-content">
                <span>
                  Verification Rate
                </span>

                <strong>
                  {verificationRate}%
                </strong>

                <p>
                  Verified / total pharmacies
                </p>
              </div>

              <div className="health-progress">
                <div
                  style={{
                    width: `${verificationRate}%`,
                  }}
                />
              </div>
            </div>

            <div className="admin-health-card">
              <div className="health-icon purple">
                🚨
              </div>

              <div className="health-content">
                <span>
                  Needs Attention
                </span>

                <strong>
                  {attentionCount}
                </strong>

                <p>
                  Pending + unverified
                </p>
              </div>
            </div>

            <div className="admin-health-card">
              <div className="health-icon green">
                🟢
              </div>

              <div className="health-content">
                <span>
                  Active Shops
                </span>

                <strong>
                  {activeShops}
                </strong>

                <p>
                  Updated inventory recently
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================= INVENTORY HEALTH ================= */}
        <section className="admin-section">

          <div className="admin-section-heading">
            <div>
              <span className="admin-section-label">
                INVENTORY MONITORING
              </span>

              <h2>
                Inventory Health
              </h2>

              <p>
                Freshness of pharmacy inventory data.
              </p>
            </div>
          </div>

          <div className="inventory-health-card">

            <div className="inventory-health-main">

              <div className="inventory-health-icon">
                📦
              </div>

              <div>
                <span>
                  Inventory Freshness
                </span>

                <strong>
                  {freshnessPercent}%
                </strong>

                <p>
                  Inventory rows updated within the last 24 hours
                </p>
              </div>

            </div>

            <div className="inventory-progress-wrapper">

              <div className="inventory-progress">
                <div
                  style={{
                    width: `${freshnessPercent}%`,
                  }}
                />
              </div>

              <div className="inventory-progress-labels">
                <span>0%</span>

                <strong>
                  {freshnessPercent}% fresh
                </strong>

                <span>100%</span>
              </div>

            </div>

            <div className="inventory-summary">

              <div>
                <strong>
                  {metrics?.freshness?.rowsUpdatedLast24h || 0}
                </strong>

                <span>
                  Rows updated recently
                </span>
              </div>

              <div>
                <strong>
                  {metrics?.freshness?.totalRows || 0}
                </strong>

                <span>
                  Total inventory rows
                </span>
              </div>

            </div>

          </div>
        </section>

        {/* ================= VERIFICATION QUEUE ================= */}
        <section className="admin-section">

          <div className="verification-header">

            <div>
              <span className="admin-section-label">
                PHARMACY MANAGEMENT
              </span>

              <h2>
                Pharmacy Verification
              </h2>

              <p>
                Review pharmacy licence information and approve or reject
                partner applications.
              </p>
            </div>

            <div className="verification-count">
              <strong>
                {items.length}
              </strong>

              <span>
                {TAB_LABELS[tab]} records
              </span>
            </div>

          </div>

          {/* ================= FILTER TABS ================= */}
          <div className="admin-tabs">

            {TABS.map((t) => (
              <button
                key={t}
                className={`admin-tab ${
                  tab === t ? 'active' : ''
                }`}
                onClick={() => setTab(t)}
              >

                <span className="admin-tab-icon">
                  {TAB_ICONS[t]}
                </span>

                <span>
                  {TAB_LABELS[t]}
                </span>

                {metrics?.pharmacies?.[t] !== undefined && (
                  <b>
                    {metrics.pharmacies[t]}
                  </b>
                )}

              </button>
            ))}

          </div>

          {/* ================= TABLE ================= */}
          <div className="admin-table-wrapper">

            {loading ? (
              <div className="admin-loading">

                <div className="admin-spinner" />

                <p>
                  Loading pharmacy records...
                </p>

              </div>

            ) : items.length === 0 ? (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  ✓
                </div>

                <h3>
                  No {TAB_LABELS[tab].toLowerCase()} pharmacies
                </h3>

                <p>
                  There are currently no pharmacy records in this category.
                </p>

              </div>

            ) : (

              <table className="admin-table">

                <thead>

                  <tr>
                    <th>Pharmacy</th>
                    <th>Owner</th>
                    <th>Licence</th>
                    <th>Source</th>
                    <th>Status</th>

                    {/* REJECTION REASON COLUMN */}
                    {tab === 'rejected' && (
                      <th>
                        Rejection Reason
                      </th>
                    )}

                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {items.map((p) => (

                    <tr key={p._id}>

                      {/* ================= PHARMACY ================= */}
                      <td>

                        <div className="admin-pharmacy-cell">

                          <div className="pharmacy-avatar">
                            🏪
                          </div>

                          <div>

                            <Link
                              to={`/pharmacy/${p._id}`}
                              className="admin-pharmacy-name"
                            >
                              {p.name}
                            </Link>

                            <span className="admin-pharmacy-address">
                              {p.address || 'Address not available'}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* ================= OWNER ================= */}
                      <td>

                        {p.owner ? (

                          <div className="admin-owner">

                            <strong>
                              {p.owner.name || 'Unknown'}
                            </strong>

                            <span>
                              {p.owner.email || 'No email'}
                            </span>

                          </div>

                        ) : (

                          <span className="admin-muted">
                            —
                          </span>

                        )}

                      </td>

                      {/* ================= LICENCE ================= */}
                      <td>

                        <span className="admin-license">
                          {p.licenceNo || 'Not provided'}
                        </span>

                      </td>

                      {/* ================= SOURCE ================= */}
                      <td>

                        <span className="admin-source">
                          {p.source || 'Unknown'}
                        </span>

                      </td>

                      {/* ================= STATUS ================= */}
                      <td>

                        <span
                          className={`admin-status ${
                            p.verificationStatus || 'unverified'
                          }`}
                        >

                          <span>
                            {p.verificationStatus === 'verified'
                              ? '✓'
                              : p.verificationStatus === 'rejected'
                              ? '✕'
                              : p.verificationStatus === 'pending'
                              ? '⏳'
                              : '⚠'}
                          </span>

                          {p.verificationStatus || 'unverified'}

                        </span>

                      </td>

                      {/* ================= REJECTION REASON ================= */}
                      {tab === 'rejected' && (

                        <td>

                          <div className="admin-rejection-reason">

                            {p.rejectionReason ||
                              'No reason provided'}

                          </div>

                        </td>

                      )}

                      {/* ================= ACTIONS ================= */}
                      <td>

                        <div className="admin-actions">

                          {p.verificationStatus !== 'verified' && (

                            <button
                              className="admin-action-btn verify"
                              disabled={busyId === p._id}
                              onClick={() =>
                                decide(p._id, 'verified')
                              }
                            >
                              {busyId === p._id
                                ? '...'
                                : '✓ Verify'}
                            </button>

                          )}

                          {p.verificationStatus !== 'rejected' && (

                            <button
                              className="admin-action-btn reject"
                              disabled={busyId === p._id}
                              onClick={() =>
                                decide(p._id, 'rejected')
                              }
                            >
                              {busyId === p._id
                                ? '...'
                                : '✕ Reject'}
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </div>
    </main>
  );
}