import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    showCreateOption?: boolean;
    createOptionLabel?: string;
    onCreateClick?: () => void;
}

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    showCreateOption = false,
    createOptionLabel = 'Create New',
    onCreateClick,
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreateClick = () => {
        if (onCreateClick) {
            onCreateClick();
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="input-field w-full flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
            >
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                    {displayText}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-xl max-h-64 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-border sticky top-0 bg-background">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-48 overflow-y-auto">
                            {/* Create Option */}
                            {showCreateOption && (
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors flex items-center gap-2 text-primary font-medium border-b border-border"
                                >
                                    <Plus className="w-4 h-4" />
                                    {createOptionLabel}
                                </button>
                            )}

                            {/* Filtered Options */}
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleOptionClick(option.value)}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-muted transition-colors ${option.value === value
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-foreground'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchableSelect;
