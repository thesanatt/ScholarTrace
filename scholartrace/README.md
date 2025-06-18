# 📘 ScholarTrace

ScholarTrace is a VS Code extension designed to help students transparently track their coding progress and submit logs to professors, ensuring academic integrity and protecting against false accusations.

## ✨ Features

- ⏱️ Automatically logs file changes after brief pauses
- 💾 Locally stores code change history with timestamps
- 📤 Sends log history to a secure backend for professor access
- 📄 Export logs to a nicely formatted HTML file
- 🔐 Professors can securely view and filter student logs via a web dashboard

## 🎓 Why ScholarTrace?

Students often face the risk of academic dishonesty accusations due to lack of evidence for their independent work. ScholarTrace helps prevent this by logging your code evolution and optionally submitting it securely for verification.

## 🛠 How It Works

1. **Install the extension in VS Code**
2. **Start coding normally**
3. **Logs will be saved automatically after pauses (5 seconds default)**
4. Use `ScholarTrace: Export ScholarTrace Log` to export your work
5. Use `ScholarTrace: Send Logs to Server` to upload for review

## 🧪 Commands

| Command                              | Description                           |
|--------------------------------------|---------------------------------------|
| `ScholarTrace: Export ScholarTrace Log` | Save logs to an HTML file             |
| `ScholarTrace: Send Logs to Server` | Upload logs with student email input  |

## 📦 Requirements

- VS Code 1.101.0 or higher
- Internet connection to use the log upload feature

## 🔒 Privacy

Your logs are stored locally unless you choose to upload them to your institution's ScholarTrace backend. No data is collected without your explicit consent.

## 🧑‍🏫 For Professors

Visit the ScholarTrace dashboard to view logs by student email, search content, and export records.

## 📤 Open Source & Contributions

ScholarTrace is a student-built project aiming to promote transparency and fairness.


---

Developed by Sanat Gupta