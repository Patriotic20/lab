import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { roleService, type Role } from '@/services/roleService';

const RolePermissionsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const data = await roleService.getRoleById(Number(id)); 
                setRole(data || null);
            } catch (error) {
                console.error("Failed to fetch role permissions", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => navigate('/roles')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
                </Button>
                <div>Rol topilmadi.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/roles')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{role.name} ruxsatlari</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Barcha ruxsatlar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {Object.entries(
                            (role.permissions || []).reduce((acc: Record<string, typeof role.permissions>, perm) => {
                                // Assume format action:resource or resource:action.
                                // Typically, let's split by ':' and use the last part or first part. 
                                // Looking at the screenshot, we have 'update:quiz', 'read:quiz' etc.
                                // So the category is usually the part after the colon or the whole string if no colon.
                                const parts = perm.name.split(':');
                                const category = parts.length > 1 ? parts[1].toLowerCase() : 'boshqa';
                                
                                if (!acc[category]) {
                                    acc[category] = [];
                                }
                                acc[category]!.push(perm);
                                return acc;
                            }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([category, perms]) => (
                            <div key={category} className="space-y-3 border-b pb-4 last:border-0 last:pb-0">
                                <h3 className="text-lg font-semibold capitalize text-primary border-l-4 border-primary pl-2">
                                    {category}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {perms?.sort((a, b) => a.name.localeCompare(b.name)).map(perm => (
                                        <span key={perm.id} className="inline-flex items-center rounded-full border border-border/50 px-3 py-1 text-sm font-semibold bg-muted/30 shadow-sm">
                                            {perm.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {(!role.permissions || role.permissions.length === 0) && (
                            <span className="text-muted-foreground text-sm">Ruxsatlar topilmadi.</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default RolePermissionsPage;
