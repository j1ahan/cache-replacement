# Cache Replacement Algorithm Simulator

This is an interactive web application built with React and Vite that provides a visual step-by-step simulation of various cache replacement algorithms. It's designed as an educational tool to help understand how different algorithms manage memory and handle page hits and misses.

## Features

- **Algorithm Visualization**: Simulates and visualizes the following algorithms:
  - **Clock (Second Chance)**: Shows the circular buffer, the pointer, and the reference bit for each page.
  - **Least Recently Used (LRU)**: Displays the cache as an ordered list, where the least recently used page is evicted.
  - **Most Recently Used (MRU)**: Displays the cache as an ordered list, where the most recently used page is evicted.
- **Interactive Controls**:
  - **Customizable Cache Size**: Set the number of frames in the cache.
  - **Custom Page Request Sequence**: Input your own string of page requests (e.g., "A B C A D E").
  - **Step-by-Step Navigation**: Move forward, backward, or reset the simulation to see the state of the cache at each step.
- **Detailed Simulation Info**: For each step, the application shows:
  - The page being requested.
  - Whether the request resulted in a **Hit** or a **Miss (Fault)**.
  - The specific action taken by the algorithm (e.g., page placed in an empty frame, page replaced).
  - The page that was replaced, if any.
- **Real-time Statistics**:
  - Live counts of total hits and misses.
  - A dynamically updated hit rate percentage.

## Technologies Used

- **Frontend**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## How to Use

1.  **Select an Algorithm**: Choose from the dropdown menu (Clock, LRU, or MRU).
2.  **Set Cache Size**: Enter the desired number of frames for the cache.
3.  **Enter Page Sequence**: Type the sequence of page requests, separated by spaces or commas.
4.  **Click Simulate**: Press the "Simulate" button to begin.
5.  **Navigate**: Use the "Previous Step" and "Next Step" buttons to walk through the simulation and observe the changes in the cache state and statistics.

## Available Scripts

This project was bootstrapped with Vite. In the project directory, you can run:

### `npm run dev`

Runs the app in development mode.<br />
Open [http://localhost:5173](http://localhost:5173) (or the address shown in your terminal) to view it in the browser. The page will reload if you make edits.

### `npm run build`

Builds the app for production to the `dist` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run preview`

Serves the production build from the `dist` folder locally to preview it before deployment.