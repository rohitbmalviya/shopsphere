"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { placeOrder } from "@/lib/actions/orders";
import { AlertCircle, CreditCard, Smartphone, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutFormValues {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPincode: string;
  provider: "mock-stripe" | "mock-razorpay";
}

const PAYMENT_OPTIONS = [
  {
    value: "mock-stripe" as const,
    label: "Mock Stripe",
    description: "Credit / Debit Card",
    detail: "Card ending in 4242",
    icon: CreditCard,
  },
  {
    value: "mock-razorpay" as const,
    label: "Mock Razorpay",
    description: "UPI / Net Banking",
    detail: "UPI: demo@razorpay",
    icon: Smartphone,
  },
];

export function CheckoutForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      shippingName: "",
      shippingAddress: "",
      shippingCity: "",
      shippingPincode: "",
      provider: "mock-stripe",
    },
  });

  const selectedProvider = watch("provider");

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await placeOrder({
        shippingName: values.shippingName,
        shippingAddress: values.shippingAddress,
        shippingCity: values.shippingCity,
        shippingPincode: values.shippingPincode,
        provider: values.provider,
      });

      if (!result.success) {
        toast.error(result.error);
        if (result.error.includes("Pincode")) {
          setError("shippingPincode", { message: result.error });
        }
        return;
      }

      toast.success("Order placed successfully!");
      router.push(`/orders/${result.data.orderId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Shipping Details */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="shippingName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shippingName"
              type="text"
              autoComplete="name"
              placeholder="Rahul Sharma"
              aria-required="true"
              aria-invalid={!!errors.shippingName}
              aria-describedby={errors.shippingName ? "name-error" : undefined}
              {...register("shippingName", {
                required: "Full name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
              })}
            />
            {errors.shippingName && (
              <p id="name-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle size={13} />
                {errors.shippingName.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="shippingAddress">
              Address Line 1 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shippingAddress"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main Street, Apartment 4B"
              aria-required="true"
              aria-invalid={!!errors.shippingAddress}
              aria-describedby={errors.shippingAddress ? "address-error" : undefined}
              {...register("shippingAddress", {
                required: "Address is required",
                minLength: { value: 5, message: "Please enter a complete address" },
              })}
            />
            {errors.shippingAddress && (
              <p id="address-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle size={13} />
                {errors.shippingAddress.message}
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label htmlFor="shippingCity">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shippingCity"
              type="text"
              autoComplete="address-level2"
              placeholder="Mumbai"
              aria-required="true"
              aria-invalid={!!errors.shippingCity}
              aria-describedby={errors.shippingCity ? "city-error" : undefined}
              {...register("shippingCity", {
                required: "City is required",
                minLength: { value: 2, message: "Please enter a valid city" },
              })}
            />
            {errors.shippingCity && (
              <p id="city-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle size={13} />
                {errors.shippingCity.message}
              </p>
            )}
          </div>

          {/* Pincode */}
          <div className="space-y-1.5">
            <Label htmlFor="shippingPincode">
              Pincode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shippingPincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="400001"
              maxLength={6}
              aria-required="true"
              aria-invalid={!!errors.shippingPincode}
              aria-describedby={errors.shippingPincode ? "pincode-error" : undefined}
              {...register("shippingPincode", {
                required: "Pincode is required",
                pattern: { value: /^\d{6}$/, message: "Pincode must be 6 digits" },
              })}
            />
            {errors.shippingPincode && (
              <p id="pincode-error" className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle size={13} />
                {errors.shippingPincode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Payment Method */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAYMENT_OPTIONS.map(({ value, label, description, detail, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("provider", value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedProvider === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
              aria-pressed={selectedProvider === value}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                selectedProvider === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground mt-0.5 italic">{detail}</p>
              </div>
              {selectedProvider === value && (
                <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 10 10" width="8" height="8" fill="white">
                    <path d="M1.5 5l2.5 2.5L8.5 2.5" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("provider")} />

        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <ShieldCheck size={12} className="text-primary" />
          Mock payment — no real card details needed. This is a portfolio demo.
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          "Place Order"
        )}
      </Button>
    </form>
  );
}
