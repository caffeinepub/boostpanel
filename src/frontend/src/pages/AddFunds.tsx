import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Copy, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

const UPI_ID = "boostpanel@paytm";
const UPI_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(UPI_ID)}%26pn=BoostPanel%26am=0%26cu=INR`;

export default function AddFunds() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [screenshotRef, setScreenshotRef] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store file name as reference; in production this would upload to blob storage
    const ref = `screenshot_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    setScreenshotRef(ref);
    setScreenshotName(file.name);
    toast.success("Screenshot selected!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !utrNumber || !amount || !screenshotRef) return;
    setSubmitting(true);
    try {
      await actor.submitPaymentRequest(
        screenshotRef,
        utrNumber,
        Number(amount),
      );
      toast.success(
        "Payment request submitted! Admin will verify and credit your balance.",
      );
      setUtrNumber("");
      setAmount("");
      setScreenshotRef("");
      setScreenshotName("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["myPayments"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Add Funds</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Pay via UPI and submit proof to get your balance credited.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* QR Card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
          <p className="text-sm font-semibold">Scan QR to Pay</p>
          <div className="bg-white p-2 rounded-xl">
            <img
              src={UPI_QR_URL}
              alt="UPI QR Code"
              className="w-44 h-44 object-contain"
            />
          </div>
          <div className="w-full">
            <p className="text-xs text-muted-foreground mb-1 text-center">
              UPI ID
            </p>
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2">
              <span className="text-sm font-mono flex-1">{UPI_ID}</span>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Pay using Paytm, PhonePe, Google Pay, or any UPI app
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold">Accepted Payment Methods</p>
          <div className="space-y-2">
            {["Paytm", "PhonePe", "Google Pay", "BHIM UPI", "Any UPI App"].map(
              (method) => (
                <div key={method} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{method}</span>
                </div>
              ),
            )}
          </div>
          <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-3">
            <p className="text-xs text-amber-400">
              After payment, fill the form below with your transaction details.
              Balance is credited after admin verification (usually within 1
              hour).
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Submit Payment Proof</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Screenshot upload */}
          <div>
            <label
              htmlFor="screenshot-upload"
              className="block text-sm font-medium mb-1.5"
            >
              Payment Screenshot
            </label>
            <input
              id="screenshot-upload"
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-all ${
                screenshotRef
                  ? "border-green-500 bg-green-900/10"
                  : "border-border hover:border-primary/50 bg-secondary/40"
              }`}
            >
              {screenshotRef ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-sm text-green-400 truncate max-w-full px-4">
                    {screenshotName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click to change
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload screenshot
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP accepted
                  </span>
                </>
              )}
            </button>
          </div>

          {/* UTR */}
          <div>
            <label htmlFor="utr" className="block text-sm font-medium mb-1.5">
              Transaction ID / UTR Number
            </label>
            <input
              id="utr"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 123456789012"
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium mb-1.5"
            >
              Amount Paid (&#x20B9;)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              min={1}
              step="0.01"
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !screenshotRef}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Payment Proof"}
          </button>
        </form>
      </div>
    </div>
  );
}
