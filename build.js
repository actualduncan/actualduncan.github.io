const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const TEMPLATES = path.join(ROOT, 'templates');

// --- Front matter parser ---

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, body: match[2] };
}

// --- Read all posts ---

function readPosts() {
  const dir = path.join(CONTENT, 'posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(dir, f), 'utf-8'));
      return {
        slug: f.replace('.md', ''),
        title: meta.title || f.replace('.md', ''),
        date: meta.date || new Date().toISOString().slice(0, 10),
        html: marked.parse(body),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// --- HTML generators ---

function postListHtml(posts, hrefPrefix) {
  let html = '    <h2>Blog</h2>\n';
  html += '    <p>Posts about engine programming, C++, and whatever else I\'m working on.</p>\n\n';
  html += '    <ul class="post-list">\n';
  for (const p of posts) {
    html += '      <li>\n';
    html += `        <a href="${hrefPrefix}${p.slug}.html">${p.title}</a>\n`;
    html += `        <span class="post-date">${p.date}</span>\n`;
    html += '      </li>\n';
  }
  html += '    </ul>';
  return html;
}

function tabbar(active, post) {
  const isPost = active === 'post';
  const aboutHref = '/';

  let html = '';
  html += `    <a href="${aboutHref}" class="tab${active === 'about' ? ' tab--active' : ''}">`;
  html += `<span class="tab-icon">${active === 'about' ? '●' : '○'}</span> about.h</a>\n`;

  if (isPost && post) {
    html += `    <a href="${post.slug}.html" class="tab tab--active">`;
    html += `<span class="tab-icon">●</span> ${post.slug}.cpp</a>\n`;
  }
  return html;
}

function sidebar(active, posts, activePost) {
  const isPost = active === 'post';
  let html = '';

  // About link
  const aboutActive = active === 'about' ? ' sidebar-file--active' : '';
  html += `        <a href="/" class="sidebar-file${aboutActive}">\n`;
  html += `          <span class="sidebar-file-icon">📄</span> about.h\n`;
  html += `        </a>\n`;

  // Blog folder
  html += `        <div class="sidebar-folder">\n`;
  html += `          <div class="sidebar-folder-label">\n`;
  html += `            <span class="sidebar-folder-arrow">▾</span>\n`;
  html += `            <span>blog</span>\n`;
  html += `          </div>\n`;
  html += `          <div class="sidebar-folder-children">\n`;

  for (const p of posts) {
    const href = isPost ? `${p.slug}.html` : `posts/${p.slug}.html`;
    const fileActive = activePost && activePost.slug === p.slug ? ' sidebar-file--active' : '';
    html += `            <a href="${href}" class="sidebar-file${fileActive}">\n`;
    html += `              <span class="sidebar-file-icon">📝</span> ${p.slug}.cpp\n`;
    html += `            </a>\n`;
  }

  html += `          </div>\n`;
  html += `        </div>`;
  return html;
}

// --- Template renderer ---

function render(template, vars) {
  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(`{{${key}}}`, value);
  }
  return html;
}

// --- Build ---

function build() {
  const template = fs.readFileSync(path.join(TEMPLATES, 'base.html'), 'utf-8');
  const posts = readPosts();

  // Home page (about intro + blog post list)
  const about = parseFrontMatter(fs.readFileSync(path.join(CONTENT, 'about.md'), 'utf-8'));
  const homeContent = marked.parse(about.body) +
    '\n\n    <hr>\n\n' +
    postListHtml(posts, 'posts/');
  fs.writeFileSync(path.join(ROOT, 'index.html'), render(template, {
    title: 'actualduncan',
    cssPath: 'styles.css',
    jsPath: 'scripts.js',
    tabbar: tabbar('about'),
    sidebarItems: sidebar('about', posts),
    content: homeContent,
  }));

  // Individual posts
  const postsDir = path.join(ROOT, 'posts');
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  for (const p of posts) {
    let postHtml = `    <h1>${p.title}</h1>\n`;
    postHtml += `    <p><em>${p.date}</em></p>\n\n`;
    postHtml += '    <hr>\n\n';
    postHtml += p.html;

    fs.writeFileSync(path.join(postsDir, `${p.slug}.html`), render(template, {
      title: `actualduncan — ${p.title}`,
      cssPath: '../styles.css',
      jsPath: '../scripts.js',
      tabbar: tabbar('post', p),
      sidebarItems: sidebar('post', posts, p),
      content: postHtml,
    }));
  }

  console.log(`Built: index.html, ${posts.length} post(s)`);
}

build();
