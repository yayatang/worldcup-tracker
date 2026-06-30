"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/rankings", label: "Rankings" },
  { href: "/bracket", label: "Bracket" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="bg-neutral-900 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 h-14">
        <span className="text-xl mr-4 select-none">⚽</span>
        <span className="font-bold text-sm text-neutral-200 mr-6 hidden sm:block">
          World Cup 2026
        </span>
        <nav className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-green-700 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
