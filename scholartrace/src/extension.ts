import * as vscode from 'vscode';

// Global log array
const logEntries: { timestamp: string, filename: string, content: string }[] = [];

export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('✅ ScholarTrace is active!');

	// Debounce timers per file
	const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

	// === 1. Track File Edits (Debounced) ===
	const listener = vscode.workspace.onDidChangeTextDocument(event => {
		const uri = event.document.uri.toString();

		if (debounceTimers.has(uri)) {
			clearTimeout(debounceTimers.get(uri)!);
		}

		const timeout = setTimeout(() => {
			const content = event.document.getText();
			const filename = event.document.fileName;
			const timestamp = new Date().toISOString();

			logEntries.push({ timestamp, filename, content });
			console.log(`[ScholarTrace] Logged after pause at ${timestamp}`);
		}, 5000);

		debounceTimers.set(uri, timeout);
	});
	context.subscriptions.push(listener);

	// === 2. Export Logs as HTML ===
	const exportCommand = vscode.commands.registerCommand('scholartrace.exportLog', async () => {
		if (logEntries.length === 0) {
			vscode.window.showWarningMessage('No logs to export yet.');
			return;
		}

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>ScholarTrace Log Report</title>
				<style>
					body { font-family: Arial, sans-serif; padding: 20px; }
					.entry { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
					pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
				</style>
			</head>
			<body>
				<h1>ScholarTrace Log Report</h1>
				${logEntries.map(entry => `
					<div class="entry">
						<b>Timestamp:</b> ${entry.timestamp}<br>
						<b>File:</b> ${entry.filename}<br>
						<pre><code>${entry.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
					</div>
				`).join('')}
			</body>
			</html>
		`;

		const folder = vscode.workspace.workspaceFolders?.[0];
		if (!folder) {
			vscode.window.showErrorMessage('No workspace folder is open.');
			return;
		}

		const fileUri = vscode.Uri.joinPath(folder.uri, 'scholartrace-log.html');
		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(htmlContent, 'utf8'));

		vscode.window.showInformationMessage(`ScholarTrace log exported to ${fileUri.fsPath}`);
	});
	context.subscriptions.push(exportCommand);

	// === 3. Send Logs to Server ===
	const sendToServerCommand = vscode.commands.registerCommand('scholartrace.sendLogsToServer', async () => {
		if (logEntries.length === 0) {
			vscode.window.showWarningMessage('No logs to send.');
			return;
		}

		const studentEmail = await vscode.window.showInputBox({
			placeHolder: 'Enter your student email (required to link logs)',
			validateInput: value => value.includes('@') ? null : 'Please enter a valid email address.'
		});

		if (!studentEmail) {
			vscode.window.showErrorMessage('Log upload cancelled.');
			return;
		}

		const payload = {
			studentEmail,
			logs: logEntries
		};

		try {
			const response = await fetch('http://localhost:5000/api/uploadLogs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`Server responded with ${response.status}`);
			}

			vscode.window.showInformationMessage('✅ Logs successfully sent to server!');
		} catch (err: any) {
			vscode.window.showErrorMessage(`❌ Failed to send logs: ${err.message}`);
		}
	});
	context.subscriptions.push(sendToServerCommand);
}

export function deactivate() {
	console.log('❌ ScholarTrace deactivated.');
}
