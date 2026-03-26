import { useQuery } from "@tanstack/react-query";
import { Search, Server } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Category, Service } from "../backend.d";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";

export default function Services() {
  const { actor, isFetching } = useActor();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: services = [], isLoading: servicesLoading } = useQuery<
    Service[]
  >({
    queryKey: ["allServices"],
    queryFn: () => actor!.getAllServices(),
    enabled: !!actor && !isFetching,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor && !isFetching,
  });

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "all" || s.categoryId.toString() === categoryFilter;
    return matchSearch && matchCat;
  });

  const getCategoryName = (catId: bigint) =>
    categories.find((c) => c.id === catId)?.name ?? "Unknown";

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Services</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Browse all available SMM services.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id.toString()} value={c.id.toString()}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {servicesLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Server className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No services found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">
                    Service
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    ₹/1000
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Min
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Max
                  </th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr
                    key={s.id.toString()}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.id.toString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {getCategoryName(s.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      ₹{s.pricePerThousand.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {s.minQuantity.toString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {s.maxQuantity.toString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/new-order?service=${s.id}`}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        Order
                      </Link>
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
