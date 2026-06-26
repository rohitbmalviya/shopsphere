"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    if (!values.name || values.name.trim().length < 2) {
      setError("name", { message: "Name must be at least 2 characters" });
      return;
    }
    if (!values.email || !values.email.includes("@")) {
      setError("email", { message: "Please enter a valid email address" });
      return;
    }
    if (!values.password || values.password.length < 8) {
      setError("password", { message: "Password must be at least 8 characters" });
      return;
    }

    const result = await registerAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (field === "name" || field === "email" || field === "password") {
            setError(field as keyof RegisterFormValues, { message: msgs[0] });
          }
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success("Account created! Welcome to ShopSphere.");
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Full name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Rahul Sharma"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle size={13} />
            {errors.name.message}
          </p>
        )}
      </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By creating an account you agree to our Terms of Service. This is a portfolio demo.
      </p>
    </form>
  );
}
