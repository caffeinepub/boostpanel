import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Edit, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import type {
  Category,
  OrderRecord,
  PaymentRequest,
  Service,
} from "../backend.d";
import { OrderStatus, PaymentStatus } from "../backend.d";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";

function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { data, isLoading } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !isFetching,
  });
  return { isAdmin: !!data, isLoading };
}

const ORDER_STATUSES = Object.values(OrderStatus);
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-900/40 text-amber-400" },
  processing: {
    label: "Processing",
    className: "bg-blue-900/40 text-blue-400",
  },
  completed: {
    label: "Completed",
    className: "bg-green-900/40 text-green-400",
  },
  cancelled: { label: "Cancelled", className: "bg-red-900/40 text-red-400" },
  approved: { label: "Approved", className: "bg-green-900/40 text-green-400" },
  rejected: { label: "Rejected", className: "bg-red-900/40 text-red-400" },
};

function AdminStats() {
  const { actor, isFetching } = useActor();
  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled: !!actor && !isFetching,
  });
  if (!stats)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: "Total Users", value: stats.totalUsers.toString() },
        { label: "Total Orders", value: stats.totalOrders.toString() },
        { label: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(2)}` },
        { label: "Pending Payments", value: stats.pendingPayments.toString() },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminPayments() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const { data: payments = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ["allPayments"],
    queryFn: () => actor!.getAllPaymentRequests(),
    enabled: !!actor && !isFetching,
  });

  const handleApprove = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.approvePayment(id);
      toast.success("Payment approved!");
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const handleReject = async (id: bigint) => {
    if (!actor) return;
    const note = rejectNote[id.toString()] ?? "";
    try {
      await actor.rejectPayment(id, note);
      toast.success("Payment rejected.");
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {payments.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No payment requests.
        </p>
      )}
      {[...payments]
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .map((p) => (
          <div
            key={p.id.toString()}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Request #{p.id.toString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  UTR: {p.utrNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Amount:{" "}
                  <span className="text-green-400 font-medium">
                    ₹{p.amount.toFixed(2)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Number(p.createdAt) / 1_000_000).toLocaleString()}
                </p>
                {p.adminNote && (
                  <p className="text-xs text-amber-400">Note: {p.adminNote}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[p.status]?.className}`}
                >
                  {STATUS_LABELS[p.status]?.label ?? p.status}
                </span>
              </div>
            </div>
            {p.status === PaymentStatus.pending && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  placeholder="Reject reason (optional)"
                  value={rejectNote[p.id.toString()] ?? ""}
                  onChange={(e) =>
                    setRejectNote((prev) => ({
                      ...prev,
                      [p.id.toString()]: e.target.value,
                    }))
                  }
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => handleApprove(p.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(p.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-900 hover:bg-red-800 text-red-200 rounded-xl text-xs font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function AdminOrders() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<OrderRecord[]>({
    queryKey: ["allOrders"],
    queryFn: () => actor!.getAllOrders(),
    enabled: !!actor && !isFetching,
  });

  const handleStatusChange = async (orderId: bigint, status: OrderStatus) => {
    if (!actor) return;
    try {
      await actor.updateOrderStatus(orderId, status);
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
              ID
            </th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
              Service
            </th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
              Link
            </th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
              Qty
            </th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
              Cost
            </th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {[...orders]
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .map((o) => (
              <tr key={o.id.toString()} className="hover:bg-muted/20">
                <td className="py-2.5 px-3 text-muted-foreground">
                  #{o.id.toString()}
                </td>
                <td className="py-2.5 px-3 max-w-[160px] truncate">
                  {o.serviceName}
                </td>
                <td className="py-2.5 px-3">
                  <a
                    href={o.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs truncate max-w-[100px] block hover:underline"
                  >
                    {o.link}
                  </a>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {o.quantity.toString()}
                </td>
                <td className="py-2.5 px-3 text-right">₹{o.cost.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      handleStatusChange(o.id, e.target.value as OrderStatus)
                    }
                    className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="text-center py-8 text-muted-foreground text-sm">
          No orders yet.
        </p>
      )}
    </div>
  );
}

function AdminServices() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: servicesLoading } = useQuery<
    Service[]
  >({
    queryKey: ["allServicesAdmin"],
    queryFn: () => actor!.getAllServicesAdmin(),
    enabled: !!actor && !isFetching,
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor && !isFetching,
  });

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    pricePerThousand: "",
    minQuantity: "100",
    maxQuantity: "100000",
    isActive: true,
  });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !form.categoryId) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await actor.updateService(
          editId,
          BigInt(form.categoryId),
          form.name,
          form.description,
          Number(form.pricePerThousand),
          BigInt(form.minQuantity),
          BigInt(form.maxQuantity),
          form.isActive,
        );
        toast.success("Service updated!");
      } else {
        await actor.createService(
          BigInt(form.categoryId),
          form.name,
          form.description,
          Number(form.pricePerThousand),
          BigInt(form.minQuantity),
          BigInt(form.maxQuantity),
          form.isActive,
        );
        toast.success("Service created!");
      }
      setForm({
        categoryId: "",
        name: "",
        description: "",
        pricePerThousand: "",
        minQuantity: "100",
        maxQuantity: "100000",
        isActive: true,
      });
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ["allServicesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["allServices"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSaving(false);
  };

  const handleEdit = (s: Service) => {
    setEditId(s.id);
    setForm({
      categoryId: s.categoryId.toString(),
      name: s.name,
      description: s.description,
      pricePerThousand: s.pricePerThousand.toString(),
      minQuantity: s.minQuantity.toString(),
      maxQuantity: s.maxQuantity.toString(),
      isActive: s.isActive,
    });
  };

  const handleDelete = async (id: bigint) => {
    if (!actor || !confirm("Delete this service?")) return;
    try {
      await actor.deleteService(id);
      toast.success("Deleted!");
      queryClient.invalidateQueries({ queryKey: ["allServicesAdmin"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-secondary/40 border border-border rounded-xl p-4">
        <h3 className="font-medium text-sm mb-3">
          {editId !== null ? "Edit Service" : "Add Service"}
        </h3>
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <select
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value }))
            }
            required
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id.toString()} value={c.id.toString()}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Service name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:col-span-2"
          />
          <input
            type="number"
            placeholder="Price per 1000"
            value={form.pricePerThousand}
            onChange={(e) =>
              setForm((f) => ({ ...f, pricePerThousand: e.target.value }))
            }
            required
            min={0}
            step="0.01"
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min qty"
              value={form.minQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, minQuantity: e.target.value }))
              }
              required
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Max qty"
              value={form.maxQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxQuantity: e.target.value }))
              }
              required
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm col-span-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="w-4 h-4 rounded"
            />
            Active
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />{" "}
              {editId !== null ? "Update" : "Create"}
            </button>
            {editId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({
                    categoryId: "",
                    name: "",
                    description: "",
                    pricePerThousand: "",
                    minQuantity: "100",
                    maxQuantity: "100000",
                    isActive: true,
                  });
                }}
                className="px-4 py-2 bg-secondary hover:bg-accent text-muted-foreground rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      {servicesLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
                  ID
                </th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">
                  Name
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
                  ₹/1k
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
                  Active
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s) => (
                <tr key={s.id.toString()} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {s.id.toString()}
                  </td>
                  <td className="py-2.5 px-3">{s.name}</td>
                  <td className="py-2.5 px-3 text-right">
                    {s.pricePerThousand.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}
                    >
                      {s.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(s)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && (
            <p className="text-center py-6 text-muted-foreground text-sm">
              No services yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminCategories() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor && !isFetching,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await actor.updateCategory(editId, name, description);
        toast.success("Category updated!");
      } else {
        await actor.createCategory(name, description);
        toast.success("Category created!");
      }
      setName("");
      setDescription("");
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2">
        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {editId !== null ? "Update" : "Add"}
        </button>
        {editId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setName("");
              setDescription("");
            }}
            className="px-4 py-2 bg-secondary hover:bg-accent rounded-xl text-sm"
          >
            Cancel
          </button>
        )}
      </form>
      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id.toString()}
            className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              {c.description && (
                <p className="text-xs text-muted-foreground">{c.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditId(c.id);
                  setName(c.name);
                  setDescription(c.description);
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!actor || !confirm("Delete?")) return;
                  await actor.deleteCategory(c.id);
                  queryClient.invalidateQueries({ queryKey: ["categories"] });
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center py-4 text-muted-foreground text-sm">
            No categories yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { isAdmin, isLoading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState<
    "stats" | "payments" | "orders" | "services" | "categories"
  >("stats");

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "payments", label: "Payments" },
    { id: "orders", label: "Orders" },
    { id: "services", label: "Services" },
    { id: "categories", label: "Categories" },
  ] as const;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Admin Panel</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Manage the entire platform.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-secondary/40 border border-border rounded-xl p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "stats" && <AdminStats />}
        {activeTab === "payments" && <AdminPayments />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "services" && <AdminServices />}
        {activeTab === "categories" && <AdminCategories />}
      </div>
    </div>
  );
}
