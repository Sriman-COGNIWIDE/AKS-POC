import React, { useState, useEffect, useRef } from 'react';

function CustomDropdown({ isOpen, setIsOpen, options, value, onChange, searchValue, onSearchChange, placeholder, dropdownRef }) {
    const searchInputRef = useRef(null);

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{value || `Select ${placeholder}`}</span>
                <span className="dropdown-arrow">▼</span>
            </div>
            {isOpen && (
                <div className="dropdown-panel">
                    <div className="search-container">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={`Search ${placeholder}...`}
                            className="dropdown-search"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="options-container">
                        {options.map((option, index) => (
                            <div
                                key={index}
                                className="option-item"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilteringTable() {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    const [isClusterOpen, setIsClusterOpen] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState('');
    const [clusterSearchInput, setClusterSearchInput] = useState('');

    const clusterRef = useRef(null);

    const clusters = ['aks-pe-poc', 'cluster 2'];

    const filteredClusters = clusters.filter(cluster => 
        cluster.toLowerCase().includes(clusterSearchInput.toLowerCase())
    );

    const fetchData = async (cluster) => {
        if (!cluster) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:5000/api/clusters/${cluster}/deployments`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.status === 'success') {
                setData(responseData.data);
            } else {
                throw new Error(responseData.error?.message || 'Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when cluster changes
    useEffect(() => {
        if (selectedCluster) {
            fetchData(selectedCluster);
        }
    }, [selectedCluster]);

    // Handle click outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clusterRef.current && !clusterRef.current.contains(event.target)) {
                setIsClusterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter data based on search input
    const filteredData = data.filter(row => 
        Object.values(row).some(value => 
            JSON.stringify(value).toLowerCase().includes(searchInput.toLowerCase())
        )
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    // Function to render container information
    const renderContainers = (containers) => {
        if (!containers || containers.length === 0) return 'None';
        return containers.map((container, index) => (
            <div key={index} className="container-info">
                <div>Image: {container.image}</div>
                <div>Version: {container.version}</div>
            </div>
        ));
    };

    return (
        <div className="table-container">
            <div className="filters-container">
                <div className="dropdowns-wrapper">
                    <CustomDropdown
                        isOpen={isClusterOpen}
                        setIsOpen={setIsClusterOpen}
                        options={filteredClusters}
                        value={selectedCluster}
                        onChange={setSelectedCluster}
                        searchValue={clusterSearchInput}
                        onSearchChange={setClusterSearchInput}
                        placeholder="Cluster"
                        dropdownRef={clusterRef}
                    />
                </div>
                <div className="search-wrapper">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search records..."
                        className="search-input"
                    />
                </div>
            </div>

            {loading && <div className="loading-message">Loading data...</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Deployment Name</th>
                            <th>Namespace</th>
                            <th>Main Containers</th>
                            <th>Init Containers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, index) => (
                            <tr key={index}>
                                <td>{row['deployment-name']}</td>
                                <td>{row.namespace}</td>
                                <td>{renderContainers(row['main-containers'])}</td>
                                <td>{renderContainers(row['init-containers'])}</td>
                            </tr>
                        ))}
                        {!loading && paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="no-data">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    {"<<"}
                </button>
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    Next
                </button>
                <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    {">>"}
                </button>
            </div>
        </div>
    );
}

export default FilteringTable;