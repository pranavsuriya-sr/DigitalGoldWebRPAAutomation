import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '../firebase';

const EntryPage = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    goldRate: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to convert DD-MM-YYYY to YYYY-MM-DD
  const convertDateFormat = (dateString) => {
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert from DD-MM-YYYY to YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateString; // Return as is if format doesn't match
  };

  // Function to validate date format
  const isValidDate = (dateString) => {
    const convertedDate = convertDateFormat(dateString);
    const date = new Date(convertedDate);
    return date instanceof Date && !isNaN(date) && date.toISOString().split('T')[0] === convertedDate;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate date format
    if (!isValidDate(formData.date)) {
      setMessage({ type: 'error', text: 'Please enter a valid date in DD-MM-YYYY format (e.g., 30-08-2025)' });
      return;
    }
    
    if (!formData.goldRate || isNaN(formData.goldRate)) {
      setMessage({ type: 'error', text: 'Please enter a valid gold rate' });
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Convert date to YYYY-MM-DD format for database
      const convertedDate = convertDateFormat(formData.date);
      
      const goldData = {
        date: convertedDate,
        goldRate: parseFloat(formData.goldRate),
        timestamp: new Date().toISOString()
      };

      // Create a unique key using the date
      const dateKey = convertedDate.replace(/-/g, '');
      const goldRef = ref(database, `goldRates/${dateKey}`);
      
      await set(goldRef, goldData);

      setMessage({ type: 'success', text: 'Gold rate data saved successfully!' });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        goldRate: ''
      });
    } catch (error) {
      console.error('Error saving data:', error);
      setMessage({ type: 'error', text: 'Failed to save data. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Add Gold Rate Data</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Date
            </label>
            <input
              type="text"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
              placeholder="DD-MM-YYYY (e.g., 30-08-2025)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="goldRate" className="form-label">
              Gold Rate (per gram in ₹)
            </label>
            <input
              type="number"
              id="goldRate"
              name="goldRate"
              value={formData.goldRate}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter gold rate"
              step="0.01"
              min="0"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Saving...' : 'Save Gold Rate'}
          </button>
        </form>

        {message && (
          <div className={`${message.type === 'success' ? 'success-message' : 'error-message'}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#00d4ff', fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📊 Instructions
        </h3>
        <ul style={{ lineHeight: '1.6', color: '#ffffff' }}>
          <li>Enter the date in DD-MM-YYYY format (e.g., 30-08-2025) for which you want to add the gold rate</li>
          <li>Enter the gold rate per gram in Indian Rupees (₹)</li>
          <li>Click "Save Gold Rate" to store the data in the database</li>
          <li>Navigate to "View Trends" to see the graphical representation</li>
        </ul>
      </div>
    </div>
  );
};

export default EntryPage; 