from flask import Flask, request, jsonify, render_template, redirect  
import json
import os

app = Flask(__name__)

# File to save our data
DATA_FILE = "kanban_data.json"

# Function to load the board data from the JSON file
def load_data():
    #Loads the kanban board data from the JSON file.
    # If file doesn't exist, return a default board structure.

    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            # If file corrupt or empty, return default structure
            # Just to make sure teehee
            pass
            
    # Default board structure with three columns
    # Lowkey need to implement when user deletes "Done" column and makes it again but this time it doesn't cross off words
    # So now it needs to cross off words whenever a column is titled "Done" You get me? But like, there's also "Finished" and yaddah yaddah
    # A bit messy. If like, then implement. Otherwise, too lazy
    return {
        "columns": [
            {"id": 1, "title": "To Do", "tasks": []},
            {"id": 2, "title": "Doing", "tasks": []},
            {"id": 3, "title": "Done", "tasks": []}
        ]
    }

# Save board data to the JSON file
# JSON saves the data stuff. Can access it again even if you close off the program
def save_data(data):
    """Saves the kanban board data to the JSON file."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)  # indent=4 indents in the JSON. Makes it look nice to read.


# API: Gets the whole board data
@app.route('/api/board', methods=['GET'])
def get_board():
    board_data = load_data()
    return jsonify(board_data)

# API: Create a new task in a specificed coljumn
@app.route('/api/task', methods=['POST'])
def create_task():
    # 1. Get the JSON data sent from frontend
    data = request.get_json()
    column_id = data['column_id']
    task_text = data['text']

    # 2. Load the current board state
    board_data = load_data()
    
    # 3. Find the highest existing task ID to generate a new one
    all_tasks = []
    for column in board_data['columns']:
        all_tasks.extend(column['tasks'])
    
    # If tasks exist, find max ID. Otherwise start at 100
    new_id = max([task['id'] for task in all_tasks], default=100) + 1

    # 4. Create the new task object
    new_task = {
        "id": new_id,
        "text": task_text,
        "status": "active"  # Default status is 'active'
    }

    # 5. Find the correct column and add the new task
    for column in board_data['columns']:
        if column['id'] == column_id:
            column['tasks'].append(new_task)
            break

    # 6. Save the updated board and return the new task
    save_data(board_data)
    return jsonify(new_task), 201  # 201 status code means "Created"

# API: Move a task (IMPORTANT UTMOST IMPORTANT!!)
# Literally moves tasks between columns
@app.route('/api/task/<int:task_id>/move', methods=['POST'])
def move_task(task_id):
    # 1. Get new column ID from request
    # Also most of these is just rummaging through the JSON file to get stuff you need
    data = request.get_json()
    new_column_id = data['new_column_id']

    # 2. Load the current board state
    board_data = load_data()
    
    # 3. Find the task and its old column
    task_to_move = None
    old_column_id = None
    
    # Search through all columns and all tasks
    # I love overexplaining code. Hooray!
    # So like, in the JSON file, it's arranged in a way that's columns -> tasks
    # Go through all columns and compare column name, then compare task id, then move it move it
    for column in board_data['columns']:
        for task in column['tasks']:
            if task['id'] == task_id:
                task_to_move = task
                old_column_id = column['id']  # Remember where it came from
                # Remove it from the old column
                column['tasks'].remove(task)
                break
        if task_to_move:  # If we found the task, break the outer loop too
            break

    # 4. If task found, add it to the new column
    if task_to_move:
        for column in board_data['columns']:
            if column['id'] == new_column_id or column['title'] == 'Done': # Literally on a race to find the synonyms of "Done." Smh in this house only DONE is accepted or DONE you shall be
                # --- CORE LOGIC: Check if new column is "Done" (ID 3) ---
                if new_column_id == 3:
                    task_to_move['status'] = 'done'  # Mark as done
                else:
                    task_to_move['status'] = 'active' # Mark as active
                # Add the task to the new column's list
                column['tasks'].append(task_to_move)
                break
        
        # 5. Save the updated board state
        save_data(board_data)
        # Return a success message and the task's new status
        return jsonify({
            'success': True,
            'message': f'Task {task_id} moved to column {new_column_id}.',
            'new_status': task_to_move['status']
        })
    else:
        # If the task wasn't found, return an error
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    
# API: Update a task's text
@app.route('/api/task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    # 1. Get the new text from the request
    data = request.get_json()
    new_text = data['text']

    # 2. Load the current board state
    board_data = load_data()
    
    # 3. Find the task across all columns
    task_found = False
    for column in board_data['columns']:
        for task in column['tasks']:
            if task['id'] == task_id:
                # 4. Update the task's text
                task['text'] = new_text
                task_found = True
                break
        if task_found:
            break

    # 5. Save and respond
    if task_found:
        save_data(board_data)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Task not found'}), 404

# API: Delete a task
@app.route('/api/task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Deletes a task from the board."""
    # 1. Load the current board state
    board_data = load_data()
    
    # 2. Find and remove the task
    task_found = False
    for column in board_data['columns']:
        for task in column['tasks']:
            if task['id'] == task_id:
                column['tasks'].remove(task)
                task_found = True
                break
        if task_found:
            break

    # 3. Save and respond
    if task_found:
        save_data(board_data)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    
# API: Create a new column
@app.route('/api/column', methods=['POST'])
def create_column():
    """Creates a new column on the board."""
    # 1. Get the column title from the request
    data = request.get_json()
    column_title = data['title']

    # 2. Load the current board state
    board_data = load_data()
    
    # 3. Find the highest existing column ID to generate a new one
    column_ids = [col['id'] for col in board_data['columns']]
    new_id = max(column_ids, default=0) + 1

    # 4. Create the new column object
    new_column = {
        "id": new_id,
        "title": column_title,
        "tasks": []
    }

    # 5. Add the new column to the board
    board_data['columns'].append(new_column)

    # 6. Save the updated board and return the new column
    save_data(board_data)
    return jsonify(new_column), 201

# API: Delete a column and all its tasks from a board (sadness)
@app.route('/api/column/<int:column_id>', methods=['DELETE'])
def delete_column(column_id):
    # 1. Load the current board state
    board_data = load_data()
    
    # 2. Find and remove the column
    column_found = False
    for column in board_data['columns']:
        if column['id'] == column_id:
            board_data['columns'].remove(column)
            column_found = True
            break

    # 3. Save and respond
    if column_found:
        save_data(board_data)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Column not found'}), 404

# Serve the welcome page
@app.route('/welcome')
def welcome():
    return render_template('welcome.html')


# First thing appears is index.html (need to fix welcome.html Anton pls)
@app.route('/')
def home():
    return render_template('index.html')

# Run application!
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Runs on http://localhost:5000