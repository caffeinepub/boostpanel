import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { OrderRecord } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";

const STATUS_LABELS: Record<OrderStatus, { label: string; className: string }> =
  {
    [OrderStatus.pending]: {
      label: "Pending",
      className: "bg-amber-900/40 text-amber-400 border border-amber-800/50",
    },
    [OrderStatus.processing]: {
      label: "Processing",
      className: "bg-blue-900/40 text-blue-400 border border-blue-800/50",
    },
    [OrderStatus.completed]: {
      label: "Completed",
      className: "bg-green-900/40 text-green-400 border border-green-800/50",
    },
    [OrderStatus.cancelled]: {
      label: "Cancelled",
      className: "bg-red-900/40 text-red-400 border border-red-800/50",
    },
  };

export default function Orders() {
  const { actor, isFetching } = useActor();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const { data: orders = [], isLoading } = useQuery<OrderRecord[]>({
    queryKey: ["myOrders"],
    queryFn: () => actor!.getMyOrders(),
    enabled: !!actor && !isFetching,
  });

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const sorted = [...filtered].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Orders</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Track all your SMM orders.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", ...Object.values(OrderStatus)] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilter(s as typeof filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s as OrderStatus].label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No orders found.</p>
            <Link
              to="/new-order"
              className="text-primary text-sm hover:underline"
            >
              Place your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">
                    Order ID
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">
                    Service
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">
                    Link
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Qty
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Cost
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((order) => (
                  <tr
                    key={order.id.toString()}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      #{order.id.toString()}
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">
                      {order.serviceName}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline max-w-[120px] block truncate text-xs"
                      >
                        {order.link}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.quantity.toString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      ₹{order.cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[order.status]?.className}`}
                      >
                        {STATUS_LABELS[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
