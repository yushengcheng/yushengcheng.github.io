# Project publishing workflow

- Use `v2026` as the working and publishing branch for this academic homepage.
- After completing every user-requested change within this project, including website, content, and CV artifact updates, validate the relevant changes, commit only the files belonging to the current request, and push the commit to `origin/v2026` automatically without asking again.
- Before every project commit, update the `Last Updated` date in `index.html` to the actual calendar date of that commit in `YYYY-MM-DD` format, and include `index.html` in the same commit whenever the displayed date changes.
- Treat this file as the user's standing authorization for those scoped commits and pushes.
- Never include unrelated local changes in a commit. Leave unrelated changes untouched and report them.
- Do not merge into `master`, change the GitHub Pages source, rewrite history, or force-push unless the user explicitly requests it.

# Content directory protection

- Treat every file under `content/` as user-managed source data.
- Never create, edit, delete, rename, reformat, normalize line endings, or otherwise modify anything under `content/` automatically.
- If a task appears to require a change under `content/`, stop before making that change and tell the user exactly what they need to edit manually.
- Check for changes under `content/` whenever inspecting the working tree. Any detected change under `content/` is considered a user-authored content update: do not alter, revert, or commit it immediately solely because it was detected.
- Keep detected `content/` changes pending until the next requested task is completed, then include them in the same commit as that task's files and push the combined commit to `origin/v2026`. This is an explicit exception to the rule about committing only files belonging to the current request; do not create a separate content-only commit unless the user explicitly asks for one.
