import React from 'react';
import ChatBox from '../components/Chat/ChatBox';
import Layout from '../components/Layout/Layout';
// Corrected import path, assuming TopNotice.jsx is now named correctly
import TopNotice from '../components/Chat/TopNotice';

const HomePage = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-full max-w-3xl mx-auto">
          {/* Add the new notice here */}
          <TopNotice />

          <ChatBox />
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;