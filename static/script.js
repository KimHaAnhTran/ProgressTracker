// Oh boy, relearning javascript is 10x more. Can't wait!
let boardData = {};

// DOM Elements
// According to Google: "A single item within the Document Object Model (DOM), representing a specific HTML or XML tag like <h1>, <p>, or <div>"
// I don't get the reason why people name something as innocent-sounding as HTML tags into DOM

//Declare elements via HTML id
const boardElement = document.getElementById('board'); // Finds the main container div with id="board"
const columnTemplate = document.getElementById('column-template'); // Finds the hidden template for columns
const taskTemplate = document.getElementById('task-template'); // Finds the hidden template for tasks


/**The main JS functions for this

loadBoardData() --> GET /api/board
createTask(columnId, text) --> POST /api/task
updateTask(taskId, newText) --> PUT /api/task/<id>
deleteTask(taskId) --> DELETE /api/task/<id>
moveTask(taskId, newColumnId) --> POST /api/task/<id>/move
createColumn(title) --> POST /api/column
deleteColumn(columnId) --> DELETE /api/column/<id> */
// Initialize the application
// 'async' = function can pause and wait for other operations to complete
// Like Unity's coroutine that yield return new WaitForSeconds()
async function init() {
    // 'await' is basically "Pause this function and wait for loadBoardData() to finish completely"
    await loadBoardData();
    
    // Now that we have data, render the board visually
    renderBoard();
    
    // Set up all the click handlers and event listeners
    setupEventListeners();
}

// Load data from the Flask backend
// Talks to Python server to get the current board state
async function loadBoardData() {
    // try/catch is like try/catch in C#...what else...
    try {
        // fetch() sends a web request to a URL
        // Wait for the server to respond before continuing
        const response = await fetch('/api/board');
        
        // response.json() converts the JSON response from the server into a JavaScript object
        // Wait for the conversion to finish
        boardData = await response.json();
        
        // Now boardData contains something like: 
        // {
        //   columns: [
        //     {id: 1, title: "To Do", tasks: [{id: 101, text: "Task 1", status: "active"}]},
        //     {id: 2, title: "Doing", tasks: []},
        //     {id: 3, title: "Done", tasks: []}
        //   ]
        // }
    } catch (error) {
        // If anything fails above (server down, network error, etc), we get failed load error
        console.error('Failed to load board data:', error);
    }
}

// Takes the boardData and creates visual HTML elements for it
function renderBoard() {
    // Clear the board by setting its innerHTML to empty string
    // Like destroying all child GameObjects before instantiating new ones
    boardElement.innerHTML = '';
    
    // column represents each column object in boardData.columns
    boardData.columns.forEach(column => {
        // columnTemplate.content.cloneNode(true) is like Instantiate()
        // We're making a copy of the hidden template to create a real column
        // .querySelector('.column') finds the column element within the template
        const columnElement = columnTemplate.content.cloneNode(true).querySelector('.column');
        
        // dataset.columnId adds a custom data attribute to the HTML element
        // This lets us store the column's ID on the element itself
        columnElement.dataset.columnId = column.id;
        
        // Create a new div element from scratch (not from template)
        const columnHeader = document.createElement('div');
        columnHeader.className = 'column-header'; // Set its CSS class
        
        // Set the HTML content 
        columnHeader.innerHTML = `
            <h3 class="column-title">${column.title}</h3>
            <button class="delete-column-btn" title="Delete Column">×</button>
        `;
        
        // Replace the simple title with our new header that has a delete button
        columnElement.querySelector('.column-title').replaceWith(columnHeader);
        
        // Find the container where tasks should go within this column
        const tasksContainer = columnElement.querySelector('.tasks');
        
        // Loop through each task in this column and create task elements
        column.tasks.forEach(task => {
            // createTaskElement is our helper function that makes a task DOM element
            const taskElement = createTaskElement(task);
            
            // Adds the task to the column
            tasksContainer.appendChild(taskElement);
        });
        
        // This is where the drag-and-drop magic happens!
        // Sortable.js is a library that makes elements draggable
        /** Dragging a task in the UI triggers onEnd 
         * --> JS calculates taskId & newColumnId
         * --> Calls backend → backend updates JSON 
         * --> JS updates DOM CSS (done class). */
        new Sortable(tasksContainer, {
            group: 'tasks', // Allows dragging between all Sortable instances with same group
            animation: 150, // Animation duration in milliseconds
            onEnd: async function(evt) {
                // This function runs WHEN the user finishes dragging a task
                
                // evt.item is the DOM element that was dragged
                // dataset.taskId gets our custom data attribute we set earlier
                // parseInt converts the string "101" to the number 101
                const taskId = parseInt(evt.item.dataset.taskId);
                
                // evt.to is the container where the task was dropped
                // .closest('.column') finds the parent column element
                // dataset.columnId gets that column's ID
                const newColumnId = parseInt(evt.to.closest('.column').dataset.columnId);
                
                // Tell the server to move this task to the new column
                // Wait for the server to confirm the move
                await moveTask(taskId, newColumnId);
                
                // Update visual appearance based on whether it's in "Done" column
                if (newColumnId === 3) {
                    evt.item.classList.add('done'); // Add CSS class for done style
                } else {
                    evt.item.classList.remove('done'); // Remove CSS class
                }
            }
        });
        
        // Finally, add this fully constructed column to the main board
        boardElement.appendChild(columnElement);
    });
}

