import React, { useEffect, useState } from 'react';
import _get from 'lodash/get';
import { Resource, StructureDefinition } from 'fhir/r4';
import './fhir-renderer.css';

interface FhirRendererProps {
  resource: Resource;
}

interface StructureDefinitions {
  [url: string]: StructureDefinition;
}

const FhirRenderer: React.FC<FhirRendererProps> = ({ resource }) => {
  const [structureDefs, setStructureDefs] = useState<StructureDefinitions>({});
  const [mainStructureDef, setMainStructureDef] = useState<StructureDefinition | null>(null);

  const resourceType = resource.resourceType;

  useEffect(() => {
    const fetchStructureDefs = async () => {
      try {
        console.log(`Fetching structure definitions for resourceType: ${resourceType}`);
        const baseProfile = `/us-core/StructureDefinition-us-core-${resourceType.toLowerCase()}.json`;
        const coreTypes = '/us-core/profiles-types.json';

        const [mainDef, typesDef] = await Promise.all([
          fetch(baseProfile).then(res => res.json()),
          fetch(coreTypes).then(res => res.json())
        ]);

        console.log('Fetched main definition:', mainDef);
        console.log('Fetched type definitions:', typesDef);

        const typeMap: StructureDefinitions = {};
        (typesDef.entry || []).forEach((entry: any) => {
          if (entry.resource?.resourceType === 'StructureDefinition') {
            const def: StructureDefinition = entry.resource;
            typeMap[def.url] = def;
          }
        });

        typeMap[mainDef.url] = mainDef;

        console.log('Final type map keys:', Object.keys(typeMap));

        setStructureDefs(typeMap);
        setMainStructureDef(mainDef);
      } catch (err) {
        console.error('Failed to fetch structure definitions:', err);
      }
    };

    fetchStructureDefs();
  }, [resourceType]);

  
  function resolveDefinitionUrl(
    type: string,
    structureDefs: Record<string, StructureDefinition>
  ): string | undefined {
    if (!type) return undefined;
  
    // Exact match
    if (structureDefs[type]) return type;
  
    // Try canonical URL
    const match = Object.keys(structureDefs).find(key =>
      key.endsWith(`/StructureDefinition/${type}`)
    );
    return match;
  }
  
  

  const renderElement = (path: string, value: any, defUrl?: string): React.ReactNode => {
    console.log(`Rendering element at path: ${path}, defUrl: ${defUrl}`);
    console.log('Value:', value);

    if (Array.isArray(value)) {
      return (
        <div className="ml-4 space-y-2">
          {value.map((v, i) => (
            <div key={i}>{renderElement(path, v, defUrl)}</div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
        const resolvedUrl = defUrl ? resolveDefinitionUrl(defUrl, structureDefs) : null;
        const complexDef = resolvedUrl ? structureDefs[resolvedUrl] : null;
      
        if (!complexDef) {
          console.warn(`No StructureDefinition found for defUrl: ${defUrl}`);
          return <div className="text-red-500">Unknown complex type</div>;
        }
      
        const elements = complexDef.snapshot?.element.filter(e => e.path !== complexDef.type) || [];
      
        return (
          <div className="ml-4 border-l-2 pl-2">
            {elements.map((el, idx) => {
              const subPath = el.path.split('.').slice(1).join('.');
              const subValue = _get(value, subPath);
              const typeUrl = el.type?.[0]?.profile?.[0] || el.type?.[0]?.code;
      
              console.log(`Rendering sub-element: ${subPath}`, subValue);
      
              if (subValue === undefined) return null;
      
              return (
                <div key={idx}>
                  <strong>{subPath}</strong>: {renderElement(subPath, subValue, typeUrl)}
                </div>
              );
            })}
          </div>
        );
      }

    return <span>{String(value)}</span>;
  };

  if (!mainStructureDef) {
    console.log('Waiting for main structure definition to load...');
    return <div>Loading...</div>;
  }

  console.log('Rendering main structure definition...');

  return (
    <div className="fhir-grid">
      {mainStructureDef.snapshot?.element.map((el, idx) => {
        const path = el.path;
        const relativePath = path.startsWith(`${resourceType}.`) ? path.replace(`${resourceType}.`, '') : path;
        const value = _get(resource, relativePath);
  
        const typeUrl = el.type?.[0]?.profile?.[0] || el.type?.[0]?.code;
  
        console.log(`Path: ${path}`);
        console.log(`  ↳ Relative Path: ${relativePath}`);
        console.log(`  ↳ Value:`, value);
        console.log(`  ↳ Type URL:`, typeUrl);
  
        if (value === undefined) return null;
  
        return (
          <div key={idx} className="fhir-cell">
            <div className="fhir-label">{path}</div>
            <div className="fhir-value">
              {Array.isArray(value) ? (
                <div className="ml-4 space-y-2">
                  {value.map((v, i) => (
                    <div key={i}>{renderElement(relativePath, v, typeUrl)}</div>
                  ))}
                </div>
              ) : (
                renderElement(relativePath, value, typeUrl)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
  
};

export default FhirRenderer;
