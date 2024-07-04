document.addEventListener('DOMContentLoaded', () => {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let editingTaskId = null;
    let intervalIds = {};

    const loginForm = document.getElementById('login-form');
    const signUpForm = document.getElementById('signup-form');
    const taskForm = document.getElementById('task-form');
    const tasksTableBody = document.getElementById('tasks-table-body');
    const taskSelector = document.getElementById('task-selector');
    const toggleModeButton = document.getElementById('toggle-mode');
    const logoutButton = document.getElementById('logout');
    const authContainer = document.getElementById('auth-container');
    const taskManager = document.getElementById('task-manager');
    const analyticsDiv = document.getElementById('analytics');

    loginForm.addEventListener('submit', login);
    signUpForm.addEventListener('submit', signUp);
    taskForm.addEventListener('submit', addOrUpdateTask);
    toggleModeButton.addEventListener('click', toggleMode);
    logoutButton.addEventListener('click', logout);
    taskSelector.addEventListener('change', updateAnalytics);

    if (currentUser) {
        showTaskManager();
    } else {
        showAuthForms();
    }

    function showAuthForms() {
        authContainer.style.display = 'block';
        taskManager.style.display = 'none';
    }

    function showTaskManager() {
        authContainer.style.display = 'none';
        taskManager.style.display = 'block';
        displayTasks();
        updateTaskSelector();
    }

    function login(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showTaskManager();
        } else {
            alert('Email not recognized. Please sign up.');
            loginForm.reset();
            signUpForm.style.display = 'block';
        }
    }

    function signUp(event) {
        event.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        const userExists = users.some(user => user.email === email);
        if (userExists) {
            alert('Email already exists. Please log in.');
            signUpForm.reset();
        } else {
            const newUser = { username, email, password };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showTaskManager();
        }
    }

    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showAuthForms();
    }

    function toggleMode() {
        document.body.classList.toggle('dark-mode');
    }

    function addOrUpdateTask(event) {
        event.preventDefault();
        const name = document.getElementById('task-name').value;
        const description = document.getElementById('task-desc').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const priority = document.getElementById('priority').value;

        if (editingTaskId) {
            const task = tasks.find(task => task.id === editingTaskId);
            task.name = name;
            task.description = description;
            task.startTime = startTime;
            task.endTime = endTime;
            task.priority = priority;
            task.status = 'Pending';
            task.elapsedTime = 0;
        } else {
            const newTask = {
                id: Date.now(),
                user: currentUser.email,
                name,
                description,
                startTime,
                endTime,
                priority,
                status: 'Pending',
                elapsedTime: 0
            };
            tasks.push(newTask);
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        editingTaskId = null;
        taskForm.reset();
        displayTasks();
        updateTaskSelector();
    }

    function displayTasks() {
        tasksTableBody.innerHTML = '';
        tasks.filter(task => task.user === currentUser.email).forEach(task => {
            const taskRow = document.createElement('tr');
            taskRow.innerHTML = `
                <td>${task.name}</td>
                <td>${task.description}</td>
                <td>${new Date(task.startTime).toLocaleString()}</td>
                <td>${new Date(task.endTime).toLocaleString()}</td>
                <td class="${task.priority}">${task.priority}</td>
                <td>${task.status}</td>
                <td class="actions">
                    <button onclick="editTask(${task.id})"><i class="fa fa-edit"></i></button>
                    <button onclick="deleteTask(${task.id})"><i class="fa fa-trash"></i></button>
                    <button onclick="startTask(${task.id})"><i class="fa fa-play"></i></button>
                    <button onclick="endTask(${task.id})"><i class="fa fa-stop"></i></button>
                    <span id="timer-${task.id}">${formatTime(task.elapsedTime)}</span>
                </td>
            `;
            tasksTableBody.appendChild(taskRow);
        });
    }

    function editTask(taskId) {
        const task = tasks.find(task => task.id === taskId);
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('start-time').value = task.startTime;
        document.getElementById('end-time').value = task.endTime;
        document.getElementById('priority').value = task.priority;
        editingTaskId = taskId;
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasks();
        updateTaskSelector();
    }

    function startTask(taskId) {
        const task = tasks.find(task => task.id === taskId);
        task.status = 'In Progress';
        const startTime = new Date(task.startTime).getTime();
        const endTime = new Date(task.endTime).getTime();

        intervalIds[taskId] = setInterval(() => {
            const currentTime = Date.now();
            task.elapsedTime = currentTime - startTime;
            document.getElementById(`timer-${taskId}`).textContent = formatTime(task.elapsedTime);

            if (currentTime >= endTime) {
                task.status = 'Overdue';
            }

            localStorage.setItem('tasks', JSON.stringify(tasks));
        }, 1000);
    }

    function endTask(taskId) {
        clearInterval(intervalIds[taskId]);
        const task = tasks.find(task => task.id === taskId);
        task.status = 'Completed';
        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasks();
        updateTaskSelector();
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    function updateTaskSelector() {
        taskSelector.innerHTML = '<option value="">Select a task</option>';
        tasks.filter(task => task.user === currentUser.email).forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            taskSelector.appendChild(option);
        });
    }

    function updateAnalytics() {
        const taskId = taskSelector.value;
        if (!taskId) {
            analyticsDiv.innerHTML = '';
            return;
        }

        const task = tasks.find(task => task.id == taskId);
        if (task) {
            const ctx = document.createElement('canvas');
            analyticsDiv.innerHTML = '';
            analyticsDiv.appendChild(ctx);

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Time Spent'],
                    datasets: [{
                        label: task.name,
                        data: [task.elapsedTime / 1000 / 60],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Time (minutes)'
                            }
                        }
                    }
                }
            });
        }
    }

    window.editTask = editTask;
    window.deleteTask = deleteTask;
    window.startTask = startTask;
    window.endTask = endTask;
});
