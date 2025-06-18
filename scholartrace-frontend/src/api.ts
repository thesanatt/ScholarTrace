export async function fetchLogs(email: string) {
	const res = await fetch(`http://localhost:5000/api/uploadLogs?email=${encodeURIComponent(email)}`);
	if (!res.ok) throw new Error('Failed to fetch logs');
	return res.json();
}