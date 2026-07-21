import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import ProjectsList from './pages/admin/ProjectsList.jsx';
import ProjectDetail from './pages/admin/ProjectDetail.jsx';
import FormBuilder from './pages/admin/FormBuilder.jsx';
import UsersGlobal from './pages/admin/UsersGlobal.jsx';
import DocumentTypes from './pages/admin/DocumentTypes.jsx';
import SubformsLibrary from './pages/admin/SubformsLibrary.jsx';
import ParagraphsLibrary from './pages/admin/ParagraphsLibrary.jsx';
import ServerSettings from './pages/admin/ServerSettings.jsx';
import MyProjects from './pages/shared/MyProjects.jsx';
import MyDocuments from './pages/shared/MyDocuments.jsx';
import DocumentExecute from './pages/shared/DocumentExecute.jsx';

function Home() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin/proyectos' : '/mis-proyectos'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />

        <Route path="/admin/proyectos" element={<ProtectedRoute adminOnly><ProjectsList /></ProtectedRoute>} />
        <Route path="/admin/proyectos/:id" element={<ProtectedRoute adminOnly><ProjectDetail /></ProtectedRoute>} />
        <Route path="/admin/formularios/:id" element={<ProtectedRoute adminOnly><FormBuilder /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute adminOnly><UsersGlobal /></ProtectedRoute>} />
        <Route path="/admin/tipos-documento" element={<ProtectedRoute adminOnly><DocumentTypes /></ProtectedRoute>} />
        <Route path="/admin/subformularios" element={<ProtectedRoute adminOnly><SubformsLibrary /></ProtectedRoute>} />
        <Route path="/admin/parrafos" element={<ProtectedRoute adminOnly><ParagraphsLibrary /></ProtectedRoute>} />
        <Route path="/admin/parametros" element={<ProtectedRoute adminOnly><ServerSettings /></ProtectedRoute>} />

        <Route path="/mis-proyectos" element={<MyProjects />} />
        <Route path="/mis-proyectos/:projectId" element={<MyDocuments />} />
        <Route path="/documentos/:id" element={<DocumentExecute />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
