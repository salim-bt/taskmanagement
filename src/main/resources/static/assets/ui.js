const apiBase = "";
const tokenKey = "task_token";
const userKey = "task_user";

const routes = {
	login: "/ui/login",
	tasks: "/ui/tasks",
	users: "/ui/users",
	audit: "/ui/audit",
	home: "/ui"
};

/* ────────────────────────────────────────
   Auth helpers
   ──────────────────────────────────────── */
const auth = {
	getToken()  { return localStorage.getItem(tokenKey); },
	setToken(t) { localStorage.setItem(tokenKey, t); },
	clear()     {
		localStorage.removeItem(tokenKey);
		localStorage.removeItem(userKey);
		if (window.Alpine && Alpine.store('auth')) Alpine.store('auth').user = null;
	},
	setUser(u)  {
		localStorage.setItem(userKey, JSON.stringify(u));
		if (window.Alpine && Alpine.store('auth')) Alpine.store('auth').user = u;
	},
	getUser()   { const r = localStorage.getItem(userKey); return r ? JSON.parse(r) : null; }
};

/* ────────────────────────────────────────
   Alpine Stores
   ──────────────────────────────────────── */
document.addEventListener('alpine:init', () => {
	/* Auth store */
	Alpine.store('auth', {
		user: auth.getUser(),
		get isAdmin()       { return this.user?.role === 'ADMIN'; },
		get isViewer()      { return this.user?.role === 'VIEWER'; },
		get isManager()     { return ['ADMIN', 'MANAGER'].includes(this.user?.role); },
		get canViewAudit()  { return ['ADMIN', 'MANAGER', 'MEMBER'].includes(this.user?.role); },
		get canCreateTask() { return ['ADMIN', 'MANAGER'].includes(this.user?.role); },
		logout()            { auth.clear(); window.location.href = routes.login; }
	});

	/* Sidebar store */
	Alpine.store('sidebar', {
		mobileOpen: false,
		toggleMobile() { this.mobileOpen = !this.mobileOpen; }
	});

	/* Theme store */
	Alpine.store('theme', {
		mode: localStorage.getItem('tf_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
		toggle() {
			this.mode = this.mode === 'dark' ? 'light' : 'dark';
			localStorage.setItem('tf_theme', this.mode);
			if (this.mode === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	});

	/* Navigation store */
	Alpine.store('nav', {
		current: (() => {
			const p = window.location.pathname;
			if (p.endsWith('/tasks')) return 'tasks';
			if (p.endsWith('/users')) return 'users';
			if (p.endsWith('/audit')) return 'audit';
			if (p === '/ui' || p === '/ui/') return 'home';
			return '';
		})()
	});

	/* Command palette store */
	Alpine.store('cmd', {
		open: false,
		toggle() { this.open = !this.open; },
		close()  { this.open = false; }
	});
});

/* ────────────────────────────────────────
   Command Palette Alpine component
   ──────────────────────────────────────── */
function commandPalette() {
	return {
		query: '',
		selectedIndex: 0,

		get allCommands() {
			const u = Alpine.store('auth');
			const cmds = [
				{ id: 'tasks', label: 'Go to Tasks', shortcut: 'G T', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>', action: () => window.location.href = routes.tasks },
			];
			if (!u.isViewer) {
				cmds.unshift({ id: 'home', label: 'Go to Home', shortcut: 'G H', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>', action: () => window.location.href = routes.home });
			}
			if (u.canCreateTask) {
				cmds.push({ id: 'create', label: 'Create new task', shortcut: 'N', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>', action: () => { Alpine.store('cmd').close(); const a = document.querySelector('[x-data*="taskBoard"]'); if (a && a._x_dataStack) a._x_dataStack[0].openCreateSheet(); } });
			}
			if (u.isAdmin) {
				cmds.push({ id: 'members', label: 'Go to Members', shortcut: 'G M', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>', action: () => window.location.href = routes.users });
			}
			if (u.canViewAudit) {
				cmds.push({ id: 'activity', label: 'Go to Activity', shortcut: 'G A', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>', action: () => window.location.href = routes.audit });
			}
			cmds.push({ id: 'theme', label: 'Toggle theme', shortcut: '', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>', action: () => { Alpine.store('cmd').close(); Alpine.store('theme').toggle(); } });
			return cmds;
		},

		get filteredCommands() {
			if (!this.query) return this.allCommands;
			const q = this.query.toLowerCase();
			return this.allCommands.filter(c => c.label.toLowerCase().includes(q));
		},

		run(cmd) {
			Alpine.store('cmd').close();
			cmd.action();
		}
	};
}

/* ────────────────────────────────────────
   Keyboard shortcuts
   ──────────────────────────────────────── */
function isInputFocused() {
	const tag = document.activeElement?.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
}

document.addEventListener('keydown', (e) => {
	/* Cmd/Ctrl+K: command palette */
	if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
		e.preventDefault();
		if (window.Alpine) Alpine.store('cmd').toggle();
		return;
	}

	/* Skip shortcuts when in input fields */
	if (isInputFocused()) return;

	const path = window.location.pathname;
	const isTasksPage = path.endsWith('/tasks');

	switch (e.key) {
		case 'n':
		case 'N':
			if (isTasksPage) {
				e.preventDefault();
				const alpine = document.querySelector('[x-data*="taskBoard"]');
				if (alpine && alpine._x_dataStack) alpine._x_dataStack[0].openCreateSheet();
			}
			break;
		case '/':
			if (isTasksPage) {
				e.preventDefault();
				const searchInput = document.querySelector('[x-ref="boardSearch"]');
				if (searchInput) searchInput.focus();
			}
			break;
		case 'r':
		case 'R':
			if (isTasksPage) {
				e.preventDefault();
				const refreshBtn = document.getElementById("refreshTasks");
				if (refreshBtn) refreshBtn.click();
			}
			break;
		case '?':
			if (isTasksPage) {
				e.preventDefault();
				const alpine = document.querySelector('[x-data*="taskBoard"]');
				if (alpine && alpine._x_dataStack) alpine._x_dataStack[0].shortcutsOpen = true;
			}
			break;
	}
});

/* ────────────────────────────────────────
   Toast notification system
   ──────────────────────────────────────── */
function createToastContainer() {
	let c = document.getElementById("toastContainer");
	if (c) return c;
	c = document.createElement("div");
	c.id = "toastContainer";
	c.className = "fixed top-4 right-4 z-[300] space-y-3 w-80";
	c.setAttribute("role", "status");
	c.setAttribute("aria-live", "polite");
	c.setAttribute("aria-label", "Notifications");
	document.body.appendChild(c);
	return c;
}

function showToast(message, type = "info") {
	const container = createToastContainer();
	const toast = document.createElement("div");
	const colors = {
		success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/60 dark:border-emerald-700/50 dark:text-emerald-200",
		error:   "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/60 dark:border-red-700/50 dark:text-red-200",
		info:    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:border-blue-700/50 dark:text-blue-200",
		warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/60 dark:border-amber-700/50 dark:text-amber-200"
	};
	const icons = {
		success: `<svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
		error:   `<svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
		info:    `<svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
		warning: `<svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
	};
	toast.className = `flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm toast-enter backdrop-blur-sm ${colors[type] || colors.info}`;
	toast.innerHTML = `
		<div class="shrink-0 mt-0.5">${icons[type] || icons.info}</div>
		<p class="flex-1 text-[13px]">${escHtml(message)}</p>
		<button class="shrink-0 opacity-50 hover:opacity-100 transition-opacity" onclick="this.parentElement.remove()" aria-label="Dismiss">
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
		</button>`;
	container.appendChild(toast);
	setTimeout(() => {
		toast.classList.remove("toast-enter");
		toast.classList.add("toast-exit");
		setTimeout(() => toast.remove(), 250);
	}, 4000);
}

/* ────────────────────────────────────────
   Button loading spinner helper
   ──────────────────────────────────────── */
function setButtonLoading(buttonId, spinnerId, loading) {
	const btn = document.getElementById(buttonId);
	const spinner = document.getElementById(spinnerId);
	if (btn) btn.disabled = loading;
	if (spinner) spinner.classList.toggle("hidden", !loading);
}

/* ────────────────────────────────────────
   Confirmation dialog (with keyboard)
   ──────────────────────────────────────── */
function showConfirmDialog(message, onConfirm) {
	const overlay = document.createElement("div");
	overlay.className = "fixed inset-0 z-[300] flex items-center justify-center modal-backdrop";
	overlay.setAttribute("role", "alertdialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-label", "Confirm action");
	overlay.innerHTML = `
		<div class="bg-surface-3 rounded-xl shadow-2xl border border-border-strong p-6 max-w-sm w-full mx-4">
			<h3 class="text-base font-semibold text-text-primary mb-2">Confirm action</h3>
			<p class="text-sm text-text-secondary mb-6">${escHtml(message)}</p>
			<div class="flex justify-end gap-3">
				<button id="confirmCancel" class="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-4 border border-border-strong rounded-lg hover:bg-surface-5 transition-colors cursor-pointer">Cancel</button>
				<button id="confirmOk" class="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors cursor-pointer">Confirm</button>
			</div>
		</div>`;
	document.body.appendChild(overlay);

	const cancelBtn = overlay.querySelector("#confirmCancel");
	const okBtn = overlay.querySelector("#confirmOk");

	const close = () => overlay.remove();
	cancelBtn.addEventListener("click", close);
	okBtn.addEventListener("click", () => { close(); onConfirm(); });
	overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

	/* Keyboard: Enter to confirm, Escape to cancel */
	const handleKey = (e) => {
		if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleKey); }
		if (e.key === 'Enter') { close(); onConfirm(); document.removeEventListener('keydown', handleKey); }
	};
	document.addEventListener('keydown', handleKey);

	/* Focus the cancel button by default (safer) */
	cancelBtn.focus();
}

/* ────────────────────────────────────────
   User cache & assignee helpers
   ──────────────────────────────────────── */
let cachedUsers = null;

async function loadUsersForAssignee() {
	if (cachedUsers) return cachedUsers;
	const user = auth.getUser();
	if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return [];
	const endpoint = user.role === "ADMIN" ? "/api/users" : "/api/users/assignable";
	try {
		const r = await apiRequest(endpoint, {}, true);
		if (r && r.ok) { cachedUsers = await r.json(); return cachedUsers; }
	} catch (_) {}
	return [];
}

async function populateAssigneeDropdown() {
	const sel = document.getElementById("taskAssignee");
	if (!sel) return;
	const users = await loadUsersForAssignee();
	users.forEach(u => {
		const opt = document.createElement("option");
		opt.value = u.id;
		opt.textContent = u.email;
		sel.appendChild(opt);
	});
}

function getUserDisplay(userId) {
	if (!userId) return { initials: "?", label: "Unassigned" };
	if (cachedUsers) {
		const u = cachedUsers.find(x => x.id === userId);
		if (u) {
			const name = u.email.split("@")[0];
			return { initials: name.substring(0, 2).toUpperCase(), label: u.email };
		}
	}
	return { initials: "#" + userId, label: "User #" + userId };
}

/* ────────────────────────────────────────
   Form validation helper
   ──────────────────────────────────────── */
function setupFormValidation(formId) {
	const form = document.getElementById(formId);
	if (!form) return;
	form.querySelectorAll("input, textarea, select").forEach(field => {
		field.addEventListener("invalid", (e) => {
			e.preventDefault();
			field.classList.add("border-red-500", "focus:ring-red-500");
			let msg = field.nextElementSibling;
			if (!msg || !msg.classList.contains("validation-msg")) {
				msg = document.createElement("p");
				msg.className = "validation-msg text-xs text-red-400 mt-1";
				msg.setAttribute("role", "alert");
				field.after(msg);
			}
			msg.textContent = field.validationMessage;
		});
		field.addEventListener("input", () => {
			field.classList.remove("border-red-500", "focus:ring-red-500");
			const msg = field.nextElementSibling;
			if (msg && msg.classList.contains("validation-msg")) msg.remove();
		});
	});
}

/* ────────────────────────────────────────
   Skeleton helpers (dark)
   ──────────────────────────────────────── */
function showBoardSkeleton(show) {
	const skel = document.getElementById("boardSkeleton");
	const board = document.getElementById("boardGrid");
	if (skel) skel.classList.toggle("hidden", !show);
	if (board) board.classList.toggle("hidden", show);
}

function renderListSkeleton(containerId, count = 4) {
	const c = document.getElementById(containerId);
	if (!c) return;
	c.innerHTML = "";
	for (let i = 0; i < count; i++) {
		const d = document.createElement("div");
		d.className = "animate-pulse flex items-center gap-4 p-4 border-b border-border-subtle";
		d.innerHTML = `<div class="w-2 h-2 bg-surface-5 rounded-full shrink-0"></div>
			<div class="flex-1 space-y-2"><div class="h-3 bg-surface-4 rounded w-3/4"></div><div class="h-2 bg-surface-3 rounded w-1/2"></div></div>
			<div class="h-3 bg-surface-4 rounded w-16"></div>`;
		c.appendChild(d);
	}
}

function renderEmptyState(container, message, sub) {
	const d = document.createElement("div");
	d.className = "flex flex-col items-center justify-center py-16 text-center";
	d.innerHTML = `
		<svg class="w-10 h-10 text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
		<p class="text-sm text-text-secondary font-medium">${message}</p>
		${sub ? `<p class="text-xs text-text-tertiary mt-1">${sub}</p>` : ""}`;
	container.appendChild(d);
}

/* ────────────────────────────────────────
   API request
   ──────────────────────────────────────── */
async function apiRequest(path, options = {}, silent = false) {
	const headers = options.headers || {};
	headers["Content-Type"] = "application/json";
	const token = auth.getToken();
	if (token) headers["Authorization"] = `Bearer ${token}`;
	try {
		const response = await fetch(`${apiBase}${path}`, { ...options, headers });
		if (response.status === 401) {
			auth.clear();
			if (!silent) showToast("Session expired. Redirecting to login...", "warning");
			setTimeout(() => { window.location.href = routes.login; }, 1200);
			return null;
		}
		if (response.status === 403 && !silent) {
			showToast("You do not have permission for this action.", "error");
		}
		if (response.status >= 500 && !silent) {
			showToast("Server error. Please try again later.", "error");
		}
		return response;
	} catch (err) {
		if (!silent) showToast("Network error. Please check your connection.", "error");
		return null;
	}
}

async function ensureUserProfile(silent = false) {
	const cached = auth.getUser();
	if (cached) return cached;

	const token = auth.getToken();
	if (!token) return null;

	const r = await apiRequest("/api/users/me", {}, silent);
	if (!r || !r.ok) return null;
	const data = await r.json();
	auth.setUser(data);
	return data;
}

/* ────────────────────────────────────────
   Login / Register
   ──────────────────────────────────────── */
async function initLogin() {
	const loginForm = document.getElementById("loginForm");
	const registerForm = document.getElementById("registerForm");
	if (!loginForm || !registerForm) return;

	setupFormValidation("loginForm");
	setupFormValidation("registerForm");

	loginForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		setButtonLoading("loginSubmitBtn", "loginSpinner", true);
		try {
			const r = await apiRequest("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({
					email: document.getElementById("email").value,
					password: document.getElementById("password").value
				})
			});
			if (!r || !r.ok) { showToast("Invalid credentials. Please try again.", "error"); return; }
			const data = await r.json();
			auth.setToken(data.token);
			await ensureUserProfile();
			showToast("Welcome back!", "success");
			setTimeout(() => { window.location.href = routes.tasks; }, 600);
		} catch (_) {
			showToast("Something went wrong. Please try again.", "error");
		} finally {
			setButtonLoading("loginSubmitBtn", "loginSpinner", false);
		}
	});

	registerForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		setButtonLoading("registerSubmitBtn", "registerSpinner", true);
		try {
			const r = await apiRequest("/api/auth/register", {
				method: "POST",
				body: JSON.stringify({
					email: document.getElementById("regEmail").value,
					password: document.getElementById("regPassword").value
				})
			});
			if (!r || !r.ok) { showToast("Registration failed. Email may already be in use.", "error"); return; }
			const data = await r.json();
			auth.setToken(data.token);
			await ensureUserProfile();
			showToast("Account created successfully!", "success");
			setTimeout(() => { window.location.href = routes.tasks; }, 600);
		} catch (_) {
			showToast("Something went wrong. Please try again.", "error");
		} finally {
			setButtonLoading("registerSubmitBtn", "registerSpinner", false);
		}
	});
}

/* ────────────────────────────────────────
   Alpine.js taskBoard() component
   ──────────────────────────────────────── */
function taskBoard() {
	return {
		/* Sheet state */
		sheetOpen: false,
		/* Detail modal state */
		detailOpen: false,
		detailTask: {},
		editing: false,
		editForm: {},
		saving: false,
		/* Permissions */
		canEdit: false,
		canDelete: false,
		/* Filter state */
		searchQuery: '',
		statusFilter: '',
		myTasksOnly: false,
		allTasks: [],
		noResults: false,
		/* Shortcuts modal */
		shortcutsOpen: false,
		/* Computed-style getters */
		get detailAssignee() { return getUserDisplay(this.detailTask.assigneeId); },
		get detailCreator()  { return getUserDisplay(this.detailTask.createdById); },

		countByStatus(status) {
			return this.allTasks.filter(t => t.status === status).length;
		},

		applyFilters() {
			const user = auth.getUser();
			if (!user) return;
			let filtered = [...this.allTasks];
			if (this.searchQuery) {
				const q = this.searchQuery.toLowerCase();
				filtered = filtered.filter(t =>
					(t.title && t.title.toLowerCase().includes(q)) ||
					(t.description && t.description.toLowerCase().includes(q))
				);
			}
			if (this.statusFilter) {
				filtered = filtered.filter(t => t.status === this.statusFilter);
			}
			if (this.myTasksOnly) {
				filtered = filtered.filter(t => t.assigneeId === user.id);
			}
			this.noResults = filtered.length === 0 && this.allTasks.length > 0;
			const noResultsEl = document.getElementById("noResults");
			const boardGrid = document.getElementById("boardGrid");
			if (this.noResults) {
				if (boardGrid) boardGrid.classList.add("hidden");
			} else {
				if (boardGrid) boardGrid.classList.remove("hidden");
			}
			renderKanbanView(filtered, user);
		},

		clearFilters() {
			this.searchQuery = '';
			this.statusFilter = '';
			this.myTasksOnly = false;
			this.noResults = false;
			const user = auth.getUser();
			if (user) {
				const boardGrid = document.getElementById("boardGrid");
				if (boardGrid) boardGrid.classList.remove("hidden");
				renderKanbanView(this.allTasks, user);
			}
		},

		openCreateSheet() {
			const user = auth.getUser();
			if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
				showToast("Only managers and admins can create tasks.", "warning");
				return;
			}
			this.sheetOpen = true;
			this.$nextTick(() => {
				const el = document.getElementById("taskTitle");
				if (el) el.focus();
			});
		},

		openDetail(task) {
			const user = auth.getUser();
			if (!user) return;
			this.detailTask = { ...task };
			this.editing = false;
			this.saving = false;
			this.canEdit = user.role === "ADMIN" || user.role === "MANAGER" ||
				(user.role === "MEMBER" && user.id === task.assigneeId);
			this.canDelete = user.role === "ADMIN";
			this.detailOpen = true;
		},

		startEditing() {
			this.editForm = {
				title: this.detailTask.title,
				description: this.detailTask.description || "",
				status: this.detailTask.status,
				assigneeId: this.detailTask.assigneeId ?? ""
			};
			this.editing = true;
			this.$nextTick(() => {
				const sel = document.getElementById("detailAssigneeSelect");
				if (sel && cachedUsers) {
					while (sel.options.length > 1) sel.remove(1);
					cachedUsers.forEach(u => {
						const opt = document.createElement("option");
						opt.value = u.id;
						opt.textContent = u.email;
						if (u.id === this.detailTask.assigneeId) opt.selected = true;
						sel.appendChild(opt);
					});
				}
			});
		},

		cancelEditing() { this.editing = false; },

		async saveEdits() {
			this.saving = true;
			const payload = {};
			if (this.editForm.title !== this.detailTask.title) payload.title = this.editForm.title;
			if (this.editForm.description !== (this.detailTask.description || "")) payload.description = this.editForm.description;
			if (this.editForm.status !== this.detailTask.status) payload.status = this.editForm.status;
			const newAssignee = this.editForm.assigneeId === "" ? null : parseInt(this.editForm.assigneeId, 10);
			if (newAssignee !== this.detailTask.assigneeId) payload.assigneeId = newAssignee;

			if (Object.keys(payload).length === 0) {
				this.editing = false;
				this.saving = false;
				return;
			}
			const r = await apiRequest(`/api/tasks/${this.detailTask.id}`, {
				method: "PUT", body: JSON.stringify(payload)
			});
			this.saving = false;
			if (r && r.ok) {
				showToast("Task updated", "success");
				this.editing = false;
				this.detailOpen = false;
				await loadBoard();
			} else {
				showToast("Failed to update task", "error");
			}
		},

		confirmDelete() {
			const id = this.detailTask.id;
			const title = this.detailTask.title;
			showConfirmDialog(
				`Permanently delete "${title}"? This action cannot be undone.`,
				async () => {
					const r = await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
					if (r && (r.ok || r.status === 204)) {
						showToast("Task deleted", "success");
						this.detailOpen = false;
						await loadBoard();
					} else {
						showToast("Failed to delete task", "error");
					}
				}
			);
		},

		nextStatus(status) {
			if (status === "TODO") return "DOING";
			if (status === "DOING") return "DONE";
			return null;
		},

		async quickMove() {
			const next = this.nextStatus(this.detailTask.status);
			if (!next) return;
			const r = await apiRequest(`/api/tasks/${this.detailTask.id}`, {
				method: "PUT", body: JSON.stringify({ status: next })
			});
			if (r && r.ok) {
				showToast(`Task moved to ${next}`, "success");
				this.detailOpen = false;
				await loadBoard();
			} else {
				showToast("Failed to move task", "error");
			}
		}
	};
}

/* ────────────────────────────────────────
   Task Board - load & render
   ──────────────────────────────────────── */
async function initTasks() {
	showBoardSkeleton(true);

	const user = await ensureUserProfile();
	if (!user) return;

	/* Hide new-task button for non-creators */
	const newBtn = document.getElementById("newTaskBtn");
	if (newBtn && user.role !== "ADMIN" && user.role !== "MANAGER") {
		newBtn.classList.add("hidden");
	}

	/* Populate assignee dropdown in the create-sheet (once) */
	const sel = document.getElementById("taskAssignee");
	if (sel && sel.options.length <= 1) {
		await populateAssigneeDropdown();
	}

	/* Refresh button */
	const refreshBtn = document.getElementById("refreshTasks");
	if (refreshBtn && !refreshBtn.dataset.bound) {
		refreshBtn.dataset.bound = "true";
		refreshBtn.addEventListener("click", async () => {
			const icon = document.getElementById("refreshIcon");
			if (icon) icon.classList.add("animate-spin");
			await loadBoard();
			if (icon) icon.classList.remove("animate-spin");
		});
	}

	/* Create task form in slide-over */
	const form = document.getElementById("taskForm");
	const hint = document.getElementById("taskFormHint");
	if (form && hint) {
		const canCreate = user.role === "ADMIN" || user.role === "MANAGER";
		if (!canCreate) {
			hint.textContent = "Only managers and admins can create tasks.";
		}
		setupFormValidation("taskForm");
		if (!form.dataset.bound) {
			form.dataset.bound = "true";
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				if (!canCreate) return;
				setButtonLoading("createTaskBtn", "createTaskSpinner", true);
				try {
					const payload = {
						title: document.getElementById("taskTitle").value,
						description: document.getElementById("taskDescription").value,
						assigneeId: parseInt(document.getElementById("taskAssignee").value || "", 10) || null
					};
					const cr = await apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
					if (cr && cr.ok) {
						form.reset();
						showToast("Task created successfully", "success");
						const alpine = document.querySelector('[x-data*="taskBoard"]');
						if (alpine && alpine._x_dataStack) alpine._x_dataStack[0].sheetOpen = false;
						await loadBoard();
					} else {
						showToast("Failed to create task", "error");
					}
				} finally {
					setButtonLoading("createTaskBtn", "createTaskSpinner", false);
				}
			});
		}
	}

	await loadBoard();
}

/* Separated so modals/sheets can call it without re-binding */
async function loadBoard() {
	const user = auth.getUser();
	if (!user) return;

	showBoardSkeleton(true);
	const response = await apiRequest("/api/tasks");
	if (!response || !response.ok) { showBoardSkeleton(false); return; }
	const tasks = await response.json();
	showBoardSkeleton(false);

	/* Store tasks in Alpine for filtering */
	const alpine = document.querySelector('[x-data*="taskBoard"]');
	if (alpine && alpine._x_dataStack) {
		alpine._x_dataStack[0].allTasks = tasks;
		/* Re-apply filters if any are active */
		const board = alpine._x_dataStack[0];
		if (board.searchQuery || board.statusFilter || board.myTasksOnly) {
			board.applyFilters();
			return;
		}
	}

	renderKanbanView(tasks, user);
}

/* ────────────────────────────────────────
   Kanban View Renderer
   ──────────────────────────────────────── */
const statusDotClass = { TODO: "status-dot-TODO", DOING: "status-dot-DOING", DONE: "status-dot-DONE" };
const statusColors = {
	TODO:  "border-l-gray-400",
	DOING: "border-l-yellow-400",
	DONE:  "border-l-accent"
};

function renderKanbanView(tasks, user) {
	const colTodo = document.getElementById("colTodo");
	const colDoing = document.getElementById("colDoing");
	const colDone = document.getElementById("colDone");
	const boardGrid = document.getElementById("boardGrid");
	if (!colTodo || !colDoing || !colDone) return;
	if (boardGrid) boardGrid.classList.remove("hidden");

	colTodo.innerHTML = "";
	colDoing.innerHTML = "";
	colDone.innerHTML = "";

	const grouped = { TODO: [], DOING: [], DONE: [] };
	tasks.forEach(t => grouped[t.status]?.push(t));

	const todoCount = document.getElementById("todoCount");
	const doingCount = document.getElementById("doingCount");
	const doneCount = document.getElementById("doneCount");
	if (todoCount) todoCount.textContent = grouped.TODO.length;
	if (doingCount) doingCount.textContent = grouped.DOING.length;
	if (doneCount) doneCount.textContent = grouped.DONE.length;

	const columns = { TODO: colTodo, DOING: colDoing, DONE: colDone };
	Object.entries(grouped).forEach(([status, items]) => {
		if (items.length === 0) {
			renderEmptyState(columns[status], "No tasks", "Drag a card here");
		} else {
			items.forEach(task => columns[status].appendChild(renderTaskCard(task, user)));
		}
	});

	setupBoardDnD(user);
}

/* ────────────────────────────────────────
   Render single task card (dark)
   ──────────────────────────────────────── */
function renderTaskCard(task, user) {
	const card = document.createElement("div");
	const canDrag = canMoveTask(user, task, null);
	const assignee = getUserDisplay(task.assigneeId);
	const created = task.createdAt ? timeAgo(task.createdAt) : "";
	const fullDate = task.createdAt ? new Date(task.createdAt).toLocaleString() : "";

	card.className = `task-card bg-surface-3 rounded-xl p-4 border border-border border-l-2 ${statusColors[task.status] || ''} transition-all group ${canDrag ? "cursor-grab hover:bg-surface-4" : "opacity-60"}`;
	card.setAttribute("role", "listitem");
	card.setAttribute("tabindex", "0");
	card.setAttribute("aria-label", `${task.title}, status: ${task.status}, assigned to: ${assignee.label}`);
	card.innerHTML = `
		<div class="flex items-start justify-between gap-2 mb-2">
			<h4 class="text-sm font-medium text-text-primary leading-snug line-clamp-2 cursor-pointer hover:text-accent transition-colors" data-open-detail="true">${escHtml(task.title)}</h4>
		</div>
		<p class="text-sm text-text-tertiary line-clamp-2 mb-3">${escHtml(task.description || "")}</p>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="w-6 h-6 rounded-full bg-accent-muted text-accent flex items-center justify-center text-[10px] font-bold" title="${escHtml(assignee.label)}" aria-hidden="true">${assignee.initials}</div>
				<span class="text-xs text-text-tertiary truncate max-w-[100px]">${escHtml(assignee.label)}</span>
			</div>
			<span class="text-xs text-text-tertiary" title="${fullDate}">${created}</span>
		</div>`;

	card.dataset.taskId = task.id;
	card.dataset.status = task.status;
	card.dataset.assigneeId = task.assigneeId ?? "";

	/* Open detail on click or Enter key */
	const openDetail = () => {
		if (card.classList.contains("dragging")) return;
		const alpine = document.querySelector('[x-data*="taskBoard"]');
		if (alpine && alpine._x_dataStack) alpine._x_dataStack[0].openDetail(task);
	};
	card.addEventListener("click", openDetail);
	card.addEventListener("keydown", (e) => {
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
	});

	if (canDrag) {
		card.setAttribute("draggable", "true");
		card.addEventListener("dragstart", handleDragStart);
		card.addEventListener("dragend", handleDragEnd);
	}

	return card;
}

function nextMemberStatus(status) {
	if (status === "TODO") return "DOING";
	if (status === "DOING") return "DONE";
	return null;
}

async function updateTaskStatus(id, status) {
	const r = await apiRequest(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
	if (r && r.ok) {
		showToast(`Task moved to ${status}`, "success");
		await loadBoard();
	} else {
		showToast("Failed to update task status", "error");
	}
}

/* ────────────────────────────────────────
   Drag and drop
   ──────────────────────────────────────── */
function setupBoardDnD(user) {
	document.querySelectorAll(".column-drop[data-status]").forEach(col => {
		if (col.dataset.bound) return;
		col.dataset.bound = "true";
		col.addEventListener("dragover", (e) => {
			e.preventDefault();
			col.classList.add("drag-over");
		});
		col.addEventListener("dragleave", () => {
			col.classList.remove("drag-over");
		});
		col.addEventListener("drop", async (e) => {
			e.preventDefault();
			col.classList.remove("drag-over");
			const payload = e.dataTransfer.getData("application/json");
			if (!payload) return;
			const data = JSON.parse(payload);
			const target = col.getAttribute("data-status");
			if (data.status === target) return;
			if (!canMoveTask(user, data, target)) return;
			await updateTaskStatus(data.id, target);
		});
	});
}

let dragStarted = false;
function handleDragStart(e) {
	dragStarted = true;
	const card = e.currentTarget;
	e.dataTransfer.effectAllowed = "move";
	e.dataTransfer.setData("application/json", JSON.stringify({
		id: parseInt(card.dataset.taskId, 10),
		status: card.dataset.status,
		assigneeId: card.dataset.assigneeId ? parseInt(card.dataset.assigneeId, 10) : null
	}));
	setTimeout(() => card.classList.add("dragging"), 0);
}

function handleDragEnd(e) {
	dragStarted = false;
	e.currentTarget.classList.remove("dragging");
}

function canMoveTask(user, task, targetStatus) {
	if (user.role === "ADMIN" || user.role === "MANAGER") return true;
	if (user.role !== "MEMBER") return false;
	if (user.id !== task.assigneeId) return false;
	if (!targetStatus) return true;
	return (task.status === "TODO" && targetStatus === "DOING") || (task.status === "DOING" && targetStatus === "DONE");
}

/* ────────────────────────────────────────
   Users page
   ──────────────────────────────────────── */
async function initUsers() {
	const list = document.getElementById("usersList");
	if (!list) return;
	renderListSkeleton("usersList", 4);

	const user = await ensureUserProfile();
	if (!user) return;

	const r = await apiRequest("/api/users");
	if (!r) return;
	if (r.status === 403) {
		list.innerHTML = "";
		renderEmptyState(list, "Admin access required", "Only administrators can manage users.");
		return;
	}
	const users = await r.json();
	cachedUsers = users;
	list.innerHTML = "";

	if (users.length === 0) {
		renderEmptyState(list, "No users found", "");
		return;
	}

	const roleBadgeColors = {
		ADMIN:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20",
		MANAGER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20",
		MEMBER:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
		VIEWER:  "bg-surface-5 text-text-secondary border-border-strong"
	};

	for (const item of users) {
		const name = item.email.split("@")[0];
		const initials = name.substring(0, 2).toUpperCase();
		const card = document.createElement("div");
		card.className = "flex items-center justify-between px-4 py-3 border-b border-border-subtle hover:bg-surface-4 transition-colors";
		card.setAttribute("data-user-email", item.email);
		card.innerHTML = `
			<div class="flex items-center gap-3 min-w-0">
				<div class="w-8 h-8 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">${initials}</div>
				<div class="min-w-0">
					<p class="text-sm font-medium text-text-primary truncate">${escHtml(item.email)}</p>
					<p class="text-[11px] text-text-tertiary">Joined ${new Date(item.createdAt).toLocaleDateString()}</p>
				</div>
			</div>
			<div class="flex items-center gap-3 shrink-0">
				<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadgeColors[item.role] || roleBadgeColors.VIEWER}">${item.role}</span>
				<label class="sr-only" for="role-select-${item.id}">Change role for ${escHtml(item.email)}</label>
				<select id="role-select-${item.id}" data-user-id="${item.id}" class="text-xs px-2.5 py-1.5 rounded-lg border border-border-strong bg-surface-3 text-text-secondary focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer">
					<option value="">Change role...</option>
					<option value="ADMIN">Admin</option>
					<option value="MANAGER">Manager</option>
					<option value="MEMBER">Member</option>
					<option value="VIEWER">Viewer</option>
				</select>
			</div>`;
		list.appendChild(card);
	}

	list.querySelectorAll("select[data-user-id]").forEach(sel => {
		sel.addEventListener("change", (e) => {
			const role = e.target.value;
			if (!role) return;
			const id = e.target.getAttribute("data-user-id");
			const email = e.target.closest("[data-user-email]")?.dataset.userEmail || `User #${id}`;
			showConfirmDialog(
				`Change ${email}'s role to ${role}? This will immediately affect their permissions.`,
				async () => {
					const ur = await apiRequest(`/api/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) });
					if (ur && ur.ok) {
						showToast(`Role updated to ${role}`, "success");
						cachedUsers = null;
						await initUsers();
					} else {
						showToast("Failed to update role", "error");
					}
				}
			);
			e.target.value = "";
		});
	});
}

/* ────────────────────────────────────────
   Audit page
   ──────────────────────────────────────── */
const fieldLabels = {
	id: "ID", title: "Title", description: "Description", status: "Status",
	assigneeId: "Assignee", createdById: "Created by", createdAt: "Created at"
};
const actionVerbs = { CREATE: "created", UPDATE: "updated", DELETE: "deleted" };

function parseAuditJson(raw) {
	if (!raw || raw === "null") return null;
	try { return JSON.parse(raw); } catch (_) { return null; }
}

function humanizeFieldValue(key, value) {
	if (value === null || value === undefined) return "None";
	if (key === "assigneeId" || key === "createdById") {
		const u = getUserDisplay(value);
		return u.label;
	}
	if (key === "createdAt") {
		return new Date(value).toLocaleString();
	}
	return String(value);
}

function buildDiffHtml(action, oldObj, newObj) {
	if (action === "CREATE" && newObj) {
		const rows = Object.keys(newObj)
			.filter(k => k !== "id" && k !== "createdAt" && k !== "createdById")
			.map(k => {
				const label = fieldLabels[k] || k;
				const val = humanizeFieldValue(k, newObj[k]);
				return `<div class="flex items-start gap-3 px-3 py-2 diff-add rounded-r">
					<span class="text-emerald-400 font-mono text-xs leading-5 select-none shrink-0">+</span>
					<span class="text-xs text-text-tertiary font-medium w-20 shrink-0">${label}</span>
					<span class="text-xs text-emerald-300 font-medium break-all">${escHtml(val)}</span>
				</div>`;
			}).join("");
		return `<div class="mt-3 pt-3 border-t border-border-subtle space-y-1">${rows}</div>`;
	}

	if (action === "DELETE" && oldObj) {
		const rows = Object.keys(oldObj)
			.filter(k => k !== "id" && k !== "createdAt" && k !== "createdById")
			.map(k => {
				const label = fieldLabels[k] || k;
				const val = humanizeFieldValue(k, oldObj[k]);
				return `<div class="flex items-start gap-3 px-3 py-2 diff-remove rounded-r">
					<span class="text-red-400 font-mono text-xs leading-5 select-none shrink-0">&minus;</span>
					<span class="text-xs text-text-tertiary font-medium w-20 shrink-0">${label}</span>
					<span class="text-xs text-red-300 font-medium break-all">${escHtml(val)}</span>
				</div>`;
			}).join("");
		return `<div class="mt-3 pt-3 border-t border-border-subtle space-y-1">${rows}</div>`;
	}

	if (action === "UPDATE" && oldObj && newObj) {
		const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
		const changedRows = [];
		for (const k of allKeys) {
			if (k === "id" || k === "createdAt" || k === "createdById") continue;
			const oldVal = oldObj[k];
			const newVal = newObj[k];
			if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
			const label = fieldLabels[k] || k;
			const oldStr = humanizeFieldValue(k, oldVal);
			const newStr = humanizeFieldValue(k, newVal);
			changedRows.push(`
				<div class="flex items-start gap-3 px-3 py-1.5 diff-remove rounded-r">
					<span class="text-red-400 font-mono text-xs leading-5 select-none shrink-0">&minus;</span>
					<span class="text-xs text-text-tertiary font-medium w-20 shrink-0">${label}</span>
					<span class="text-xs text-red-300 font-medium break-all">${escHtml(oldStr)}</span>
				</div>
				<div class="flex items-start gap-3 px-3 py-1.5 diff-add rounded-r">
					<span class="text-emerald-400 font-mono text-xs leading-5 select-none shrink-0">+</span>
					<span class="text-xs text-text-tertiary font-medium w-20 shrink-0">${label}</span>
					<span class="text-xs text-emerald-300 font-medium break-all">${escHtml(newStr)}</span>
				</div>`);
		}
		if (changedRows.length === 0) {
			return `<div class="mt-3 pt-3 border-t border-border-subtle"><p class="text-xs text-text-tertiary italic">No visible field changes</p></div>`;
		}
		return `<div class="mt-3 pt-3 border-t border-border-subtle">
			<div class="rounded-lg border border-border-subtle overflow-hidden divide-y divide-border-subtle">${changedRows.join("")}</div>
		</div>`;
	}

	return "";
}

function escHtml(str) {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}

function timeAgo(dateStr) {
	const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

function getChangedFieldLabels(oldObj, newObj) {
	if (!oldObj || !newObj) return [];
	const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
	const changed = [];
	for (const k of keys) {
		if (k === "id" || k === "createdAt" || k === "createdById") continue;
		if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
			changed.push(fieldLabels[k] || k);
		}
	}
	return changed;
}

function getLocalDayKey(dateStr) {
	const d = new Date(dateStr);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function formatAuditDayLabel(dayKey) {
	const [y, m, d] = dayKey.split("-").map(Number);
	const dayDate = new Date(y, m - 1, d);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);

	if (
		dayDate.getFullYear() === today.getFullYear() &&
		dayDate.getMonth() === today.getMonth() &&
		dayDate.getDate() === today.getDate()
	) {
		return "Today";
	}
	if (
		dayDate.getFullYear() === yesterday.getFullYear() &&
		dayDate.getMonth() === yesterday.getMonth() &&
		dayDate.getDate() === yesterday.getDate()
	) {
		return "Yesterday";
	}
	return dayDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

async function initAudit() {
	const list = document.getElementById("auditList");
	if (!list) return;
	renderListSkeleton("auditList", 5);

	const user = await ensureUserProfile();
	if (!user) return;

	const scope = document.getElementById("auditScope");
	const path = user.role === "ADMIN" ? "/api/audit" : "/api/audit/me";
	if (scope) scope.textContent = user.role === "ADMIN" ? "All activity" : "My activity";

	await loadUsersForAssignee();

	const r = await apiRequest(path);
	if (!r || !r.ok) { list.innerHTML = ""; return; }
	const logs = (await r.json()).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
	list.innerHTML = "";

	const actionColors = {
		CREATE: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
		UPDATE: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20",
		DELETE: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20"
	};
	const actionIconColors = {
		CREATE: "text-emerald-600 dark:text-emerald-400",
		UPDATE: "text-blue-600 dark:text-blue-400",
		DELETE: "text-red-600 dark:text-red-400"
	};
	const actionIcons = {
		CREATE: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
		UPDATE: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
		DELETE: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`
	};

	const dotBgColors = {
		CREATE: "bg-emerald-100 dark:bg-emerald-500/20",
		UPDATE: "bg-blue-100 dark:bg-blue-500/20",
		DELETE: "bg-red-100 dark:bg-red-500/20"
	};

	const totalEl = document.getElementById("auditTotalCount");
	const createEl = document.getElementById("auditCreateCount");
	const updateEl = document.getElementById("auditUpdateCount");
	const deleteEl = document.getElementById("auditDeleteCount");
	const searchInput = document.getElementById("auditSearch");
	const filterRoot = document.getElementById("auditActionFilters");
	const filterButtons = filterRoot ? Array.from(filterRoot.querySelectorAll("[data-action]")) : [];

	if (totalEl) totalEl.textContent = String(logs.length);
	if (createEl) createEl.textContent = String(logs.filter(l => l.action === "CREATE").length);
	if (updateEl) updateEl.textContent = String(logs.filter(l => l.action === "UPDATE").length);
	if (deleteEl) deleteEl.textContent = String(logs.filter(l => l.action === "DELETE").length);

	if (logs.length === 0) {
		renderEmptyState(list, "No audit entries yet", "Actions will appear here as tasks are created and updated.");
		return;
	}

	let activeAction = "ALL";
	let searchQuery = "";

	const renderAuditList = () => {
		const filtered = logs.filter(log => {
			if (activeAction !== "ALL" && log.action !== activeAction) return false;

			if (!searchQuery) return true;
			const oldObj = parseAuditJson(log.oldData);
			const newObj = parseAuditJson(log.newData);
			const changedFields = getChangedFieldLabels(oldObj, newObj).join(" ");
			const actor = getUserDisplay(log.userId);
			const title = newObj?.title || oldObj?.title || "";
			const haystack = [
				actor.label,
				log.action,
				log.entity,
				String(log.entityId),
				title,
				changedFields
			].join(" ").toLowerCase();
			return haystack.includes(searchQuery);
		});

		list.innerHTML = "";
		if (filtered.length === 0) {
			renderEmptyState(list, "No matching activity", "Try a different search or action filter.");
			return;
		}

		const grouped = new Map();
		for (const log of filtered) {
			const key = getLocalDayKey(log.timestamp);
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key).push(log);
		}

		for (const [dayKey, dayLogs] of grouped.entries()) {
			const section = document.createElement("section");
			section.className = "space-y-3";
			section.innerHTML = `
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">${formatAuditDayLabel(dayKey)}</h3>
					<span class="text-[11px] text-text-tertiary">${dayLogs.length} event${dayLogs.length > 1 ? "s" : ""}</span>
				</div>
			`;

			const dayList = document.createElement("div");
			dayList.className = "space-y-3";

			for (const log of dayLogs) {
				const entry = document.createElement("article");
				entry.className = "audit-entry bg-surface-2 border border-border rounded-xl p-4";

				const icon = actionIcons[log.action] || actionIcons.UPDATE;
				const dotBg = dotBgColors[log.action] || dotBgColors.UPDATE;
				const iconColor = actionIconColors[log.action] || actionIconColors.UPDATE;
				const actor = getUserDisplay(log.userId);
				const verb = actionVerbs[log.action] || log.action.toLowerCase();
				const oldObj = parseAuditJson(log.oldData);
				const newObj = parseAuditJson(log.newData);
				const entityTitle = newObj?.title || oldObj?.title || "";
				const changed = getChangedFieldLabels(oldObj, newObj);
				const changedSummary = changed.length > 0
					? `${changed.length} field${changed.length > 1 ? "s" : ""} changed${changed.length <= 3 ? `: ${changed.join(", ")}` : ""}`
					: "No field changes";
				const diffHtml = buildDiffHtml(log.action, oldObj, newObj);

				const detailsBlock = diffHtml
					? `<details class="mt-3">
						<summary class="cursor-pointer text-xs text-accent hover:text-accent-hover font-medium">View details</summary>
						${diffHtml}
					</details>`
					: "";

				entry.innerHTML = `
					<div class="flex items-start gap-3">
						<div class="w-9 h-9 rounded-full ${dotBg} ${iconColor} flex items-center justify-center shrink-0">${icon}</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-sm text-text-secondary leading-6">
										<span class="font-semibold text-text-primary">${escHtml(actor.label)}</span>
										${verb}
										<span class="font-medium text-text-primary">${escHtml(log.entity)} #${log.entityId}</span>
										${entityTitle ? `&mdash; <span class="font-semibold text-text-primary">${escHtml(entityTitle)}</span>` : ""}
									</p>
									<div class="flex items-center gap-2 mt-1 flex-wrap">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionColors[log.action] || ""}">${log.action}</span>
										${log.action === "UPDATE" ? `<span class="text-xs text-text-tertiary">${escHtml(changedSummary)}</span>` : ""}
									</div>
								</div>
								<div class="text-right shrink-0">
									<time class="block text-[11px] text-text-tertiary whitespace-nowrap" title="${new Date(log.timestamp).toLocaleString()}" datetime="${log.timestamp}">${timeAgo(log.timestamp)}</time>
									<span class="block text-[11px] text-text-tertiary mt-0.5">${new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
								</div>
							</div>
							${detailsBlock}
						</div>
					</div>
				`;

				dayList.appendChild(entry);
			}

			section.appendChild(dayList);
			list.appendChild(section);
		}
	};

	if (searchInput) {
		searchInput.addEventListener("input", () => {
			searchQuery = searchInput.value.trim().toLowerCase();
			renderAuditList();
		});
	}

	for (const btn of filterButtons) {
		btn.addEventListener("click", () => {
			activeAction = btn.dataset.action || "ALL";
			for (const chip of filterButtons) {
				chip.classList.toggle("active", chip === btn);
			}
			renderAuditList();
		});
	}

	renderAuditList();
}

/* ────────────────────────────────────────
   Dashboard (index page)
   ──────────────────────────────────────── */
function getGreeting() {
	const h = new Date().getHours();
	if (h < 12) return "Good morning";
	if (h < 17) return "Good afternoon";
	return "Good evening";
}

async function initDashboard() {
	const user = await ensureUserProfile(true);
	if (!user) {
		window.location.href = routes.login;
		return;
	}

	/* Time-of-day greeting */
	const greetEl = document.getElementById("dashboardGreeting");
	if (greetEl) {
		const name = user.email ? user.email.split("@")[0] : "";
		greetEl.textContent = `${getGreeting()}, ${name}`;
	}

	/* Load task stats */
	const statsEl = document.getElementById("dashboardStats");
	if (statsEl) {
		const r = await apiRequest("/api/tasks", {}, true);
		if (r && r.ok) {
			const tasks = await r.json();
			const todo = tasks.filter(t => t.status === "TODO").length;
			const doing = tasks.filter(t => t.status === "DOING").length;
			const done = tasks.filter(t => t.status === "DONE").length;
			const myTasks = tasks.filter(t => t.assigneeId === user.id).length;

			document.getElementById("statTotal").textContent = tasks.length;
			document.getElementById("statTodo").textContent = todo;
			document.getElementById("statDoing").textContent = doing;
			document.getElementById("statDone").textContent = done;
			document.getElementById("statMine").textContent = myTasks;

			/* Progress bar */
			const progressSection = document.getElementById("progressSection");
			if (progressSection && tasks.length > 0) {
				progressSection.classList.remove("hidden");
				const pct = Math.round((done / tasks.length) * 100);
				document.getElementById("progressPercent").textContent = `${pct}%`;
				document.getElementById("progressFill").style.width = `${pct}%`;
				document.getElementById("progressDone").textContent = done;
				document.getElementById("progressTotal").textContent = tasks.length;
				const labelEl = document.getElementById("progressLabel");
				if (labelEl) {
					if (pct === 100) labelEl.textContent = "All done!";
					else if (pct >= 75) labelEl.textContent = "Almost there";
					else if (pct >= 50) labelEl.textContent = "Halfway through";
					else if (doing > 0) labelEl.textContent = `${doing} in progress`;
					else labelEl.textContent = "";
				}
			}
		}
	}

	/* Load recent activity */
	const recentEl = document.getElementById("recentActivity");
	if (recentEl) {
		await loadUsersForAssignee();
		const auditPath = user.role === "ADMIN" ? "/api/audit" : "/api/audit/me";
		const r = await apiRequest(auditPath, {}, true);
		if (r && r.ok) {
			const logs = await r.json();
			const recent = logs.slice(0, 5);
			recentEl.innerHTML = "";
			if (recent.length === 0) {
				recentEl.innerHTML = '<p class="text-sm text-text-tertiary py-4 text-center">No recent activity</p>';
			} else {
				recent.forEach(log => {
					const actor = getUserDisplay(log.userId);
					const verb = actionVerbs[log.action] || log.action.toLowerCase();
					const oldObj = parseAuditJson(log.oldData);
					const newObj = parseAuditJson(log.newData);
					const title = newObj?.title || oldObj?.title || `#${log.entityId}`;
					const row = document.createElement("div");
					row.className = "flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-4 transition-colors rounded";
					row.setAttribute("role", "listitem");
					const dotColor = log.action === "CREATE" ? "bg-emerald-400" : log.action === "DELETE" ? "bg-red-400" : "bg-blue-400";
					row.innerHTML = `
						<span class="w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0" aria-hidden="true"></span>
						<span class="text-[13px] text-text-secondary flex-1 truncate">
							<span class="text-text-primary font-medium">${escHtml(actor.label.split('@')[0])}</span>
							${verb}
							<span class="text-text-primary">${escHtml(title)}</span>
						</span>
						<span class="text-[11px] text-text-tertiary flex-shrink-0">${timeAgo(log.timestamp)}</span>`;
					recentEl.appendChild(row);
				});
			}
		}
	}
}

/* ────────────────────────────────────────
   Bootstrap on DOM ready
   ──────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
	const path = window.location.pathname;

	if (path.endsWith("/login")) { initLogin(); return; }

	/* For index: init dashboard if authenticated, otherwise show landing */
	if (path === "/ui" || path === "/ui/") {
		if (auth.getToken()) {
			initDashboard();
		}
		return;
	}

	/* All other pages require auth */
	if (!auth.getToken()) { window.location.href = routes.login; return; }

	if (path.endsWith("/tasks")) initTasks();
	if (path.endsWith("/users")) initUsers();
	if (path.endsWith("/audit")) initAudit();
});