// Create a DOM element for a single task
function createTaskElement(task) {
    // Clone the task template and find the .task element
    const taskElement = taskTemplate.content.cloneNode(true).querySelector('.task');
    
    // Store the task ID on the element so we can reference it later
    taskElement.dataset.taskId = task.id;
    
    // Find the paragraph element that will hold the task text
    const taskTextElement = taskElement.querySelector('.task-text');
    
    // Set the text content to the actual task text
    taskTextElement.textContent = task.text;
    
    // Create hidden input for editing - this is like having an InputField in Unity
    const editInput = document.createElement('input');
    editInput.type = 'text'; // Make it a text input field
    editInput.className = 'edit-input'; // Set CSS class for styling
    editInput.value = task.text; // Pre-fill with current task text
    taskElement.appendChild(editInput); // Add it to the task element
    
    // If task is marked as done, add the 'done' CSS class for visual styling
    if (task.status === 'done') {
        taskElement.classList.add('done');
    }
    
    // Return the fully constructed task element
    return taskElement;
}

// Sets up all the click handlers and event listeners
function setupEventListeners() {
    // Add Column button click handler
    // This finds the button by ID and adds a click event listener
    document.getElementById('add-column-btn').addEventListener('click', async () => {
        // prompt() shows a popup dialog asking for input
        const columnTitle = prompt('Enter column title:');
        
        // Check if user entered something (not empty or cancelled)
        if (columnTitle && columnTitle.trim()) {
            // Send request to server to create new column
            await createColumn(columnTitle.trim());
            
            // Reload data from server to get the new column
            await loadBoardData();
            
            // Re-render the board to show the new column
            renderBoard();
        }
    });
    
    // Event delegation for dynamic elements
    // Instead of adding listeners to each button individually, we add ONE listener
    // to the parent boardElement and check what was clicked
    // This works for dynamically created elements (elements added after page load)
    boardElement.addEventListener('click', async (event) => {
        // event.target is what was actually clicked
        // .closest() finds the nearest parent element with the given class
        // This is like checking "which GameObject was clicked" in Unity
        const taskElement = event.target.closest('.task');
        const columnElement = event.target.closest('.column');
        
        // If we found a task element, get its ID, otherwise null
        const taskId = taskElement ? parseInt(taskElement.dataset.taskId) : null;
        
        // If we found a column element, get its ID, otherwise null
        const columnId = columnElement ? parseInt(columnElement.dataset.columnId) : null;
        
        // Delete Column button
        // Check if the clicked element has the delete-column-btn class
        if (event.target.classList.contains('delete-column-btn')) {
            // confirm() shows a yes/no dialog and returns true/false
            if (confirm('Delete this column and all its tasks?')) {
                // Send delete request to server
                await deleteColumn(columnId);
                
                // Reload and re-render
                await loadBoardData();
                renderBoard();
            }
        }
        // Add Card button
        else if (event.target.classList.contains('add-task-btn')) {
            const taskText = prompt('Enter task text:');
            if (taskText && taskText.trim()) {
                await createTask(columnId, taskText.trim());
                await loadBoardData();
                renderBoard();
            }
        }
        // Edit button
        else if (event.target.classList.contains('edit-btn')) {
            // Find the text display and input field within this specific task
            const taskTextElement = taskElement.querySelector('.task-text');
            const editInput = taskElement.querySelector('.edit-input');
            
            // Enter edit mode by adding CSS class that shows input, hides text
            taskElement.classList.add('editing');
            
            // Focus on the input field (put cursor in it)
            editInput.focus();
            
            // Define function to save changes
            const finishEdit = async () => {
                const newText = editInput.value.trim();
                if (newText) {
                    // Send update to server
                    await updateTask(taskId, newText);
                    
                    // Update the displayed text
                    taskTextElement.textContent = newText;
                }
                // Exit edit mode
                taskElement.classList.remove('editing');
            };
            
            // Define function to cancel editing
            const cancelEdit = () => {
                // Reset input value to original text
                editInput.value = taskTextElement.textContent;
                
                // Exit edit mode
                taskElement.classList.remove('editing');
            };
            
            // Set up keyboard handlers
            editInput.onkeydown = (e) => {
                if (e.key === 'Enter') finishEdit(); // Enter key saves
                if (e.key === 'Escape') cancelEdit(); // Escape key cancels
            };
            
            // When input loses focus (user clicks elsewhere), save changes
            editInput.onblur = finishEdit;
        }
        // Delete button
        else if (event.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this task?')) {
                await deleteTask(taskId);
                await loadBoardData();
                renderBoard();
            }
        }
    });
}

