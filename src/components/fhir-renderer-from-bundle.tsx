import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bundle, Resource } from 'fhir/r4';
import FHIRSearchResults from './fhir-search-results';
import FhirRenderer from './fhir-renderer';

const FhirRendererFromBundle = () => {
  const { resourceType, id } = useParams();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    const load = async () => {
      const bundleData: Bundle = await fetch('/fhir-resources/example-patient-bundle.json').then((r) => r.json());
      setBundle(bundleData);
    };

    load();
  }, [resourceType, id]);

  if (!bundle) return <div>Loading...</div>;

  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">FHIR Search Results</h1>

      {selectedResource ? (
        <div>
          <h2 className="text-lg font-bold">Selected Resource Detail</h2>
          <FhirRenderer resource={selectedResource} />
          <button
            onClick={() => setSelectedResource(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
      ) : (
        <FHIRSearchResults
  bundle={bundle}
  onSelectResource={handleSelectResource}
/>
      )}
    </div>
  );
};

export default FhirRendererFromBundle;
