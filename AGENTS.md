# Project publishing workflow

- Use `v2026` as the working and publishing branch for this academic homepage.
- After completing each requested website or content update, validate the relevant changes, commit only the files belonging to the current request, and push the commit to `origin/v2026` automatically without asking again.
- Treat this file as the user's standing authorization for those scoped commits and pushes.
- Never include unrelated local changes in a commit. Leave unrelated changes untouched and report them.
- Do not merge into `master`, change the GitHub Pages source, rewrite history, or force-push unless the user explicitly requests it.

# Content directory protection

- Treat every file under `content/` as user-managed source data.
- Never create, edit, delete, rename, reformat, normalize line endings, or otherwise modify anything under `content/` automatically.
- If a task appears to require a change under `content/`, stop before making that change and tell the user exactly what they need to edit manually.
- Check for changes under `content/` whenever inspecting the working tree. Any detected change under `content/` is considered a user-authored content update: do not alter or revert it; promptly commit those files in a dedicated content-only commit and push it to `origin/v2026` without asking again.
- Keep detected `content/` changes separate from website code, styling, configuration, and other unrelated files.
