import React, { useMemo, useState } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import MOCK_DATA from './MOCK_DATA.json';
import { COLUMNS } from './columns';
import './table.css';

export const FilteringTable = () => {
    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => MOCK_DATA, []);
    const [filterInput, setFilterInput] = useState('');

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        state: { pageIndex, globalFilter },
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
                <button 
                    onClick={() => previousPage()} 
                    disabled={!canPreviousPage}
                    className="pagination-button"
                >
                    Previous
                </button>
                <span className="pagination-info">
                    Page {pageIndex + 1} of {pageOptions.length}
                </span>
                <button 
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default FilteringTable;