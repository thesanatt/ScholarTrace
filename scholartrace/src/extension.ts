import * as vscode from "vscode";

const API_URL = "https://scholartrace.up.railway.app";

let logEntries: { timestamp: string; filename: string; content: string }[] = [];
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  // Status bar item — shows snapshot count, click to upload
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
    // Ignore output channels, git, etc
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
    }, 5000);

    debounceTimers.set(uri, timeout);
  });
  context.subscriptions.push(listener);

  // Command: Upload logs to server
  const sendCommand = vscode.commands.registerCommand(
    "scholartrace.sendLogsToServer",
    async () => {
      if (logEntries.length === 0) {
        vscode.window.showWarningMessage(
          "ScholarTrace: No snapshots to upload yet. Start editing some files!"
        );
        return;
      }

      // Get saved email or ask for it
      let studentEmail = context.globalState.get<string>(
        "scholartrace.studentEmail"
      );

      if (!studentEmail) {
        studentEmail = await vscode.window.showInputBox({
          prompt: "Enter your student email (only asked once)",
          placeHolder: "you@university.edu",
          validateInput: (value) =>
            value.includes("@") ? null : "Enter a valid email address",
        });

        if (!studentEmail) {
          return;
        }

        await context.globalState.update(
          "scholartrace.studentEmail",
          studentEmail
        );
      }

      // Upload with progress
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
              body: JSON.stringify({ studentEmail, logs: logEntries }),
            });

            if (!response.ok) {
              throw new Error(`Server responded with ${response.status}`);
            }

            const count = logEntries.length;
            logEntries = [];
            updateStatusBar();

            vscode.window.showInformationMessage(
              `ScholarTrace: ${count} snapshots uploaded successfully!`
            );
          } catch (err: any) {
            vscode.window.showErrorMessage(
              `ScholarTrace: Upload failed — ${err.message}`
            );
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
        vscode.window.showWarningMessage(
          "ScholarTrace: No snapshots to export."
        );
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
  ${logEntries
    .map(
      (entry, i) => `
  <div class="entry">
    <div class="entry-header">
      <span>#${i + 1} ${entry.filename.split(/[/\\]/).pop()}</span>
      <span>${new Date(entry.timestamp).toLocaleString()}</span>
    </div>
    <pre><code>${entry.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
  </div>`
    )
    .join("")}
</body>
</html>`;

      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const fileUri = vscode.Uri.joinPath(folder.uri, "scholartrace-log.html");
      await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(htmlContent, "utf8")
      );
      vscode.window.showInformationMessage(
        `ScholarTrace: Log exported to ${fileUri.fsPath}`
      );
    }
  );
  context.subscriptions.push(exportCommand);

  // Command: Clear logs
  const clearCommand = vscode.commands.registerCommand(
    "scholartrace.clearLogs",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        `Clear ${logEntries.length} snapshots?`,
        "Yes",
        "No"
      );
      if (confirm === "Yes") {
        logEntries = [];
        updateStatusBar();
        vscode.window.showInformationMessage("ScholarTrace: Logs cleared.");
      }
    }
  );
  context.subscriptions.push(clearCommand);

  // Command: Change email
  const changeEmailCommand = vscode.commands.registerCommand(
    "scholartrace.changeEmail",
    async () => {
      const current = context.globalState.get<string>(
        "scholartrace.studentEmail"
      );
      const email = await vscode.window.showInputBox({
        prompt: "Update your student email",
        value: current || "",
        placeHolder: "you@university.edu",
        validateInput: (value) =>
          value.includes("@") ? null : "Enter a valid email address",
      });
      if (email) {
        await context.globalState.update("scholartrace.studentEmail", email);
        vscode.window.showInformationMessage(
          `ScholarTrace: Email updated to ${email}`
        );
      }
    }
  );
  context.subscriptions.push(changeEmailCommand);

  vscode.window.showInformationMessage("ScholarTrace is tracking your edits");
}

function updateStatusBar() {
  const count = logEntries.length;
  statusBarItem.text = `$(book) ScholarTrace: ${count} snapshot${count !== 1 ? "s" : ""}`;
  statusBarItem.backgroundColor =
    count > 0 ? undefined : undefined;
}

export function deactivate() {}