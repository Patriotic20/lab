import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

import { User, Calendar } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
                    <CardDescription>Foydalanuvchi va talaba ma'lumotlari.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8">
                    {/* Left Side: User Image & Basic Info */}
                    <div className="w-full md:w-1/4 flex flex-col items-center text-center space-y-4 border-b md:border-b-0 md:border-r border-border md:pr-8 pb-6 md:pb-0 h-fit">
                         <div className="relative">
                            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-primary/10 border-4 border-background shadow-xl overflow-hidden">
                                {user.student?.image_path ? (
                                    <img 
                                        src={user.student.image_path} 
                                        alt={user.username} 
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-20 w-20 text-primary" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                             <h2 className="text-xl font-bold break-words">
                                {user.teacher 
                                    ? `${user.teacher.last_name} ${user.teacher.first_name}`
                                    : user.student
                                        ? `${user.student.last_name} ${user.student.first_name}`
                                        : user.username
                                }
                            </h2>
                             <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                                {user.roles?.map(r => r.name).join(', ') || 'Foydalanuvchi'}
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Detailed Info */}
                    <div className="flex-1">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Common Fields */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    Foydalanuvchi nomi
                                </label>
                                <div className="text-base font-semibold">
                                    {user.username}
                                </div>
                            </div>
                            
                             {/* Teacher Specific Details */}
                            {user.teacher && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Kafedra
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.teacher.kafedra?.name || 'Mavjud emas'}
                                        </div>
                                    </div>
                                     <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            F.I.O
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.teacher.last_name} {user.teacher.first_name} {user.teacher.third_name}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Student Specific Details */}
                            {user.student && (
                                <>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            F.I.O (To'liq)
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.full_name || `${user.student.last_name} ${user.student.first_name} ${user.student.middle_name}`}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Universitet
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.university || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Fakultet
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.faculty || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Mutaxassislik
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.specialty || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Guruh
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.group?.name || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Bosqich (Kurs)
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.level || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Semestr
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.semester || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Ta'lim Shakli
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.education_form || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Ta'lim Turi
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.education_type || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            To'lov Shakli
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.payment_form || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Ta'lim Tili
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.education_lang || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            O'rtacha Baho (GPA)
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.avg_gpa || '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Manzil
                                        </label>
                                        <div className="text-base font-semibold">
                                           {user.student.address || '-'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
