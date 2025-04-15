import React, { useEffect, useState } from 'react';
import { Resource, StructureDefinition, Bundle } from 'fhir/r4';
import _get from 'lodash/get';

export interface FHIRSearchResultsProps {
  bundle: Bundle;
  onSelectResource?: (resource: Resource) => void;
}

interface StructureDefinitions {
  [url: string]: StructureDefinition;
}

interface Column {
  path: string;
  label: string;
  defUrl?: string;
}


const FHIRSearchResults: React.FC<FHIRSearchResultsProps> = ({ bundle, onSelectResource }) => {

  const [structureDefs, setStructureDefs] = useState<StructureDefinitions>({});
  const [mainStructureDef, setMainStructureDef] = useState<StructureDefinition | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);

  const entries = bundle.entry?.map(e => e.resource).filter(Boolean) || [];
  const resourceType = entries[0]?.resourceType;
  useEffect(() => {
    const fetchStructureDefs = async () => {
      if (!resourceType) return; // Bail if resourceType is undefined
      try {
        console.log(`Loading structure definitions...`);
  
        // Define local paths for structure definitions
        const baseProfile = `/us-core/StructureDefinition-us-core-${resourceType.toLowerCase()}.json`;
        const coreTypes = '/us-core/profiles-types.json';
  
        // Fetch the locally stored structure definitions
        const [mainDef, typesDef] = await Promise.all([
          fetch(baseProfile).then(res => res.json()),
          fetch(coreTypes).then(res => res.json())
        ]);
  
        const typeMap: StructureDefinitions = {};
        // Iterate over entries in profiles-types.json and populate the typeMap with local data
        (typesDef.entry || []).forEach((entry: any) => {
          if (entry.resource?.resourceType === 'StructureDefinition') {
            const def: StructureDefinition = entry.resource;
            typeMap[def.url] = def;
          }
        });
  
        // Add the main definition to the map
        typeMap[mainDef.url] = mainDef;
  
        // Update state with the fetched definitions
        setStructureDefs(typeMap);
        setMainStructureDef(mainDef);
  
        console.log('Loaded main structure definition:', mainDef.url);
        console.log('Loaded core type definitions:', Object.keys(typeMap));
  
        const paths = (mainDef.snapshot?.element || [])
        .filter((el: { path: string }) =>
          typeof el.path === 'string' &&
          (el.path === resourceType || el.path.startsWith(`${resourceType}.`))
        );

        const uniquePathMap = new Map<string, typeof paths[0]>();

        paths.forEach((el: { path: string | any[]; }) => {
          if (typeof el.path === 'string' && !el.path.slice(resourceType.length + 1).includes('.')) {
            uniquePathMap.set(el.path, el);
          }
        });

        const dedupedElements = Array.from(uniquePathMap.values());

        const dedupedColumns = dedupedElements.map((el: any) => {
        const relativePath = el.path.replace(`${resourceType}.`, '');
        const typeUrl = el.type?.[0]?.profile?.[0] || el.type?.[0]?.code;

        if (el.path.includes('extension')) {
          const extensionTitle = el.short || el.path.split('.').pop();
          return {
            path: relativePath,
            label: extensionTitle,
            defUrl: typeUrl
          };
        }

        return {
          path: relativePath,
          label: relativePath,
          defUrl: typeUrl
        };
        });

        // Only use columns with actual data
        const columnsWithData = dedupedColumns.filter((col: { path: any }) => {
        return entries.some(resource => {
          const val = _get(resource, col.path);
          return val !== undefined && val !== null &&
                !(Array.isArray(val) && val.length === 0) &&
                !(typeof val === 'object' && Object.keys(val).length === 0);
        });
        });

        setColumns(columnsWithData);

        console.log('Extracted columns:', paths);
      } catch (err) {
        console.error('Failed to fetch structure definitions:', err);
      }
    };
  
    if (resourceType) {
      fetchStructureDefs();
    }
  }, [resourceType]);
  
  

  function resolveDefinitionUrl(type: string): string | undefined {
    if (!type) return undefined;
    if (structureDefs[type]) return type;
    const match = Object.keys(structureDefs).find(key => key.endsWith(`/StructureDefinition/${type}`));
    return match;
  }

  function getStructureDefinitionPath(url: string): string | null {
    if (url.startsWith("http://hl7.org/fhir/us/core/StructureDefinition/")) {
      const name = url.split("/").pop();
      return `/us-core/StructureDefinition-${name}.json`;
    }
    return null;
  }

  const loadExtensionDef = async (url: string): Promise<StructureDefinition | null> => {
    if (structureDefs[url]) return structureDefs[url];
  
    const localPath = getStructureDefinitionPath(url);
    if (!localPath) {
      console.warn(`Unsupported extension URL: ${url}`);
      return null;
    }
  
    try {
      const extDef = await fetch(localPath).then(res => res.json());
      setStructureDefs(prev => ({ ...prev, [url]: extDef }));
      return extDef;
    } catch (err) {
      console.warn(`Failed to load extension definition from ${localPath}:`, err);
      return null;
    }
  };

  const renderElement = (path: string, value: any, defUrl?: string): React.ReactNode => {
    if (Array.isArray(value)) {
      return value.map((v, i) => <div key={i}>{renderElement(path, v, defUrl)}</div>);
    }
  
    // 🔍 Handle FHIR Extensions
    if (typeof value === 'object' && value !== null && value.url) {
      const extUrl = value.url;
      const extDef = structureDefs[extUrl];
      const label = extDef?.title || extDef?.name || extUrl.split('/').pop();
  
      // 🧩 Complex extension (has nested .extension array)
      if (Array.isArray(value.extension)) {
        const renderedSubs = value.extension.map((subExt: any, idx: number) => {
          const valKey = Object.keys(subExt).find(k => k.startsWith('value'));
          const val = valKey ? subExt[valKey] : '';
          const subPath = subExt.url;
  
          // Try to resolve the 'short' description from StructureDefinition
          const subElShort =
            extDef?.snapshot?.element?.find(e => e.path.endsWith(`extension:${subPath}`))?.short;
  
          const subLabel = subElShort || subPath;
  
          return `${subLabel}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`;
        });
  
        return (
          <div>
            <strong>{label}</strong>: {renderedSubs.join(', ')}
          </div>
        );
      }
  
      // 🧷 Simple extension (has direct value)
      const valKey = Object.keys(value).find(k => k.startsWith('value'));
      if (valKey) {
        const val = value[valKey];
        return (
          <div>
            <strong>{label}</strong>: {String(val)}
          </div>
        );
      }
  
      return <div><strong>{label}</strong></div>;
    }
  
    // 🧱 Complex types
    if (typeof value === 'object' && value !== null) {
      const resolvedUrl = defUrl ? resolveDefinitionUrl(defUrl) : null;
      const complexDef = resolvedUrl ? structureDefs[resolvedUrl] : null;
  
      if (!complexDef) {
        if (defUrl?.startsWith('http')) {
          loadExtensionDef(defUrl).then(() => {
            console.log(`Loaded structure definition for ${defUrl}`);
          });
        }
        return <span className="text-yellow-500">[Loading definition...]</span>;
      }
  
      const elements = complexDef.snapshot?.element.filter(e => e.path !== complexDef.type) || [];
      return (
        <div className="ml-2">
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



  const resources: Resource[] = (bundle.entry ?? [])
  .map(({ resource }): Resource | undefined => resource)
  .filter((res): res is Resource => res !== undefined);


  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="border px-4 py-2 text-left">{col.label}</th>
            ))}
          </tr>
        </thead>
<tbody>
  {resources.map((resource, rowIdx) => (
     <tr
     key={rowIdx}
     className="hover:bg-gray-100 cursor-pointer"
     onClick={() => onSelectResource?.(resource)} // ✅ make sure this is the one!
   >
     {columns.map((col, colIdx) => (
       <td key={colIdx} className="border px-2 py-1">
         {renderElement(col.path, _get(resource, col.path), col.defUrl)}
       </td>
     ))}
   </tr>
  ))}
</tbody>
      </table>
    </div>
  );
};

export default FHIRSearchResults;