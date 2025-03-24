import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1>Welcome to the Landing Page</h1>
      <p>This is a basic landing page.</p>
    </div>
  );
};

export default LandingPage;
