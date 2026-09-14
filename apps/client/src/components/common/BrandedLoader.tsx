import React from 'react';

interface Props {
  fullScreen?: boolean;
}

const BrandedLoader: React.FC<Props> = ({ fullScreen = true }) => (
  <div
    className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-16'} bg-earbore-grayLight`}
  >
    <div className="relative w-16 h-16">
      <img
        src="/assets/favicon.svg"
        alt=""
        className="absolute inset-0 w-full h-full animate-pulse"
      />
      <div className="absolute -inset-1.5 rounded-full border-4 border-earbore-200 border-t-earbore-600 animate-spin" />
    </div>
  </div>
);

export default BrandedLoader;