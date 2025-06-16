import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User } from '@supabase/supabase-js';

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hire_date: string | null;
  salary: string;
  status: string;
}

const EmployeeProfile: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    status: '',
  });
  const [showForm, setShowForm] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_list')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployeeData(data);
      setFormData({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        position: data.position,
        hireDate: data.hire_date || '',
        salary: data.salary,
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchEmployeeData();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('employee_list')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          hire_date: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
          salary: formData.salary,
          status: formData.status,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) throw error;

      // Refresh the data
      fetchEmployeeData();
      setShowForm(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default EmployeeProfile; 