import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User } from '@supabase/supabase-js';

interface Employee {
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
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    status: 'active',
    password: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employee_list')
      .select('*');

    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee_list')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            position: formData.position,
            hire_date: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
            salary: formData.salary,
            status: formData.status,
            created_by: user.id,
            updated_by: user.id
          }
        ])
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Create auth user
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            employee_id: employeeData.id
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      // Refresh the list
      fetchEmployees();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: '',
        salary: '',
        status: 'active',
        password: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee. Please try again.');
    }
  };

  return (
    <div>
      {/* Render your employee list and form here */}
    </div>
  );
};

export default EmployeeList; 