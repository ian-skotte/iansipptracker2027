import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, ChevronRight, RotateCcw, Save } from "lucide-react";

const OUTCOMES = [
  {
    id: "wo1",
    label: "Work Outcome 1",
    title: "Training, Communication & Resource Accuracy",
    weight: 35,
    due: "Jul 31, 2027",
    items: [
      { id: "wo1-1", text: "Review state, higher ed, local education, and local government benefits pages for discrepancies", due: "Ongoing" },
      { id: "wo1-4", text: "Organize 2026 ABC Summer Training, gather feedback, upload virtual videos", due: "Sep 15, 2026" },
      { id: "wo1-8", text: "Evaluate training-development software to replace Articulate; report to leadership", due: "Dec 1, 2026" },
      { id: "wo1-6", text: "Revamp Benefits Orientation videos, ABC Guides, 2027 retirement guide (ADA compliant)", due: "Jan 15, 2027" },
      { id: "wo1-7", text: "Revamp New ABC training materials for 2027 (ADA compliant)", due: "Feb 15, 2027" },
      { id: "wo1-2", text: "Update BA Active retirement recalibration training materials and videos", due: "Apr 1, 2027" },
      { id: "wo1-3", text: "Update BA Active billing recalibration training materials and videos", due: "Apr 1, 2027" },
      { id: "wo1-5", text: "Coordinate 2027 Summer Training for ABCs", due: "Jul 31, 2027" },
      { id: "wo1-9", text: "Complete additional assigned training material or resource work", due: "Ongoing" },
    ],
  },
  {
    id: "wo2",
    label: "Work Outcome 2",
    title: "Agency Outreach & Retention",
    weight: 15,
    due: "Jul 31, 2027",
    items: [
      { id: "wo2-1", text: "Attend bi-weekly outreach meetings", due: "Ongoing" },
      { id: "wo2-2", text: "Flag conferences and engagement opportunities for the Outreach Director", due: "Ongoing" },
      { id: "wo2-3", text: "Support higher ed and state agency engagement; document customer experience feedback", due: "Jul 31, 2027" },
      { id: "wo2-4", text: "Help identify and prioritize at-risk agencies (renewal date, size, risk, affordability)", due: "Ongoing" },
      { id: "wo2-5", text: "Deploy retention outreach protocol for assigned at-risk agencies", due: "May 31, 2027" },
      { id: "wo2-6", text: "Create or revise educational materials for prospective agencies and outreach events", due: "Jul 31, 2027" },
      { id: "wo2-7", text: "Review and summarize customer feedback (ABC survey, Zendesk, Edison, website)", due: "Jul 31, 2027" },
    ],
  },
  {
    id: "wo3",
    label: "Work Outcome 3",
    title: "Forms, Accessibility & Customer Feedback",
    weight: 35,
    due: "Jul 31, 2027",
    items: [
      { id: "wo3-1", text: "Design and maintain Formstack surveys or tools for stakeholder feedback", due: "Ongoing" },
      { id: "wo3-2", text: "Review survey results and web data; recommend content and resource improvements", due: "Ongoing" },
      { id: "wo3-5", text: "Serve as E&O subject-matter expert in CRM planning and evaluation", due: "Dec 31, 2026" },
      { id: "wo3-3", text: "Lead the annual form-update process for assigned Ops and E&O forms", due: "Jul 31, 2027" },
      { id: "wo3-4", text: "Develop and maintain internal and external form-process documentation", due: "Jul 31, 2027" },
    ],
  },
  {
    id: "wo4",
    label: "Work Outcome 4",
    title: "Business Continuity & Knowledge Transfer",
    weight: 10,
    due: "Jul 15, 2027",
    items: [
      { id: "wo4-1", text: "Document or update procedures for assigned critical business functions", due: "Ongoing" },
      { id: "wo4-3", text: "Review and update critical-function documentation as needed during the year", due: "Ongoing" },
      { id: "wo4-2", text: "Complete cross-training on one teammate's critical function and demonstrate it", due: "Jul 15, 2027" },
      { id: "wo4-4", text: "Update documentation based on feedback from cross-training or use", due: "Jul 15, 2027" },
    ],
  },
  {
    id: "wo5",
    label: "Work Outcome 5",
    title: "Professional Development & Continuous Improvement",
    weight: 5,
    due: "Jul 15, 2027",
    items: [
      { id: "wo5-1", text: "Complete annual compliance training (Title VI, Respectful Workplace, Security, HIPAA, FWA)", due: "Jul 15, 2027" },
      { id: "wo5-2", text: "Complete a professional development activity for Customer Focus", due: "Jul 15, 2027" },
      { id: "wo5-3", text: "Complete a professional development activity for Collaborates", due: "Jul 15, 2027" },
      { id: "wo5-4", text: "Complete a professional development activity for Communicates Effectively", due: "Jul 15, 2027" },
      { id: "wo5-5", text: "Independently review one process or recurring work activity for improvement opportunities", due: "Jul 15, 2027" },
      { id: "wo5-6", text: "Communicate review findings and any recommendation to your manager", due: "Jul 15, 2027" },
    ],
  },
];

