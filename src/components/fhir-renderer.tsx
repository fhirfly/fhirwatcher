// fhir-renderer.tsx (patched)
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
        const baseProfile = `/us-core/StructureDefinition-us-core-${resourceType.toLowerCase()}.json`;
        const coreTypes = '/us-core/profiles-types.json';

        const [mainDef, typesDef] = await Promise.all([
          fetch(baseProfile).then(res => res.json()),
          fetch(coreTypes).then(res => res.json())
        ]);

        const typeMap: StructureDefinitions = {};
        (typesDef.entry || []).forEach((entry: any) => {
          if (entry.resource?.resourceType === 'StructureDefinition') {
            const def: StructureDefinition = entry.resource;
            typeMap[def.url] = def;
          }
        });

        typeMap[mainDef.url] = mainDef;
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
    if (structureDefs[type]) return type;

    const match = Object.keys(structureDefs).find(key =>
      key.endsWith(`/StructureDefinition/${type}`)
    );
    if (match) return match;

    const tailMatch = Object.keys(structureDefs).find(key =>
      key.endsWith(type)
    );
    return tailMatch;
  }

  const loadExtensionStructureDefinition = async (extUrl: string): Promise<StructureDefinition | undefined> => {
    const extId = extUrl.split('/').pop();
    if (!extId) return undefined;

    const path = `/us-core/StructureDefinition-${extId}.json`;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to fetch ${path}`);
      const def = await res.json();
      if (def.resourceType === 'StructureDefinition') {
        setStructureDefs(prev => ({ ...prev, [def.url]: def }));
        return def;
      }
    } catch (err) {
      console.error(`Error loading extension StructureDefinition ${extId}:`, err);
    }

    return undefined;
  };

  const renderElement = (path: string, value: any, defUrl?: string): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="ml-4 space-y-2">
          {value.map((v, i) => (
            <div key={i}>{renderElement(path, v, defUrl)}</div>
          ))}
        </div>
      );
    }

    if (value?.url && (value.valueString || value.valueCode || value.valueCoding || value.valueBoolean || value.extension)) {
      const extUrl = value.url;
      const extDef = structureDefs[extUrl];

      if (!extDef) {
        loadExtensionStructureDefinition(extUrl).then(loaded => {
          if (loaded) {
            setStructureDefs(prev => ({ ...prev, [loaded.url]: loaded }));
          }
        });

        return <div className="text-yellow-600">[Extension: {extUrl}]</div>;
      }

      const label = extDef.title || extDef.name || extUrl.split('/').pop();

      if (value.extension) {
        return (
          <div className="ml-4 border-l-2 pl-2 border-gray-400">
            <strong>{label}</strong>
            {value.extension.map((subExt: any, i: number) => {
              const valueKey = Object.keys(subExt).find(k => k.startsWith('value'));
              const subValue = subExt[valueKey!];
              const subLabel = subExt.url;

              return (
                <div key={i}>
                  <strong>{subLabel}</strong>: {typeof subValue === 'object' ? JSON.stringify(subValue) : String(subValue)}
                </div>
              );
            })}
          </div>
        );
      } else {
        const valueKey = Object.keys(value).find(k => k.startsWith('value'));
        const val = value[valueKey!];

        return (
          <div>
            <strong>{label}</strong>: {String(val)}
          </div>
        );
      }
    }

    if (typeof value === 'object' && value !== null) {
      const resolvedUrl = defUrl ? resolveDefinitionUrl(defUrl, structureDefs) : null;
      const complexDef = resolvedUrl ? structureDefs[resolvedUrl] : null;

      if (!complexDef) {
        return <div className="text-red-500">Unknown complex type</div>;
      }

      const elements = complexDef.snapshot?.element.filter(e => e.path !== complexDef.type) || [];

      return (
        <div className="ml-4 border-l-2 pl-2 border-gray-300">
          {elements.map((el, idx) => {
            const subPath = el.path.split('.').slice(1).join('.');
            const subValue = _get(value, subPath);
            const typeUrl = el.type?.[0]?.profile?.[0] || el.type?.[0]?.code;

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

  if (!mainStructureDef) return <div>Loading...</div>;

  // ⬇️ Dedupe snapshot elements by path
  const topLevelElements = [
    ...new Map(
      mainStructureDef.snapshot?.element
        .filter(el =>
          el.path === resourceType ||
          (el.path.startsWith(`${resourceType}.`) &&
            !el.path.slice(resourceType.length + 1).includes('.'))
        )
        .map(el => [el.path, el])
    ).values()
  ];

  return (
    <div className="fhir-grid">
      {topLevelElements.map((el, idx) => {
        const path = el.path;
        const relativePath = path.startsWith(`${resourceType}.`) ? path.replace(`${resourceType}.`, '') : path;
        const value = _get(resource, relativePath);
        const typeUrl = el.type?.[0]?.profile?.[0] || el.type?.[0]?.code;
        if (value === undefined) return null;

        return (
          <div key={idx} className="fhir-cell">
            <div className="fhir-label">{path}</div>
            <div className="fhir-value">
              {renderElement(relativePath, value, typeUrl)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FhirRenderer;
