// ===== To-Do List Application =====

const STORAGE_KEY = "todo.tasks";

// DOM references
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter");

// App state
let tasks = loadTasks();
let currentFilter = "all";

// ===== Storage helpers =====
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== Core actions =====
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: trimmed,
    completed: false,
  });
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (trimmed) {
    task.text = trimmed;
    saveTasks();
  }
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

// ===== Rendering =====
function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function render() {
  list.innerHTML = "";
  const visible = getFilteredTasks();

  visible.forEach((task) => list.appendChild(createTaskElement(task)));

  // Empty state
  emptyState.classList.toggle("is-visible", visible.length === 0);

  // Counter
  const remaining = tasks.filter((t) => !t.completed).length;
  taskCount.textContent = `${remaining} task${remaining !== 1 ? "s" : ""} left`;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.completed ? " is-completed" : "");
  li.dataset.id = task.id;

  // Checkbox (mark complete)
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task__checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () => toggleComplete(task.id));

  // Task text (double-click to edit)
  const span = document.createElement("span");
  span.className = "task__text";
  span.textContent = task.text;
  span.title = "Double-click to edit";
  span.addEventListener("dblclick", () => startEditing(li, task));

  // Actions
  const actions = document.createElement("div");
  actions.className = "task__actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn icon-btn--edit";
  editBtn.innerHTML = "✏️";
  editBtn.title = "Edit task";
  editBtn.addEventListener("click", () => startEditing(li, task));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn icon-btn--delete";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, span, actions);
  return li;
}

function startEditing(li, task) {
  // Prevent multiple edit inputs
  if (li.querySelector(".task__edit-input")) return;

  const span = li.querySelector(".task__text");
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "task__edit-input";
  editInput.value = task.text;
  editInput.maxLength = 200;

  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  let finished = false;
  const commit = () => {
    if (finished) return;
    finished = true;
    editTask(task.id, editInput.value);
  };

  editInput.addEventListener("blur", commit);
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      finished = true;
      render();
    }
  });
}

// ===== Event listeners =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(input.value);
  input.value = "";
  input.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

// Initial render
render();
