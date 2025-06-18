import React from 'react';

export default function LogViewer({ logs }: { logs: any[] }) {
	return (
		<div>
			{logs.map((log, i) => (
				<div
					key={i}
					style={{
						border: '1px solid #ccc',
						borderRadius: 8,
						marginBottom: 20,
						padding: 15,
						background: '#1e1e1e',
						color: '#fff',
						boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
					}}
				>
					<p><b>📅 Timestamp:</b> {new Date(log.timestamp).toLocaleString()}</p>
					<p><b>📄 File:</b> {log.filename}</p>
					<pre style={{
						background: '#2d2d2d',
						padding: '10px',
						borderRadius: '5px',
						overflowX: 'auto'
					}}>
						<code>{log.content}</code>
					</pre>
				</div>
			))}
		</div>
	);
}