import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle,
  ShieldWarning,
} from "@phosphor-icons/react";
import { api } from "../services/api";

const navItems = [
  { label: "Overview", path: "/" },
  { label: "Agents", path: "/agents" },
  { label: "Demo", path: "/demo-lab" },
  { label: "Analytics", path: "/analytics" },
  { label: "Audit", path: "/audit" },
  { label: "System", path: "/system" },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const checkChain = async () => {
    try {
      setChainValid((await api.getDemoStatus()).audit_chain_valid);
    } catch {
      setChainValid(false);
    }
  };
  useEffect(() => {
    checkChain();
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const fn = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", fn);
    if (open) closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-4 md:pt-5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full bg-surface/95 px-3 shadow-[0_18px_60px_rgba(55,67,63,0.12)] ring-1 ring-ink/[0.07] backdrop-blur-xl md:px-5">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-full pr-2 text-ink"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal font-serif text-xl font-semibold text-surface">
              T
            </span>
            <span className="hidden leading-none sm:block">
              <strong className="block font-serif text-xl">TrustLine</strong>
              <small className="mt-1 block font-mono text-[8px] uppercase tracking-[.17em] text-muted-ink">
                Agent credit infrastructure
              </small>
            </span>
          </Link>
          <nav
            className="hidden items-center gap-1 xl:flex"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-3 py-2 text-sm font-medium ${location.pathname === item.path ? "bg-teal-light text-teal-dark" : "text-muted-ink hover:bg-canvas hover:text-ink"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={checkChain}
              title="Verify audit chain"
              className={`hidden min-h-10 items-center gap-2 rounded-full px-3 font-mono text-[10px] font-semibold sm:flex ${chainValid === false ? "bg-danger-light text-danger" : "bg-canvas text-teal-dark"}`}
            >
              {chainValid === false ? (
                <ShieldWarning size={16} weight="light" />
              ) : (
                <CheckCircle size={16} weight="light" />
              )}
              {chainValid === null
                ? "CHECKING"
                : chainValid
                  ? "CHAIN VALID"
                  : "CHAIN BROKEN"}
            </button>
            <Link
              to="/presentation"
              className="btn-primary hidden min-h-10 px-4 md:inline-flex"
            >
              Present{" "}
              <span className="icon-island h-7 w-7">
                <ArrowUpRight size={15} />
              </span>
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface xl:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <span className="absolute h-px w-5 -translate-y-1.5 bg-current" />
              <span className="absolute h-px w-5 translate-y-1.5 bg-current" />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[60] bg-canvas/95 p-5 backdrop-blur-2xl xl:hidden">
          <div className="mx-auto flex h-full max-w-xl flex-col">
            <div className="flex items-center justify-between">
              <span className="font-serif text-3xl font-semibold">
                TrustLine
              </span>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                className="relative h-12 w-12 rounded-full bg-ink text-surface"
                aria-label="Close menu"
              >
                <span className="absolute left-3 top-1/2 h-px w-6 rotate-45 bg-current" />
                <span className="absolute left-3 top-1/2 h-px w-6 -rotate-45 bg-current" />
              </button>
            </div>
            <nav className="stagger my-auto grid gap-2">
              {[
                ...navItems,
                { label: "Presentation mode", path: "/presentation" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="border-b border-ink/10 py-4 font-serif text-4xl font-medium text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="font-mono text-xs text-muted-ink">
              Autonomous Agent Credit Infrastructure
            </p>
          </div>
        </div>
      )}
    </>
  );
};
