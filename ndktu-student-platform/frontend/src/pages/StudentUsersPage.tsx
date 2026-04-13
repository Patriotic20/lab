import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, Loader2, Filter } from 'lucide-react';
import { useStudentUsers } from '@/hooks/useStudentUsers';
import { useGroups } from '@/hooks/useGroups';

const StudentUsersPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [groupIdFilter, setGroupIdFilter] = useState<number | undefined>();
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: studentsData, isLoading } = useStudentUsers(
        currentPage,
        pageSize,
        debouncedSearch || undefined,
        groupIdFilter
    );

    const { data: groupsData } = useGroups(1, 100, '');

    const students = studentsData?.students || [];
    const totalPages = studentsData
        ? Math.ceil(studentsData.total / pageSize)
        : 1;
    const groups = groupsData?.groups || [];

    const getStatusBadge = (isActive: boolean | null) => {
        if (isActive === null) return 'bg-gray-100 text-gray-800';
        return isActive
            ? 'inline-block px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full'
            : 'inline-block px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full';
    };

    const getGroupName = (groupId: number | null) => {
        if (!groupId) return 'Yo\'q';
        const group = groups.find((g: any) => g.id === groupId);
        return group ? group.name : `ID: ${groupId}`;
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Talabalar Foydalanuvchilar</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Foydalanuvchi hisobi va talaba ma'lumotiga ega talabalarni boshqarish
                </p>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter size={20} />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                Qidiruv (Ism, Familiya, Login, Talaba #)
                            </label>
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    type="text"
                                    placeholder="Qidirishni boshlang..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                Guruh
                            </label>
                            <select
                                value={groupIdFilter || ''}
                                onChange={(e) =>
                                    setGroupIdFilter(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                            >
                                <option value="">Barchasi</option>
                                {groups.map((group: any) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                &nbsp;
                            </label>
                            <Button
                                onClick={() => {
                                    setSearchTerm('');
                                    setGroupIdFilter(undefined);
                                    setCurrentPage(1);
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Tozalash
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Jami talabalar (Foydalanuvchi bilan)
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                {studentsData?.total || 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Faol foydalanuvchilar
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {students.filter((s) => s.is_active).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students Table */}
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted hover:bg-muted">
                                            <TableHead className="px-6 py-3 text-left">
                                                Login
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Ism-Sharifi
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Talaba #
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Fakultet
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Guruh
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Kurs
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Semestr
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Status
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                GPA
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.length > 0 ? (
                                            students.map((student) => (
                                                <TableRow
                                                    key={student.student_id}
                                                    className="border-b border-border hover:bg-muted/50"
                                                >
                                                    <TableCell className="px-6 py-3 font-medium">
                                                        {student.username}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3">
                                                        {student.full_name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm font-mono">
                                                        {student.student_id_number}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm">
                                                        {student.faculty}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm">
                                                        {getGroupName(student.group_id)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm">
                                                        {student.level}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm">
                                                        {student.semester}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3">
                                                        <span className={getStatusBadge(student.is_active)}>
                                                            {student.is_active ? 'Faol' : 'Nofaol'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 font-semibold">
                                                        {student.avg_gpa.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="px-6 py-8 text-center text-muted-foreground"
                                                >
                                                    Talabalar topilmadi
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentUsersPage;
