import React from 'react';
import { FieldErrors } from 'react-hook-form';
import { showFormValidationAlert } from '../../utils/alerts';

interface FormErrorsProps {
  errors: FieldErrors;
  showAlert?: boolean;
}

/**
 * Component to display form validation errors
 * Can show inline errors and/or trigger a SweetAlert with all errors
 */
const FormErrors: React.FC<FormErrorsProps> = ({ errors, showAlert = false }) => {
  React.useEffect(() => {
    if (showAlert && Object.keys(errors).length > 0) {
      const formattedErrors: Record<string, string> = {};
      Object.entries(errors).forEach(([key, value]) => {
        formattedErrors[key] = value.message as string;
      });
      showFormValidationAlert(formattedErrors);
    }
  }, [errors, showAlert]);

  if (Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
      <ul className="mt-2 list-disc list-inside text-sm text-red-700">
        {Object.entries(errors).map(([key, error]) => (
          <li key={key}>
            {typeof error.message === 'string' ? error.message : 'Invalid field'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrors; 