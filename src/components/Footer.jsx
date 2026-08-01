import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      {/* Emergency strip — real problem-solver: this is *the* moment users need us */}
      <div className="emergency-strip">
        <div className="emergency-inner">
          <div className="emergency-title">
            <span className="pulse-dot" /> Medical emergency?
          </div>
          <div className="emergency-nums">
            <a href="tel:108"><strong>108</strong> Ambulance</a>
            <a href="tel:1066"><strong>1066</strong> Poison Control</a>
            <a href="tel:104"><strong>104</strong> Health Helpline</a>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="footer-main">
        <div className="footer-col brand-col">
          <Logo size={40} />
          <p className="tag">
            Vijayawada's fastest way to find medicines. Real-time stock,
            real prices, real directions — no calling six shops.
          </p>
          <div className="trust-row">
            <span>✓ 200+ verified pharmacies</span>
            <span>✓ Data refreshed daily</span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="/">Find medicine</a></li>
            <li><a href="/">Nearby pharmacies</a></li>
            <li><a href="/">Price comparison</a></li>
            <li><a href="/">Coming: Prescription upload</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>For users</h4>
          <ul>
            <li><a href="/register">Create account</a></li>
            <li><a href="/login">Sign in</a></li>
            <li><a href="/">Save favourite shops</a></li>
            <li><a href="/">Help & FAQ</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>For pharmacies</h4>
          <ul>
            <li><a href="/">List your shop</a></li>
            <li><a href="/">Partner dashboard</a></li>
            <li><a href="/">Update inventory</a></li>
            <li><a href="/">Pricing</a></li>
          </ul>
        </div>

        <div className="footer-col newsletter-col">
          <h4>Stock alerts</h4>
          <p className="small">Get an email when a scarce medicine comes back in stock nearby.</p>
          <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="you@email.com" required />
            <button className="btn primary small" type="submit">Notify me</button>
          </form>
          <div className="socials">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="Instagram">◐</a>
            <a href="#" aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Dawa-Find · Made in Vijayawada with 🩺</span>
        <div className="legal">
          <a href="/">Privacy</a>
          <a href="/">Terms</a>
          <a href="/">Disclaimer</a>
        </div>
      </div>
      <p className="disclaimer">
        Dawa-Find is a directory service. Always consult a qualified doctor
        before purchasing prescription medicines. Stock and prices are
        indicative and may vary in-store.
      </p>
    </footer>
  );
}
