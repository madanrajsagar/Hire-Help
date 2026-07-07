import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="border-t border-black/5 dark:border-white/10 bg-[#f5f5f7] dark:bg-neutral-950 text-neutral-500 dark:text-neutral-500"
      data-testid="site-footer"
    >
      <div className="max-w-[1080px] mx-auto px-6 py-10 text-[12px] leading-relaxed">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-black/5 dark:border-white/10">
          <div>
            <div className="text-neutral-900 dark:text-white font-medium mb-3">Product</div>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:underline">Features</Link></li>
              <li><Link to="/app" className="hover:underline">Launch App</Link></li>
              <li><Link to="/about" className="hover:underline">About</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-neutral-900 dark:text-white font-medium mb-3">For</div>
            <ul className="space-y-2">
              <li>Recruiters</li>
              <li>Founders</li>
              <li>HR teams</li>
              <li>Agencies</li>
            </ul>
          </div>
          <div>
            <div className="text-neutral-900 dark:text-white font-medium mb-3">Technology</div>
            <ul className="space-y-2">
              <li>Semantic search</li>
              <li>Vector embeddings</li>
              <li>JD de-buzzification</li>
              <li>Ranking pipeline</li>
            </ul>
          </div>
          <div>
            <div className="text-neutral-900 dark:text-white font-medium mb-3">Resources</div>
            <ul className="space-y-2">
              <li>Documentation</li>
              <li>Contact</li>
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>Copyright © {new Date().getFullYear()} Hire Help. All rights reserved.</div>
          <div className="flex gap-4">
            <span>Made for hiring teams</span>
            <span>·</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}