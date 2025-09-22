import React from 'react';
import { Option } from '../types';

interface OptionSelectorProps {
    label: string;
    options: Option<string>[];
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    icon?: React.ReactNode;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, value, onChange, icon }) => {
    const hasIcon = icon != null;
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <div className="relative">
                {hasIcon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        {icon}
                    </div>
                )}
                <select
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${hasIcon ? 'pl-10' : ''}`}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default OptionSelector;