// API call to create a new task
// This is like calling a UnityWebRequest to send data to a server
async function createTask(columnId, text) {
    try {
        // fetch() with POST method sends data to the server
        const response = await fetch('/api/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Tell server we're sending JSON
            body: JSON.stringify({ column_id: columnId, text: text }) // Convert object to JSON string
        });
        return await response.json(); // Return the server's response
    } catch (error) {
        console.error('Failed to create task:', error);
    }
}

// API call to move a task
async function moveTask(taskId, newColumnId) {
    try {
        // Note the URL: /api/task/101/move - where 101 is the taskId
        const response = await fetch(`/api/task/${taskId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_column_id: newColumnId })
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to move task:', error);
    }
}

// API call to update a task's text
async function updateTask(taskId, newText) {
    try {
        // PUT method is typically used for updates
        const response = await fetch(`/api/task/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to update task:', error);
    }
}

// API call to delete a task
async function deleteTask(taskId) {
    try {
        // DELETE method is for deleting resources
        const response = await fetch(`/api/task/${taskId}`, {
            method: 'DELETE' // No body needed for DELETE requests
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to delete task:', error);
    }
}

// API call to create a column
async function createColumn(title) {
    try {
        const response = await fetch('/api/column', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title })
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to create column:', error);
    }
}

// API call to delete a column
async function deleteColumn(columnId) {
    try {
        const response = await fetch(`/api/column/${columnId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to delete column:', error);
    }
}

// Start the app when the page loads
// This is like Unity's Start() function - it runs when the page is ready
// DOMContentLoaded event fires when the HTML is fully loaded and parsed
document.addEventListener('DOMContentLoaded', init);