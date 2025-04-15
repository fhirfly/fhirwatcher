# 🧬 FHIR Renderer

A dynamic React component that renders [FHIR](https://www.hl7.org/fhir/) resources using their associated `StructureDefinition`s. This tool is useful for exploring FHIR resource content in a readable, structured format without hardcoding each resource type.

## 🚀 Features

- Recursively renders complex FHIR resources like `Patient`, `HumanName`, `Address`, etc.
- Uses FHIR `StructureDefinition`s to guide the layout dynamically.
- Supports nested complex types and arrays.
- Automatically resolves type profiles using canonical URLs or type codes.

## 🛠️ Installation

1. **Clone the repo**

```bash
git clone https://github.com/your-username/fhir-renderer.git
cd fhir-renderer
```

2. **Install dependencies**

```bash
yarn install
```

3. **Start the dev server**

```bash
yarn dev
```

Your app will be available at `http://localhost:5173` (or your configured Vite port).

## 📁 Project Structure

```
src/
├── App.tsx                  # Entry point – renders a sample Patient resource
├── FhirRenderer.tsx         # Main FHIR renderer logic
├── structureDefs/           # Folder for JSON StructureDefinition files
├── utils/resolveDefinitionUrl.ts  # Utility to map type names to StructureDefinitions
```

## 🧩 How it works

1. StructureDefinitions are loaded into memory (e.g., `Patient`, `HumanName`, etc.).
2. The `<FhirRenderer />` component receives a FHIR resource and its type.
3. It looks up the `StructureDefinition` based on the resource type.
4. It recursively walks the resource data using the structure definition:
   - Displays scalar values (`string`, `boolean`, etc.)
   - Re-renders subcomponents for complex types like `HumanName`, `Address`, etc.

## 🔧 Customizing

- Add more `StructureDefinition` JSON files to support additional resource types.
- Adjust styling in `FhirRenderer.tsx` to match your desired UI.
- Extend `resolveDefinitionUrl` to handle more exotic type resolution logic.

## 📄 Example Resource Rendered

Given this `Patient` resource:

```json
{
  "resourceType": "Patient",
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1980-01-01"
}
```

The UI will display:

```
Patient.name
  use: official
  family: Doe
  given: John
gender: male
birthDate: 1980-01-01
```

## 🧱 Dependencies

- React
- TypeScript
- lodash (for deep value access)
- `@types/fhir` for FHIR typings

## 📜 License

MIT – use it, fork it, share it!

## 🙌 Acknowledgments

Thanks to the HL7 FHIR community for the amazing open standards and tooling.
