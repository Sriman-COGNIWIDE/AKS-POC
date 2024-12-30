import React, { useState, useEffect } from 'react';
import { useAsyncDebounce } from 'react-table';

export const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
    const [value, setValue] = useState(globalFilter || '');
    
    const onChange = useAsyncDebounce(value => {
        setGlobalFilter(value || undefined);
    }, 300);

    useEffect(() => {
        setValue(globalFilter || ''); 
    }, [globalFilter]);

    return (
        <div className="search-wrapper"> 
            <label htmlFor="search">Search:</label>
            <input
                id="search"
                type="text"
                value={value}
                onChange={e => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder="Search any field..."
            />
        </div>
    );
};

export default GlobalFilter;