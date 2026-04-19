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
import { useHemisTransactions } from '@/hooks/useHemisTransactions';

const HemisTransactionsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchLogin, setSearchLogin] = useState('');
    const [debouncedLogin, setDebouncedLogin] = useState('');
    const [statusFilter, setStatusFilter] = useState<'success' | 'failed' | ''>('');
    const [typeFilter, setTypeFilter] = useState<'local' | 'hemis_api' | ''>('');
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedLogin(searchLogin);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchLogin]);

    const { data: transactionsData, isLoading } = useHemisTransactions(
        currentPage,
        pageSize,
        {
            login: debouncedLogin || undefined,
            status: (statusFilter || undefined) as any,
            login_type: (typeFilter || undefined) as any,
        }
    );

    const transactions = transactionsData?.transactions || [];
    const totalPages = transactionsData
        ? Math.ceil(transactionsData.total / pageSize)
        : 1;

    const getStatusBadge = (status: string) => {
        return status === 'success'
            ? 'inline-block px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full'
            : 'inline-block px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full';
    };

    const getTypeBadge = (type: string) => {
        return type === 'local'
            ? 'inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full'
            : 'inline-block px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">HEMIS Kirish Jurnali</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Barcha HEMIS tizimiga kirish urinishlari
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                Login qidirish
                            </label>
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    type="text"
                                    placeholder="Login kiriting..."
                                    value={searchLogin}
                                    onChange={(e) => setSearchLogin(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                            >
                                <option value="">Barchasi</option>
                                <option value="success">Muvaffaqiyat</option>
                                <option value="failed">Muvaffaqiyatsiz</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                Kirish turi
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                            >
                                <option value="">Barchasi</option>
                                <option value="local">Lokal</option>
                                <option value="hemis_api">HEMIS API</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                &nbsp;
                            </label>
                            <Button
                                onClick={() => {
                                    setSearchLogin('');
                                    setStatusFilter('');
                                    setTypeFilter('');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Jami kirish urinishlari
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                {transactionsData?.total || 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Muvaffaqiyatli kirish
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {transactions.filter(t => t.status === 'success').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Muvaffaqiyatsiz kirish
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {transactions.filter(t => t.status === 'failed').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
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
                                                Status
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Kirish Turi
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                IP Address
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Vaqt
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left">
                                                Xatolik
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? (
                                            transactions.map((transaction) => (
                                                <TableRow
                                                    key={transaction.id}
                                                    className="border-b border-border hover:bg-muted/50"
                                                >
                                                    <TableCell className="px-6 py-3 font-medium">
                                                        {transaction.login}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3">
                                                        <span
                                                            className={getStatusBadge(
                                                                transaction.status
                                                            )}
                                                        >
                                                            {transaction.status === 'success'
                                                                ? 'Muvaffaqiyat'
                                                                : 'Muvaffaqiyatsiz'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3">
                                                        <span className={getTypeBadge(transaction.login_type)}>
                                                            {transaction.login_type === 'local'
                                                                ? 'Lokal'
                                                                : 'HEMIS API'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm font-mono">
                                                        {transaction.ip_address}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm">
                                                        {formatDate(transaction.created_at)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3 text-sm max-w-xs truncate"
                                                        title={transaction.error_message || ''}
                                                    >
                                                        {transaction.error_message || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="px-6 py-8 text-center text-muted-foreground"
                                                >
                                                    Kirish jurnali topilmadi
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

export default HemisTransactionsPage;
