# ScholarTrace

A VS Code extension that builds a tamper-proof timeline of your coding process. Every edit is automatically snapshotted and can be uploaded for professor review — so if your work is ever questioned, you have the receipts.

## How it works

1. Install ScholarTrace and open any project
2. Code normally — the extension silently snapshots your files after 5 seconds of inactivity
3. When you're ready, enter your email and your professor's class code
4. Hit upload — your snapshots are pushed to a secure server where your professor can review your full coding timeline

That's it. No configuration, no setup beyond the initial email and class code.

## What professors see

Professors create classes on the [ScholarTrace Dashboard](https://scholar-trace.vercel.app) and get a unique 6-character join code to share with students. From the dashboard they can:

- View every student's coding timeline in chronological order
- See exactly how code evolved — what was written, when, and in what order
- Search and filter students across classes
- Export or remove student data as needed

## Commands

| Command | What it does |
|---|---|
| `ScholarTrace: Upload Snapshots` | Push your captured snapshots to the server |
| `ScholarTrace: Export Log as HTML` | Save a local HTML report of your coding timeline |
| `ScholarTrace: Clear Snapshots` | Clear all captured snapshots from this session |
| `ScholarTrace: Change Student Email` | Update your student email |
| `ScholarTrace: Change Class Code` | Switch to a different class |

All commands are also accessible from the ScholarTrace sidebar panel.

## Privacy

ScholarTrace only captures snapshots of files you edit in VS Code. All data stays local on your machine until you explicitly choose to upload. No telemetry, no background data collection.

## Requirements

- VS Code 1.101.0+
- Internet connection for uploading snapshots

## Links

- [Professor Dashboard](https://scholar-trace.vercel.app)
- [Source Code](https://github.com/thesanatt/ScholarTrace)

---

Built by [Sanat Gupta](https://thesanatgupta.com)
