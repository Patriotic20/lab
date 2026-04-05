import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, RefreshCw, UserCheck, AlertCircle, CheckCircle2, XCircle, Users, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { hemisService } from '@/services/hemisService';
import { useFaculties } from '@/hooks/useReferenceData';
import { useGroups } from '@/hooks/useGroups';

const HemisSyncPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const login = searchParams.get('login');
    const password = searchParams.get('password');

    // Override State
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | undefined>();
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();

    // Helper for safe text extraction from Hemis fields (could be string or object with name)
    const extractName = (data: any) => {
        if (!data) return 'N/A';
        if (typeof data === 'string') return data;
        if (typeof data === 'object') return data.name || data.title || JSON.stringify(data);
        return String(data);
    };

    // 1. Fetch preview data from Hemis
    const { data: previewData, isLoading: isPreviewLoading, isPending, isError, error: previewError } = useQuery({
        queryKey: ['hemisPreview', login],
        queryFn: async () => {
            const data = await hemisService.previewAdminData({ login: login!, password: password! });
            console.log("API Response (RAW):", data);
            return data;
        },
        enabled: !!login && !!password,
        retry: false,
    });

    // Populate overrides when data arrives
    useEffect(() => {
        if (previewData) {
            if (selectedFacultyId === undefined) setSelectedFacultyId(previewData.faculty_id || undefined);
            if (selectedGroupId === undefined) setSelectedGroupId(previewData.group_id || undefined);
        }
    }, [previewData]);

    // Fetch lists for selects
    const { data: facultiesData } = useFaculties(1, 100);
    const { data: groupsData } = useGroups(1, 1000, '', undefined, selectedFacultyId);

    // 2. Sync mutation
    const syncMutation = useMutation({
        mutationFn: () => hemisService.syncAdminData({ 
            login: login!, 
            password: password!,
            faculty_id: selectedFacultyId,
            group_id: selectedGroupId,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            alert('Sinxronlash muvaffaqiyatli amalga oshirildi!');
            navigate('/students');
        },
        onError: (err: any) => {
            alert(err?.response?.data?.detail || err?.message || 'Sinxronlashda xatolik yuz berdi');
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

    if (isPreviewLoading || isPending) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground">App tizimi (Hemis) bilan bog'lanilmoqda...</p>
            </div>
        );
    }

    if (isError || previewError) {
        console.log("API Error:", previewError);
        return (
            <Card className="max-w-lg mx-auto mt-10 p-6 border-red-200">
                <div className="flex flex-col items-center text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Ma'lumotlarni yuklashda xatolik</h2>
                    <div className="text-red-700 bg-red-50 p-4 rounded-md w-full mb-6 border border-red-100 font-medium">
                        {(previewError as any)?.response?.data?.detail || previewError?.message || 'Unknown error'}
                    </div>
                    <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Orqaga qaytish</Button>
                </div>
            </Card>
        );
    }

    if (!isPreviewLoading && !isPending && !previewData) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Ma'lumot topilmadi</h2>
                <p className="text-muted-foreground mb-6">Hemis tizimidan hech qanday ma'lumot kelmadi.</p>
                <Button onClick={() => navigate('/students')}><ArrowLeft className="w-4 h-4 mr-2"/> Orqaga qaytish</Button>
            </div>
        );
    }

    // Mapping backend response keys
    const userExists = previewData?.user_exists;
    const facultyExists = previewData?.faculty_exists;
    const groupExists = previewData?.group_exists;
    const existingResults = previewData?.existing_results || [];
    const suggestedGroup = previewData?.suggested_group || 'N/A';
    const hData = previewData?.hemis_data || {};

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Talaba Ma'lumotlarini Sinxronlash (Hemis)</h1>
                    <p className="text-muted-foreground mt-1">Sinxronlashdan oldin ma'lumotlarni tasdiqlash va tahrirlash</p>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {syncMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                        Sinxronlash va Saqlash
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Override Section */}
                <Card className="md:col-span-1 border-primary/20 shadow-lg h-fit">
                    <CardHeader className="bg-primary/5 border-b py-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4 rotate-180 text-primary" />
                            Sinxronlash Sozlamalari
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-muted-foreground" /> Fakultet Override
                            </label>
                            <select 
                                className="w-full p-2.5 rounded-md border text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={selectedFacultyId || ''}
                                onChange={(e) => {
                                    setSelectedFacultyId(Number(e.target.value) || undefined);
                                    setSelectedGroupId(undefined); // Reset group if faculty changes
                                }}
                            >
                                <option value="">Hemis bo'yicha (avtomatik)</option>
                                {facultiesData?.faculties?.map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            {!facultyExists && !selectedFacultyId && (
                                <p className="text-[11px] text-amber-600 bg-amber-50 p-1.5 rounded mt-1 border border-amber-100 italic">
                                    Hemisdagi fakultet topilmadi, sinxronlashda yangi fakultet yaratiladi.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" /> Guruh Override
                            </label>
                            <select 
                                className="w-full p-2.5 rounded-md border text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={selectedGroupId || ''}
                                onChange={(e) => setSelectedGroupId(Number(e.target.value) || undefined)}
                            >
                                <option value="">Hemis bo'yicha (avtomatik)</option>
                                {groupsData?.groups?.map((g: any) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            {!groupExists && !selectedGroupId && (
                                <p className="text-[11px] text-amber-600 bg-amber-50 p-1.5 rounded mt-1 border border-amber-100 italic">
                                    Guruh topilmadi. Taklif etilgan nom: <span className="font-bold underline">{suggestedGroup}</span>
                                </p>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md leading-relaxed">
                            <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
                            Agar "avtomatik" tanlansa, platforma Hemisdan kelgan nomlar asosida guruh/fakultetni topishga yoki yaratishga harakat qiladi.
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    {/* Exist Indicators */}
                    <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Talaba bormi?</span>
                            {userExists ? (
                                <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mavjud</span> 
                            ) : (
                                <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Yangi</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* External Column / Hemis Data */}
                        <Card className="border-blue-100 shadow-sm h-fit">
                            <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
                                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2 text-lg">
                                    Kelayotgan Ma'lumotlar (Hemis)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">F.I.SH</span>
                                    <span className="col-span-2 font-medium">{extractName(hData?.full_name)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">ID Raqami</span>
                                    <span className="col-span-2">{extractName(hData?.student_id_number)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">Asl Guruh</span>
                                    <span className="col-span-2">{extractName(hData?.group)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-muted pb-3">
                                    <span className="font-semibold text-muted-foreground text-sm">Asl Fakultet</span>
                                    <span className="col-span-2">{extractName(hData?.faculty)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="font-semibold text-muted-foreground text-sm">Telefon</span>
                                    <span className="col-span-2">{extractName(hData?.phone)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Local Impacts / Test Results Column */}
                        <Card className={userExists ? 'border-amber-100 shadow-sm h-fit' : 'border-dashed shadow-none border-2 bg-muted/10 h-fit'}>
                            <CardHeader className={userExists ? 'bg-amber-50/50 dark:bg-amber-900/10 border-b' : 'border-b border-dashed'}>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {userExists ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <UserCheck className="w-5 h-5 text-green-600 dark:text-green-500" />}
                                    Bazadagi Holati
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {userExists ? (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-md text-sm mb-4 border border-amber-200">
                                            Bu talaba bazada bor. Sinxronlash tahrirlash kabi ishlaydi.
                                        </div>
                                        
                                        {existingResults && existingResults.length > 0 ? (
                                            <div className="pt-2 border-t">
                                                <h4 className="font-semibold mb-3 text-sm">Test Natijalari ({existingResults.length} ta)</h4>
                                                <div className="space-y-2">
                                                    {existingResults.map((r: any, idx: number) => (
                                                        <div key={r?.id || idx} className="text-xs bg-muted p-3 rounded-md flex justify-between items-center border">
                                                            <div>
                                                                <span className="font-medium block">{r?.quiz?.title || 'Unknown'}</span>
                                                                <span className="text-muted-foreground">{r?.subject?.name}</span>
                                                            </div>
                                                            <span className="font-bold text-green-600">{Number(r?.grade).toFixed(1)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic border-t pt-4">Natijalar topilmadi.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                        <UserCheck className="w-12 h-12 text-green-500 mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">Yangi Akkaunt</h3>
                                        <p className="text-sm text-muted-foreground mt-2">Bu talaba birinchi marta kiritilmoqda.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Info icon if lucide missing or just use AlertCircle
const Info = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export default HemisSyncPage;
