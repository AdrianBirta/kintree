import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-earbore-grayLight flex flex-col">
      <Header />

      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block bg-earbore-100 text-earbore-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Familia ta, într-un singur loc
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-earbore-ink mb-6 leading-tight">
            Construiește-ți <span className="text-earbore-600">arborele genealogic</span>
          </h1>

          <p className="text-earbore-gray text-lg max-w-2xl mx-auto mb-10">
            Adaugă membri ai familiei, poze și povești. eArbore te ajută să păstrezi
            legăturile de familie vii, generație după generație.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => navigate('/auth?mode=register')} className="btn-primary">
              Începe gratuit →
            </button>
            <button onClick={() => navigate('/auth?mode=login')} className="btn-outline">
              Am deja cont
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-earbore-border py-6 text-center text-sm text-earbore-gray">
        © {new Date().getFullYear()} eArbore. Toate drepturile rezervate.
      </footer>
    </div>
  );
};

export default LandingPage;