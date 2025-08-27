# Progress Tracker

A full-stack Kanban board application for task management and progress tracking, developed by Kim Ha Anh Tran and Anton Yang from the Montgomery Academy (2025-2026).

## Overview
![](https://media.discordapp.net/attachments/1006429731144609832/1410372453279993916/2025-08-27_16-11-00_online-video-cutter.com_1.gif?ex=68b0c734&is=68af75b4&hm=f6a29aee9a9e5611cc33222acc421536289b194fbfb915a8b0dce7ee11128a5e&=&width=1386&height=720) <br>
**Progress Tracker** is a web-based Kanban-style task management system that allows users to organize their work into customizable columns. Users can create tasks, drag and drop them between columns to track progress, and visually distinguish completed tasks. The application features a clean, intuitive interface with real-time updates and persistent data storage.

## How It Works

The application uses a client-server architecture where the Python Flask backend serves RESTful API endpoints and the JavaScript frontend handles user interactions. The backend manages data persistence through a JSON file, while the frontend provides a dynamic, responsive interface using modern web technologies.

Users can immediately begin organizing tasks into columns, with visual feedback provided for all actions. The drag-and-drop functionality is powered by Sortable.js, ensuring smooth and intuitive task management. The application automatically handles data synchronization between the frontend and backend, providing a seamless user experience.

# Features

## Technical Stack

This project is built using a modern web development stack:

- **Backend**: Python with Flask web framework
- **Frontend**: Vanilla JavaScript with HTML5 and CSS3
- **Data Storage**: JSON file to store and update data
- **Drag & Drop**: Sortable.js library for smooth interactions
- **Styling**: CSS 

## Key Features

- **Dynamic Column Management**: Create and delete custom columns to suit any workflow
- **Interactive Task Cards**: Add, edit, and delete tasks with intuitive controls
- **Visual Progress Tracking**: Drag and drop tasks between columns with smooth animations
- **Completion Status**: Tasks in the "Done" column are automatically marked with visual indicators (crossed-out text, reduced opacity)
- **Persistent Data**: All changes are saved even if the program is closed

## Prerequisites
Before running the application, make sure to have the following installed:
- Python 3.7 or higher
- Flask framework (`pip install flask`)

## Project Structure

The application follows a standard Flask project structure with separate directories for templates, static assets, and backend logic. The main components include:

- Flask backend API endpoints for all CRUD operations
- JavaScript frontend with modular functionality
- HTML templates for page rendering
- CSS styles for visual presentation
- JSON-based data storage system
