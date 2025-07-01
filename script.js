document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabaseUrl = 'https://pekzgmsqjmvyeaedsirl.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla3pnbXNxam12eWVhZWRzaXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzE1MjEsImV4cCI6MjA2NjkwNzUyMX0.qUQ4z5aSKofuwBaqxDWxJwa1i9BY12vKJaUs4W5T_28';
    
    // Check if Supabase is available
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        return;
    }
    
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');

    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');

    // Fetch and render all tasks from Supabase
    async function loadTasks() {
        console.log('Loading tasks from Supabase...');
        const { data: tasks, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        console.log('Load tasks response:', { data: tasks, error });
        
        if (error) {
            console.error('Error loading tasks:', error);
            return;
        }
        
        console.log('Tasks loaded successfully:', tasks);
        taskList.innerHTML = '';
        tasks.forEach(renderTask);
    }

    // Render a single task
    function renderTask(task) {
        const li = document.createElement('li');
        li.style.flexDirection = 'column';
        li.style.alignItems = 'stretch';

        // Row for main task controls
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.width = '100%';

        // Toggle button for notes
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '>';
        toggleBtn.className = 'toggle-notes-btn';
        toggleBtn.style.marginRight = '10px';
        row.appendChild(toggleBtn);

        // Task title
        const textSpan = document.createElement('span');
        textSpan.textContent = task.title;
        textSpan.style.flex = '1';
        row.appendChild(textSpan);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✖️';
        deleteBtn.className = 'delete-btn';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.onclick = async function() {
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', task.id);
            
            if (error) {
                console.error('Error deleting task:', error);
                return;
            }
            
            li.remove();
        };

        // Streak display (clickable)
        const streakBtn = document.createElement('button');
        streakBtn.textContent = `${task.streak || 0}🔥`;
        streakBtn.className = 'streak-btn';
        streakBtn.style.marginLeft = '10px';
        streakBtn.onclick = async function() {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            if (task.last_done_date === today) {
                alert('You already marked this task for today!');
                return;
            }
            
            let newStreak = 1;
            if (task.last_done_date) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (task.last_done_date === yesterday) {
                    newStreak = (task.streak || 0) + 1;
                }
            }
            
            const { error } = await supabaseClient
                .from('tasks')
                .update({ 
                    streak: newStreak, 
                    last_done_date: today 
                })
                .eq('id', task.id);
            
            if (error) {
                console.error('Error updating streak:', error);
                return;
            }
            
            task.streak = newStreak;
            task.last_done_date = today;
            streakBtn.textContent = `${newStreak}🔥`;
        };

        row.appendChild(streakBtn);
        row.appendChild(deleteBtn);
        li.appendChild(row);

        // Notes container (hidden by default)
        const notesContainer = document.createElement('div');
        notesContainer.style.display = 'none';
        notesContainer.style.marginTop = '8px';
        notesContainer.style.width = '100%';

        const notesTextarea = document.createElement('textarea');
        notesTextarea.placeholder = 'Write notes for this task...';
        notesTextarea.rows = 3;
        notesTextarea.style.width = '98%';
        notesTextarea.style.resize = 'vertical';
        notesTextarea.value = task.notes || '';
        notesTextarea.onchange = async function() {
            const { error } = await supabaseClient
                .from('tasks')
                .update({ notes: notesTextarea.value })
                .eq('id', task.id);
            
            if (error) {
                console.error('Error updating notes:', error);
                return;
            }
            
            task.notes = notesTextarea.value;
        };
        notesContainer.appendChild(notesTextarea);

        toggleBtn.onclick = function() {
            if (notesContainer.style.display === 'none') {
                notesContainer.style.display = 'block';
                toggleBtn.textContent = 'v';
            } else {
                notesContainer.style.display = 'none';
                toggleBtn.textContent = '>';
            }
        };

        li.appendChild(notesContainer);
        taskList.appendChild(li);
    }

    // Add a new task
    addBtn.addEventListener('click', async function() {
        console.log('Add button clicked!');
        const taskText = taskInput.value.trim();
        console.log('Task text:', taskText);
        if (taskText === '') return;
        
        console.log('Attempting to insert task into Supabase...');
        const { data: newTask, error } = await supabaseClient
            .from('tasks')
            .insert([{ 
                title: taskText,
                streak: 0,
                notes: ''
            }])
            .select()
            .single();
        
        console.log('Supabase response:', { data: newTask, error });
        
        if (error) {
            console.error('Error adding task:', error);
            return;
        }
        
        console.log('Task added successfully:', newTask);
        renderTask(newTask);
        taskInput.value = '';
        taskInput.focus();
    });

    taskInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });

    // Initial load
    loadTasks();
}); 