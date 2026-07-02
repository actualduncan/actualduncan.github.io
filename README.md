# actualduncan.github.io

Personal site — auto-generated from markdown content.

## Building

```bash
npm install   # first time only
npm run build
```

## Adding content

The build script auto-discovers everything in `content/`. No code changes needed.

### New blog post

Create a `.md` file in `content/blog/`:

```
content/blog/my_new_post.md
```

Optional front matter:

```markdown
---
title: My Post Title
date: 2026-07-02
---

Post content here...
```

### New portfolio item

Create a `.md` file in `content/portfolio/`:

```
content/portfolio/project_name.md
```

### New top-level page

Create a `.md` file in `content/`:

```
content/newpage.md
```

This generates `/newpage.html` and adds `newpage.h` to the sidebar automatically.

### New section (folder)

Create a folder in `content/` with `.md` files inside. If a matching top-level `.md` exists (e.g., `blog.md` + `blog/`), it becomes the listing page for that folder.
