export default function GuardrailBanner() {
  return (
    <div className="w-full border border-yellow-600/40 bg-yellow-950/40 text-yellow-300 px-4 py-3 rounded-md text-sm">
      <strong>Governance Guardrail:</strong> Executive signals are read-only and
      derived from the
      <span className="font-semibold">
        {" "}
        Decision Engine — Zero-Formula v1.2 (SSOT)
      </span>
      . Any change requires an approved ADR.
    </div>
  );
}
