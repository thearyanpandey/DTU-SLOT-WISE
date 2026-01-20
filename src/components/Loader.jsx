import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-500 animate-[bounce_1s_infinite_0ms]"></div>
      <div className="w-3 h-3 rounded-full bg-red-500 animate-[bounce_1s_infinite_200ms]"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500 animate-[bounce_1s_infinite_400ms]"></div>
      <div className="w-3 h-3 rounded-full bg-green-500 animate-[bounce_1s_infinite_600ms]"></div>
    </div>
  );
};

export default Loader;
