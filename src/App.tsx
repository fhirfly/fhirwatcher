import {React, Route} from 'react';
import FhirRendererFromBundle from './components/fhir-renderer-from-bundle';
import './App.css';
import FhirViewer from './components/fhir-viewer';

function App() {
  return (
    <div>
      <h1>FHIR Renderer</h1>
      <Route path="/:resourceType?" element={<FhirViewer />} />
    </div>
  );
}

export default App;
