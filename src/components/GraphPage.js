import React, { useState, useEffect } from 'react';
import { ref, onValue, off, set, get } from 'firebase/database';
import { database } from '../firebase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays, subWeeks, subMonths, parseISO } from 'date-fns';

const GraphPage = () => {
  const [goldData, setGoldData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timePeriod, setTimePeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState(null);
  const [showCurrentDialog, setShowCurrentDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedTradeData, setSelectedTradeData] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeGrams, setTradeGrams] = useState('');
  const [isTradeLoading, setIsTradeLoading] = useState(false);
  const [fixedTooltip, setFixedTooltip] = useState(null);
  const [goldProfile, setGoldProfile] = useState({
    totalGrams: 0,
    totalInvestment: 0,
    transactions: []
  });

  useEffect(() => {
    const goldRef = ref(database, 'goldRates');
    const profileRef = ref(database, 'goldProfile');
    
    onValue(goldRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const processedData = Object.values(data)
          .map(item => ({
            ...item,
            date: item.date,
            goldRate: parseFloat(item.goldRate)
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setGoldData(processedData);
        
        // Find current day's rate
        const today = new Date().toISOString().split('T')[0];
        const todayData = processedData.find(item => item.date === today);
        setCurrentRate(todayData);
      } else {
        setGoldData([]);
        setCurrentRate(null);
      }
      setIsLoading(false);
    });

    onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGoldProfile({
          totalGrams: data.totalGrams || 0,
          totalInvestment: data.totalInvestment || 0,
          transactions: data.transactions || []
        });
      } else {
        setGoldProfile({
          totalGrams: 0,
          totalInvestment: 0,
          transactions: []
        });
      }
    });

    return () => {
      off(goldRef);
      off(profileRef);
    };
  }, []);

  useEffect(() => {
    if (goldData.length === 0) {
      setFilteredData([]);
      return;
    }

    const now = new Date();
    let startDate;

    switch (timePeriod) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      default:
        startDate = subWeeks(now, 1);
    }

    const filtered = goldData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= now;
    });

    // Calculate price changes
    const dataWithChanges = filtered.map((item, index) => {
      if (index === 0) {
        return { ...item, change: 0, changePercent: 0 };
      }
      
      const previousRate = filtered[index - 1].goldRate;
      const currentRate = item.goldRate;
      const change = currentRate - previousRate;
      const changePercent = ((change / previousRate) * 100);
      
      return {
        ...item,
        change,
        changePercent
      };
    });

    setFilteredData(dataWithChanges);
  }, [goldData, timePeriod]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isIncrease = data.change >= 0;
      const transaction = getTransactionForDate(data.date);
      
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          minWidth: '220px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e293b' }}>
            {format(parseISO(label), 'MMM dd, yyyy')}
          </p>
          <p style={{ margin: '0 0 4px 0', color: '#64748b' }}>
            Rate: <strong style={{ color: '#1e293b' }}>₹{data.goldRate.toFixed(2)}</strong>
          </p>
          {data.change !== undefined && (
            <p style={{ 
              margin: '0 0 8px 0', 
              color: isIncrease ? '#22c55e' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {isIncrease ? '↗' : '↘'} ₹{Math.abs(data.change).toFixed(2)} 
              ({isIncrease ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </p>
          )}
          
          {transaction ? (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: transaction.type === 'buy' ? '#dcfce7' : '#fef3c7',
              borderRadius: '8px',
              border: `1px solid ${transaction.type === 'buy' ? '#22c55e' : '#f59e0b'}`
            }}>
              <p style={{ 
                margin: '0 0 4px 0', 
                fontWeight: 'bold',
                color: transaction.type === 'buy' ? '#166534' : '#92400e'
              }}>
                {transaction.type === 'buy' ? '🟢 Bought' : '🟡 Sold'}
              </p>
              <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#64748b' }}>
                {transaction.grams.toFixed(3)} grams
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                ₹{transaction.amount.toFixed(2)}
              </p>
            </div>
          ) : (
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={() => handleTradeClick('buy', data)}
                style={{
                  marginRight: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Buy
              </button>
              <button
                onClick={() => handleTradeClick('sell', data)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Sell
              </button>
            </div>
          )}
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <button
              onClick={() => handleDataPointClick(data)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#00d4ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📌 Pin Tooltip
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem) => {
    return format(parseISO(tickItem), 'MMM dd');
  };

  const handleTradeClick = (type, data) => {
    setTradeType(type);
    setSelectedTradeData(data);
    setShowTradeDialog(true);
    setTradeAmount('');
    setTradeGrams('');
    setFixedTooltip(null); // Close the fixed tooltip when opening trade dialog
  };

  const handleDataPointClick = (data) => {
    setFixedTooltip(data);
  };

  const closeFixedTooltip = () => {
    setFixedTooltip(null);
  };

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    
    if (!tradeAmount && !tradeGrams) {
      alert('Please enter either amount or grams');
      return;
    }

    setIsTradeLoading(true);

    try {
      const rate = selectedTradeData.goldRate;
      let grams, amount;

      if (tradeAmount) {
        amount = parseFloat(tradeAmount);
        grams = amount / rate;
      } else {
        grams = parseFloat(tradeGrams);
        amount = grams * rate;
      }

      const transaction = {
        date: selectedTradeData.date,
        type: tradeType,
        grams: grams,
        amount: amount,
        rate: rate,
        timestamp: new Date().toISOString()
      };

      // Get current profile data
      const profileRef = ref(database, 'goldProfile');
      const snapshot = await get(profileRef);
      const currentProfile = snapshot.val() || {
        totalGrams: 0,
        totalInvestment: 0,
        transactions: []
      };

      // Update profile based on trade type
      let newTotalGrams = currentProfile.totalGrams;
      let newTotalInvestment = currentProfile.totalInvestment;

      if (tradeType === 'buy') {
        newTotalGrams += grams;
        newTotalInvestment += amount;
      } else {
        if (newTotalGrams < grams) {
          alert('Insufficient gold balance for selling');
          setIsTradeLoading(false);
          return;
        }
        newTotalGrams -= grams;
        
        // Calculate proportional investment reduction
        if (newTotalGrams === 0) {
          // If selling all gold, set investment to 0
          newTotalInvestment = 0;
        } else {
          // Calculate proportional reduction based on grams sold
          const proportionSold = grams / (currentProfile.totalGrams);
          const investmentToReduce = currentProfile.totalInvestment * proportionSold;
          newTotalInvestment -= investmentToReduce;
        }
      }

      // Add transaction to history
      const newTransactions = [...currentProfile.transactions, transaction];

      // Update profile in database
      await set(profileRef, {
        totalGrams: newTotalGrams,
        totalInvestment: newTotalInvestment,
        transactions: newTransactions
      });

      setShowTradeDialog(false);
      setTradeAmount('');
      setTradeGrams('');
    } catch (error) {
      console.error('Error processing trade:', error);
      alert('Failed to process trade. Please try again.');
    } finally {
      setIsTradeLoading(false);
    }
  };

  const calculateCurrentValue = () => {
    if (!currentRate || goldProfile.totalGrams === 0) return 0;
    return goldProfile.totalGrams * currentRate.goldRate;
  };

  const calculateProfitLoss = () => {
    // If no gold balance, profit/loss should be 0
    if (goldProfile.totalGrams === 0) {
      return 0;
    }
    const currentValue = calculateCurrentValue();
    return currentValue - goldProfile.totalInvestment;
  };

  const calculateAmountDrawn = () => {
    let totalBought = 0;
    let totalSold = 0;

    goldProfile.transactions.forEach(transaction => {
      if (transaction.type === 'buy') {
        totalBought += transaction.amount;
      } else if (transaction.type === 'sell') {
        totalSold += transaction.amount;
      }
    });

    return totalSold - totalBought;
  };

  const getTransactionForDate = (date) => {
    return goldProfile.transactions.find(t => t.date === date);
  };

  if (isLoading) {
    return (
      <div className="container">
        <h1 className="page-title">Gold Rate Trends</h1>
        <div className="loading">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Gold Rate Trends</h1>
      
      <div className="card" style={{ position: 'relative' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#00d4ff', fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Period</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              {['day', 'week', 'month'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  style={{
                    padding: '10px 20px',
                    border: `2px solid ${timePeriod === period ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '10px',
                    background: timePeriod === period 
                      ? 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    color: timePeriod === period ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {currentRate && (
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: 0, color: '#00d4ff', fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Rate</h3>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#333',
                cursor: 'pointer'
              }}
              onClick={() => setShowCurrentDialog(true)}
              >
                ₹{currentRate.goldRate.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {filteredData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#666',
            fontSize: '1.1rem'
          }}>
            <p>No data available for the selected time period.</p>
            <p>Add some gold rate data from the "Add Data" page to see trends.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart 
              data={filteredData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  handleDataPointClick(data.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
                tickFormatter={(value) => `₹${value}`}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="goldRate"
                stroke="#00d4ff"
                strokeWidth={3}
                fill="url(#colorGradient)"
                fillOpacity={0.4}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Fixed Tooltip */}
        {fixedTooltip && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            border: '2px solid #00d4ff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
            minWidth: '280px',
            zIndex: 1000
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: '600' }}>
                {format(parseISO(fixedTooltip.date), 'MMM dd, yyyy')}
              </h4>
              <button
                onClick={closeFixedTooltip}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ✕
              </button>
            </div>
            
            <p style={{ margin: '0 0 8px 0', color: '#64748b' }}>
              Rate: <strong style={{ color: '#1e293b' }}>₹{fixedTooltip.goldRate.toFixed(2)}</strong>
            </p>
            
            {fixedTooltip.change !== undefined && (
              <p style={{ 
                margin: '0 0 16px 0', 
                color: fixedTooltip.change >= 0 ? '#22c55e' : '#ef4444',
                fontWeight: 'bold'
              }}>
                {fixedTooltip.change >= 0 ? '↗' : '↘'} ₹{Math.abs(fixedTooltip.change).toFixed(2)} 
                ({fixedTooltip.change >= 0 ? '+' : ''}{fixedTooltip.changePercent.toFixed(2)}%)
              </p>
            )}

            {getTransactionForDate(fixedTooltip.date) ? (
              <div style={{ 
                padding: '12px', 
                backgroundColor: getTransactionForDate(fixedTooltip.date).type === 'buy' ? '#dcfce7' : '#fef3c7',
                borderRadius: '12px',
                border: `1px solid ${getTransactionForDate(fixedTooltip.date).type === 'buy' ? '#22c55e' : '#f59e0b'}`,
                marginBottom: '16px'
              }}>
                <p style={{ 
                  margin: '0 0 6px 0', 
                  fontWeight: 'bold',
                  color: getTransactionForDate(fixedTooltip.date).type === 'buy' ? '#166534' : '#92400e'
                }}>
                  {getTransactionForDate(fixedTooltip.date).type === 'buy' ? '🟢 Bought' : '🟡 Sold'}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>
                  {getTransactionForDate(fixedTooltip.date).grams.toFixed(3)} grams
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>
                  ₹{getTransactionForDate(fixedTooltip.date).amount.toFixed(2)}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <button
                  onClick={() => handleTradeClick('buy', fixedTooltip)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🟢 Buy
                </button>
                <button
                  onClick={() => handleTradeClick('sell', fixedTooltip)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🟡 Sell
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Rate Dialog */}
      {showCurrentDialog && currentRate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowCurrentDialog(false)}
        >
          <div className="card" style={{ 
            maxWidth: '400px', 
            margin: '20px',
            cursor: 'default'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
              Today's Gold Rate Details
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Date:</strong> {format(parseISO(currentRate.date), 'EEEE, MMMM dd, yyyy')}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Rate:</strong> ₹{currentRate.goldRate.toFixed(2)} per gram
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Last Updated:</strong> {format(parseISO(currentRate.timestamp), 'MMM dd, yyyy HH:mm')}
            </div>
            <button 
              className="btn" 
              onClick={() => setShowCurrentDialog(false)}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Trade Dialog */}
      {showTradeDialog && selectedTradeData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowTradeDialog(false)}
        >
          <div className="card" style={{ 
            maxWidth: '500px', 
            margin: '20px',
            cursor: 'default'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
              {tradeType === 'buy' ? '🟢 Buy Gold' : '🟡 Sell Gold'}
            </h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Date: {format(parseISO(selectedTradeData.date), 'EEEE, MMMM dd, yyyy')}
            </p>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Rate: <strong>₹{selectedTradeData.goldRate.toFixed(2)} per gram</strong>
            </p>

            <form onSubmit={handleTradeSubmit}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => {
                    setTradeAmount(e.target.value);
                    if (e.target.value && selectedTradeData.goldRate) {
                      setTradeGrams((parseFloat(e.target.value) / selectedTradeData.goldRate).toFixed(3));
                    }
                  }}
                  className="form-input"
                  placeholder="Enter amount in rupees"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Grams</label>
                <input
                  type="number"
                  value={tradeGrams}
                  onChange={(e) => {
                    setTradeGrams(e.target.value);
                    if (e.target.value && selectedTradeData.goldRate) {
                      setTradeAmount((parseFloat(e.target.value) * selectedTradeData.goldRate).toFixed(2));
                    }
                  }}
                  className="form-input"
                  placeholder="Enter grams"
                  step="0.001"
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isTradeLoading}
                  style={{ flex: 1 }}
                >
                  {isTradeLoading ? 'Processing...' : (tradeType === 'buy' ? 'Buy Gold' : 'Sell Gold')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTradeDialog(false)}
                  style={{ 
                    flex: 1,
                    padding: '12px 24px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gold Account Balance */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', color: '#667eea' }}>
          💰 Gold Account Balance
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 153, 204, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#00d4ff', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Gold</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              {goldProfile.totalGrams.toFixed(3)}g
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(238, 90, 82, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#ff6b6b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Investment</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              ₹{goldProfile.totalInvestment.toFixed(2)}
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#22c55e', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Value</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              ₹{calculateCurrentValue().toFixed(2)}
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#a855f7', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit/Loss</h4>
            <p style={{ 
              margin: 0, 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: calculateProfitLoss() >= 0 ? '#22c55e' : '#ef4444',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {calculateProfitLoss() >= 0 ? '+' : ''}₹{calculateProfitLoss().toFixed(2)}
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Drawn</h4>
            <p style={{ 
              margin: 0, 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: calculateAmountDrawn() >= 0 ? '#22c55e' : '#ef4444',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {calculateAmountDrawn() >= 0 ? '+' : ''}₹{calculateAmountDrawn().toFixed(2)}
            </p>
          </div>
        </div>

        {currentRate && (
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#fbbf24', fontSize: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📊 Current Market Rate
            </h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              ₹{currentRate.goldRate.toFixed(2)} per gram
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#ffffff' }}>
              Last updated: {format(parseISO(currentRate.timestamp), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        )}

        {goldProfile.transactions.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '1.5rem', color: '#00d4ff', fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Transactions</h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {goldProfile.transactions.slice(-5).reverse().map((transaction, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: transaction.type === 'buy' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  borderRadius: '12px',
                  marginBottom: '0.75rem',
                  border: `1px solid ${transaction.type === 'buy' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}>
                  <div>
                    <p style={{ 
                      margin: '0 0 0.5rem 0', 
                      fontWeight: 'bold',
                      color: transaction.type === 'buy' ? '#22c55e' : '#fbbf24',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {transaction.type === 'buy' ? '🟢 Bought' : '🟡 Sold'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff' }}>
                      {format(parseISO(transaction.date), 'MMM dd, yyyy')} @ ₹{transaction.rate.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: '#ffffff', fontSize: '1.1rem', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                      {transaction.grams.toFixed(3)}g
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ffffff' }}>
                      ₹{transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#00d4ff', fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📈 Chart Features
        </h3>
        <ul style={{ lineHeight: '1.6', color: '#ffffff' }}>
          <li>Hover over data points to see detailed information and trade options</li>
          <li>Click Buy/Sell buttons to trade gold at historical rates</li>
          <li>Toggle between day, week, and month views</li>
          <li>Green arrows (↗) indicate price increases</li>
          <li>Red arrows (↘) indicate price decreases</li>
          <li>Click on today's rate to see detailed information</li>
          <li>Track your gold portfolio balance and profit/loss</li>
        </ul>
      </div>
    </div>
  );
};

export default GraphPage; 