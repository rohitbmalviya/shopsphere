"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Home,
  Package,
  Grid3x3,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";

interface MobileNavProps {
  user: SessionUser | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
                <ShoppingBag className="text-primary-foreground" size={14} />
              </div>
              ShopSphere
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4 mt-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Home size={16} />
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Grid3x3 size={16} />
              Products
            </Link>

            {user && (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Package size={16} />
                    My Orders
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="px-4 mt-6 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{user.name}</span>
                </div>
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <LogOut size={14} />
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <Button variant="default" className="w-full">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
