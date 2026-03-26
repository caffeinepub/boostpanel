import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Server,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { OrderRecord } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useGetCallerUserProfile } from "../hooks/useProfile";

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; className: string }> = {
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
  const { label, className } = map[status] ?? map[OrderStatus.pending];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default function Dashboard() {
  const { actor, isFetching } = useActor();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<
    OrderRecord[]
  >({
    queryKey: ["myOrders"],
    queryFn: () => actor!.getMyOrders(),
    enabled: !!actor && !isFetching,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["allServices"],
    queryFn: () => actor!.getAllServices(),
    enabled: !!actor && !isFetching,
  });

  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.processing || o.status === OrderStatus.pending,
  ).length;
  const recentOrders = [...orders]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      label: "Wallet Balance",
      value: profileLoading ? null : `₹${(profile?.balance ?? 0).toFixed(2)}`,
      icon: Wallet,
      action: { label: "Add Funds", to: "/add-funds" },
      color: "text-primary",
    },
    {
      label: "Total Orders",
      value: ordersLoading ? null : totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-green-400",
    },
    {
      label: "Active Orders",
      value: ordersLoading ? null : activeOrders.toString(),
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Services",
      value: services.length.toString(),
      icon: Server,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profileLoading ? "..." : (profile?.username ?? "User")}{" "}
          👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your account.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, action, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {label}
              </span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            {value === null ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
            {action && (
              <Link
                to={action.to}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {action.label} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link
            to="/orders"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {ordersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              No orders yet.{" "}
              <Link to="/new-order" className="text-primary hover:underline">
                Place your first order
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium text-xs">
                    Order ID
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium text-xs">
                    Service
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">
                    Qty
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">
                    Cost
                  </th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id.toString()}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 text-muted-foreground">
                      #{order.id.toString()}
                    </td>
                    <td className="py-2.5 max-w-[180px] truncate">
                      {order.serviceName}
                    </td>
                    <td className="py-2.5 text-right">
                      {order.quantity.toString()}
                    </td>
                    <td className="py-2.5 text-right">
                      ₹{order.cost.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={order.status} />
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