const TODAY = new Date("2026-09-14");

function parseDue(due) {
  if (due === "Ongoing") return null;
  const d = new Date(due);
  return isNaN(d) ? null : d;
}

function urgency(due, done) {
  if (done || due === "Ongoing") return "none";
  const d = parseDue(due);
  if (!d) return "none";
  const days = Math.round((d - TODAY) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 45) return "soon";
  return "later";
}

const STORAGE_KEY = "ipp-2026-2027-progress";

export default function IPPTracker() {
  const [state, setState] = useState({});
  const [notes, setNotes] = useState({});
  const [openNote, setOpenNote] = useState(null);
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(OUTCOMES.map((o) => [o.id, true]))
  );
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle");

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setState(parsed.done || {});
          setNotes(parsed.notes || {});
        }
      } catch (e) {
        // no saved data yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (done, noteMap) => {
    setSaveState("saving");
    try {
      const result = await window.storage.set(
        STORAGE_KEY,
        JSON.stringify({ done, notes: noteMap }),
        false
      );
      setSaveState(result ? "saved" : "error");
    } catch (e) {
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 1500);
  }, []);

  const toggleItem = (id) => {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persist(next, notes);
      return next;
    });
  };

  const updateNote = (id, text) => {
    setNotes((prev) => {
      const next = { ...prev, [id]: text };
      return next;
    });
  };

  const commitNote = (id) => {
    persist(state, notes);
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetAll = async () => {
    setState({});
    setNotes({});
    await persist({}, {});
  };

  const totalItems = OUTCOMES.reduce((sum, o) => sum + o.items.length, 0);
  const doneItems = Object.values(state).filter(Boolean).length;
  const weightedPct = Math.round(
    OUTCOMES.reduce((sum, o) => {
      const doneCount = o.items.filter((it) => state[it.id]).length;
      const frac = o.items.length ? doneCount / o.items.length : 0;
      return sum + frac * o.weight;
    }, 0)
  );

  if (!loaded) {
    return (
      <div style={{ padding: "2rem", color: "#6B6B5F", fontFamily: "IBM Plex Sans, sans-serif" }}>
        Loading your progress…
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#EDEFE6",
        color: "#1C2620",
        fontFamily: "'IBM Plex Sans', sans-serif",
        minHeight: "100%",
        padding: "2rem 1.25rem 4rem",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap');
        .ipp-num { font-variant-numeric: tabular-nums; }
        .ipp-check {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 1.5px solid #8A8A76;
          border-radius: 4px;
          background: #F7F7EF;
          cursor: pointer;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.12s, border-color 0.12s;
        }
        .ipp-check:checked {
          background: #2F5D52;
          border-color: #2F5D52;
        }
        .ipp-note-input {
          width: 100%;
          border: 1px solid #C9C7B4;
          border-radius: 4px;
          background: #F7F7EF;
          padding: 6px 8px;
          font-size: 13px;
          font-family: 'IBM Plex Sans', sans-serif;
          color: #1C2620;
          resize: vertical;
          min-height: 44px;
        }
        .ipp-note-input:focus {
          outline: none;
          border-color: #2F5D52;
        }
        .ipp-row-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: inherit;
          font: inherit;
          text-align: left;
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontWeight: 600,
              fontSize: 26,
              margin: "0 0 4px",
              letterSpacing: "-0.01em",
            }}
          >
            IPP tracker
          </h1>
          <p style={{ fontSize: 13, color: "#5B5B4E", margin: 0 }}>
            2026&ndash;2027 performance cycle &middot; reviewed through Jul 31, 2027
          </p>
        </div>

        <div
          style={{
            background: "#F7F7EF",
            border: "1px solid #DAD8C4",
            borderRadius: 8,
            padding: "1.1rem 1.25rem",
            marginBottom: "1.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#5B5B4E" }}>Overall completion</span>
            <span className="ipp-num" style={{ fontSize: 22, fontWeight: 600 }}>
              {weightedPct}%
            </span>
          </div>
          <div style={{ height: 8, background: "#E2E0CE", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${weightedPct}%`,
                background: "#2F5D52",
                borderRadius: 4,
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#7A7A6A" }}>
            <span className="ipp-num">{doneItems} of {totalItems} items complete</span>
            <span>weighted by outcome</span>
          </div>
        </div>

        {OUTCOMES.map((outcome) => {
          const doneCount = outcome.items.filter((it) => state[it.id]).length;
          const isOpen = expanded[outcome.id];
          return (
            <div
              key={outcome.id}
              style={{
                marginBottom: 14,
                background: "#F7F7EF",
                border: "1px solid #DAD8C4",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <button
                className="ipp-row-btn"
                onClick={() => toggleExpanded(outcome.id)}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown size={16} color="#7A7A6A" style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={16} color="#7A7A6A" style={{ flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#A9762D", fontWeight: 500 }}>
                      {outcome.label} &middot; {outcome.weight}%
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginTop: 1 }}>{outcome.title}</div>
                </div>
                <div className="ipp-num" style={{ fontSize: 13, color: "#5B5B4E", flexShrink: 0 }}>
                  {doneCount}/{outcome.items.length}
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid #E2E0CE" }}>
                  {outcome.items.map((item) => {
                    const done = !!state[item.id];
                    const urg = urgency(item.due, done);
                    const noteOpen = openNote === item.id;
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.65rem 1rem",
                          borderBottom: "1px solid #ECEBDD",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <input
                            type="checkbox"
                            className="ipp-check"
                            checked={done}
                            onChange={() => toggleItem(item.id)}
                            style={{ marginTop: 1 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                lineHeight: 1.45,
                                color: done ? "#8A8A76" : "#1C2620",
                                textDecoration: done ? "line-through" : "none",
                              }}
                            >
                              {item.text}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  padding: "1px 7px",
                                  borderRadius: 10,
                                  background:
                                    urg === "overdue" ? "#F0997B33" : urg === "soon" ? "#FAC77533" : "#E2E0CE",
                                  color: urg === "overdue" ? "#993C1D" : urg === "soon" ? "#7A5209" : "#6B6B5A",
                                }}
                              >
                                {item.due}
                              </span>
                              <button
                                className="ipp-row-btn"
                                onClick={() => setOpenNote(noteOpen ? null : item.id)}
                                style={{ fontSize: 11, color: "#5B5B4E", textDecoration: "underline" }}
                              >
                                {notes[item.id] ? "edit note" : "add note"}
                              </button>
                            </div>
                            {noteOpen && (
                              <textarea
                                className="ipp-note-input"
                                style={{ marginTop: 6 }}
                                placeholder="Evidence, status, or a reminder for later"
                                value={notes[item.id] || ""}
                                onChange={(e) => updateNote(item.id, e.target.value)}
                                onBlur={() => commitNote(item.id)}
                              />
                            )}
                            {!noteOpen && notes[item.id] && (
                              <div style={{ fontSize: 12, color: "#7A7A6A", marginTop: 4, fontStyle: "italic" }}>
                                {notes[item.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <button
            onClick={resetAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid #C9C7B4",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              color: "#5B5B4E",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            Reset all progress
          </button>
          <div style={{ fontSize: 12, color: "#8A8A76", display: "flex", alignItems: "center", gap: 5 }}>
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && (
              <>
                <Save size={12} /> Saved
              </>
            )}
            {saveState === "error" && "Couldn't save"}
          </div>
        </div>
      </div>
    </div>
  );
}
