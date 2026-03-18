import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Login from '@/pages/Login';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/pages/ProfilePage';
import UsersPage from '@/pages/UsersPage';
import QuizzesPage from '@/pages/QuizzesPage';
import ResultsPage from '@/pages/ResultsPage';
import TeachersPage from '@/pages/TeachersPage';
import FacultyPage from '@/pages/FacultyPage';
import KafedraPage from '@/pages/KafedraPage';
import GroupsPage from '@/pages/GroupsPage';
import SubjectsPage from '@/pages/SubjectsPage';
import StudentsPage from '@/pages/StudentsPage';
import QuestionsPage from '@/pages/QuestionsPage';
import QuestionFormPage from '@/pages/QuestionFormPage';
import QuizTestPage from '@/pages/QuizTestPage';
import UserAnswersPage from '@/pages/UserAnswersPage';
import TeacherGroupsPage from '@/pages/TeacherGroupsPage';
import TeacherSubjectsPage from '@/pages/TeacherSubjectsPage';
import TeacherRankingPage from '@/pages/TeacherRankingPage';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RoleRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactElement }) => {
  const { user } = useAuth();
  const userRoles = user?.roles?.map(r => r.name.toLowerCase()) || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
  const isTeacher = user?.roles?.some(role => role.name.toLowerCase() === 'teacher');

  if (isStudent) {
    return <Navigate to="/quiz-test" replace />;
  }

  if (isTeacher) {
    return <Navigate to="/questions" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardRedirect />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Admin-only routes */}
                <Route path="/dashboard" element={<RoleRoute allowedRoles={['admin']}><Dashboard /></RoleRoute>} />
                <Route path="/users" element={<RoleRoute allowedRoles={['admin']}><UsersPage /></RoleRoute>} />
                <Route path="/teachers" element={<RoleRoute allowedRoles={['admin']}><TeachersPage /></RoleRoute>} />
                <Route path="/teacher-ranking" element={<RoleRoute allowedRoles={['admin', 'teacher']}><TeacherRankingPage /></RoleRoute>} />
                <Route path="/faculties" element={<RoleRoute allowedRoles={['admin']}><FacultyPage /></RoleRoute>} />
                <Route path="/kafedras" element={<RoleRoute allowedRoles={['admin']}><KafedraPage /></RoleRoute>} />
                <Route path="/groups" element={<RoleRoute allowedRoles={['admin']}><GroupsPage /></RoleRoute>} />
                <Route path="/students" element={<RoleRoute allowedRoles={['admin']}><StudentsPage /></RoleRoute>} />

                {/* Admin + Teacher routes */}
                <Route path="/subjects" element={<RoleRoute allowedRoles={['admin', 'teacher']}><SubjectsPage /></RoleRoute>} />
                <Route path="/teacher-groups" element={<RoleRoute allowedRoles={['admin', 'teacher']}><TeacherGroupsPage /></RoleRoute>} />
                <Route path="/teacher-subjects" element={<RoleRoute allowedRoles={['admin', 'teacher']}><TeacherSubjectsPage /></RoleRoute>} />
                <Route path="/questions" element={<RoleRoute allowedRoles={['admin', 'teacher']}><QuestionsPage /></RoleRoute>} />
                <Route path="/questions/create" element={<RoleRoute allowedRoles={['admin', 'teacher']}><QuestionFormPage /></RoleRoute>} />
                <Route path="/questions/:id/edit" element={<RoleRoute allowedRoles={['admin', 'teacher']}><QuestionFormPage /></RoleRoute>} />
                <Route path="/quizzes" element={<RoleRoute allowedRoles={['admin', 'teacher']}><QuizzesPage /></RoleRoute>} />

                {/* Admin + Student routes */}
                <Route path="/quiz-test" element={<RoleRoute allowedRoles={['admin', 'student']}><QuizTestPage /></RoleRoute>} />
                <Route path="/results" element={<RoleRoute allowedRoles={['admin', 'student', 'teacher']}><ResultsPage /></RoleRoute>} />
                <Route path="/results/answers" element={<RoleRoute allowedRoles={['admin', 'student', 'teacher']}><UserAnswersPage /></RoleRoute>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
