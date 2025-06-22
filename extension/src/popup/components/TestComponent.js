import React, { useState } from 'react';

const TestComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h1 className="text-xl font-bold text-blue-600 mb-4">Password Manager Extension</h1>
      <p className="mb-4 text-gray-700">If you can see this, React is working correctly!</p>
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        onClick={() => setCount(count + 1)}
      >
        Clicked {count} times
      </button>
    </div>
  );
};

export default TestComponent;
