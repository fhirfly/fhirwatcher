import React, { JSX, useEffect, useState } from 'react';

// This is assumed to be available in scope — replace with your actual implementation
declare function SearchResource(resourceType: string, parameters: { name: string; value: string }[]): void;

const typeMap: Record<string, (name: string, value: string, onChange: (v: string) => void) => JSX.Element> = {
  base64Binary: (n, v, onChange) => <input type="file" name={n} onChange={(e) => onChange(e.target.value)} />,
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

type Param = {
  code: string;
  type: string;
  description?: string;
};

export const FhirSearchBuilder: React.FC<{ resourceType: string }> = ({ resourceType }) => {
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
    setFormState({}); // reset on resource change
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

    SearchResource(resourceType, searchParams);
  };

  return (
    <form className="fhir-search-form" onSubmit={handleSubmit}>
      {params.map((param) => (
        <div key={param.code} className="form-group" style={{ marginBottom: '1em' }}>
          <label htmlFor={param.code} title={param.description || ''}>
            {param.code}
          </label>
          {(typeMap[param.type] || typeMap['string'])(param.code, formState[param.code] || '', (v) => handleChange(param.code, v))}
        </div>
      ))}
      <button type="submit">Search</button>
    </form>
  );
};
