import React, { useState, useEffect } from 'react';
import './Table.css';
import Pagination from './Pagination';
 
const DynamicTable = ({
  searchTerm,
  selectedCluster,
  selectedEnvironment,
  selectedNamespace,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Environment-to-Cluster Mapping
  const envToClusterMap = {
    poc: ['aks-pe-poc', 'minikube'],
    dev: ['aks-dev-cluster'],
    prod: ['aks-prod-cluster'],
    stage: ['aks-stage-cluster'],
  };
 
  useEffect(() => {
    let url;
 
    if (selectedEnvironment && !selectedCluster) {
      url = `http://127.0.0.1:5000/api/${selectedEnvironment}`;        // Fetch data for all clusters in the environment
    } else if (selectedCluster) {
      url = `http://localhost:5000/api/clusters/${selectedCluster}/deployments`;          // Fetch data for the selected cluster
    } else {
      return;               // Exit if neither environment nor cluster is selected
    }
 
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
 
    fetchData();
  }, [selectedCluster, selectedEnvironment]);
 
  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };
 
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
 
    const order = sortConfig.direction === 'asc' ? 1 : -1;
    const getFieldValue = (item, key) => {
      switch (key) {
        case 'version':
          return item['main-containers']?.[0]?.version || '';
        case 'mainImage':
          return item['main-containers']?.[0]?.image || '';
        case 'initImages':
          return item['init-containers']
            ?.map((container) => container.image)
            .join(', ') || '';
        default:
          return item[key] || '';
      }
    };
 
    const aValue = getFieldValue(a, sortConfig.key);
    const bValue = getFieldValue(b, sortConfig.key);
 
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order;
    }
    return (aValue > bValue ? 1 : -1) * order;
  });
 
  const filteredData = sortedData.filter((item) => {
    const search = (field) =>
      field &&
      typeof field === 'string' &&
      field.toLowerCase().includes(searchTerm.toLowerCase());
 
    const isClusterValid =
      selectedEnvironment === '' ||
      envToClusterMap[selectedEnvironment]?.includes(selectedCluster);

    const matchesNamespace = selectedNamespace === '' || item.namespace === selectedNamespace;

    const matchesSearch = searchTerm === '' ||
      search(item['deployment-name']) ||
      search(item.namespace) ||
      item['main-containers']?.some((container) =>
        container.image.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      item['init-containers']?.some((container) =>
        container.image.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch && matchesNamespace && (isClusterValid || !selectedEnvironment);
  });
 
  const totalItems = filteredData.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);
 
  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;
 
  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>
              Deployment Name
              <span onClick={() => handleSort('deployment-name', 'asc')} className="arrow">▲</span>
              <span onClick={() => handleSort('deployment-name', 'desc')} className="arrow">▼</span>
            </th>
            <th>
              Namespace
              <span onClick={() => handleSort('namespace', 'asc')} className="arrow">▲</span>
              <span onClick={() => handleSort('namespace', 'desc')} className="arrow">▼</span>
            </th>
            <th>
              Version
              <span onClick={() => handleSort('version', 'asc')} className="arrow">▲</span>
              <span onClick={() => handleSort('version', 'desc')} className="arrow">▼</span>
            </th>
            <th>
              Main Container Images
              <span onClick={() => handleSort('mainImage', 'asc')} className="arrow">▲</span>
              <span onClick={() => handleSort('mainImage', 'desc')} className="arrow">▼</span>
            </th>
            <th>
              Side Container Images
              <span onClick={() => handleSort('initImages', 'asc')} className="arrow">▲</span>
              <span onClick={() => handleSort('initImages', 'desc')} className="arrow">▼</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => {
            const mainImages = item['main-containers'];
            const initImages = item['init-containers'];
 
            const rows = mainImages.map((container, idx) => ({
              deploymentName: item['deployment-name'],
              namespace: item.namespace,
              version: container.version,
              mainImage: container.image.includes(':') ? container.image.split(':')[0] : container.image,
              initImages: initImages
                .map((initContainer) => initContainer.image)
                .join(', '),
            }));
 
            return rows.map((row, rowIndex) => (
              <tr key={`${index}-${rowIndex}`}>
                <td>{row.deploymentName}</td>
                <td>{row.namespace}</td>
                <td>{row.version}</td>
                <td>{row.mainImage}</td>
                <td>{row.initImages || 'N/A'}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
 
export default DynamicTable;