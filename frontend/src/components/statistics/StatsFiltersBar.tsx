import React from 'react';
import { Calendar, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useFaculties, useKafedras } from '@/hooks/useReferenceData';
import type { StatsFilters } from '@/services/statisticsService';

interface StatsFiltersBarProps {
    value: StatsFilters;
    onChange: (next: StatsFilters) => void;
    showFaculty?: boolean;
    showKafedra?: boolean;
    showDateRange?: boolean;
    extra?: React.ReactNode;
}

export const StatsFiltersBar: React.FC<StatsFiltersBarProps> = ({
    value,
    onChange,
    showFaculty = true,
    showKafedra = true,
    showDateRange = true,
    extra,
}) => {
    const { data: facultiesData } = useFaculties(1, 200);
    const { data: kafedrasData } = useKafedras(1, 200);

    const facultyOptions = facultiesData?.faculties.map((f) => ({
        value: f.id.toString(),
        label: f.name,
    })) ?? [];

    const kafedraOptions =
        kafedrasData?.kafedras
            .filter((k) => (value.faculty_id ? k.faculty_id === value.faculty_id : true))
            .map((k) => ({ value: k.id.toString(), label: k.name })) ?? [];

    const isDirty =
        !!value.date_from ||
        !!value.date_to ||
        value.faculty_id != null ||
        value.group_id != null ||
        value.subject_id != null ||
        value.kafedra_id != null;

    const clear = () => onChange({});

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
            {showDateRange && (
                <>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={value.date_from ?? ''}
                            onChange={(e) =>
                                onChange({ ...value, date_from: e.target.value || undefined })
                            }
                            className="h-9 w-[150px]"
                        />
                    </div>
                    <span className="text-sm text-muted-foreground">—</span>
                    <Input
                        type="date"
                        value={value.date_to ?? ''}
                        onChange={(e) => onChange({ ...value, date_to: e.target.value || undefined })}
                        className="h-9 w-[150px]"
                    />
                </>
            )}

            {showFaculty && (
                <Combobox
                    options={facultyOptions}
                    value={value.faculty_id?.toString() ?? ''}
                    onChange={(val) =>
                        onChange({
                            ...value,
                            faculty_id: val ? parseInt(val) : undefined,
                            kafedra_id: undefined,
                        })
                    }
                    placeholder="Fakultet"
                    searchPlaceholder="Fakultet qidirish..."
                    className="w-[200px]"
                />
            )}

            {showKafedra && (
                <Combobox
                    options={kafedraOptions}
                    value={value.kafedra_id?.toString() ?? ''}
                    onChange={(val) =>
                        onChange({ ...value, kafedra_id: val ? parseInt(val) : undefined })
                    }
                    placeholder="Kafedra"
                    searchPlaceholder="Kafedra qidirish..."
                    className="w-[200px]"
                />
            )}

            {extra}

            {isDirty && (
                <Button variant="outline" size="sm" onClick={clear} className="ml-auto">
                    <FilterX className="mr-1.5 h-3.5 w-3.5" />
                    Tozalash
                </Button>
            )}
        </div>
    );
};

export default StatsFiltersBar;
