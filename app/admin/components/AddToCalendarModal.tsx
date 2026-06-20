"use client";

import { useState, useEffect } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface CadenceMetric {
  pillar: string;
  suggestedNextSlots: string[];
  isOverdue: boolean;
  daysSinceLastPost: number | null;
}

interface AddToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (pillar: string, date: string) => Promise<void>;
  availablePillars: string[];
}

const PILLAR_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  "Probabilistic User Research": { bg: "var(--blue-50)", fg: "var(--blue-700)", dot: "var(--blue-600)" },
  "Agentic and Anticipatory UX": { bg: "var(--purple-50)", fg: "var(--purple-700)", dot: "var(--purple-600)" },
  "Research Craft in the AI Era": { bg: "var(--orange-50)", fg: "var(--orange-700)", dot: "var(--orange-600)" },
  "Trust, Verification, and Safe Reliance": { bg: "var(--green-50)", fg: "var(--green-700)", dot: "var(--green-600)" },
  "AI Economics and Value": { bg: "var(--red-50)", fg: "var(--red-700)", dot: "var(--red-600)" },
};

export function AddToCalendarModal({
  isOpen,
  onClose,
  onSchedule,
  availablePillars,
}: AddToCalendarModalProps) {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [cadence, setCadence] = useState<Record<string, CadenceMetric>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCadence();
    }
  }, [isOpen]);

  const fetchCadence = async () => {
    try {
      const res = await fetch("/api/admin/calendar/cadence");
      if (res.ok) {
        const data = await res.json();
        const cadenceMap = data.reduce((acc: Record<string, CadenceMetric>, m: CadenceMetric) => {
          acc[m.pillar] = m;
          return acc;
        }, {});
        setCadence(cadenceMap);
        if (!selectedPillar && availablePillars.length > 0) {
          setSelectedPillar(availablePillars[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch cadence:", err);
    }
  };

  const handleSchedule = async () => {
    if (!selectedPillar || !selectedDate) {
      alert("Please select a pillar and date");
      return;
    }
    setLoading(true);
    try {
      await onSchedule(selectedPillar, selectedDate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMetric = selectedPillar ? cadence[selectedPillar] : null;
  const colors = selectedPillar
    ? PILLAR_COLORS[selectedPillar] || { bg: "var(--orange-50)", fg: "var(--orange-700)", dot: "var(--orange-600)" }
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: "var(--radius-lg)", padding: 32, maxWidth: 600, width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Schedule Content</h2>
          <Btn variant="ghost" icon="x" onClick={onClose}>Close</Btn>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 12, color: "var(--fg-muted)", textTransform: "uppercase" }}>Select Pillar</label>
          <div style={{ display: "grid", gap: 8 }}>
            {availablePillars.map((pillar) => (
              <button key={pillar} onClick={() => setSelectedPillar(pillar)} style={{ padding: 12, border: selectedPillar === pillar ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: "var(--radius-md)", background: selectedPillar === pillar ? "var(--primary-50)" : "var(--surface)", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                {pillar}
              </button>
            ))}
          </div>
        </div>

        {selectedMetric && (
          <div style={{ background: colors?.bg, border: `1px solid ${colors?.dot}`, borderRadius: "var(--radius-md)", padding: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors?.fg, marginBottom: 8 }}>✨ Suggested Slots</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {selectedMetric.suggestedNextSlots.map((slot) => (
                <div key={slot} style={{ fontSize: 11, color: colors?.fg, cursor: "pointer", padding: 6, borderRadius: 4, background: "rgba(255,255,255,0.3)" }} onClick={() => { const dateMatch = slot.match(/(\d{2})\/(\d{2})/); if (dateMatch) { const month = dateMatch[1]; const day = dateMatch[2]; const year = new Date().getFullYear(); setSelectedDate(`${year}-${month}-${day}`); } }}>
                  {slot}
                </div>
              ))}
            </div>
            {selectedMetric.isOverdue && <div style={{ marginTop: 8, padding: 6, background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>⚠️ This pillar is overdue!</div>}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 12, color: "var(--fg-muted)", textTransform: "uppercase" }}>Scheduled Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--fg)", background: "var(--surface)", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={handleSchedule} disabled={!selectedPillar || !selectedDate || loading}>
            {loading ? "Scheduling…" : "Schedule Content"}
          </Btn>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  );
}
