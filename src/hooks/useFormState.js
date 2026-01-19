import { useState } from 'react';

export function useFormState(initialValues) {
    const [values, setValues] = useState(initialValues);

    const handleChange = (name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const reset = (newValues = initialValues) => {
        setValues(newValues);
    };

    const setAllValues = (newValues) => {
        setValues(newValues);
    };

    return { values, handleChange, reset, setAllValues };
}
