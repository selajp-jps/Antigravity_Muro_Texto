import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './views/HomeView';
import TeacherView from './views/TeacherView';
import StudentView from './views/StudentView';
import { observarSesion } from './auth';

export default function App() {
  // Current route state: { view: 'home' | 'teacher' | 'student', sessionCode: string }
  const [route, setRoute] = useState(() => parseCurrentRoute());

  // Cuenta del docente que inició sesión (null si nadie lo hizo todavía).
  // Los alumnos no necesitan cuenta: esta sesión solo habilita los controles
  // del proyector.
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const unsubscribe = observarSesion((u) => {
      setUsuario(u);
      setCargandoSesion(false);
    });
    return () => unsubscribe();
  }, []);

  function parseCurrentRoute() {
    // Check hash first: #/teacher/ADM-101 or #/join/ADM-101
    const hash = window.location.hash || '';
    if (hash.startsWith('#/teacher/')) {
      const code = hash.replace('#/teacher/', '').split('?')[0].trim().toUpperCase();
      if (code) return { view: 'teacher', sessionCode: code };
    }
    if (hash.startsWith('#/join/')) {
      const code = hash.replace('#/join/', '').split('?')[0].trim().toUpperCase();
      if (code) return { view: 'student', sessionCode: code };
    }

    // Check query params fallback: ?role=teacher&session=ADM-101 or ?join=ADM-101
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session') || urlParams.get('join') || urlParams.get('code');
    const role = urlParams.get('role');

    if (session) {
      const code = session.trim().toUpperCase();
      if (role === 'teacher') {
        return { view: 'teacher', sessionCode: code };
      }
      return { view: 'student', sessionCode: code };
    }

    return { view: 'home', sessionCode: '' };
  }

  // Listen to hash and URL navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const navigateToHome = () => {
    window.location.hash = '#/';
    setRoute({ view: 'home', sessionCode: '' });
  };

  const navigateToTeacher = (code) => {
    const cleanCode = code.trim().toUpperCase();
    window.location.hash = `#/teacher/${cleanCode}`;
    setRoute({ view: 'teacher', sessionCode: cleanCode });
  };

  const navigateToStudent = (code) => {
    const cleanCode = code.trim().toUpperCase();
    window.location.hash = `#/join/${cleanCode}`;
    setRoute({ view: 'student', sessionCode: cleanCode });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        onGoHome={route.view !== 'home' ? navigateToHome : null}
        currentSessionCode={route.sessionCode}
        role={route.view === 'teacher' ? 'teacher' : route.view === 'student' ? 'student' : null}
        usuario={usuario}
      />

      <main className="flex-1">
        {route.view === 'home' && (
          <HomeView
            onNavigateToTeacher={navigateToTeacher}
            onNavigateToStudent={navigateToStudent}
            usuario={usuario}
            cargandoSesion={cargandoSesion}
          />
        )}

        {route.view === 'teacher' && (
          <TeacherView
            sessionCode={route.sessionCode}
            onGoHome={navigateToHome}
            usuario={usuario}
            cargandoSesion={cargandoSesion}
          />
        )}

        {route.view === 'student' && (
          <StudentView
            sessionCode={route.sessionCode}
            onGoHome={navigateToHome}
          />
        )}
      </main>
    </div>
  );
}
