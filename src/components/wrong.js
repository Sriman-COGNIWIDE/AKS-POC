import React, { useMemo, useState } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import Select from 'react-select';
import './table.css';

export const FilteringTable = () => {
    const [filterInput, setFilterInput] = useState('');
    const [selectedEnv, setSelectedEnv] = useState(null);
    const [selectedCluster, setSelectedCluster] = useState(null);

    const columns = useMemo(
        () => [
            {
                Header: 'DEPLOYMENT NAME',
                accessor: 'deployment_name',
            },
            {
                Header: 'NAMESPACE',
                accessor: 'namespace',
            },
            {
                Header: 'VERSION',
                accessor: 'version',
            },
            {
                Header: 'MAIN CONTAINER IMAGES',
                accessor: 'main_container',
            },
            {
                Header: 'SIDE CONTAINER IMAGES',
                accessor: 'side_container',
            },
        ],
        []
    );

    const data = useMemo(
        () => [
            {
                deployment_name: 'AS',
                namespace: 'CNY',
                version: '27.7',
                main_container: 'database',
                side_container: 'User-friendly',
            },
            {
                deployment_name: 'AS',
                namespace: 'IDR',
                version: '16.66',
                main_container: 'even-keeled',
                side_container: 'core',
            },
        ],
        []
    );

    const environmentOptions = [
        { value: 'dev', label: 'Dev' },
        { value: 'lit', label: 'Lit' },
        { value: 'stg', label: 'Stg' },
        { value: 'cs_stg', label: 'CS Stg' },
        { value: 'prod', label: 'Prod' },
        { value: 'cs_prod', label: 'CS Prod' }
    ];

    const clusterOptions = [
        { value: 'dev', label: 'dev' },
        { value: 'lit', label: 'lit' },
        { value: 'dev_corda', label: 'dev_corda' },
        { value: 'np_dmz', label: 'np_dmz' },
        { value: 'stg', label: 'stg' },
        { value: 'stg_dmz', label: 'stg_dmz' },
        { value: 'stg_corda', label: 'stg_corda' },
        { value: 'prod', label: 'prod' },
        { value: 'prod_dmz', label: 'prod_dmz' },
        { value: 'prod_corda', label: 'prod_corda' },
        { value: 'cslit', label: 'cslit' },
        { value: 'cslit_dmz', label: 'cslit_dmz' },
        { value: 'csstg', label: 'csstg' },
        { value: 'csstg_dmz', label: 'csstg_dmz' },
        { value: 'csprod', label: 'csprod' }
    ];

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderColor: '#e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            minHeight: '38px',
            '&:hover': {
                borderColor: '#2c3e50'
            }
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#2c3e50' : state.isFocused ? '#f7fafc' : 'white',
            color: state.isSelected ? 'white' : '#2d3748',
            cursor: 'pointer'
        }),
        input: (provided) => ({
            ...provided,
            color: '#2d3748'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#a0aec0'
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: '#2d3748'
        }),
        container: (provided) => ({
            ...provided,
            width: '200px'
        })
    };

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
            initialState: { pageSize: 20 }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const handleFilterChange = (e) => {
        const value = e.target.value || undefined;
        setGlobalFilter(value);
        setFilterInput(value);
    };

    const handlePageChange = (e) => {
        const page = e.target.value ? Number(e.target.value) - 1 : 0;
        gotoPage(page);
    };

    return (
        <div className="table-container">
            <div className="filters-wrapper">
                <div className="filter-group">
                    <label>Environment:</label>
                    <Select
                        options={environmentOptions}
                        value={selectedEnv}
                        onChange={setSelectedEnv}
                        styles={customSelectStyles}
                        placeholder="Select Environment..."
                        isClearable
                        isSearchable
                    />
                </div>
                <div className="filter-group">
                    <label>Cluster:</label>
                    <Select
                        options={clusterOptions}
                        value={selectedCluster}
                        onChange={setSelectedCluster}
                        styles={customSelectStyles}
                        placeholder="Select Cluster..."
                        isClearable
                        isSearchable
                    />
                </div>
                <div className="filter-group">
                    <label>Search Records:</label>
                    <input
                        value={filterInput || ''}
                        onChange={handleFilterChange}
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
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' 🔽'
                                                : ' 🔼'
                                            : ''}
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
                    Page {pageIndex + 1} of {pageCount}
                </span>
                <div className="pagination-goto">
                    Go to page:
                    <input
                        type="number"
                        min={1}
                        max={pageCount}
                        onChange={handlePageChange}
                        style={{ width: '50px' }}
                    />
                </div>
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