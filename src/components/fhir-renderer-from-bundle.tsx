import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bundle, Resource} from 'fhir/r4';
import FHIRSearchResults from './fhir-search-results';

const FhirRendererFromBundle = () => {
  const { resourceType, id } = useParams();
  const [bundle, setBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    const load = async () => {
      // Fetch the bundle containing the resources
      const bundleData: Bundle = await fetch('/fhir-resources/example-patient-bundle.json').then((r) => r.json());
      setBundle(bundleData);
    };

    load();
  }, [resourceType, id]);

  if (!bundle) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>FHIR Search Results</h1>
      <FHIRSearchResults bundle={bundle} onSelect={function (resource: Resource): void {
        throw new Error('Function not implemented.');
      } } />
    </div>
  );
};

export default FhirRendererFromBundle;
