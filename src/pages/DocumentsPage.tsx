import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Document, Team } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/shallow';
const StatusBadge = ({ status }: { status: Document['status'] }) => {
  const statusMap = {
    Processing: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: 'Processing' },
    Processed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'Processed' },
    Failed: { icon: XCircle, color: 'bg-red-100 text-red-800', text: 'Failed' },
  };
  const { icon: Icon, color, text } = statusMap[status];
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </Badge>
  );
};
export function DocumentsPage() {
  const { isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    }))
  );
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api('/api/teams'),
    enabled: isAuthenticated && !!token,
  });
  const { data: allDocuments, isLoading: isLoadingDocs } = useQuery<Document[]>({
    queryKey: ['allDocuments'],
    queryFn: () => api('/api/documents'),
    enabled: isAuthenticated && !!token,
  });
  const isLoading = isLoadingTeams || isLoadingDocs;
  const teamsById = new Map(teams?.map(t => [t.id, t.name]));
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Center</h1>
        <p className="text-muted-foreground">
          Manage all your uploaded receipts, invoices, and financial documents.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>A complete history of your uploaded files across all teams.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : allDocuments && allDocuments.length > 0 ? (
                allDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.fileName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{teamsById.get(doc.teamId) || 'Unknown Team'}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true })}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No documents have been uploaded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}