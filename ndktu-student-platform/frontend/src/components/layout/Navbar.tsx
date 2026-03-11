/**
 * Navbar.tsx
 *
 * Design decisions:
 * - Breadcrumb using route label map (instead of just capitalizing path segments).
 * - Clean h-14 header — matches sidebar logo area height.
 * - Profile dropdown: user avatar initials as fallback, clean dropdown.
 * - Icon buttons use consistent h-9 w-9 size.
 */
import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Bell, User, LogOut, Sun, Moon, Menu, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/utils';

interface NavbarProps {
    onMenuClick: () => void;
}

/** Maps route paths to human-readable labels */
const ROUTE_LABELS: Record<string, string> = {
    '':            'Dashboard',
    'users':       'Foydalanuvchilar',
    'teachers':    "O'qituvchilar",
    'students':    'Talabalar',
    'roles':       'Rollar',
    'permissions': 'Ruxsatlar',
    'faculties':   'Fakultetlar',
    'kafedras':    'Kafedralar',
    'groups':      'Guruhlar',
    'subjects':    'Fanlar',
    'questions':   'Savollar',
    'quizzes':     'Testlar',
    'quiz-test':   'Test ishlash',
    'results':     'Natijalar',
    'profile':     'Profil',
};

const getPageInfo = (pathname: string) => {
    const segment = pathname.split('/')[1] || '';
    return ROUTE_LABELS[segment] ?? segment;
};

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const pageLabel = getPageInfo(location.pathname);
    const isHome = location.pathname === '/';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Avatar initials from username
    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'U';

    return (
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur-sm">
            {/* Left side */}
            <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <button
                    onClick={onMenuClick}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:hidden"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-4 w-4" />
                </button>

                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
                    {!isHome ? (
                        <>
                            <Link
                                to="/"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Dashboard
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-foreground">{pageLabel}</span>
                        </>
                    ) : (
                        <span className="font-semibold text-foreground">Dashboard</span>
                    )}
                </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Notifications */}
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 rounded-full border border-input bg-background pl-1 pr-2 py-1 text-sm hover:bg-accent transition-colors"
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                    >
                        {/* Avatar */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden text-xs font-semibold">
                            {user?.student?.image_path ? (
                                <img
                                    src={user.student.image_path}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">
                            {user?.username ?? 'User'}
                        </span>
                        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isProfileOpen && 'rotate-180')} />
                    </button>

                    {isProfileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsProfileOpen(false)}
                                aria-hidden="true"
                            />
                            <div
                                role="menu"
                                className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
                            >
                                {/* User info header */}
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-xs font-medium text-foreground truncate">{user?.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.roles?.map(r => r.name).join(', ') || 'Foydalanuvchi'}
                                    </p>
                                </div>
                                <div className="h-px bg-border mb-1" />
                                <Link
                                    to="/profile"
                                    role="menuitem"
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    Profil
                                </Link>
                                <div className="h-px bg-border my-1" />
                                <button
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Chiqish
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
