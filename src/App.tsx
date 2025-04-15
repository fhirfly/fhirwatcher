import { useEffect, useState } from 'react';
import FhirRenderer from './components/fhir-renderer';
import './App.css';
import { Resource } from 'fhir/r4';

function App() {
  const [resource, setResource] = useState<Resource | null>(null);

  useEffect(() => {
    console.log("useEffect running");
    fetch('/fhir-resources/example-patient.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Resource) => {
        console.log("Fetched FHIR resource:", data);
        setResource(data);
      })
      .catch((err) => {
        console.error("Failed to load resource:", err);
      });
  }, []);

  return (
    <div>
      <h1>FHIR Renderer</h1>
      {!resource ? (
        <div>Loading FHIR Resource...</div>
      ) : (
        <FhirRenderer resource={resource} />
      )}
    </div>
  );
}

export default App;
