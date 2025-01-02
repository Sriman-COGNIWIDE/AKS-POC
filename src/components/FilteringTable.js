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
    const clusters = ['aks-pe-poc', 'cluster 2', 'minikube'];

    const [isNamespaceOpen, setIsNamespaceOpen] = useState(false);
    const [selectedNamespace, setSelectedNamespace] = useState('');
    const [namespaceSearchInput, setNamespaceSearchInput] = useState('');
    const namespaceRef = useRef(null);
    const namespaces = [
        'cogniassist-discovery',
        'default',
        'ingress-nginx',
        'kube-node-lease',
        'kube-public',
        'kube-system'
    ];

    const filteredClusters = clusters.filter(cluster => 
        cluster.toLowerCase().includes(clusterSearchInput.toLowerCase())
    );

    const filteredNamespaces = namespaces.filter(namespace => 
        namespace.toLowerCase().includes(namespaceSearchInput.toLowerCase())
    );

    const processContainers = (containers) => {
        if (!containers || containers.length === 0) return [{ image: 'None', version: '-' }];
        
        return containers.flatMap(container => {
            const images = container.image.split(',').map(img => img.trim());
            const versions = container.version.split(',').map(ver => ver.trim());
            
            return images.map((image, index) => ({
                image: image,
                version: versions[index] || versions[0]
            }));
        });
    };

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

    useEffect(() => {
        if (selectedCluster) {
            fetchData(selectedCluster);
        }
    }, [selectedCluster]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clusterRef.current && !clusterRef.current.contains(event.target)) {
                setIsClusterOpen(false);
            }
            if (namespaceRef.current && !namespaceRef.current.contains(event.target)) {
                setIsNamespaceOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const processedData = data.flatMap(row => {
        const mainContainers = processContainers(row['main-containers']);
        const initContainers = processContainers(row['init-containers']);

        const mainRows = mainContainers
            .filter(container => container.image !== 'None')
            .map(container => ({
                deploymentName: row['deployment-name'],
                namespace: row.namespace,
                version: container.version,
                mainContainerImage: container.image,
                initContainerImage: 'None'
            }));

        const initRows = initContainers
            .filter(container => container.image !== 'None')
            .map(container => ({
                deploymentName: row['deployment-name'],
                namespace: row.namespace,
                version: container.version,
                mainContainerImage: 'None',
                initContainerImage: container.image
            }));

        return [...mainRows, ...initRows];
    });

    const filteredData = processedData.filter(row => {
        const matchesSearch = Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchInput.toLowerCase())
        );
        const matchesNamespace = !selectedNamespace || row.namespace === selectedNamespace;
        
        return matchesSearch && matchesNamespace;
    });

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

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
                    <CustomDropdown
                        isOpen={isNamespaceOpen}
                        setIsOpen={setIsNamespaceOpen}
                        options={filteredNamespaces}
                        value={selectedNamespace}
                        onChange={setSelectedNamespace}
                        searchValue={namespaceSearchInput}
                        onSearchChange={setNamespaceSearchInput}
                        placeholder="Namespace"
                        dropdownRef={namespaceRef}
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
                            <th>Version</th>
                            <th>Main Container Image</th>
                            <th>Init Container Image</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.deploymentName}</td>
                                <td>{row.namespace}</td>
                                <td>{row.version}</td>
                                <td>{row.mainContainerImage}</td>
                                <td>{row.initContainerImage}</td>
                            </tr>
                        ))}
                        {!loading && paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="no-data">
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