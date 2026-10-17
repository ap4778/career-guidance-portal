import { NavLink } from "react-router-dom";
import { LayoutDashboard, Compass, BriefcaseBusiness, FileText, BookOpen, Sun, Moon, LogOut, ShieldCheck, UserRound } from "lucide-react";
import "./Navbar.css";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/guidance", label: "Career guidance", icon: Compass },
  { to: "/jobs", label: "Job portal", icon: BriefcaseBusiness },
  { to: "/resume", label: "Resume builder", icon: FileText },
  { to: "/roadmap", label: "Skills roadmap", icon: BookOpen },
  { to: "/account", label: "Profile settings", icon: UserRound },
];

export default function Navbar({ dark, onThemeToggle, account, onSignOut }) {
  const visibleLinks = account.role === "admin" ? [...links, { to: "/admin", label: "Admin", icon: ShieldCheck }] : links;
  const initials = (account?.name || account?.email || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand-row"><a className="brand" href="/">CareerPath</a><button className="theme-icon-button" type="button" onClick={onThemeToggle} aria-label={dark ? "Use light mode" : "Use dark mode"} title={dark ? "Use light mode" : "Use dark mode"}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
        <nav className="nav-links" aria-label="Main navigation">{visibleLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={16} strokeWidth={2} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-bottom">
          <div className="account-summary"><span className="account-avatar">{initials}</span><span className="account-identity"><strong>{account.name}</strong><small>{account.email || "Account"}</small></span><button className="signout-text" onClick={onSignOut}>Sign out</button></div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Mobile navigation"><a className="mobile-brand" href="/">CareerPath</a>{visibleLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}><Icon size={16} /><span>{label}</span></NavLink>)}<span className="mobile-account-identity"><strong>{account.name}</strong><small>{account.email || "Account"}</small></span><button className="mobile-theme-button" type="button" onClick={onThemeToggle} aria-label={dark ? "Use light mode" : "Use dark mode"}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button className="mobile-signout" onClick={onSignOut}><LogOut size={15} /><span>Sign out</span></button></nav>
    </>
  );
}
