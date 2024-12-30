import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import MOCK_DATA from './MOCK_DATA.json';
import { COLUMNS } from './columns';

const CustomDropdown = ({ 
    isOpen, 
    setIsOpen, 
    options, 
    value, 
    onChange, 
    searchValue, 
    onSearchChange, 
    placeholder,
    dropdownRef 
}) => {
    const searchInputRef = useRef(null);

    const handleSearchClick = (e) => {
        e.stopPropagation();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{value || `Select ${placeholder}`}</span>
                <span className="dropdown-arrow">▼</span>
            </div>
            {isOpen && (
                <div className="dropdown-panel">
                    <div className="search-container" onClick={handleSearchClick}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={`Search ${placeholder}...`}
                            className="dropdown-search"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="options-container">
                        <div className="options-list">
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
                </div>
            )}
        </div>
    );
};

const CellWithLineBreaks = ({ value }) => {
    if (typeof value !== 'string') return value;
    return value.split(',').map((item, index) => (
        <React.Fragment key={index}>
            {index > 0 && <br />}
            {item.trim()}
        </React.Fragment>
    ));
};

export const FilteringTable = () => {
    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => MOCK_DATA, []);
    const [filterInput, setFilterInput] = useState('');
    const [pageSize] = useState(20);
    const [pageInput, setPageInput] = useState('');
    const [envSearchInput, setEnvSearchInput] = useState('');
    const [clusterSearchInput, setClusterSearchInput] = useState('');
    const [isEnvOpen, setIsEnvOpen] = useState(false);
    const [isClusterOpen, setIsClusterOpen] = useState(false);
    const [selectedEnv, setSelectedEnv] = useState('');
    const [selectedCluster, setSelectedCluster] = useState('');
    const envRef = useRef(null);
    const clusterRef = useRef(null);

    const environments = ['Dev', 'Lit', 'stg', 'CS stg', 'prod', 'cs prod'];
    const clusters = ['dev', 'lit', 'dev_corda', 'np_dmz', 'stg', 'stg_dmz', 'stg_corda', 'prod', 'prod_dmz', 'prod_corda', 'cslit', 'cslit_dmz', 'csstg', 'csstg_dmz', 'csprod'];

    const filteredEnvs = environments.filter(env => 
        env.toLowerCase().includes(envSearchInput.toLowerCase())
    );
    
    const filteredClusters = clusters.filter(cluster => 
        cluster.toLowerCase().includes(clusterSearchInput.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (envRef.current && !envRef.current.contains(event.target)) {
                setIsEnvOpen(false);
            }
            if (clusterRef.current && !clusterRef.current.contains(event.target)) {
                setIsClusterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        gotoPage,
        pageCount,
        state: { pageIndex },
        setGlobalFilter,
        prepareRow
    } = useTable(
        { 
            columns, 
            data, 
            initialState: { pageSize },
            defaultColumn: {
                Cell: CellWithLineBreaks
            }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    return (
        <div className="table-container">
            <div className="filters-container">
                <div className="dropdowns-wrapper">
                    <CustomDropdown
                        isOpen={isEnvOpen}
                        setIsOpen={setIsEnvOpen}
                        options={filteredEnvs}
                        value={selectedEnv}
                        onChange={setSelectedEnv}
                        searchValue={envSearchInput}
                        onSearchChange={setEnvSearchInput}
                        placeholder="Environment"
                        dropdownRef={envRef}
                    />
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
                    <label htmlFor="search">Search Records:</label>
                    <input
                        id="search"
                        value={filterInput}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFilterInput(value);
                            setGlobalFilter(value || undefined);
                        }}
                        placeholder="Filter records..."
                    />
                </div>
            </div>

            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    <span>
                                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map(cell => (
                                    <td {...cell.getCellProps()}>
                                        {cell.render('Cell')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="pagination">
                <span className="pagination-info">
                    <strong>Page {pageIndex + 1} of {pageCount}</strong>
                </span>
                <span className="pagination-goto">
                    <strong>Go to page:</strong>
                    <input
                        type="number"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                const pageNumber = parseInt(pageInput, 10);
                                if (pageNumber > 0 && pageNumber <= pageCount) {
                                    gotoPage(pageNumber - 1);
                                }
                            }
                        }}
                        min="1"
                        max={pageCount}
                    />
                </span>
                <button
                    onClick={() => gotoPage(0)}
                    disabled={!canPreviousPage}
                    className="pagination-button"
                >
                    {"<<"}
                </button>
                <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className="pagination-button"
                >
                    Previous
                </button>
                <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="pagination-button"
                >
                    Next
                </button>
                <button
                    onClick={() => gotoPage(pageCount - 1)}
                    disabled={!canNextPage}
                    className="pagination-button"
                >
                    {">>"}
                </button>
            </div>
        </div>
    );
};

export default FilteringTable;
