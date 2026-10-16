/* ============================================================
   To-do list app
   Tasks persist locally via localStorage. To sync with Supabase
   instead, set window.TODO_SUPABASE = { url, anonKey, table }
   before this script runs.
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "alex-rivera-todo-tasks-v1";

  var form = document.getElementById("todo-form");
  if (!form) return;

  var input = document.getElementById("todo-input");
  var dateInput = document.getElementById("todo-date");
  var priorityFieldset = document.getElementById("todo-priority");
  var errorBox = document.getElementById("todo-error");
  var statusBox = document.getElementById("todo-status");
  var statusText = document.getElementById("todo-status-text");
  var retryBtn = document.getElementById("todo-retry");
  var metaBox = document.querySelector(".todo-meta");
  var countEl = document.getElementById("todo-count");
  var clearDoneBtn = document.getElementById("todo-clear-done");
  var listEl = document.getElementById("todo-list");
  var emptyEl = document.getElementById("todo-empty");

  var tasks = [];
  var currentPriority = "medium";

  var PRIORITY_META = {
    low: { label: "Low", emoji: "🍃" },
    medium: { label: "Medium", emoji: "⚡" },
    high: { label: "High", emoji: "🔥" }
  };

  /* ---------- Storage ---------- */
  function loadTasks() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          var parsed = raw ? JSON.parse(raw) : [];
          resolve(Array.isArray(parsed) ? parsed : []);
        } catch (err) {
          reject(err);
        }
      }, 350);
    });
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      showError("Couldn't save your tasks in this browser, but you can keep adding them.");
    }
  }

  /* ---------- Helpers ---------- */
  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(date.getTime())) return iso;
    if (iso === todayISO()) return "Today";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function showError(message) {
    errorBox.textContent = message || "";
  }

  function showStatus(message, isError) {
    statusBox.hidden = false;
    statusText.textContent = message;
    retryBtn.hidden = !isError;
    statusText.style.color = isError ? "var(--coral-deep)" : "";
  }

  function hideStatus() {
    statusBox.hidden = true;
  }

  /* ---------- Rendering ---------- */
  function render() {
    listEl.innerHTML = "";

    if (!tasks.length) {
      emptyEl.hidden = false;
      metaBox.hidden = true;
    } else {
      emptyEl.hidden = true;
      metaBox.hidden = false;

      tasks.forEach(function (task) {
        listEl.appendChild(renderItem(task));
      });
    }

    var doneCount = tasks.filter(function (t) { return t.done; }).length;
    countEl.textContent = doneCount
      ? doneCount + " of " + tasks.length + " done"
      : tasks.length + (tasks.length === 1 ? " task" : " tasks");

    clearDoneBtn.hidden = doneCount === 0;
  }

  function renderItem(task) {
    var meta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

    var li = document.createElement("li");
    li.className = "todo-item" + (task.done ? " is-done" : "");

    var label = document.createElement("label");
    label.className = "todo-check";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!task.done;
    checkbox.setAttribute("aria-label", "Mark “" + task.text + "” as done");
    checkbox.addEventListener("change", function () {
      task.done = checkbox.checked;
      saveTasks();
      render();
    });

    var checkUi = document.createElement("span");
    checkUi.className = "todo-checkbox-ui";
    checkUi.setAttribute("aria-hidden", "true");
    checkUi.textContent = "✓";

    label.appendChild(checkbox);
    label.appendChild(checkUi);

    var body = document.createElement("div");
    body.className = "todo-body";

    var text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = task.text;

    var metaLine = document.createElement("span");
    metaLine.className = "todo-item-meta";

    var priority = document.createElement("span");
    priority.innerHTML =
      '<span class="todo-dot ' + task.priority + '"></span>' +
      meta.emoji + " " + meta.label;

    metaLine.appendChild(priority);

    if (task.date) {
      var date = document.createElement("span");
      date.textContent = "📅 " + formatDate(task.date);
      metaLine.appendChild(date);
    }

    body.appendChild(text);
    body.appendChild(metaLine);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "todo-delete";
    del.setAttribute("aria-label", "Delete “" + task.text + "”");
    del.textContent = "🗑️";
    del.addEventListener("click", function () {
      tasks = tasks.filter(function (t) { return t.id !== task.id; });
      saveTasks();
      render();
    });

    li.appendChild(label);
    li.appendChild(body);
    li.appendChild(del);

    return li;
  }

  /* ---------- Events ---------- */
  priorityFieldset.addEventListener("click", function (event) {
    var btn = event.target.closest(".priority-btn");
    if (!btn) return;

    currentPriority = btn.dataset.priority;

    priorityFieldset.querySelectorAll(".priority-btn").forEach(function (other) {
      var selected = other === btn;
      other.classList.toggle("selected", selected);
      other.setAttribute("aria-checked", String(selected));
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var text = input.value.trim();
    if (!text) {
      showError("Please enter a task before adding it to the list.");
      input.focus();
      return;
    }

    showError("");

    tasks.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text,
      date: dateInput.value || todayISO(),
      priority: currentPriority,
      done: false
    });

    saveTasks();
    render();

    input.value = "";
    input.focus();
  });

  input.addEventListener("input", function () {
    if (input.value.trim()) showError("");
  });

  clearDoneBtn.addEventListener("click", function () {
    tasks = tasks.filter(function (t) { return !t.done; });
    saveTasks();
    render();
  });

  retryBtn.addEventListener("click", init);

  /* ---------- Boot ---------- */
  function init() {
    showStatus("Fetching your tasks…", false);
    loadTasks()
      .then(function (loaded) {
        tasks = loaded;
        dateInput.value = todayISO();
        hideStatus();
        render();
      })
      .catch(function () {
        showStatus("Couldn't load your tasks.", true);
      });
  }

  init();
})();
