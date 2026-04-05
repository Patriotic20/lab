import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, RefreshCw, UserCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { hemisService } from '@/services/hemisService';
import { useStudents } from '@/hooks/useStudents';
import { useUserResults } from '@/hooks/useResults';

const HemisSyncPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const login = searchParams.get('login');
    const password = searchParams.get('password');

    // 1. Fetch preview data from Hemis
    const { data: previewData, isLoading: isPreviewLoading, error: previewError } = useQuery({
        queryKey: ['hemisPreview', login],
        queryFn: () => hemisService.previewAdminData({ login: login!, password: password! }),
        enabled: !!login && !!password,
        retry: false,
    });

    // 2. Fetch local student data using search
    const { data: studentsData, isLoading: isStudentLoading } = useStudents(1, 1, login as string);
    const localStudent = studentsData?.students?.[0];

    // 3. Fetch user results if local student exists
    const { data: resultsData, isLoading: isResultsLoading } = useUserResults(localStudent?.user_id || 0, 1, 5);
    const results = resultsData?.results || [];

    // 4. Sync mutation
    const syncMutation = useMutation({
        mutationFn: () => hemisService.syncAdminData({ login: login!, password: password! }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            // Show a simple success mechanism
            alert('Sinxronlash muvaffaqiyatli amalga oshirildi!');
            navigate('/students');
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || err.message || 'Sinxronlashda xatolik yuz berdi');
        }
    });

    if (!login || !password) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Noto'g'ri so'rov</h2>
                <p className="text-muted-foreground mb-6">Login yoki parol taqdim etilmagan.</p>
                <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Orqaga qaytish</Button>
            </div>
        );
    }

    if (isPreviewLoading || isStudentLoading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground">Hemis bilan bog'lanilmoqda...</p>
            </div>
        );
    }

    if (previewError) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Hemisga ulanishda xatolik</h2>
                <div className="text-red-700 bg-red-50 p-4 rounded-md mb-6 border border-red-100 font-medium">
                    {(previewError as any).response?.data?.detail || previewError.message || 'Noma\'lum xato'}
                </div>
                <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Talabalar ro'yxatiga qaytish</Button>
            </div>
        );
    }

    const hData = previewData?.hemis_data || {};

    const isDifferent = (hemisVal: any, localVal: any) => {
        if (!localVal && !hemisVal) return false;
        return String(hemisVal || '').trim().toLowerCase() !== String(localVal || '').trim().toLowerCase();
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Talaba Ma'lumotlarini Sinxronlash (Hemis)</h1>
                    <p className="text-muted-foreground mt-1">Hemis ma'lumotlarini mahalliy baza bilan solishtirish va yangilash</p>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {syncMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                        Tastiqlash va Saqlash
                    </Button>
                </div>
            </div>

            {/* Exist Indicators */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Foydalanuvchi/Talaba bormi?</span>
                    {previewData?.user_exists ? <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mavjud</span> : <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Yangi</span>}
                </div>
                <div className="flex items-center gap-2 border-l pl-4">
                    <span className="text-sm font-medium">Fakultet bormi?</span>
                    {previewData?.faculty_exists ? <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mavjud</span> : <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Yangi</span>}
                </div>
                <div className="flex items-center gap-2 border-l pl-4">
                    <span className="text-sm font-medium">Guruh bormi?</span>
                    {previewData?.group_exists ? <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mavjud</span> : <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Yangi</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* External Column */}
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
                        <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            Ma'lumotlar (Hemis Tizimidan)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">F.I.SH</span>
                            <span className="col-span-2 font-medium">{hData.full_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">ID Raqami</span>
                            <span className="col-span-2">{hData.student_id_number || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Guruh</span>
                            <span className="col-span-2">{hData.group?.name || hData.group || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Fakultet</span>
                            <span className="col-span-2">{hData.faculty?.name || hData.faculty || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Bosqich / Semestr</span>
                            <span className="col-span-2">{hData.level || '-'} - kurs, {hData.semester || '-'}-semestr</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                            <span className="font-semibold text-muted-foreground text-sm">Ta'lim tili</span>
                            <span className="col-span-2">{hData.educationLang?.name || hData.educationLang || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-semibold text-muted-foreground text-sm">Tug'ilgan sana / Jins</span>
                            <span className="col-span-2">
                                {hData.birth_date ? new Date(hData.birth_date * 1000).toLocaleDateString() : '-'} | {hData.gender?.name || hData.gender || '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Local Column */}
                <Card className={localStudent ? 'border-green-100 shadow-sm' : 'border-dashed shadow-none border-2 bg-muted/10'}>
                    <CardHeader className={localStudent ? 'bg-green-50/50 dark:bg-green-900/10 border-b' : 'border-b border-dashed'}>
                        <CardTitle className="flex items-center gap-2">
                            {localStudent ? <UserCheck className="w-5 h-5 text-green-600 dark:text-green-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                            Mahalliy Baza
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {localStudent ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">F.I.SH</span>
                                    <span className={`col-span-2 ${isDifferent(hData.full_name, localStudent.full_name) ? 'bg-amber-100 dark:bg-amber-900/50 px-2 rounded font-medium text-amber-800 dark:text-amber-200' : ''}`}>
                                        {localStudent.full_name || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">ID Raqami</span>
                                    <span className={`col-span-2 ${isDifferent(hData.student_id_number, localStudent.student_id_number) ? 'bg-amber-100 dark:bg-amber-900/50 px-2 rounded font-medium text-amber-800 dark:text-amber-200' : ''}`}>
                                        {localStudent.student_id_number || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">Guruh ID</span>
                                    <span className="col-span-2">
                                        ID: {localStudent.group_id || 'Biriktirilmagan'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">Fakultet</span>
                                    <span className={`col-span-2 ${isDifferent(hData.faculty?.name || hData.faculty, localStudent.faculty) ? 'bg-amber-100 dark:bg-amber-900/50 px-2 rounded font-medium text-amber-800 dark:text-amber-200' : ''}`}>
                                        {localStudent.faculty || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">Bosqich / Semestr</span>
                                    <span className="col-span-2">
                                        {localStudent.level || '-'} - kurs, {localStudent.semester || '-'}-semestr
                                    </span>
                                </div>
                                
                                {isResultsLoading ? (
                                    <div className="flex items-center text-sm text-muted-foreground mt-4"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Natijalar yuklanmoqda...</div>
                                ) : results.length > 0 ? (
                                    <div className="mt-6 pt-4 border-t">
                                        <h4 className="font-semibold mb-2 text-sm flex items-center justify-between">
                                            <span>Mavjud Test Natijalari ({results.length})</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {results.map((r: any) => (
                                                <div key={r.id} className="text-xs bg-muted p-2 rounded flex justify-between">
                                                    <span className="truncate max-w-[150px]">{r.quiz?.title || 'Test'}</span>
                                                    <span className="font-medium text-green-600">{Number(r.grade).toFixed(1)} / 5</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-6 pt-4 border-t text-sm text-muted-foreground italic">Test natijalari mavjud emas</p>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-muted-foreground">Yangi Talaba</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                                    Bu talaba platforma bazasida topilmadi. U birinchi marta saqlanadi.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HemisSyncPage;
