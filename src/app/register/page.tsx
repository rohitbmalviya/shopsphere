import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { RegisterForm } from "./register-form";
import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <ShoppingBag className="text-primary-foreground" size={18} />
            </div>
            <span className="font-semibold text-xl tracking-tight">ShopSphere</span>
          </div>

          <h1 className="text-2xl font-semibold text-center tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
            Join ShopSphere and start shopping today
          </p>

          <RegisterForm />

          <Separator className="my-5" />

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
