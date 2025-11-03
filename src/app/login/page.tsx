import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "./login-form";
import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <ShoppingBag className="text-primary-foreground" size={18} />
            </div>
            <span className="font-semibold text-xl tracking-tight">ShopSphere</span>
          </div>

          <h1 className="text-2xl font-semibold text-center tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
            Sign in to your account to continue
          </p>

          <LoginForm next={next} />

          <Separator className="my-5" />

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
