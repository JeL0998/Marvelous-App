import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { FaEdit, FaTrash, FaSearch, FaSave, FaUndo } from 'react-icons/fa';

const GENDERS = ['Male', 'Female', 'Other'];
const POSITIONS = ['Teacher', 'Course Head', 'Department Head', 'Registrar', 'Admin'];

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', gender: '', address: '', mobileNumber: '', position: '', department: '', course: '' });
  const [departments, setDepartments] = useState([]);
  const [allCourses, setAllCourses] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const staffDocs = await getDocs(collection(db, 'Staff'));
      setStaff(staffDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const deptSnapshot = await getDocs(collection(db, 'Departments'));
      const departments = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(departments);

      const coursesByDept = {};
      for (const department of departments) {
        const courseSnapshot = await getDocs(collection(db, `Departments/${department.id}/Courses`));
        coursesByDept[department.id] = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      setAllCourses(coursesByDept);
    } catch (error) {
      console.error("Error fetching data: ", error);
      Swal.fire('Error!', 'There was an error fetching the data.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const staffRef = selectedStaff ? doc(db, 'Staff', selectedStaff.id) : collection(db, 'Staff');
    try {
      if (selectedStaff) {
        await updateDoc(staffRef, formData);
      } else {
        await addDoc(staffRef, formData);
      }
      Swal.fire('Success!', `Staff has been ${selectedStaff ? 'updated' : 'added'}.`, 'success');
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving staff data: ", error);
      Swal.fire('Error!', 'There was an error saving the staff data.', 'error');
    }
  };

  const handleEdit = (staffMember) => {
    setFormData(staffMember);
    setSelectedStaff(staffMember);
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (staffMember) => {
    const confirmed = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this staff member!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (confirmed.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Staff', staffMember.id));
        Swal.fire('Deleted!', 'Staff member has been deleted.', 'success');
        await fetchData();
      } catch (error) {
        console.error("Error deleting staff member: ", error);
        Swal.fire('Error!', 'There was an error deleting the staff member.', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', gender: '', address: '', mobileNumber: '', position: '', department: '', course: '' });
    setSelectedStaff(null);
  };

  const filteredStaff = useMemo(() => staff.filter(({ firstName, lastName, position, department, course }) =>
    [firstName, lastName, position, department, course].some(field => field.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [staff, searchQuery]);

  const columns = useMemo(() => [
    { name: 'First Name', selector: row => row.firstName, sortable: true },
    { name: 'Last Name', selector: row => row.lastName, sortable: true },
    { name: 'Position', selector: row => row.position, sortable: true },
    { name: 'Department', selector: row => row.department, sortable: true },
    { name: 'Course', selector: row => row.course, sortable: true },
    {
      cell: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
            <FaEdit />
          </button>
          <button onClick={() => handleDelete(row)} className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true
    }
  ], []);

  const customStyles = {
    rows: {
      style: {
        minHeight: '72px',
        '&:nth-child(odd)': { backgroundColor: '#f9f9f9' },
        '&:hover': { backgroundColor: '#f1f1f1' },
      },
    },
    headCells: {
      style: {
        backgroundColor: '#4B5563',
        color: '#ffffff',
        fontWeight: 'bold',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  const subHeaderComponentMemo = useMemo(() => (
    <div className="flex items-center p-2">
      <FaSearch className="text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Search Staff..."
        className="border rounded-md p-2 w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  ), [searchQuery]);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Staff Management</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{selectedStaff ? 'Edit Staff' : 'Add Staff'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['firstName', 'lastName', 'address', 'mobileNumber'].map(field => (
              <input
                key={field}
                type="text"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="p-2 border rounded-md"
                value={formData[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                required
              />
            ))}
            <select className="p-2 border rounded-md" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} required>
              <option value="">Select Gender</option>
              {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            <select className="p-2 border rounded-md" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} required>
              <option value="">Select Position</option>
              {POSITIONS.map(position => <option key={position} value={position}>{position}</option>)}
            </select>
            <select className="p-2 border rounded-md" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} required>
              <option value="">Select Department</option>
              {departments.map(department => <option key={department.id} value={department.id}>{department.id}</option>)}
            </select>
            <select className="p-2 border rounded-md" value={formData.course} onChange={(e) => handleChange('course', e.target.value)} disabled={!formData.department}>
              <option value="">Select Course</option>
              {(allCourses[formData.department] || []).map(course => <option key={course.id} value={course.id}>{course.id}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 mt-5">
          <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"><FaSave className="inline mr-1" />{selectedStaff ? 'Update Staff' : 'Add Staff'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-400"><FaUndo className="inline mr-1" />Reset</button>
          </div>
        </form>

        <DataTable
          columns={columns}
          data={filteredStaff}
          customStyles={customStyles}
          subHeader
          subHeaderComponent={subHeaderComponentMemo}
          pagination
        />
      </motion.div>
    </Layout>
  );
}