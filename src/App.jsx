import React, { useState, useCallback, useMemo } from 'react';

const MAX_CACHE_SIZE = 10;
const MAX_PAGE_REQUESTS = 30;
const ALGORITHMS = {
  LRU: 'LRU',
  CLOCK: 'Clock',
  MRU: 'MRU',
};

// --- Helper Function ---
// Parses the page request string into an array of strings (page identifiers)
const parsePageString = (str) => {
  return str
    .split(/[,;\s]+/) // Split by comma, semicolon, or whitespace
    .map(s => s.trim()) // Trim whitespace
    .filter(s => s !== ''); // Remove empty strings
};

// --- Main Component ---
function App() {
  // --- State Variables ---
  const [cacheSize, setCacheSize] = useState(4); // Size of the cache
  const [pageString, setPageString] = useState('A P R O P E R C O P P E R C O F F E E P O T'); // Input page requests
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS.CLOCK); // Algorithm selection
  const [simulationSteps, setSimulationSteps] = useState([]); // Stores each step of the simulation
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // Index of the currently displayed step
  const [error, setError] = useState(''); // Error messages

  // --- Simulation Logic Functions ---

  // Simulates the Clock (Second Chance) Algorithm
  const simulateClock = (pages, size) => {
    const steps = [];
    let cache = Array(size).fill(null).map(() => ({ page: null, useBit: 0 }));
    let pointer = 0;
    let hits = 0;
    let misses = 0;

    steps.push({ /* Initial state */
      pageRequested: null, cacheState: JSON.parse(JSON.stringify(cache)), pointer: pointer,
      action: 'Initial state', hit: false, miss: false, replacedPage: null, hits: 0, misses: 0, order: []
    });

    for (const page of pages) {
      const cacheBefore = JSON.parse(JSON.stringify(cache));
      let hit = false, miss = false, replacedPage = null, action = '';
      const hitIndex = cache.findIndex(frame => frame.page === page);

      if (hitIndex !== -1) { // Hit
        hit = true; hits++; cache[hitIndex].useBit = 1;
        action = `Page "${page}" found (Hit). Set Use Bit to 1.`;
      } else { // Miss
        miss = true; misses++; action = `Page "${page}" not found (Miss). `;
        while (true) {
          const currentFrame = cache[pointer];
          if (currentFrame.page === null) { // Empty frame
            currentFrame.page = page; currentFrame.useBit = 1;
            action += `Placed in empty frame ${pointer}.`;
            pointer = (pointer + 1) % size; break;
          } else if (currentFrame.useBit === 0) { // Replace frame
            replacedPage = currentFrame.page; currentFrame.page = page; currentFrame.useBit = 1;
            action += `Replaced page "${replacedPage}" (Use Bit 0) at frame ${pointer}.`;
            pointer = (pointer + 1) % size; break;
          } else { // Second chance
            currentFrame.useBit = 0;
            action += `Checked frame ${pointer} (Page "${currentFrame.page}", Use Bit 1 -> 0). `;
            pointer = (pointer + 1) % size;
          }
        }
      }
      steps.push({
        pageRequested: page, cacheStateBefore: cacheBefore, cacheState: JSON.parse(JSON.stringify(cache)),
        pointer: pointer, action: action, hit: hit, miss: miss, replacedPage: replacedPage, hits: hits, misses: misses, order: [] // Order not relevant for Clock vis
      });
    }
    return steps;
  };

  // Simulates the Least Recently Used (LRU) Algorithm
  const simulateLRU = (pages, size) => {
    const steps = [];
    let cache = []; // Use array as ordered list (index 0 = LRU, end = MRU)
    let hits = 0;
    let misses = 0;

    steps.push({ /* Initial state */
      pageRequested: null, cacheState: [], pointer: null,
      action: 'Initial state', hit: false, miss: false, replacedPage: null, hits: 0, misses: 0, order: []
    });

    for (const page of pages) {
      const cacheBefore = [...cache]; // Shallow copy is fine for array of strings
      let hit = false, miss = false, replacedPage = null, action = '';
      const hitIndex = cache.indexOf(page);

      if (hitIndex !== -1) { // Hit
        hit = true; hits++;
        const [hitPage] = cache.splice(hitIndex, 1); // Remove from current position
        cache.push(hitPage); // Add to the end (most recently used)
        action = `Page "${page}" found (Hit). Moved to MRU position.`;
      } else { // Miss
        miss = true; misses++; action = `Page "${page}" not found (Miss). `;
        if (cache.length < size) { // Cache not full
          cache.push(page); // Add to the end
          action += `Added to cache.`;
        } else { // Cache full, replace LRU
          replacedPage = cache.shift(); // Remove from the beginning (LRU)
          cache.push(page); // Add new page to the end (MRU)
          action += `Cache full. Replaced LRU page "${replacedPage}".`;
        }
      }
      steps.push({
        pageRequested: page, cacheStateBefore: cacheBefore, cacheState: [...cache], // Log current order
        pointer: null, action: action, hit: hit, miss: miss, replacedPage: replacedPage, hits: hits, misses: misses, order: [...cache] // Store order for vis
      });
    }
    return steps;
  };

   // Simulates the Most Recently Used (MRU) Algorithm
   const simulateMRU = (pages, size) => {
    const steps = [];
    let cache = []; // Use array as ordered list (index 0 = LRU, end = MRU)
    let hits = 0;
    let misses = 0;

    steps.push({ /* Initial state */
      pageRequested: null, cacheState: [], pointer: null,
      action: 'Initial state', hit: false, miss: false, replacedPage: null, hits: 0, misses: 0, order: []
    });

    for (const page of pages) {
      const cacheBefore = [...cache];
      let hit = false, miss = false, replacedPage = null, action = '';
      const hitIndex = cache.indexOf(page);

      if (hitIndex !== -1) { // Hit
        hit = true; hits++;
        const [hitPage] = cache.splice(hitIndex, 1); // Remove from current position
        cache.push(hitPage); // Add to the end (most recently used)
        action = `Page "${page}" found (Hit). Moved to MRU position.`;
      } else { // Miss
        miss = true; misses++; action = `Page "${page}" not found (Miss). `;
        if (cache.length < size) { // Cache not full
          cache.push(page); // Add to the end
          action += `Added to cache.`;
        } else { // Cache full, replace MRU
          replacedPage = cache.pop(); // Remove from the end (MRU)
          cache.push(page); // Add new page to the end (MRU)
          action += `Cache full. Replaced MRU page "${replacedPage}".`;
        }
      }
      steps.push({
        pageRequested: page, cacheStateBefore: cacheBefore, cacheState: [...cache],
        pointer: null, action: action, hit: hit, miss: miss, replacedPage: replacedPage, hits: hits, misses: misses, order: [...cache] // Store order for vis
      });
    }
    return steps;
  };


  // --- Main Calculation Trigger ---
  // Now depends on algorithm selection as well
  const calculateSimulation = useCallback(() => {
    setError('');
    const pages = parsePageString(pageString);

    // Input validation (cache size, page format, page count)
    if (cacheSize <= 0 || cacheSize > MAX_CACHE_SIZE) {
      setError(`Cache size must be between 1 and ${MAX_CACHE_SIZE}.`);
      setSimulationSteps([]); setCurrentStepIndex(0); return;
    }
    if (pages.length === 0 && pageString.trim() !== '') {
        setError('Invalid page request sequence format.');
        setSimulationSteps([]); setCurrentStepIndex(0); return;
    }
     if (pages.length > MAX_PAGE_REQUESTS) {
      setError(`Maximum ${MAX_PAGE_REQUESTS} page requests allowed.`);
      setSimulationSteps([]); setCurrentStepIndex(0); return;
    }

    // --- Select and Run Simulation ---
    let calculatedSteps = [];
    switch (selectedAlgorithm) {
      case ALGORITHMS.CLOCK:
        calculatedSteps = simulateClock(pages, cacheSize);
        break;
      case ALGORITHMS.LRU:
        calculatedSteps = simulateLRU(pages, cacheSize);
        break;
      case ALGORITHMS.MRU:
         calculatedSteps = simulateMRU(pages, cacheSize);
         break;
      default:
        setError('Invalid algorithm selected.'); // Should not happen with dropdown
        setSimulationSteps([]); setCurrentStepIndex(0); return;
    }

    setSimulationSteps(calculatedSteps);
    setCurrentStepIndex(0); // Reset view to the first step
  }, [cacheSize, pageString, selectedAlgorithm]); // Added selectedAlgorithm dependency

  // --- Event Handlers ---
  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setCacheSize(isNaN(newSize) ? 0 : newSize);
  };

  const handlePageStringChange = (e) => {
    setPageString(e.target.value);
  };

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
    // Clear previous simulation results when algorithm changes
    setSimulationSteps([]);
    setCurrentStepIndex(0);
    setError('');
  };

  const handleSimulate = () => {
    calculateSimulation(); // Trigger the calculation
  };

  const handleNextStep = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, simulationSteps.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  // --- Prepare Data for Display ---
  const currentStepData = simulationSteps[currentStepIndex] || {};
  const displayAction = currentStepData.action || 'Select algorithm, enter settings and click Simulate.';
  const displayHits = currentStepData.hits !== undefined ? currentStepData.hits : 0;
  const displayMisses = currentStepData.misses !== undefined ? currentStepData.misses : 0;
  const displayPageRequested = currentStepData.pageRequested;

  // --- Determine Cache Visualization based on Algorithm ---
  const getDisplayCache = () => {
    if (!currentStepData.cacheState) {
        // Default empty state before simulation runs
        return Array(cacheSize).fill(null).map((_, index) => ({
            id: `frame-${index}`, // Unique key for React rendering
            page: null,
            useBit: null, // Not relevant unless Clock
            isPointer: false,
            orderIndex: null // Not relevant unless LRU/MRU
        }));
    }

    switch (selectedAlgorithm) {
      case ALGORITHMS.CLOCK:
        // Clock uses fixed frames with a pointer
        const clockPointer = currentStepData.pointer;
        return currentStepData.cacheState.map((frame, index) => ({
          id: `frame-${index}`,
          page: frame.page,
          useBit: frame.useBit,
          isPointer: index === clockPointer,
          orderIndex: null // Not applicable
        }));

      case ALGORITHMS.LRU:
      case ALGORITHMS.MRU:
         // LRU/MRU use an ordered list. We'll display it in that order.
         // Pad with empty slots if cache isn't full yet for consistent display size
         const orderedCache = currentStepData.cacheState; // This is the ordered array [LRU...MRU]
         const displayArray = orderedCache.map((page, index) => ({
             id: `page-${page}-${index}`, // Need a stable key, page might repeat
             page: page,
             useBit: null, // Not applicable
             isPointer: false, // Not applicable
             orderIndex: index // Store the 0-based order (0 = LRU end)
         }));
         // Add empty placeholders if needed
         while (displayArray.length < cacheSize) {
             displayArray.push({
                 id: `empty-${displayArray.length}`,
                 page: null,
                 useBit: null,
                 isPointer: false,
                 orderIndex: displayArray.length // Continue index for empty slots
             });
         }
         return displayArray;

      default:
        return []; // Should not happen
    }
  };

  const displayCache = getDisplayCache();

  // --- Helper text for cache visualization ---
  const getCacheDescription = () => {
      switch(selectedAlgorithm) {
          case ALGORITHMS.CLOCK:
              return "Pointer indicates the *next* frame to consider for replacement. R is the Reference Bit.";
          case ALGORITHMS.LRU:
              return "Frames ordered by use: Leftmost (Index 0) is Least Recently Used (LRU), Rightmost is Most Recently Used (MRU).";
          case ALGORITHMS.MRU:
              return "Frames ordered by use: Leftmost (Index 0) is Least Recently Used, Rightmost is Most Recently Used (MRU - replacement target).";
          default:
              return "";
      }
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Cache Replacement Simulator</h1>

      {/* --- Input Area --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
        {/* Algorithm Selection */}
        <div>
           <label htmlFor="algorithmSelect" className="block text-sm font-medium text-gray-700 mb-1">Algorithm:</label>
           <select
             id="algorithmSelect"
             value={selectedAlgorithm}
             onChange={handleAlgorithmChange}
             className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
           >
             <option value={ALGORITHMS.CLOCK}>{ALGORITHMS.CLOCK}</option>
             <option value={ALGORITHMS.LRU}>{ALGORITHMS.LRU}</option>
             <option value={ALGORITHMS.MRU}>{ALGORITHMS.MRU}</option>
           </select>
         </div>

        {/* Cache Size */}
        <div>
          <label htmlFor="cacheSize" className="block text-sm font-medium text-gray-700 mb-1">Cache Size:</label>
          <input
            type="number"
            id="cacheSize"
            value={cacheSize}
            onChange={handleSizeChange}
            min="1"
            max={MAX_CACHE_SIZE}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Page Sequence */}
        <div className="md:col-span-2">
          <label htmlFor="pageString" className="block text-sm font-medium text-gray-700 mb-1">Page Request Sequence (blank or comma-separated):</label>
          <input
            type="text"
            id="pageString"
            value={pageString}
            onChange={handlePageStringChange}
            placeholder="e.g., A, B, C, D, A, B, E"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Simulate Button */}
        <div className="md:col-span-4 text-center mt-2">
          <button
            onClick={handleSimulate}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            Simulate {selectedAlgorithm}
          </button>
        </div>
         {error && (
            <div className="md:col-span-4 mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
                {error}
            </div>
        )}
      </div>

      {/* --- Simulation Display Area --- */}
      {simulationSteps.length > 0 && (
        <div className="p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{selectedAlgorithm} Simulation Steps</h2>

          {/* Cache Visualization */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Cache State (Step {currentStepIndex}/{simulationSteps.length - 1})</h3>
             <p className="text-sm text-gray-600 mb-3">
                {getCacheDescription()}
             </p>
            <div className="flex flex-wrap justify-center items-stretch gap-2 bg-gray-100 p-4 rounded-md border border-gray-200 relative min-h-[8rem]">
              {displayCache.map((frame) => (
                <div
                  key={frame.id} // Use generated unique ID
                  className={`relative flex flex-col items-center justify-between w-20 h-24 border-2 rounded-md p-2 text-center shadow ${
                    frame.isPointer ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300' // Highlight pointer for Clock
                  } ${frame.page === null ? 'bg-gray-200' : 'bg-white'}`}
                >
                  {/* Pointer Indicator (Clock only) */}
                   {frame.isPointer && selectedAlgorithm === ALGORITHMS.CLOCK && (
                     <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-blue-600" title="Clock Pointer">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 11.707a1 1 0 001.414 1.414l2-2A1 1 0 0011 10.5V7z" clipRule="evenodd" />
                       </svg>
                     </div>
                   )}

                   {/* Frame Index/Order (LRU/MRU) */}
                   {(selectedAlgorithm === ALGORITHMS.LRU || selectedAlgorithm === ALGORITHMS.MRU) && frame.orderIndex !== null && (
                      <span className="absolute top-0 right-1 text-[0.6rem] font-mono text-gray-500 bg-gray-200 px-1 rounded-sm">
                         Idx {frame.orderIndex}
                      </span>
                   )}

                   {/* Frame Label (Clock) or Placeholder */}
                   {selectedAlgorithm === ALGORITHMS.CLOCK && (
                       <span className="text-xs font-medium text-gray-500">Frame {displayCache.indexOf(frame)}</span>
                   )}
                   {/* Placeholder for spacing if not Clock */}
                   {(selectedAlgorithm !== ALGORITHMS.CLOCK) && (
                       <span className="text-xs font-medium text-gray-500 h-4"> </span>
                   )}


                  {/* Page Content */}
                  <span className={`text-xl font-bold ${frame.page === null ? 'text-gray-400' : 'text-blue-700'} my-1 break-all flex-grow flex items-center justify-center`}>
                    {frame.page ?? '-'}
                  </span>

                  {/* Reference Bit (Clock only) */}
                  {selectedAlgorithm === ALGORITHMS.CLOCK && (
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${frame.page === null ? 'text-gray-400' : frame.useBit === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        R={frame.page !== null ? frame.useBit : '-'}
                      </span>
                  )}
                   {/* Placeholder for spacing if not Clock */}
                   {(selectedAlgorithm !== ALGORITHMS.CLOCK) && (
                       <span className="text-xs font-mono h-5"> </span>
                   )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Action Info */}
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
             <p className="text-sm font-medium text-gray-700">
                Page Requested: <span className="font-bold text-lg text-indigo-700">{displayPageRequested ? `"${displayPageRequested}"` : 'N/A'}</span>
             </p>
             <p className="text-sm text-gray-600 mt-1">Action: <span className="font-medium">{displayAction}</span></p>
              {currentStepData.hit && <span className="text-sm font-semibold text-green-600"> (Hit)</span>}
              {currentStepData.miss && <span className="text-sm font-semibold text-red-600"> (Miss/Fault)</span>}
               {currentStepData.replacedPage !== null && <span className="text-sm text-orange-600"> Replaced: "{currentStepData.replacedPage}"</span>}
          </div>

           {/* Statistics */}
           <div className="flex justify-around items-center text-center mb-4 p-3 bg-gray-100 rounded-md border border-gray-200">
                <div>
                    <span className="block text-sm font-medium text-gray-700">Hits</span>
                    <span className="text-2xl font-bold text-green-600">{displayHits}</span>
                </div>
                 <div>
                    <span className="block text-sm font-medium text-gray-700">Misses</span>
                    <span className="text-2xl font-bold text-red-600">{displayMisses}</span>
                </div>
                 <div>
                    <span className="block text-sm font-medium text-gray-700">Hit Rate</span>
                    <span className="text-2xl font-bold text-blue-600">
                        { (displayHits + displayMisses) > 0 ? ((displayHits / (displayHits + displayMisses)) * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                </div>
            </div>


          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              Previous Step
            </button>
             <button
              onClick={handleReset}
              className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
            >
              Go to Start
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex >= simulationSteps.length - 1}
              className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              Next Step
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Export the main component
export default App;
