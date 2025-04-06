export interface HistoryEntry {
    id: number;
    service_name: string;
    service_type: 'immediate' | 'appointment';
    category?: string;
    date_created: string;
    status: 'completed' | 'pending' | 'cancelled' | 'transferred';
    waiting_time?: number;
    position?: number;
    order_id?: string;
    appointment_date?: string;
    appointment_time?: string;
    transferred_from?: number | null;
    transferred_to?: number | null;
}

export interface HistoryCardProps {
    entry: HistoryEntry;
    onViewDetails: (entry: HistoryEntry) => void;
    formatDate: (dateString: string) => string;
    formatTime: (timeString?: string) => string;
    onRefresh?: () => void;
}

export interface HistoryListProps {
    dateGroups: { [key: string]: HistoryEntry[] };
    handleViewDetails: (entry: HistoryEntry) => void;
    formatDate: (dateString: string) => string;
    formatTime: (timeString?: string) => string;
    filteredHistory: HistoryEntry[];
    onRefresh?: () => void;
}

export interface HistorySummaryProps {
    filteredHistory: HistoryEntry[];
}

export interface AdvancedFiltersProps {
    startDate: Date | null;
    setStartDate: (date: Date | null) => void;
    endDate: Date | null;
    setEndDate: (date: Date | null) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
    serviceTypeFilter: string;
    setServiceTypeFilter: (type: string) => void;
    categories: string[];
    clearFilters: () => void;
}

export interface HistoryFilterBarProps {
    searchQuery: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    showFilters: boolean;
    toggleFilters: () => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}