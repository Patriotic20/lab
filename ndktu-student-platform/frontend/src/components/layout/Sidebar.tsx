/**
 * Sidebar.tsx
 *
 * Design decisions:
 * - Menu items grouped into logical sections (Overview / Management / Access).
 * - Active item: left border accent + primary bg + primary-fg text.
 * - Collapsed state (default): icon-only, 56px wide. Expanded: 240px.
 * - Section labels visible only in expanded mode.
 * - Tooltip via HTML `title` attribute for collapsed icon accessibility.
 * - Mobile: drawer with overlay.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    BarChart2,
    Users,
    GraduationCap,
    BookOpen,
    FileText,
    Shield,
    Key,
    Building2,
    Layers,
    UsersRound,
    FileQuestion,
    PlayCircle,
    X,
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.png';

interface SidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

const adminSections: NavSection[] = [
    {
        label: 'Umumiy',
        items: [
            { name: 'Dashboard', href: '/', icon: BarChart2 },
        ],
    },
    {
        label: 'Boshqaruv',
        items: [
            { name: 'Fakultetlar', href: '/faculties', icon: Building2 },
            { name: 'Kafedralar', href: '/kafedras', icon: Layers },
            { name: 'Guruhlar', href: '/groups', icon: UsersRound },
            { name: 'Fanlar', href: '/subjects', icon: BookOpen },
        ],
    },
    {
        label: 'Foydalanuvchilar',
        items: [
            { name: 'Foydalanuvchilar', href: '/users', icon: Users },
            { name: "O'qituvchilar", href: '/teachers', icon: GraduationCap },
            { name: 'Talabalar', href: '/students', icon: GraduationCap },
        ],
    },
    {
        label: 'Kirish huquqlari',
        items: [
            { name: 'Rollar', href: '/roles', icon: Shield },
            { name: 'Ruxsatlar', href: '/permissions', icon: Key },
        ],
    },
    {
        label: 'Testlar',
        items: [
            { name: 'Savollar', href: '/questions', icon: FileQuestion },
            { name: 'Testlar', href: '/quizzes', icon: BookOpen },
            { name: 'Test ishlash', href: '/quiz-test', icon: PlayCircle },
            { name: 'Natijalar', href: '/results', icon: FileText },
        ],
    },
];

const teacherSections: NavSection[] = [
    {
        label: 'Fanlar',
        items: [
            { name: 'Mening fanlarim', href: '/teacher-subjects', icon: BookOpen },
        ],
    },
    {
        label: 'Testlar',
        items: [
            { name: 'Savollar', href: '/questions', icon: FileQuestion },
            { name: 'Natijalar', href: '/results', icon: FileText },
        ],
    },
];

const studentSections: NavSection[] = [
    {
        label: 'Test',
        items: [
            { name: 'Test ishlash', href: '/quiz-test', icon: PlayCircle },
            { name: 'Natijalar', href: '/results', icon: FileText },
        ],
    },
];

const Sidebar = ({ mobileOpen, setMobileOpen }: SidebarProps) => {
    const location = useLocation();
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isStudent = user?.roles?.some(r => r.name.toLowerCase() === 'student');
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');

    const sections = isStudent ? studentSections : isTeacher ? teacherSections : adminSections;

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300 md:static',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                    isCollapsed ? 'w-14' : 'w-60'
                )}
            >
                {/* Logo / Brand */}
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        'flex h-14 shrink-0 cursor-pointer items-center border-b px-3 transition-colors hover:bg-accent',
                        isCollapsed ? 'justify-center' : 'gap-3'
                    )}
                >
                    <img
                        src={logo}
                        alt="NDKTU"
                        className="h-8 w-8 shrink-0 object-contain"
                    />
                    {!isCollapsed && (
                        <span className="text-xs font-semibold leading-tight text-foreground/80 line-clamp-2">
                            Navoiy davlat konchilik va texnologiyalar universiteti
                        </span>
                    )}
                </div>

                {/* Mobile close button */}
                {mobileOpen && (
                    <button
                        className="absolute right-3 top-3 md:hidden text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-3">
                    <nav className="flex flex-col gap-4 px-2">
                        {sections.map((section) => (
                            <div key={section.label}>
                                {/* Section label (hidden when collapsed) */}
                                {!isCollapsed && (
                                    <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        {section.label}
                                    </p>
                                )}
                                {isCollapsed && (
                                    <div className="mb-1 h-px bg-border" />
                                )}

                                <div className="flex flex-col gap-0.5">
                                    {section.items.map((item) => {
                                        const isActive = location.pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                title={isCollapsed ? item.name : undefined}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    'flex items-center rounded-md text-sm font-medium transition-colors',
                                                    isCollapsed
                                                        ? 'h-9 w-9 justify-center mx-auto'
                                                        : 'h-9 gap-3 px-3',
                                                    isActive
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                )}
                                            >
                                                {/* Active accent bar */}
                                                {isActive && !isCollapsed && (
                                                    <span className="absolute left-0 h-6 w-0.5 rounded-r bg-primary" />
                                                )}
                                                <item.icon className="h-4 w-4 shrink-0" />
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
