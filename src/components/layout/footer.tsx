import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors mb-3"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                <ShoppingBag className="text-primary-foreground" size={14} />
              </div>
              <span className="font-semibold">ShopSphere</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-48">
              Premium products, delivered fast. Your one-stop shop for everything.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Shop</h3>
            <ul className="space-y-2">
              {[
                { href: "/products", label: "All Products" },
                { href: "/products?sort=newest", label: "New Arrivals" },
                { href: "/products?sort=rating", label: "Top Rated" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Account</h3>
            <ul className="space-y-2">
              {[
                { href: "/login", label: "Log In" },
                { href: "/register", label: "Sign Up" },
                { href: "/orders", label: "My Orders" },
                { href: "/cart", label: "Cart" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Legal</h3>
            <ul className="space-y-2">
              {[
                { href: "#", label: "Privacy Policy" },
                { href: "#", label: "Terms of Service" },
                { href: "#", label: "Refund Policy" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ShopSphere. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Portfolio demo — no real transactions are processed.
          </p>
        </div>
      </div>
    </footer>
  );
}
