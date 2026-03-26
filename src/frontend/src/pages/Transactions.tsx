import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { Transaction } from "../backend.d";
import { TransactionType } from "../backend.d";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";

export default function Transactions() {
  const { actor, isFetching } = useActor();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["myTransactions"],
    queryFn: () => actor!.getMyTransactions(),
    enabled: !!actor && !isFetching,
  });

  const sorted = [...transactions].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Transaction History</h1>
      <p className="text-muted-foreground text-sm mb-6">
        All credits and debits on your account.
      </p>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowUpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((tx) => (
              <div
                key={tx.id.toString()}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  {tx.transactionType === TransactionType.credit ? (
                    <ArrowDownCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(tx.createdAt) / 1_000_000,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    tx.transactionType === TransactionType.credit
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {tx.transactionType === TransactionType.credit ? "+" : "-"}₹
                  {tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
