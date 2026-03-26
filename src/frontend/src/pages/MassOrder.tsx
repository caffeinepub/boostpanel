import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Service } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function MassOrder() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["allServices"],
    queryFn: () => actor!.getAllServices(),
    enabled: !!actor && !isFetching,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    const lines = bulkText
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length === 0) return;
    setSubmitting(true);
    let success = 0;
    let failed = 0;
    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length !== 3) {
        failed++;
        continue;
      }
      const [sid, lnk, qty] = parts.map((p) => p.trim());
      try {
        await actor.placeOrder(BigInt(sid), lnk, BigInt(qty));
        success++;
      } catch {
        failed++;
      }
    }
    if (success > 0) toast.success(`${success} order(s) placed successfully!`);
    if (failed > 0) toast.error(`${failed} order(s) failed. Check format.`);
    queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    setSubmitting(false);
    if (failed === 0) setBulkText("");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Mass Order</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Place multiple orders at once.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="bg-secondary/50 border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Format</p>
          <code className="text-xs text-muted-foreground">
            service_id|link|quantity
          </code>
          <p className="text-xs text-muted-foreground mt-1">
            One order per line
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mass-orders"
              className="block text-sm font-medium mb-1.5"
            >
              Orders
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              id="mass-orders"
              placeholder="1|https://instagram.com/p/xxx|1000
2|https://tiktok.com/@user/video/xxx|500"
              rows={8}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <List className="w-4 h-4" />
            {submitting ? "Processing..." : "Submit Orders"}
          </button>
        </form>

        {/* Service IDs reference */}
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Available Service IDs
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 text-muted-foreground">ID</th>
                  <th className="text-left py-1.5 text-muted-foreground">
                    Service
                  </th>
                  <th className="text-right py-1.5 text-muted-foreground">
                    ₹/1k
                  </th>
                  <th className="text-right py-1.5 text-muted-foreground">
                    Min
                  </th>
                  <th className="text-right py-1.5 text-muted-foreground">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id.toString()}>
                    <td className="py-1.5 text-muted-foreground">
                      {s.id.toString()}
                    </td>
                    <td className="py-1.5 max-w-[200px] truncate">{s.name}</td>
                    <td className="py-1.5 text-right">
                      {s.pricePerThousand.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-right">
                      {s.minQuantity.toString()}
                    </td>
                    <td className="py-1.5 text-right">
                      {s.maxQuantity.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
