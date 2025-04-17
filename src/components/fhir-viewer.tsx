import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bundle, Resource } from 'fhir/r4';
import FHIRSearchResults from './fhir-search-results';
import FhirRenderer from './fhir-renderer';
import FhirSearchBuilder from './fhir-search-builder';
import { searchResource, SearchParam } from './utils/fhir-client';

const FhirViewer = () => {
  const { resourceType: routeType } = useParams();
  const navigate = useNavigate();
  const resourceType = routeType || 'Patient'; // default to Patient

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to /Patient if no routeType present
  useEffect(() => {
    if (!routeType) {
      navigate('/Patient', { replace: true });
    }
  }, [routeType, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await searchResource(resourceType, searchParams);
        setBundle(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [resourceType, searchParams]);

  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">FHIR Viewer: {resourceType}</h1>

      <FhirSearchBuilder resourceType={resourceType} onSearch={setSearchParams} />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

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
      ) : bundle ? (
        <FHIRSearchResults bundle={bundle} onSelectResource={handleSelectResource} />
      ) : (
        <p>No results yet.</p>
      )}
    </div>
  );
};

export default FhirViewer;
