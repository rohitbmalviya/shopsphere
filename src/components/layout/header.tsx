import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth";
import { getCart } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, ShoppingCart, LogOut, Package, LayoutDashboard } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const [user, cart] = await Promise.all([
    getCurrentUser(),
    getCart(),
  ]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <ShoppingBag className="text-primary-foreground" size={17} />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              ShopSphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" size="sm">
                Products
              </Button>
            </Link>
          </nav>

          {/* Desktop Auth + Cart */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cart icon */}
            <Link href="/cart" aria-label={`Cart, ${cart.itemCount} items`}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart size={20} />
                {cart.itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-0 flex items-center justify-center"
                  >
                    {cart.itemCount > 99 ? "99+" : cart.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-32 truncate">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "ADMIN" ? (
                    <DropdownMenuItem>
                      <Link href="/admin" className="flex items-center gap-2 w-full">
                        <LayoutDashboard size={14} />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem>
                      <Link href="/orders" className="flex items-center gap-2 w-full">
                        <Package size={14} />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex items-center gap-2 w-full text-left text-destructive"
                      >
                        <LogOut size={14} />
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Link href="/cart" aria-label={`Cart, ${cart.itemCount} items`}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart size={20} />
                {cart.itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-0 flex items-center justify-center">
                    {cart.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
