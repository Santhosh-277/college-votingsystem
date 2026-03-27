import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents, updateStudentInFirebase, deleteStudentFromFirebase, StudentUser } from '@/integrations/firebase/authService';
import { importStudentsFromExcel, exportStudentsToExcel, downloadStudentTemplate } from '@/integrations/firebase/excelImportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  UserCog,
  Shield,
  Mail,
  Hash,
  Save,
  X,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    rollNo: '',
    password: '',
  });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student: StudentUser) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      rollNo: student.rollNo,
      password: '', // Don't show existing password
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      const updates: any = {
        name: editForm.name,
        rollNo: editForm.rollNo,
      };

      if (editForm.password) {
        updates.password = editForm.password;
      }

      await updateStudentInFirebase(selectedStudent.id, updates);
      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await deleteStudentFromFirebase(id);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
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
        toast.success(`Import completed! ${result.imported} students added successfully.`);
        fetchStudents(); // Refresh the list
      } else {
        toast.error(`Import completed with issues. Check console for details.`);
      }

    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed. Check console for details.');
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      console.log('Exporting students to Excel...');
      await exportStudentsToExcel();
      toast.success('Students exported to Excel file successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Check console for details.');
    }
  };

  const handleDownloadTemplate = () => {
    downloadStudentTemplate();
    toast.success('Template downloaded! Fill it with student data and import.');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by department
  const groupedStudents = filteredStudents.reduce((acc: any, student) => {
    const dept = student.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(student);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="text-gray-700 dark:text-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">View and manage student records</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name or roll number..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Excel Import/Export Section */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Bulk Student Management
            </CardTitle>
            <CardDescription>
              Import students from Excel or export current student data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isImporting}
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : 'Import from Excel'}
                </Button>
              </div>

              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-200">Excel Format:</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Columns:</strong> Roll Number*, Name*, Email, Department, Password<br/>
                <strong>Note:</strong> *Required fields. Password auto-generated if empty.
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading student records...</p>
          </div>
        ) : Object.keys(groupedStudents).length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-gray-500">
              No students found matching your search.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedStudents).map(([dept, deptStudents]: [string, any]) => (
              <section key={dept}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-sm font-semibold px-3 py-1 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                    {dept}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wider">
                    {deptStudents.length} Students
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deptStudents.map((student: StudentUser) => (
                    <Card key={student.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-gray-900 dark:text-white">{student.name}</CardTitle>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {student.role.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1.5 pt-1">
                          <Hash className="w-3 h-3" />
                          {student.rollNo}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Shield className="w-3.5 h-3.5" />
                            Registered: {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-xs"
                              onClick={() => handleEditClick(student)}
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                              onClick={() => handleDeleteStudent(student.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle>Edit Student Record</DialogTitle>
            <DialogDescription>
              Update information for <span className="font-bold text-gray-900 dark:text-white">{selectedStudent?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roll">Roll Number</Label>
              <Input 
                id="edit-roll"
                value={editForm.rollNo}
                onChange={(e) => setEditForm(prev => ({ ...prev, rollNo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pass">New Password (leave blank to keep current)</Label>
              <Input 
                id="edit-pass"
                type="password"
                placeholder="••••••••"
                value={editForm.password}
                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStudent}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;
