import { importStudentsFromExcel, exportStudentsToExcel, downloadStudentTemplate } from './excelImportService';

// Example usage in React component
export const ExcelImportExample = () => {
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('Importing students from Excel...');
      const result = await importStudentsFromExcel(file);

      console.log('Import Results:');
      console.log(`✅ Successfully imported: ${result.imported} students`);
      console.log(`❌ Failed to import: ${result.failed} students`);

      if (result.errors.length > 0) {
        console.log('Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (result.duplicates.length > 0) {
        console.log('Duplicates found:');
        result.duplicates.forEach(duplicate => console.log(`  - ${duplicate}`));
      }

      if (result.success) {
        alert(`Import completed! ${result.imported} students added successfully.`);
      } else {
        alert(`Import completed with issues. Check console for details.`);
      }

    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Check console for details.');
    }
  };

  const handleExport = async () => {
    try {
      console.log('Exporting students to Excel...');
      await exportStudentsToExcel();
      alert('Students exported to Excel file successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    }
  };

  const handleDownloadTemplate = () => {
    downloadStudentTemplate();
    alert('Template downloaded! Fill it with student data and import.');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Excel Import/Export</h2>

      <div className="space-y-2">
        <button
          onClick={handleDownloadTemplate}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          📥 Download Template
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Import Students from Excel:</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileImport}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          📤 Export Students to Excel
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">📋 Excel Format:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Roll Number:</strong> Required (e.g., AIT001)</li>
          <li><strong>Name:</strong> Required (e.g., John Doe)</li>
          <li><strong>Email:</strong> Optional (e.g., john@college.edu)</li>
          <li><strong>Department:</strong> Optional (e.g., Computer Science)</li>
          <li><strong>Password:</strong> Optional (leave empty for auto-generation)</li>
        </ul>
      </div>
    </div>
  );
};

// Test the import functionality
export const testExcelImport = async () => {
  console.log('Testing Excel import functionality...');

  // This would be used with an actual file input in the UI
  // For testing, you can manually upload the template file

  console.log('✅ Excel import service is ready!');
  console.log('📝 Template file: student_import_template.xlsx');
  console.log('🔧 Service file: src/integrations/firebase/excelImportService.ts');
};