import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, UserPlus, X } from 'lucide-react';

export default function SalaryEditor() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
 
  const [newEmployee, setNewEmployee] = useState({
    Emp_Name: '',
    Gender: 'Male',
    Age: '',
    Role: '',
    Salary: '',
    PhoneNumbers: ['']
  });

 
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3006/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading employees: ' + err.message);
      setLoading(false);
    }
  };

  const fetchEmployeeSalary = async (empId) => {
    try {
      const response = await fetch(`http://localhost:3006/api/employee/${empId}/salary`);
      if (!response.ok) throw new Error('Failed to fetch salary');
      
      const data = await response.json();
      return data.salary;
    } catch (err) {
      setError('Error fetching salary: ' + err.message);
      return null;
    }
  };

  const handleEmployeeChange = async (e) => {
    const empId = parseInt(e.target.value);
    if (!empId) {
      setSelectedEmployee(null);
      setSalary('');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3006/api/employees/${empId}`);
      if (!response.ok) throw new Error('Failed to fetch employee details');
      
      const employee = await response.json();
      setSelectedEmployee(employee);
      setSalary(employee.Salary);
    } catch (err) {
      setError('Error fetching employee details: ' + err.message);
    }
  };

  const handleSalaryChange = (e) => {
    setSalary(e.target.value);
  };

  const updateSalary = async () => {
    if (!selectedEmployee || !salary) {
      setError('Please select an employee and enter a salary');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3006/api/employees/${selectedEmployee.Emp_ID}/salary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ salary: parseFloat(salary) }),
      });
      
      if (!response.ok) throw new Error('Failed to update salary');
      
      const data = await response.json();
      setMessage(`Salary updated successfully for ${selectedEmployee.Emp_Name}`);
      
     
      fetchEmployees();
      
     
      setError('');
    } catch (err) {
      setError('Error updating salary: ' + err.message);
    }
  };

  const deleteEmployee = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee to delete');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedEmployee.Emp_Name}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3006/api/employees/${selectedEmployee.Emp_ID}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete employee');
      
      const data = await response.json();
      setMessage(`Employee ${selectedEmployee.Emp_Name} deleted successfully`);
      
     
      setSelectedEmployee(null);
      setSalary('');
      
     
      fetchEmployees();
      
     
      setError('');
    } catch (err) {
      setError('Error deleting employee: ' + err.message);
    }
  };

 
  const handleNewEmployeeChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: value
    });
  };

 
  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...newEmployee.PhoneNumbers];
    updatedPhones[index] = value;
    setNewEmployee({
      ...newEmployee,
      PhoneNumbers: updatedPhones
    });
  };

 
  const addPhoneField = () => {
    setNewEmployee({
      ...newEmployee,
      PhoneNumbers: [...newEmployee.PhoneNumbers, '']
    });
  };

 
  const removePhoneField = (index) => {
    const updatedPhones = [...newEmployee.PhoneNumbers];
    updatedPhones.splice(index, 1);
    setNewEmployee({
      ...newEmployee,
      PhoneNumbers: updatedPhones.length > 0 ? updatedPhones : ['']
    });
  };

 
  const addEmployee = async (e) => {
    e.preventDefault();
    
   
    const phoneNumbers = newEmployee.PhoneNumbers.filter(phone => phone.trim() !== '');
    
    try {
      const response = await fetch('http://localhost:3006/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEmployee,
          Age: newEmployee.Age ? parseInt(newEmployee.Age) : null,
          Salary: parseFloat(newEmployee.Salary),
          PhoneNumbers: phoneNumbers
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add employee');
      
      const data = await response.json();
      setMessage(`Employee ${newEmployee.Emp_Name} added successfully`);
      
     
      setNewEmployee({
        Emp_Name: '',
        Gender: 'Male',
        Age: '',
        Role: '',
        Salary: '',
        PhoneNumbers: ['']
      });
      
     
      setShowAddForm(false);
      
     
      fetchEmployees();
      
     
      setError('');
    } catch (err) {
      setError('Error adding employee: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Employee Salary Management</h1>
      
      {/* Message and Error Display */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {/* Main Section with Employee Selector */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Salary Editor</h2>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <UserPlus size={18} className="mr-1" /> Add New Employee
          </button>
        </div>
        
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select Employee:</label>
              <select 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedEmployee?.Emp_ID || ''}
                onChange={handleEmployeeChange}
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.Emp_ID} value={emp.Emp_ID}>
                    {emp.Emp_ID} - {emp.Emp_Name} ({emp.Role})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedEmployee && (
              <div className="bg-white p-4 border rounded">
                <h3 className="font-semibold text-lg mb-3">{selectedEmployee.Emp_Name}'s Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p><span className="font-medium">ID:</span> {selectedEmployee.Emp_ID}</p>
                    <p><span className="font-medium">Gender:</span> {selectedEmployee.Gender}</p>
                    <p><span className="font-medium">Age:</span> {selectedEmployee.Age || 'N/A'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Role:</span> {selectedEmployee.Role}</p>
                    <p><span className="font-medium">Start Date:</span> {new Date(selectedEmployee.Start_Date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Phone:</span> {selectedEmployee.Phone_Numbers || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Current Salary:</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={salary}
                      onChange={handleSalaryChange}
                      className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter salary amount"
                    />
                    <button
                      onClick={updateSalary}
                      className="px-4 bg-green-600 text-white rounded-r hover:bg-green-700 flex items-center"
                    >
                      <Save size={18} className="mr-1" /> Save
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  <button
                    onClick={deleteEmployee}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center ml-auto"
                  >
                    <Trash2 size={18} className="mr-1" /> Delete Employee
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Employee Form (Modal) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Employee</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={addEmployee}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="Emp_Name"
                  value={newEmployee.Emp_Name}
                  onChange={handleNewEmployeeChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-1">Gender *</label>
                  <select
                    name="Gender"
                    value={newEmployee.Gender}
                    onChange={handleNewEmployeeChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="Age"
                    value={newEmployee.Age}
                    onChange={handleNewEmployeeChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    name="Role"
                    value={newEmployee.Role}
                    onChange={handleNewEmployeeChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Salary *</label>
                  <input
                    type="number"
                    name="Salary"
                    value={newEmployee.Salary}
                    onChange={handleNewEmployeeChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Phone Number(s)</label>
                {newEmployee.PhoneNumbers.map((phone, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="flex-grow p-2 border rounded mr-2"
                      placeholder="Phone number"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoneField(index)}
                      className="px-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhoneField}
                  className="text-blue-600 flex items-center mt-1 hover:text-blue-800"
                >
                  <PlusCircle size={18} className="mr-1" /> Add Another Phone
                </button>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}