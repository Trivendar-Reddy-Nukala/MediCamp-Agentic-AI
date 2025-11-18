import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter
} from "recharts";
import rawData from './data.json';
import './AnalyticsDashboard.css';
import { useAuth } from './Auth';

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const { user } = useAuth();

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    try {
      setLoading(true);

      // Limit to 250 samples
      const limitedData = rawData.slice(0, 250);
      setData(limitedData);

      // Calculate statistics
      const calculatedStats = calculateStats(limitedData);
      setStats(calculatedStats);

      // Set default fields
      if (limitedData.length > 0) {
        setXField('disease');
        setYField('age');
      }

      setError("");
    } catch (err) {
      setError(err.message || "Failed to load analytics data");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dataSet) => {
    const stats = {
      totalRecords: dataSet.length,
      totalDistricts: new Set(dataSet.map(d => d.district)).size,
      totalDiseases: new Set(dataSet.map(d => d.disease)).size,
      totalMedications: new Set(dataSet.map(d => d.medication)).size,
      avgAge: (dataSet.reduce((sum, d) => sum + d.age, 0) / dataSet.length).toFixed(2),
      diseaseFrequency: {},
      medicationFrequency: {},
      districtFrequency: {},
      ageGroups: { '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0 },
    };

    // Calculate frequencies
    dataSet.forEach(record => {
      stats.diseaseFrequency[record.disease] = (stats.diseaseFrequency[record.disease] || 0) + 1;
      stats.medicationFrequency[record.medication] = (stats.medicationFrequency[record.medication] || 0) + 1;
      stats.districtFrequency[record.district] = (stats.districtFrequency[record.district] || 0) + 1;

      // Age groups
      if (record.age <= 18) stats.ageGroups['0-18']++;
      else if (record.age <= 30) stats.ageGroups['19-30']++;
      else if (record.age <= 45) stats.ageGroups['31-45']++;
      else if (record.age <= 60) stats.ageGroups['46-60']++;
      else stats.ageGroups['60+']++;
    });

    return stats;
  };

  const transformDataByType = (field) => {
    if (field === 'disease') {
      return Object.entries(stats.diseaseFrequency || {}).map(([disease, count]) => ({
        disease,
        count,
        name: disease
      }));
    }
    if (field === 'medication') {
      return Object.entries(stats.medicationFrequency || {}).map(([medication, count]) => ({
        medication,
        count,
        name: medication
      }));
    }
    if (field === 'district') {
      return Object.entries(stats.districtFrequency || {}).map(([district, count]) => ({
        district,
        count,
        name: district
      }));
    }
    if (field === 'ageGroup') {
      return Object.entries(stats.ageGroups || {}).map(([ageGroup, count]) => ({
        ageGroup,
        count,
        name: ageGroup
      }));
    }
    return [];
  };

  const getChartData = () => {
    if (!xField || !yField) return [];

    // For disease, medication, district, age group analysis
    if (['disease', 'medication', 'district', 'ageGroup'].includes(xField)) {
      return transformDataByType(xField);
    }

    // For scatter plots (age vs other numeric fields)
    if (xField === 'age' && yField === 'age') {
      return data.map((d, idx) => ({ age: d.age, count: idx }));
    }

    return data;
  };

  const renderChart = () => {
    const chartData = getChartData();

    if (!xField || !yField || chartData.length === 0) {
      return (
        <div className="chart-placeholder">
          <i className="fas fa-chart-line"></i>
          <p>Select fields from dropdowns to generate chart</p>
          <small>Using {data.length} sample records</small>
        </div>
      );
    }

    const xAxisKey = xField === 'disease' ? 'disease' : 
                     xField === 'medication' ? 'medication' : 
                     xField === 'district' ? 'district' :
                     xField === 'ageGroup' ? 'ageGroup' : xField;

    const yAxisKey = yField === 'disease' ? 'count' : 
                     yField === 'medication' ? 'count' : 
                     yField === 'district' ? 'count' :
                     yField === 'ageGroup' ? 'count' : yField;

    try {
      switch (chartType) {
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey={yAxisKey} fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );

        case 'line':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={yAxisKey} 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );

        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie 
                  data={chartData} 
                  dataKey={yAxisKey} 
                  nameKey={xAxisKey} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={120}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );

        case 'scatter':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis dataKey={yAxisKey} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Scatter name={yAxisKey} data={chartData} fill="#667eea" />
              </ScatterChart>
            </ResponsiveContainer>
          );

        default:
          return null;
      }
    } catch (e) {
      console.error('Chart render error:', e);
      return (
        <div className="chart-placeholder">
          <p>Error rendering chart</p>
        </div>
      );
    }
  };

  const fields = ['disease', 'medication', 'district', 'ageGroup', 'age'];
  const numericFields = ['age', 'count'];

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading Analytics Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={loadAnalyticsData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-chart-line"></i> Analytics Dashboard
          </h1>
          <p>Medical Data Visualization ({data.length} samples)</p>
        </div>
        <button className="refresh-btn" onClick={loadAnalyticsData}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-database"></i>
          </div>
          <h4>Total Records</h4>
          <p>{stats.totalRecords}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-virus"></i>
          </div>
          <h4>Unique Diseases</h4>
          <p>{stats.totalDiseases}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <h4>Medications Used</h4>
          <p>{stats.totalMedications}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h4>Districts</h4>
          <p>{stats.totalDistricts}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-birthday-cake"></i>
          </div>
          <h4>Average Age</h4>
          <p>{stats.avgAge} years</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <i className="fas fa-tools"></i> Chart Builder
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content overview-tab">
          <div className="overview-grid">
            {/* Disease Distribution */}
            <div className="overview-card">
              <h3>Disease Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={Object.entries(stats.diseaseFrequency || {}).map(([disease, count]) => ({ 
                        name: disease, 
                        value: count 
                      }))} 
                      dataKey="value" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                    >
                      {Object.entries(stats.diseaseFrequency || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Age Distribution */}
            <div className="overview-card">
              <h3>Age Group Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(stats.ageGroups || {}).map(([ageGroup, count]) => ({ 
                      ageGroup, 
                      count 
                    }))}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#764ba2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Medication Usage */}
            <div className="overview-card">
              <h3>Top 8 Medications</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(stats.medicationFrequency || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([medication, count]) => ({ medication, count }))}
                    margin={{ left: -20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="medication" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f093fb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* District Distribution */}
            <div className="overview-card">
              <h3>District Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(stats.districtFrequency || {})
                      .map(([district, count]) => ({ district, count }))}
                    margin={{ left: -20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4facfe" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Builder Tab */}
      {activeTab === 'builder' && (
        <div className="tab-content builder-tab">
          <div className="chart-builder-container">
            {/* Controls */}
            <div className="builder-controls">
              <div className="control-group">
                <label htmlFor="xField">
                  <i className="fas fa-arrows-alt-h"></i> X-Axis Field
                </label>
                <select 
                  id="xField"
                  value={xField} 
                  onChange={(e) => setXField(e.target.value)}
                  className="control-select"
                >
                  <option value="">Select X-axis field</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="yField">
                  <i className="fas fa-arrows-alt-v"></i> Y-Axis Field
                </label>
                <select 
                  id="yField"
                  value={yField} 
                  onChange={(e) => setYField(e.target.value)}
                  className="control-select"
                >
                  <option value="">Select Y-axis field</option>
                  {numericFields.map((field) => (
                    <option key={field} value={field}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="chartType">
                  <i className="fas fa-chart-bar"></i> Chart Type
                </label>
                <select 
                  id="chartType"
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  className="control-select"
                >
                  <option value="bar">📊 Bar Chart</option>
                  <option value="line">📈 Line Chart</option>
                  <option value="pie">🥧 Pie Chart</option>
                  <option value="scatter">📍 Scatter Plot</option>
                </select>
              </div>
            </div>

            {/* Chart Display */}
            <div className="chart-display">
              {renderChart()}
            </div>

            {/* Data Info */}
            <div className="data-info">
              <h4>Available Fields for Analysis</h4>
              <div className="fields-grid">
                {fields.map((field) => (
                  <div key={field} className="field-badge">
                    <i className="fas fa-database"></i> {field}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .analytics-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .analytics-loading,
        .analytics-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .analytics-error i {
          font-size: 3rem;
          color: #dc3545;
        }

        .analytics-error p {
          font-size: 1.1rem;
          color: #2d3748;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid #e0e0e0;
          border-top: 6px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-content h1 {
          font-size: 2rem;
          color: #2d3748;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .header-content h1 i {
          color: #667eea;
        }

        .header-content p {
          color: #718096;
          margin: 10px 0 0 0;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 1.8rem;
          color: #667eea;
          margin-bottom: 10px;
        }

        .stat-card h4 {
          color: #2d3748;
          margin: 0 0 5px 0;
          font-size: 0.9rem;
        }

        .stat-card p {
          color: #667eea;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
        }

        .tab-navigation {
          display: flex;
          gap: 15px;
          background: white;
          padding: 15px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: transparent;
          border: 2px solid #e2e8f0;
          color: #718096;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .tab-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chart-builder-container {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .builder-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          font-weight: 600;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }

        .control-group label i {
          color: #667eea;
        }

        .control-select {
          padding: 10px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .control-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .chart-display {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          min-height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-placeholder {
          text-align: center;
          color: #718096;
          padding: 40px 20px;
        }

        .chart-placeholder i {
          font-size: 2rem;
          margin-bottom: 10px;
          display: block;
        }

        .chart-placeholder small {
          display: block;
          margin-top: 10px;
          font-size: 0.85rem;
          color: #a0aec0;
        }

        .data-info {
          background: #f0f4ff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .data-info h4 {
          color: #2d3748;
          margin: 0 0 15px 0;
          font-size: 1rem;
        }

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }

        .field-badge {
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          color: #2d3748;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .field-badge:hover {
          border-color: #667eea;
          background: #f0f4ff;
          color: #667eea;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 25px;
        }

        .overview-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .overview-card h3 {
          color: #2d3748;
          margin: 0 0 15px 0;
          font-size: 1.2rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }

        .chart-container {
          width: 100%;
          height: 300px;
        }

        @media (max-width: 1024px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            text-align: center;
          }

          .builder-controls {
            grid-template-columns: 1fr;
          }

          .fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
