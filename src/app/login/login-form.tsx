"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (!values.email || !values.email.includes("@")) {
      setError("email", { message: "Please enter a valid email address" });
      return;
    }
    if (!values.password) {
      setError("password", { message: "Password is required" });
      return;
    }

    const result = await loginAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (field === "email" || field === "password") {
            setError(field, { message: msgs[0] });
          }
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back!");
    const role = result.data.role;

    if (next) {
      router.push(next);
    } else if (role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle size={13} />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle size={13} />
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-11 px-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {/* Demo credentials */}
      <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Demo credentials</p>
        <p>Customer: priya@example.com / Customer@1234</p>
        <p>Admin: admin@shopsphere.dev / Admin@1234</p>
      </div>
    </form>
  );
}
