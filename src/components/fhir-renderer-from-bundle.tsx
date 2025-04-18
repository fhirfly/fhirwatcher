import React, { useEffect, useState } from 'react';
import { SearchParam } from '../utils/fhir-client';

type Param = {
  code: string;
  type: string;
  description?: string;
};

interface FhirSearchBuilderProps {
  resourceType: string;
  onSearch: (params: SearchParam[]) => void;
}

const typeMap: Record<string, (name: string, value: string, onChange: (v: string) => void) => JSX.Element> = {
  base64Binary: (n, _, onChange) => <input type="file" name={n} onChange={(e) => onChange(e.target.value)} />,
  boolean: (n, v, onChange) => (
    <select name={n} value={v} onChange={(e) => onChange(e.target.value)}>
      <option value="">--</option>
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  ),
  canonical: (n, v, onChange) => <input type="url" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  code: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  date: (n, v, onChange) => <input type="date" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  dateTime: (n, v, onChange) => <input type="datetime-local" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  decimal: (n, v, onChange) => <input type="number" step="any" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  id: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  instant: (n, v, onChange) => <input type="datetime-local" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  integer: (n, v, onChange) => <input type="number" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  integer64: (n, v, onChange) => <input type="number" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  markdown: (n, v, onChange) => <textarea name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  oid: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  positiveInt: (n, v, onChange) => <input type="number" min="1" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  string: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  time: (n, v, onChange) => <input type="time" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  unsignedInt: (n, v, onChange) => <input type="number" min="0" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  uri: (n, v, onChange) => <input type="url" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  url: (n, v, onChange) => <input type="url" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  uuid: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
  token: (n, v, onChange) => <input type="text" name={n} value={v} onChange={(e) => onChange(e.target.value)} />,
};

const FhirSearchBuilder: React.FC<FhirSearchBuilderProps> = ({ resourceType, onSearch }) => {
  const [params, setParams] = useState<Param[]>([]);
  const [formState, setFormState] = useState<Record<string, string>>({});

  useEffect(() => {
    const allFiles = import.meta.glob('/public/us-core/*.json', {
      as: 'json',
      eager: true,
    });

    const relevant: Param[] = [];

    for (const [path, file] of Object.entries(allFiles)) {
      const match = path.match(/SearchParameter-us-core-([^-]+)-(.+)\.json$/);
      if (!match) continue;

      const [_, fileResource] = match;
      if (fileResource.toLowerCase() !== resourceType.toLowerCase()) continue;

      const sp = file as any;
      if (sp.resourceType === 'SearchParameter') {
        relevant.push({
          code: sp.code,
          type: sp.type,
          description: sp.description,
        });
      }
    }

    setParams(relevant);
    setFormState({});
  }, [resourceType]);

  const handleChange = (code: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [code]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = Object.entries(formState)
      .filter(([_, v]) => v !== '')
      .map(([name, value]) => ({ name, value }));
    onSearch(searchParams);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {params.map((param) => (
        <div key={param.code}>
          <label htmlFor={param.code} title={param.description || ''} className="block font-medium">
            {param.code}
          </label>
          {(typeMap[param.type] || typeMap['string'])(param.code, formState[param.code] || '', (v) =>
            handleChange(param.code, v)
          )}
        </div>
      ))}
      <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Search
      </button>
    </form>
  );
};

export default FhirSearchBuilder;