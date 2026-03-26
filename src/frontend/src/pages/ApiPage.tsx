import { CheckCircle, Code, Copy } from "lucide-react";
import { useState } from "react";
import { useGetCallerUserProfile } from "../hooks/useProfile";

export default function ApiPage() {
  const { data: profile } = useGetCallerUserProfile();
  const [copied, setCopied] = useState(false);

  const apiKey = profile?.apiKey ?? "Loading...";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exampleCode = `// Get services
const res = await fetch('https://boostpanel.ic/api/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: '${apiKey}',
    action: 'services'
  })
});

// Add order
const order = await fetch('https://boostpanel.ic/api/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: '${apiKey}',
    action: 'add',
    service: 1,
    link: 'https://instagram.com/p/xxx',
    quantity: 1000
  })
});`;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">API Access</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Integrate BoostPanel into your own applications.
      </p>

      {/* API Key */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-3">Your API Key</h2>
        <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2.5">
          <code className="flex-1 text-sm font-mono truncate text-primary">
            {apiKey}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Keep this key secret. Do not share it publicly.
        </p>
      </div>

      {/* API Endpoint */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-3">API Endpoint</h2>
        <code className="text-sm text-primary bg-secondary px-4 py-2 rounded-xl block">
          POST https://boostpanel.ic/api/v2
        </code>
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h2 className="font-semibold mb-3">Available Actions</h2>
        <div className="space-y-2">
          {[
            { action: "services", desc: "Get list of all services" },
            { action: "add", desc: "Place a new order" },
            { action: "status", desc: "Get order status" },
            { action: "balance", desc: "Get account balance" },
          ].map(({ action, desc }) => (
            <div
              key={action}
              className="flex items-center gap-3 py-2 border-b border-border last:border-0"
            >
              <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {action}
              </code>
              <span className="text-sm text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code example */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Code Example</h2>
        </div>
        <pre className="text-xs bg-secondary rounded-xl p-4 overflow-x-auto text-muted-foreground leading-relaxed">
          <code>{exampleCode}</code>
        </pre>
      </div>
    </div>
  );
}
