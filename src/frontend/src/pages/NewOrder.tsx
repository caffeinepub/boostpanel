import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category, Service } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useGetCallerUserProfile } from "../hooks/useProfile";

export default function NewOrder() {
  const { actor, isFetching } = useActor();
  const { data: profile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor && !isFetching,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["allServices"],
    queryFn: () => actor!.getAllServices(),
    enabled: !!actor && !isFetching,
  });

  const [categoryId, setCategoryId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredServices = services.filter(
    (s) => !categoryId || s.categoryId.toString() === categoryId,
  );
  const selectedService = services.find((s) => s.id.toString() === serviceId);
  const cost =
    selectedService && quantity
      ? (Number(quantity) / 1000) * selectedService.pricePerThousand
      : 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: setServiceId is a stable setter
  useEffect(() => {
    setServiceId("");
    // eslint-disable-next-line
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !selectedService || !link || !quantity) return;
    const qty = Number(quantity);
    if (
      qty < Number(selectedService.minQuantity) ||
      qty > Number(selectedService.maxQuantity)
    ) {
      toast.error(
        `Quantity must be between ${selectedService.minQuantity} and ${selectedService.maxQuantity}`,
      );
      return;
    }
    if ((profile?.balance ?? 0) < cost) {
      toast.error("Insufficient balance. Please add funds.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.placeOrder(selectedService.id, link, BigInt(qty));
      toast.success("Order placed successfully!");
      setLink("");
      setQuantity("");
      setServiceId("");
      setCategoryId("");
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-1">New Order</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Place a new social media marketing order.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-1.5"
            >
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label
              htmlFor="service"
              className="block text-sm font-medium mb-1.5"
            >
              Service
            </label>
            <select
              id="service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a service...</option>
              {filteredServices.map((s) => (
                <option key={s.id.toString()} value={s.id.toString()}>
                  {s.name} — ₹{s.pricePerThousand.toFixed(2)}/1k
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="mt-1 text-xs text-muted-foreground">
                Min: {selectedService.minQuantity.toString()} | Max:{" "}
                {selectedService.maxQuantity.toString()} | ₹
                {selectedService.pricePerThousand}/1000
              </p>
            )}
          </div>

          {/* Link */}
          <div>
            <label htmlFor="link" className="block text-sm font-medium mb-1.5">
              Link
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium mb-1.5"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1000"
              min={selectedService ? Number(selectedService.minQuantity) : 1}
              max={
                selectedService
                  ? Number(selectedService.maxQuantity)
                  : undefined
              }
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cost */}
          <div className="bg-secondary/50 border border-border rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Estimated Cost
            </span>
            <span className="text-lg font-bold text-primary">
              ₹{cost.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Balance:{" "}
              <span className="text-foreground font-medium">
                ₹{(profile?.balance ?? 0).toFixed(2)}
              </span>
            </span>
            <button
              type="submit"
              disabled={submitting || !serviceId}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              {submitting ? "Placing..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
