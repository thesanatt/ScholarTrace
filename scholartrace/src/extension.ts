import * as vscode from "vscode";

const API_URL = "https://scholartrace.up.railway.app";

let logEntries: { timestamp: string; filename: string; content: string }[] = [];
let statusBarItem: vscode.StatusBarItem;
let sidebarProvider: ScholarTraceSidebarProvider;

class ScholarTraceSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "scholartrace.sidebar";
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "upload":
          await vscode.commands.executeCommand("scholartrace.sendLogsToServer");
          break;
        case "changeEmail":
          await vscode.commands.executeCommand("scholartrace.changeEmail");
          this.refresh();
          break;
        case "changeClass":
          await vscode.commands.executeCommand("scholartrace.changeClass");
          this.refresh();
          break;
        case "clearLogs":
          await vscode.commands.executeCommand("scholartrace.clearLogs");
          break;
        case "exportLog":
          await vscode.commands.executeCommand("scholartrace.exportLog");
          break;
      }
    });

    this.refresh();
  }

  public refresh() {
    if (!this._view) return;

    const email = this._context.globalState.get<string>("scholartrace.studentEmail") || "";
    const classCode = this._context.globalState.get<string>("scholartrace.classCode") || "";
    const count = logEntries.length;

    this._view.webview.html = this._getHtml(email, classCode, count);
  }

  private _getHtml(email: string, classCode: string, snapshotCount: number): string {
    const hasSetup = email && classCode;

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      padding: 16px;
      font-size: 13px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .logo svg { flex-shrink: 0; }
    .logo span { font-weight: 600; font-size: 14px; }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      font-weight: 600;
    }
    .stat-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: var(--vscode-foreground);
      line-height: 1;
    }
    .stat-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .info-value {
      font-size: 12px;
      color: var(--vscode-foreground);
      font-weight: 500;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .info-value.code {
      font-family: var(--vscode-editor-font-family);
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 6px;
      font-family: var(--vscode-font-family);
      text-align: center;
    }
    .btn-primary {
      background: #8B5CF6;
      color: white;
    }
    .btn-primary:hover { background: #7C3AED; }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .link-btn {
      display: block;
      width: 100%;
      padding: 6px 0;
      background: none;
      border: none;
      color: var(--vscode-textLink-foreground);
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      font-family: var(--vscode-font-family);
    }
    .link-btn:hover { text-decoration: underline; }
    .setup-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 8px;
      padding: 20px 16px;
      text-align: center;
    }
    .setup-card p {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .setup-card .step {
      text-align: left;
      padding: 8px 0;
      font-size: 12px;
      color: var(--vscode-foreground);
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .setup-card .step-num {
      background: #8B5CF6;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .tracking-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .tracking-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .tracking-text {
      font-size: 12px;
      color: #22C55E;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="logo">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    <span>ScholarTrace</span>
  </div>

  ${
    !hasSetup
      ? `
  <div class="setup-card">
    <p>Welcome! Let's get you set up so your professor can review your coding timeline.</p>
    <div class="step">
      <span class="step-num">1</span>
      <span>Get a <strong>class code</strong> from your professor</span>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <span>Click the button below and enter your email + code</span>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <span>Code normally — snapshots are saved automatically</span>
    </div>
    <div style="margin-top: 16px;">
      <button class="btn btn-primary" onclick="send('upload')">Get started</button>
    </div>
  </div>
  `
      : `
  <div class="tracking-indicator">
    <div class="tracking-dot"></div>
    <span class="tracking-text">Tracking your edits</span>
  </div>

  <div class="section">
    <div class="stat-card">
      <div class="stat-number">${snapshotCount}</div>
      <div class="stat-label">snapshot${snapshotCount !== 1 ? "s" : ""} captured</div>
    </div>
  </div>

  <div class="section">
    <button class="btn btn-primary" ${snapshotCount === 0 ? "disabled" : ""} onclick="send('upload')">
      Upload ${snapshotCount} snapshot${snapshotCount !== 1 ? "s" : ""}
    </button>
    <button class="btn btn-secondary" onclick="send('exportLog')">
      Export as HTML
    </button>
  </div>

  <div class="section">
    <div class="section-title">Your info</div>
    <div class="info-row">
      <span class="info-label">Email</span>
      <span class="info-value">${email}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Class code</span>
      <span class="info-value code">${classCode}</span>
    </div>
  </div>

  <div class="section">
    <button class="link-btn" onclick="send('changeEmail')">Change email</button>
    <button class="link-btn" onclick="send('changeClass')">Switch class</button>
    <button class="link-btn" onclick="send('clearLogs')">Clear snapshots</button>
  </div>
  `
  }

  <script>
    const vscode = acquireVsCodeApi();
    function send(cmd) { vscode.postMessage({ command: cmd }); }
  </script>
</body>
</html>`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Sidebar
  sidebarProvider = new ScholarTraceSidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ScholarTraceSidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = "scholartrace.sendLogsToServer";
  statusBarItem.tooltip = "Click to upload logs to ScholarTrace";
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Debounce timers per file
  const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Track file edits (debounced 5s)
  const listener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme !== "file") return;

    const uri = event.document.uri.toString();

    if (debounceTimers.has(uri)) {
      clearTimeout(debounceTimers.get(uri)!);
    }

    const timeout = setTimeout(() => {
      const content = event.document.getText();
      const filename = event.document.fileName;
      const timestamp = new Date().toISOString();

      logEntries.push({ timestamp, filename, content });
      updateStatusBar();
      sidebarProvider.refresh();
    }, 5000);

    debounceTimers.set(uri, timeout);
  });
  context.subscriptions.push(listener);

  // Command: Upload logs
  const sendCommand = vscode.commands.registerCommand(
    "scholartrace.sendLogsToServer",
    async () => {
      if (logEntries.length === 0) {
        vscode.window.showWarningMessage(
          "ScholarTrace: No snapshots to upload yet. Start editing some files!"
        );
        return;
      }

      let studentEmail = context.globalState.get<string>("scholartrace.studentEmail");

      if (!studentEmail) {
        studentEmail = await vscode.window.showInputBox({
          prompt: "Enter your student email (only asked once)",
          placeHolder: "you@university.edu",
          validateInput: (value) =>
            value.includes("@") ? null : "Enter a valid email address",
        });
        if (!studentEmail) return;
        await context.globalState.update("scholartrace.studentEmail", studentEmail);
      }

      let classCode = context.globalState.get<string>("scholartrace.classCode");

      if (!classCode) {
        classCode = await vscode.window.showInputBox({
          prompt: "Enter your class code (given by your professor)",
          placeHolder: "e.g. A1B2C3",
          validateInput: (value) =>
            value.length >= 6 ? null : "Class code must be at least 6 characters",
        });
        if (!classCode) return;

        try {
          const verifyRes = await fetch(`${API_URL}/api/classes/verify/${classCode}`);
          if (!verifyRes.ok) {
            vscode.window.showErrorMessage("ScholarTrace: Invalid class code. Check with your professor.");
            return;
          }
          const classInfo = (await verifyRes.json()) as { name: string; code: string };
          await context.globalState.update("scholartrace.classCode", classInfo.code);
          classCode = classInfo.code;
          vscode.window.showInformationMessage(`ScholarTrace: Joined "${classInfo.name}"`);
        } catch {
          vscode.window.showErrorMessage("ScholarTrace: Could not verify class code.");
          return;
        }
      }

      sidebarProvider.refresh();

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "ScholarTrace",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: `Uploading ${logEntries.length} snapshots...` });

          try {
            const response = await fetch(`${API_URL}/api/logs/upload`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentEmail, logs: logEntries, classCode }),
            });

            if (!response.ok) throw new Error(`Server responded with ${response.status}`);

            const count = logEntries.length;
            logEntries = [];
            updateStatusBar();
            sidebarProvider.refresh();

            vscode.window.showInformationMessage(`ScholarTrace: ${count} snapshots uploaded!`);
          } catch (err: any) {
            vscode.window.showErrorMessage(`ScholarTrace: Upload failed — ${err.message}`);
          }
        }
      );
    }
  );
  context.subscriptions.push(sendCommand);

  // Command: Export logs as HTML
  const exportCommand = vscode.commands.registerCommand(
    "scholartrace.exportLog",
    async () => {
      if (logEntries.length === 0) {
        vscode.window.showWarningMessage("ScholarTrace: No snapshots to export.");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>ScholarTrace Log Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; background: #0a0a0b; color: #fafafa; }
    h1 { font-size: 1.5rem; margin-bottom: 2rem; }
    .entry { margin-bottom: 1.5rem; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; }
    .entry-header { padding: 0.75rem 1rem; background: #141416; font-size: 0.85rem; color: #a1a1aa; display: flex; justify-content: space-between; }
    .entry-header span { color: #8b5cf6; font-weight: 500; }
    pre { margin: 0; padding: 1rem; font-size: 0.8rem; overflow-x: auto; background: #0a0a0b; }
    code { color: #e4e4e7; }
  </style>
</head>
<body>
  <h1>ScholarTrace Log Report — ${logEntries.length} snapshots</h1>
  ${logEntries.map((entry, i) => `
  <div class="entry">
    <div class="entry-header">
      <span>#${i + 1} ${entry.filename.split(/[/\\]/).pop()}</span>
      <span>${new Date(entry.timestamp).toLocaleString()}</span>
    </div>
    <pre><code>${entry.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
  </div>`).join("")}
</body>
</html>`;

      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const fileUri = vscode.Uri.joinPath(folder.uri, "scholartrace-log.html");
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(htmlContent, "utf8"));
      vscode.window.showInformationMessage(`ScholarTrace: Log exported to ${fileUri.fsPath}`);
    }
  );
  context.subscriptions.push(exportCommand);

  // Command: Clear logs
  const clearCommand = vscode.commands.registerCommand(
    "scholartrace.clearLogs",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        `Clear ${logEntries.length} snapshots?`, "Yes", "No"
      );
      if (confirm === "Yes") {
        logEntries = [];
        updateStatusBar();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage("ScholarTrace: Logs cleared.");
      }
    }
  );
  context.subscriptions.push(clearCommand);

  // Command: Change email
  const changeEmailCommand = vscode.commands.registerCommand(
    "scholartrace.changeEmail",
    async () => {
      const current = context.globalState.get<string>("scholartrace.studentEmail");
      const email = await vscode.window.showInputBox({
        prompt: "Update your student email",
        value: current || "",
        placeHolder: "you@university.edu",
        validateInput: (value) => value.includes("@") ? null : "Enter a valid email address",
      });
      if (email) {
        await context.globalState.update("scholartrace.studentEmail", email);
        sidebarProvider.refresh();
        vscode.window.showInformationMessage(`ScholarTrace: Email updated to ${email}`);
      }
    }
  );
  context.subscriptions.push(changeEmailCommand);

  // Command: Change class
  const changeClassCommand = vscode.commands.registerCommand(
    "scholartrace.changeClass",
    async () => {
      const code = await vscode.window.showInputBox({
        prompt: "Enter a new class code",
        placeHolder: "e.g. A1B2C3",
        validateInput: (value) => value.length >= 6 ? null : "Class code must be at least 6 characters",
      });
      if (!code) return;

      try {
        const res = await fetch(`${API_URL}/api/classes/verify/${code}`);
        if (!res.ok) {
          vscode.window.showErrorMessage("ScholarTrace: Invalid class code.");
          return;
        }
        const classInfo = (await res.json()) as { name: string; code: string };
        await context.globalState.update("scholartrace.classCode", classInfo.code);
        sidebarProvider.refresh();
        vscode.window.showInformationMessage(`ScholarTrace: Switched to "${classInfo.name}"`);
      } catch {
        vscode.window.showErrorMessage("ScholarTrace: Could not verify class code.");
      }
    }
  );
  context.subscriptions.push(changeClassCommand);
}

function updateStatusBar() {
  const count = logEntries.length;
  statusBarItem.text = `$(book) ScholarTrace: ${count} snapshot${count !== 1 ? "s" : ""}`;
}

export function deactivate() {}
