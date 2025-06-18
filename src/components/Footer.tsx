/* =========================================================================
 *  OneHubDB • Aurora Footer v1.0
 *  Scroll-fade glass footer with breathing Aurora and full nav.
 * ========================================================================= */

import { useEffect, useRef, useState } from "react";
import Aurora from "./Aurora";
import {
  Github,
  Mail,
  Linkedin,
  TerminalSquare,
} from "lucide-react";

export default function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={ref}
      className={`onehub-footer relative border-t border-white/10 backdrop-blur-md bg-white/5 transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      <Aurora />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-4 px-4 py-2">
        {/* Tagline */}
        <p className="text-sm font-medium text-white">
          Don’t just back up. <span className="text-white/90">Know you can restore.</span>
        </p>

        {/* Nav links */}
        <ul className="flex flex-wrap items-center gap-4 text-sm text-white/80">
          <li>
            <a
              href="https://github.com/onehubdb/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link focus-visible:outline-white"
            >
              <TerminalSquare size={14} /> GitHub CLI
            </a>
          </li>
          <li>
            <a
              href="https://github.com/apps/onehubdb"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link focus-visible:outline-white"
            >
              <Github size={14} /> Install App
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/company/onehubdb"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link focus-visible:outline-white"
            >
              <Linkedin size={14} /> LinkedIn
            </a>
          </li>
          <li>
            <a
              href="mailto:contact@onehubdb.com"
              className="footer-link focus-visible:outline-white"
            >
              <Mail size={14} /> Email Us
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
