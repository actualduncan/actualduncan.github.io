const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

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

// --- Auto-discover content ---

function discoverContent() {
  const entries = fs.readdirSync(CONTENT, { withFileTypes: true });
  const pages = [];
  const folders = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const name = entry.name.replace('.md', '');
      const raw = fs.readFileSync(path.join(CONTENT, entry.name), 'utf-8');
      const { meta, body } = parseFrontMatter(raw);
      pages.push({
        name,
        title: meta.title || name,
        description: meta.description || '',
        body,
        html: marked.parse(body),
      });
    } else if (entry.isDirectory()) {
      const folderItems = readFolder(entry.name);
      if (folderItems.length > 0) {
        folders.push({ name: entry.name, items: folderItems });
      }
    }
  }

  // Sort pages: about first, then alphabetical
  pages.sort((a, b) => {
    if (a.name === 'about') return -1;
    if (b.name === 'about') return 1;
    return a.name.localeCompare(b.name);
  });

  // Sort folders alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name));

  return { pages, folders };
}

function readFolder(folderName) {
  const dir = path.join(CONTENT, folderName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      const { meta, body } = parseFrontMatter(raw);
      return {
        slug: f.replace('.md', ''),
        title: meta.title || f.replace('.md', ''),
        date: meta.date || '',
        html: marked.parse(body),
      };
    })
    .sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return a.slug.localeCompare(b.slug);
    });
}

// --- HTML generators ---

function itemListHtml(folder, hrefPrefix) {
  let html = `    <ul class="post-list">\n`;
  for (const item of folder.items) {
    html += '      <li>\n';
    html += `        <a href="${hrefPrefix}${item.slug}.html">${item.title}</a>\n`;
    if (item.date) {
      html += `        <span class="post-date">${item.date}</span>\n`;
    }
    html += '      </li>\n';
  }
  html += '    </ul>';
  return html;
}

function tabbar(activePage, activeItem) {
  let html = '';
  html += `    <a href="/" class="tab${activePage === 'about' ? ' tab--active' : ''}">`;
  html += `<span class="tab-icon">${activePage === 'about' ? '●' : '○'}</span> about.h</a>\n`;

  if (activeItem) {
    html += `    <a href="${activeItem.slug}.html" class="tab tab--active">`;
    html += `<span class="tab-icon">●</span> ${activeItem.slug}.cpp</a>\n`;
  } else if (activePage && activePage !== 'about') {
    html += `    <a href="/${activePage}.html" class="tab tab--active">`;
    html += `<span class="tab-icon">●</span> ${activePage}.h</a>\n`;
  }
  return html;
}

function sidebar(activePage, activeItem, content) {
  let html = '';

  // Top-level pages as file links
  for (const page of content.pages) {
    const isActive = activePage === page.name && !activeItem;
    const activeClass = isActive ? ' sidebar-file--active' : '';
    const href = page.name === 'about' ? '/' : `/${page.name}.html`;
    html += `        <a href="${href}" class="sidebar-file${activeClass}">\n`;
    html += `          <span class="sidebar-file-icon">📄</span> ${page.name}.h\n`;
    html += `        </a>\n`;
  }

  // Folders
  for (const folder of content.folders) {
    html += `        <div class="sidebar-folder">\n`;
    html += `          <div class="sidebar-folder-label">\n`;
    html += `            <span class="sidebar-folder-arrow">▾</span>\n`;
    html += `            <span>${folder.name}</span>\n`;
    html += `          </div>\n`;
    html += `          <div class="sidebar-folder-children">\n`;

    for (const item of folder.items) {
      const isItemActive = activeItem && activeItem.slug === item.slug;
      const fileActive = isItemActive ? ' sidebar-file--active' : '';
      let href;
      if (activePage === folder.name && activeItem) {
        // Inside this folder — relative link to sibling
        href = `${item.slug}.html`;
      } else if (activeItem) {
        // Inside a different folder — go up then into target folder
        href = `../${folder.name}/${item.slug}.html`;
      } else {
        // At root level — path from root
        href = `${folder.name}/${item.slug}.html`;
      }
      html += `            <a href="${href}" class="sidebar-file${fileActive}">\n`;
      html += `              <span class="sidebar-file-icon">📝</span> ${item.slug}.cpp\n`;
      html += `            </a>\n`;
    }

    html += `          </div>\n`;
    html += `        </div>\n`;
  }

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
  const content = discoverContent();

  // Find the about page for the homepage
  const aboutPage = content.pages.find(p => p.name === 'about');

  // Home page (about content + page links)
  let homeContent = aboutPage ? aboutPage.html : '';
  const otherPages = content.pages.filter(p => p.name !== 'about');
  if (otherPages.length > 0) {
    homeContent += '\n\n    <hr>\n\n';
    homeContent += '    <div class="page-links">\n';
    for (const page of otherPages) {
      homeContent += `      <a href="/${page.name}.html" class="page-link">\n`;
      homeContent += `        <span class="page-link-icon">📄</span>\n`;
      homeContent += `        <span class="page-link-name">${page.name}.h</span>\n`;
      homeContent += `      </a>\n`;
    }
    homeContent += '    </div>';
  }

  fs.writeFileSync(path.join(ROOT, 'index.html'), render(template, {
    title: 'actualduncan',
    cssPath: 'styles.css',
    jsPath: 'scripts.js',
    tabbar: tabbar('about', null),
    sidebarItems: sidebar('about', null, content),
    content: homeContent,
  }));

  // Build top-level pages (except about, which is the homepage)
  for (const page of content.pages) {
    if (page.name === 'about') continue;

    // Check if this page has a matching folder (listing page)
    const matchingFolder = content.folders.find(f => f.name === page.name);
    let pageContent = page.html;
    if (matchingFolder && matchingFolder.items.length > 0) {
      pageContent += '\n\n';
      pageContent += itemListHtml(matchingFolder, `${page.name}/`);
    }

    fs.writeFileSync(path.join(ROOT, `${page.name}.html`), render(template, {
      title: `actualduncan — ${page.title}`,
      cssPath: 'styles.css',
      jsPath: 'scripts.js',
      tabbar: tabbar(page.name, null),
      sidebarItems: sidebar(page.name, null, content),
      content: pageContent,
    }));
  }

  // Build individual items in each folder
  for (const folder of content.folders) {
    const outDir = path.join(ROOT, folder.name);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const item of folder.items) {
      let itemHtml = `    <h1>${item.title}</h1>\n`;
      if (item.date) {
        itemHtml += `    <p><em>${item.date}</em></p>\n\n`;
      }
      itemHtml += '    <hr>\n\n';
      itemHtml += item.html;

      fs.writeFileSync(path.join(outDir, `${item.slug}.html`), render(template, {
        title: `actualduncan — ${item.title}`,
        cssPath: '../styles.css',
        jsPath: '../scripts.js',
        tabbar: tabbar(folder.name, item),
        sidebarItems: sidebar(folder.name, item, content),
        content: itemHtml,
      }));
    }
  }

  const totalItems = content.folders.reduce((sum, f) => sum + f.items.length, 0);
  const topPages = content.pages.filter(p => p.name !== 'about').length;
  console.log(`Built: index.html, ${topPages} page(s), ${totalItems} item(s) across ${content.folders.length} folder(s)`);
}

build();
