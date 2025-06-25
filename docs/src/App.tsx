import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import PlaygroundPage from './pages/PlaygroundPage';
import ExamplesPage from './pages/ExamplesPage';
import APIKeysPage from './pages/APIKeysPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs/*" element={<DocsPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/examples" element={<ExamplesPage />} />
        <Route path="/api-keys" element={<APIKeysPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
