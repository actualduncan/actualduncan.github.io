// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

// Collapsible sidebar folders
function toggleFolder(label) {
  const folder = label.closest('.sidebar-folder');
  if (folder) folder.classList.toggle('collapsed');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-folder-label').forEach((label) => {
    label.addEventListener('click', () => toggleFolder(label));
  });
});
