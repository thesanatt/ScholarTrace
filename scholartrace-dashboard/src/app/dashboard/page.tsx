"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getProfessor, logout, getClasses, createClass, getStudents, getStudentLogs, deleteClass, deleteStudentData } from "@/lib/api";

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

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

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  const [students, setStudents] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<LogSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<LogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete modals
  const [showDeleteClass, setShowDeleteClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [showDeleteStudent, setShowDeleteStudent] = useState<string | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  useEffect(() => {
    const token = getToken();
    const prof = getProfessor();
    if (!token || !prof) { router.push("/"); return; }
    setProfessor(prof);

    getClasses()
      .then((c) => {
        setClasses(c);
        if (c.length > 0) {
          setSelectedClass(c[0]);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    setSelectedStudent(null);
    setSelectedSnapshot(null);
    setSnapshots([]);
    getStudents(selectedClass.code)
      .then(setStudents)
      .catch(() => setStudents([]));
  }, [selectedClass]);

  async function handleCreateClass() {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const newClass = await createClass(newClassName.trim());
      setClasses((prev) => [newClass, ...prev]);
      setSelectedClass(newClass);
      setNewClassName("");
      setShowCreateClass(false);
    } catch {
      // handle error
    } finally {
      setCreatingClass(false);
    }
  }

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

  async function handleDeleteClass() {
    if (!selectedClass) return;
    setDeletingClass(true);
    try {
      await deleteClass(selectedClass.id);
      const remaining = classes.filter((c) => c.id !== selectedClass.id);
      setClasses(remaining);
      setSelectedClass(remaining.length > 0 ? remaining[0] : null);
      setSelectedStudent(null);
      setSelectedSnapshot(null);
      setSnapshots([]);
      setShowDeleteClass(false);
    } catch {
      // handle error
    } finally {
      setDeletingClass(false);
    }
  }

  async function handleDeleteStudent(email: string) {
    if (!selectedClass) return;
    setDeletingStudent(true);
    try {
      await deleteStudentData(email, selectedClass.code);
      setStudents((prev) => prev.filter((s) => s !== email));
      if (selectedStudent === email) {
        setSelectedStudent(null);
        setSelectedSnapshot(null);
        setSnapshots([]);
      }
      setShowDeleteStudent(null);
    } catch {
      // handle error
    } finally {
      setDeletingStudent(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  function getFileName(path: string) {
    return path.split(/[/\\]/).pop() || path;
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
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

          <div className="flex items-center gap-3">
            {selectedClass && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedClass.id}
                  onChange={(e) => {
                    const c = classes.find((cls) => cls.id === e.target.value);
                    if (c) setSelectedClass(c);
                  }}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => copyCode(selectedClass.code)}
                  className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 rounded-lg px-3 py-1.5 text-sm text-accent hover:bg-accent/20 cursor-pointer"
                  title="Click to copy class code"
                >
                  <span className="font-mono font-medium">{selectedClass.code}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowCreateClass(true)}
              className="text-sm text-accent hover:text-accent-hover cursor-pointer"
            >
              + New class
            </button>
            {selectedClass && (
              <button
                onClick={() => setShowDeleteClass(true)}
                className="text-sm text-text-muted hover:text-danger cursor-pointer"
                title="Delete this class"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{professor?.name}</span>
            <button onClick={handleLogout} className="text-sm text-text-muted hover:text-danger cursor-pointer">Sign out</button>
          </div>
        </div>
      </header>

      {showCreateClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Create a new class</h2>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. EECS 281 Winter 2026"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-accent mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
            />
            <p className="text-xs text-text-muted mb-4">
              A unique join code will be generated for students to use in the VS Code extension.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreateClass(false); setNewClassName(""); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={!newClassName.trim() || creatingClass}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {creatingClass ? "Creating..." : "Create class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete class modal */}
      {showDeleteClass && selectedClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Delete class</h2>
            <p className="text-sm text-text-secondary mb-2">
              Are you sure you want to delete <span className="font-semibold text-text-primary">{selectedClass.name}</span>?
            </p>
            <p className="text-xs text-danger/80 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-4">
              This will permanently delete all student logs associated with this class. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteClass(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClass}
                disabled={deletingClass}
                className="px-4 py-2 bg-danger hover:bg-danger/80 text-white text-sm font-medium rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {deletingClass ? "Deleting..." : "Delete class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete student data modal */}
      {showDeleteStudent && selectedClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Remove student data</h2>
            <p className="text-sm text-text-secondary mb-2">
              Remove all logs for <span className="font-mono text-accent">{showDeleteStudent}</span> from <span className="font-semibold text-text-primary">{selectedClass.name}</span>?
            </p>
            <p className="text-xs text-danger/80 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-4">
              This will permanently delete all coding snapshots for this student in this class. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteStudent(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(showDeleteStudent)}
                disabled={deletingStudent}
                className="px-4 py-2 bg-danger hover:bg-danger/80 text-white text-sm font-medium rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {deletingStudent ? "Removing..." : "Remove data"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {!selectedClass ? (
              <p className="text-sm text-text-muted py-8 text-center">Create a class to get started</p>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-muted mb-2">
                  {students.length === 0 ? "No students yet" : "No results found"}
                </p>
                {students.length === 0 && (
                  <p className="text-xs text-text-muted">
                    Share code <span className="font-mono text-accent">{selectedClass.code}</span> with your students
                  </p>
                )}
              </div>
            ) : (
              filteredStudents.map((email) => (
                <div key={email} className={`group flex items-center rounded-lg ${
                    selectedStudent === email
                      ? "bg-accent/15 border border-accent/30"
                      : "hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <button onClick={() => selectStudent(email)}
                    className={`flex-1 text-left px-3 py-2.5 text-sm truncate cursor-pointer ${
                      selectedStudent === email ? "text-accent" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >{email}</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteStudent(email); }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 mr-1 text-text-muted hover:text-danger cursor-pointer"
                    title="Remove student data"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
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
                <p className="text-text-secondary text-sm">
                  {selectedClass ? "Select a student to view their coding timeline" : "Create a class to get started"}
                </p>
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