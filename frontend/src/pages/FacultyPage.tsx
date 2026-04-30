import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, Search, ArrowLeft, ChevronRight, FolderEdit } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { facultyService, type Faculty } from '@/services/facultyService';
import { type Group } from '@/services/groupService';
import { type Student } from '@/services/studentService';
import { useGroups } from '@/hooks/useGroups';
import { useStudents } from '@/hooks/useStudents';
import { ChangeGroupModal } from '@/components/ChangeGroupModal';

type View =
    | { level: 'faculties' }
    | { level: 'groups'; faculty: Faculty }
    | { level: 'students'; faculty: Faculty; group: Group }
    | { level: 'student-detail'; faculty: Faculty; group: Group; student: Student };

const Crumbs = ({ items }: { items: { label: string; onClick?: () => void }[] }) => (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {items.map((it, i) => (
            <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {it.onClick
                    ? <button onClick={it.onClick} className="hover:text-foreground hover:underline">{it.label}</button>
                    : <span className="text-foreground font-medium">{it.label}</span>}
            </span>
        ))}
    </nav>
);

const facultySchema = z.object({
    name: z.string().min(1, 'Fakultet nomi kiritilishi shart'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

const FacultyPage = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
    const [cascadeWarnings, setCascadeWarnings] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [view, setView] = useState<View>({ level: 'faculties' });
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await facultyService.getFaculties(currentPage, pageSize, debouncedSearch);
            setFaculties(data.faculties);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch faculties', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => { fetchData(); }, [currentPage, debouncedSearch]);

    const handleDeleteClick = (faculty: Faculty) => {
        setFacultyToDelete(faculty);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!facultyToDelete) return;
        try {
            await facultyService.deleteFaculty(facultyToDelete.id, cascadeWarnings.length > 0);
            setFaculties((prev) => prev.filter((item) => item.id !== facultyToDelete.id));
            setIsDeleteModalOpen(false);
            setFacultyToDelete(null);
            setCascadeWarnings([]);
        } catch (error: any) {
            if (error.response?.status === 409 && error.response?.data?.detail?.requires_confirmation) {
                setCascadeWarnings(error.response.data.detail.warnings || []);
            } else {
                console.error('Fakultetni o\'chirishda xatolik', error);
                alert("O'chirishda xatolik yuz berdi");
                setIsDeleteModalOpen(false);
                setFacultyToDelete(null);
                setCascadeWarnings([]);
            }
        }
    };

    const handleSuccess = (savedFaculty?: Faculty) => {
        setIsModalOpen(false);
        if (savedFaculty) {
            if (selectedFaculty) {
                setFaculties((prev) => prev.map((f) => (f.id === savedFaculty.id ? savedFaculty : f)));
            } else {
                setFaculties((prev) => [...prev, savedFaculty]);
            }
        } else {
            fetchData();
        }
    };

    if (view.level === 'groups') {
        return (
            <FacultyGroupsView
                faculty={view.faculty}
                onBack={() => setView({ level: 'faculties' })}
                onOpenGroup={(group) => setView({ level: 'students', faculty: view.faculty, group })}
            />
        );
    }
    if (view.level === 'students') {
        return (
            <GroupStudentsView
                faculty={view.faculty}
                group={view.group}
                onBackToFaculties={() => setView({ level: 'faculties' })}
                onBackToGroups={() => setView({ level: 'groups', faculty: view.faculty })}
                onOpenStudent={(student) => setView({ level: 'student-detail', faculty: view.faculty, group: view.group, student })}
            />
        );
    }
    if (view.level === 'student-detail') {
        return (
            <StudentDetailView
                faculty={view.faculty}
                group={view.group}
                student={view.student}
                onBackToFaculties={() => setView({ level: 'faculties' })}
                onBackToGroups={() => setView({ level: 'groups', faculty: view.faculty })}
                onBackToStudents={() => setView({ level: 'students', faculty: view.faculty, group: view.group })}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Fakultetlar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Universitet fakultetlarini boshqarish</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Qidirish..."
                            className="pl-8 w-[220px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setSelectedFaculty(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faculties.map((faculty) => (
                                    <TableRow
                                        key={faculty.id}
                                        className="cursor-pointer"
                                        onClick={() => setView({ level: 'groups', faculty })}
                                    >
                                        <TableCell>{faculty.id}</TableCell>
                                        <TableCell className="font-medium capitalize">{faculty.name}</TableCell>
                                        <TableCell>{new Date(faculty.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFaculty(faculty); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClick(faculty); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {faculties.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Fakultetlar topilmadi.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
            />

            <FacultyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} faculty={selectedFaculty}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setCascadeWarnings([]); setFacultyToDelete(null); }}
                onConfirm={handleConfirmDelete}
                title="Fakultetni o'chirish"
                description={
                    cascadeWarnings.length > 0 ? (
                        <div className="space-y-2 mt-2 text-left">
                            <p className="text-red-600 font-medium">Diqqat! Ushbu fakultetni o'chirish quyidagi ma'lumotlarni ham o'chiradi:</p>
                            <ul className="list-disc pl-5 text-sm text-red-500">
                                {cascadeWarnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                            <p className="font-semibold text-red-700 mt-2">Tasdiqlaysizmi? Bu amalni bekor qilib bo'lmaydi!</p>
                        </div>
                    ) : `Siz haqiqatan ham "${facultyToDelete?.name}" fakultetini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`
                }
                confirmText={cascadeWarnings.length > 0 ? "Ha, majburiy o'chirish" : "O'chirish"}
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const FacultyModal = ({ isOpen, onClose, faculty, onSuccess }: {
    isOpen: boolean; onClose: () => void; faculty: Faculty | null; onSuccess: (faculty?: Faculty) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FacultyFormValues>({
        resolver: zodResolver(facultySchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        reset({ name: faculty?.name || '' });
    }, [faculty, reset]);

    const onSubmit = async (data: FacultyFormValues) => {
        try {
            let result;
            if (faculty) {
                result = await facultyService.updateFaculty(faculty.id, data);
            } else {
                result = await facultyService.createFaculty(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Fakultetni saqlashda xatolik', error);
            alert('Fakultetni saqlashda xatolik');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={faculty ? 'Fakultetni tahrirlash' : 'Fakultet yaratish'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Fakultet nomi</label>
                    <Input {...register('name')} error={errors.name?.message} placeholder="Fakultet nomini kiriting" />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" isLoading={isSubmitting}>{faculty ? 'Yangilash' : 'Yaratish'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const FacultyGroupsView = ({ faculty, onBack, onOpenGroup }: {
    faculty: Faculty;
    onBack: () => void;
    onOpenGroup: (group: Group) => void;
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: groupsData, isLoading } = useGroups(currentPage, pageSize, debouncedSearch, undefined, faculty.id);
    const groups = groupsData?.groups || [];
    const totalPages = groupsData ? Math.ceil(groupsData.total / pageSize) : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Crumbs items={[
                        { label: 'Fakultetlar', onClick: onBack },
                        { label: faculty.name },
                    ]} />
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Orqaga
                        </Button>
                        <h1 className="text-xl font-semibold tracking-tight capitalize">{faculty.name} — guruhlar</h1>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Qidirish..."
                        className="pl-8 w-[220px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map((group) => (
                                    <TableRow
                                        key={group.id}
                                        className="cursor-pointer"
                                        onClick={() => onOpenGroup(group)}
                                    >
                                        <TableCell>{group.id}</TableCell>
                                        <TableCell className="font-medium">{group.name}</TableCell>
                                        <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {groups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Guruhlar topilmadi.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
            />
        </div>
    );
};

const GroupStudentsView = ({ faculty, group, onBackToFaculties, onBackToGroups, onOpenStudent }: {
    faculty: Faculty;
    group: Group;
    onBackToFaculties: () => void;
    onBackToGroups: () => void;
    onOpenStudent: (student: Student) => void;
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [studentToMove, setStudentToMove] = useState<Student | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: studentsData, isLoading } = useStudents(currentPage, pageSize, debouncedSearch, undefined, group.id);
    const students = studentsData?.students || [];
    const totalPages = studentsData ? Math.ceil(studentsData.total / pageSize) : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Crumbs items={[
                        { label: 'Fakultetlar', onClick: onBackToFaculties },
                        { label: faculty.name, onClick: onBackToGroups },
                        { label: group.name },
                    ]} />
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={onBackToGroups}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Orqaga
                        </Button>
                        <h1 className="text-xl font-semibold tracking-tight">{group.name} — talabalar</h1>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Qidirish..."
                        className="pl-8 w-[220px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>F.I.SH</TableHead>
                                    <TableHead>Talaba raqami</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="cursor-pointer"
                                        onClick={() => onOpenStudent(student)}
                                    >
                                        <TableCell>{student.id}</TableCell>
                                        <TableCell className="font-medium">{student.full_name || '-'}</TableCell>
                                        <TableCell>{student.student_id_number || '-'}</TableCell>
                                        <TableCell>{student.phone || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Guruhni o'zgartirish"
                                                    onClick={(e) => { e.stopPropagation(); setStudentToMove(student); }}
                                                >
                                                    <FolderEdit className="h-4 w-4" />
                                                </Button>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {students.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Talabalar topilmadi.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
            />

            <ChangeGroupModal
                isOpen={!!studentToMove}
                onClose={() => setStudentToMove(null)}
                student={studentToMove}
            />
        </div>
    );
};

const StudentDetailView = ({ faculty, group, student, onBackToFaculties, onBackToGroups, onBackToStudents }: {
    faculty: Faculty;
    group: Group;
    student: Student;
    onBackToFaculties: () => void;
    onBackToGroups: () => void;
    onBackToStudents: () => void;
}) => {
    const [moveOpen, setMoveOpen] = useState(false);

    const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="grid grid-cols-2 gap-2">
            <span className="font-semibold text-muted-foreground">{label}:</span>
            <span>{value || '-'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Crumbs items={[
                    { label: 'Fakultetlar', onClick: onBackToFaculties },
                    { label: faculty.name, onClick: onBackToGroups },
                    { label: group.name, onClick: onBackToStudents },
                    { label: student.full_name || `Talaba #${student.id}` },
                ]} />
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBackToStudents}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Orqaga
                    </Button>
                    <h1 className="text-xl font-semibold tracking-tight">
                        {student.full_name || `Talaba #${student.id}`}
                    </h1>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => setMoveOpen(true)}>
                        <FolderEdit className="h-4 w-4 mr-2" />
                        Boshqa guruhga o'tkazish
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow label="F.I.SH" value={student.full_name} />
                        <InfoRow label="Talaba raqami" value={student.student_id_number} />
                        <InfoRow label="Telefon" value={student.phone} />
                        <InfoRow label="Manzil" value={student.address} />
                        <InfoRow label="Tug'ilgan sana" value={student.birth_date} />
                        <InfoRow label="Jinsi" value={student.gender} />
                        <InfoRow label="User ID" value={student.user_id} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Akademik ma'lumotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow label="Fakultet" value={student.faculty} />
                        <InfoRow label="Mutaxassislik" value={student.specialty} />
                        <InfoRow label="Bosqich" value={student.level} />
                        <InfoRow label="Semestr" value={student.semester} />
                        <InfoRow label="Ta'lim shakli" value={student.education_form} />
                        <InfoRow label="Ta'lim turi" value={student.education_type} />
                        <InfoRow label="To'lov shakli" value={student.payment_form} />
                        <InfoRow label="Ta'lim tili" value={student.education_lang} />
                        <InfoRow label="Status" value={student.student_status} />
                        <InfoRow label="O'rtacha ball (GPA)" value={student.avg_gpa ?? '-'} />
                    </CardContent>
                </Card>
            </div>

            <ChangeGroupModal
                isOpen={moveOpen}
                onClose={() => setMoveOpen(false)}
                student={student}
                onSuccess={onBackToStudents}
            />
        </div>
    );
};

export default FacultyPage;
