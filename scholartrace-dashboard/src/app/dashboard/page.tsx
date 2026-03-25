"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getProfessor, logout, getStudents, getStudentLogs } from "@/lib/api";

interface LogSnapshot {
  _id: string;
  studentEmail: string;
  timestamp: string;
  filename: string;
  content: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [professor, setProfessor] = useState<{ name: string; email: string } | null>(null);
  const [students, setStudents] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<LogSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<LogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = getToken();
    const prof = getProfessor();
    if (!token || !prof) { router.push("/"); return; }
    setProfessor(prof);
    getStudents()
      .then(setStudents)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function selectStudent(email: string) {
    setSelectedStudent(email);
    setSelectedSnapshot(null);
    setLogsLoading(true);
    try {
      const data = await getStudentLogs(email);
      const flattened: LogSnapshot[] = [];
      for (const entry of data) {
        if (entry.logs && Array.isArray(entry.logs)) {
          for (const snap of entry.logs) {
            flattened.push({
              _id: entry._id + "-" + snap.timestamp,
              studentEmail: entry.studentEmail,
              timestamp: snap.timestamp,
              filename: snap.filename,
              content: snap.content,
            });
          }
        } else if (entry.timestamp && entry.filename) {
          flattened.push({
            _id: entry._id,
            studentEmail: entry.studentEmail,
            timestamp: entry.timestamp,
            filename: entry.filename,
            content: entry.content,
          });
        }
      }
      flattened.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setSnapshots(flattened);
    } catch {
      setSnapshots([]);
    } finally {
      setLogsLoading(false);
    }
  }

  function handleLogout() { logout(); router.push("/"); }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  function getFileName(path: string) {
    return path.split(/[/\\]/).pop() || path;
  }

  const filteredStudents = students.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="font-semibold text-text-primary">ScholarTrace</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{professor?.name}</span>
            <button onClick={handleLogout} className="text-sm text-text-muted hover:text-danger cursor-pointer">Sign out</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        <aside className="w-72 border-r border-border p-4 flex flex-col gap-3">
          <div className="mb-2">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Students</h2>
            <input
              type="text" placeholder="Search by email..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center">
                {students.length === 0 ? "No student logs yet" : "No results found"}
              </p>
            ) : (
              filteredStudents.map((email) => (
                <button key={email} onClick={() => selectStudent(email)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate cursor-pointer ${
                    selectedStudent === email
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent"
                  }`}
                >{email}</button>
              ))
            )}
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-text-muted">{students.length} student{students.length !== 1 ? "s" : ""}</p>
          </div>
        </aside>

        <main className="flex-1 flex">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <p className="text-text-secondary text-sm">Select a student to view their coding timeline</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-80 border-r border-border p-4 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-text-primary truncate">{selectedStudent}</h3>
                  <p className="text-xs text-text-muted mt-1">{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}</p>
                </div>
                {logsLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : snapshots.length === 0 ? (
                  <p className="text-sm text-text-muted py-8 text-center">No snapshots found</p>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {snapshots.map((snap, i) => (
                      <button key={snap._id} onClick={() => setSelectedSnapshot(snap)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg cursor-pointer ${
                          selectedSnapshot?._id === snap._id
                            ? "bg-accent/15 border border-accent/30"
                            : "hover:bg-surface-hover border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-accent">#{i + 1}</span>
                          <span className="text-xs text-text-muted">{formatDate(snap.timestamp)}</span>
                        </div>
                        <p className="text-sm text-text-primary truncate">{getFileName(snap.filename)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                {!selectedSnapshot ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-text-muted">Select a snapshot to view the code</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono text-text-primary">{getFileName(selectedSnapshot.filename)}</p>
                        <p className="text-xs text-text-muted mt-0.5">{formatDate(selectedSnapshot.timestamp)}</p>
                      </div>
                      <span className="text-xs text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border">
                        {selectedSnapshot.content.split("\n").length} lines
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      <pre className="text-sm leading-relaxed">
                        <code>
                          {selectedSnapshot.content.split("\n").map((line, i) => (
                            <div key={i} className="flex hover:bg-surface-hover -mx-2 px-2 rounded">
                              <span className="text-text-muted w-12 shrink-0 text-right pr-4 select-none text-xs leading-relaxed">{i + 1}</span>
                              <span className="text-text-primary font-mono whitespace-pre">{line}</span>
                            </div>
                          ))}
                        </code>
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}