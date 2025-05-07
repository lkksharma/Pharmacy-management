import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalaryEditor = () => {
  // State variables
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch employee list to populate the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/employees');
        setEmployees(response.data);
      } catch (err) {
        setError('Error fetching employee data');
      }
    };

    fetchEmployees();
  }, []);

  // Fetch salary of the selected employee
  const fetchSalary = async (empId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/employee/${empId}/salary`);
      setSalary(response.data.salary);
      setLoading(false);
    } catch (err) {
      setError('Error fetching salary data');
      setLoading(false);
    }
  };

  // Handle employee selection change
  const handleEmpChange = (event) => {
    const empId = event.target.value;
    setSelectedEmpId(empId);
    fetchSalary(empId);
  };

  // Handle salary increment/decrement
  const handleSalaryChange = (event) => {
    setSalary(event.target.value);
  };

  // Handle submit for salary update
  const handleSalarySubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.put(`/api/employee/${selectedEmpId}/salary`, { salary });
      alert('Salary updated successfully');
      setLoading(false);
    } catch (err) {
      setError('Error updating salary');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Edit Employee Salary</h1>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <form onSubmit={handleSalarySubmit}>
        <div>
          <label>Select Employee: </label>
          <select
            value={selectedEmpId}
            onChange={handleEmpChange}
            required
          >
            <option value="" disabled>Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.Emp_ID} value={emp.Emp_ID}>
                {emp.Emp_Name}
              </option>
            ))}
          </select>
        </div>

        {selectedEmpId && (
          <>
            <div>
              <label>Current Salary: </label>
              <input
                type="number"
                value={salary}
                onChange={handleSalaryChange}
                required
              />
            </div>
            <div>
              <button type="submit" disabled={loading}>
                {loading ? 'Updating Salary...' : 'Update Salary'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default SalaryEditor;
