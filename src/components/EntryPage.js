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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.goldRate || isNaN(formData.goldRate)) {
      setMessage({ type: 'error', text: 'Please enter a valid gold rate' });
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const goldData = {
        date: formData.date,
        goldRate: parseFloat(formData.goldRate),
        timestamp: new Date().toISOString()
      };

      // Create a unique key using the date
      const dateKey = formData.date.replace(/-/g, '');
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
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
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
          <li>Select the date for which you want to add the gold rate</li>
          <li>Enter the gold rate per gram in Indian Rupees (₹)</li>
          <li>Click "Save Gold Rate" to store the data in the database</li>
          <li>Navigate to "View Trends" to see the graphical representation</li>
        </ul>
      </div>
    </div>
  );
};

export default EntryPage; 