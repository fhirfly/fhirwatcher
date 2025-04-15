import React from 'react';
import FhirRendererFromBundle from './components/fhir-renderer-from-bundle';
import './App.css';

function App() {
  return (
    <div>
      <h1>FHIR Renderer</h1>
      <FhirRendererFromBundle />
    </div>
  );
}

export default App;
