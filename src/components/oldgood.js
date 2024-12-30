import React, { useMemo, useState } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import { Search } from 'lucide-react';
import MOCK_DATA from './MOCK_DATA.json';
import { COLUMNS } from './columns';
import './table.css';

export const FilteringTable = () => {
    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => MOCK_DATA, []);
    const [filterInput, setFilterInput] = useState('');
    const [pageSize] = useState(20);
    const [pageInput, setPageInput] = useState('');
    const [selectedEnv, setSelectedEnv] = useState('');
    const [selectedCluster, setSelectedCluster] = useState('');
    const [envSearchInput, setEnvSearchInput] = useState('');
    const [clusterSearchInput, setClusterSearchInput] = useState('');

    const environments = [
        'Dev',
        'Lit',
        'stg',
        'CS stg',
        'prod',
        'cs prod'
    ];

    const clusters = [
        'dev',
        'lit',
        'dev_corda',
        'np_dmz',
        'stg',
        'stg_dmz',
        'stg_corda',
        'prod',
        'prod_dmz',
        'prod_corda',
        'cslit',
        'cslit_dmz',
        'csstg',
        'csstg_dmz',
        'csprod'
    ];

    const filteredEnvs = environments.filter(env =>
        env.toLowerCase().includes(envSearchInput.toLowerCase())
    );

    const filteredClusters = clusters.filter(cluster =>
        cluster.toLowerCase().includes(clusterSearchInput.toLowerCase())
    );

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
        state: { pageIndex, globalFilter },
        setGlobalFilter,
        prepareRow
    } = useTable(
        {
            columns,
            data,
            initialState: { pageSize }
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

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        setPageInput(value);
    };

    const handlePageGo = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= pageCount) {
            gotoPage(pageNumber - 1);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handlePageGo();
        }
    };

    return (
        <div className="table-container">
            <div className="search-wrapper">
                <label htmlFor="search">Search Records:</label>
                <input
                    id="search"
                    value={filterInput || ''}
                    onChange={handleFilterChange}
                    placeholder="Filter records..."
                />
            </div>

            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup, index) => (
                        <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                            {headerGroup.headers.map(column => (
                                <th 
                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                    key={column.id}
                                >
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
                    {page.map((row, index) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()} key={index}>
                                {row.cells.map(cell => (
                                    <td {...cell.getCellProps()} key={cell.column.id}>
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
                   <strong> Page {pageIndex + 1} of {pageCount} </strong> 
                </span>
                <span className="pagination-goto">
                <strong>   Go to page: </strong> 
                    <input 
                        type="number" 
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onKeyPress={handleKeyPress}
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