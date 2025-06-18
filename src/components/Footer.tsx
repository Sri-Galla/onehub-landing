import Aurora from "./Aurora";

export default function Footer() {
  return (
    <footer className="warp-footer">
      <Aurora />

      <div className="footer-inner">
        <p className="footer-text">
          Don’t just backup. Know if you can restore.
        </p>

        <div className="footer-links">
          <a href="https://github.com/onehubdb/cli" target="_blank" rel="noreferrer">GitHub CLI</a>
          <a href="https://github.com/apps/onehubdb" target="_blank" rel="noreferrer">Install App</a>
          <a href="https://www.linkedin.com/company/onehubdb" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="mailto:founders@onehubdb.com">Email Us</a>
        </div>
      </div>
    </footer>
  );
}
