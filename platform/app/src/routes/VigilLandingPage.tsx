import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import publicUrl from '../utils/publicUrl';
import { OHIF_VIEWER_HOME_PATH } from '../constants/viewerRoutes';
import './VigilLandingPage.css';

function VigilLandingPage() {
  const logoSrc = useMemo(() => {
    const base = String(publicUrl || '/');
    return base.endsWith('/') ? `${base}LogoVigil.jpg` : `${base}/LogoVigil.jpg`;
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const prevLang = html.lang;
    const prevDir = html.getAttribute('dir') || '';
    html.lang = 'ar';
    html.setAttribute('dir', 'rtl');
    return () => {
      html.lang = prevLang;
      if (prevDir) {
        html.setAttribute('dir', prevDir);
      } else {
        html.removeAttribute('dir');
      }
    };
  }, []);

  return (
    <div
      data-vigil-landing
      className="relative h-full min-h-0 overflow-auto bg-[#0b1120] text-slate-100"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.16),transparent_38%),radial-gradient(circle_at_80%_12%,rgba(167,139,250,0.18),transparent_32%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.14),transparent_35%)]" />

      <main className="relative mx-auto grid min-h-full w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[330px_1fr] lg:px-10">
        <aside className="rounded-3xl border border-teal-200/15 bg-slate-950/70 p-6 shadow-2xl shadow-black/35 backdrop-blur">
          <p className="vigil-aside-brand text-center text-lg font-bold tracking-[0.2em] uppercase">
            Vigil Hub
          </p>
          <p className="vigil-intro-muted mt-2 text-sm leading-7">
            أحد أنظمة
            <span className="vigil-text-white mx-1 font-bold">فيجل</span>
            <span className="vigil-text-cyan mx-1 font-semibold tracking-wide">Vigil</span>
            المتخصصة في البرمجيات المتطورة لقطاع الأشعة.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-3">
            <img
              src={logoSrc}
              alt="Vigil logo"
              width={220}
              height={220}
              className="h-auto w-full rounded-xl object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="mt-8 space-y-3">
            <p className="vigil-contact-label text-lg tracking-[0.25em] uppercase">بيانات التواصل</p>
            <a
              href="tel:01004232647"
              className="vigil-contact-card flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm transition hover:border-teal-300/40"
            >
              <span>📞</span>
              <span>01004232647</span>
            </a>
            <a
              href="tel:01200216126"
              className="vigil-contact-card flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm transition hover:border-teal-300/40"
            >
              <span>📱</span>
              <span>01200216126</span>
            </a>
            <a
              href="mailto:info@vigilhub.app"
              className="vigil-contact-card flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm transition hover:border-teal-300/40"
            >
              <span>✉️</span>
              <span>info@vigilhub.app</span>
            </a>
            <a
              href="https://vigilhub.app"
              target="_blank"
              rel="noopener noreferrer"
              className="vigil-contact-card flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm transition hover:border-teal-300/40"
            >
              <span>🌐</span>
              <span>https://vigilhub.app</span>
            </a>
          </div>
        </aside>

        <section className="flex flex-col gap-6">
          <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-b from-violet-500/15 via-cyan-400/10 to-transparent p-7 shadow-2xl shadow-cyan-950/40 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1 uppercase">
                <span className="vigil-badge-soft text-[10px] font-semibold tracking-[0.18em]">
                  Advanced Experience
                </span>
                <span className="vigil-badge-strong text-sm font-extrabold tracking-[0.28em]">OHIF</span>
              </span>
              <Link
                to={OHIF_VIEWER_HOME_PATH}
                className="vigil-cta inline-flex items-center gap-3 rounded-2xl border border-teal-300/40 bg-teal-300/10 px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-teal-300/20 animate-[float_3s_ease-in-out_infinite]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-300/20">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
                    <path d="m3 12 9 5 9-5" />
                    <path d="m3 16 9 5 9-5" />
                  </svg>
                </span>
                ابدأ الآن OHIF Viewer
              </Link>
            </div>

            <h1 className="mt-6 text-3xl leading-tight font-bold text-white sm:text-5xl sm:leading-[1.2]">
              تجربة مختلفة لإدارة التصوير الطبي
              <span className="vigil-grad mt-2 block bg-gradient-to-l from-teal-200 to-violet-200 bg-clip-text">
                لمراكز الأشعة المتخصصة والمستشفيات
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 sm:text-lg">
              هذه الواجهة تقدم تصورًا حديثًا لخبرتنا في بناء وتخصيص حلول OHIF للجهات التي تعتمد على أجهزة
              الأشعة الحديثة، مع توازن واضح بين الأداء الطبي والهوية المؤسسية الراقية.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4">
                <p className="vigil-card-muted text-xs">Specialized</p>
                <p className="vigil-card-title mt-1 text-sm font-semibold">Radiology Ready</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4">
                <p className="vigil-card-muted text-xs">DICOM First</p>
                <p className="vigil-card-title mt-1 text-sm font-semibold">Workflow Focused</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4">
                <p className="vigil-card-muted text-xs">Enterprise</p>
                <p className="vigil-card-title mt-1 text-sm font-semibold">Scalable Integration</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-7">
              <h2 className="text-xl font-semibold text-white">رسالة المنصة</h2>
              <ul className="mt-4 space-y-4 text-sm leading-8">
                <li>
                  <span className="vigil-li-marker me-2">1.</span>
                  نقدم منصة تعكس عمق خبرتنا العملية مع بيئات الأشعة التشخيصية، وتركز على تقديم تجربة واضحة
                  واحترافية من أول زيارة.
                </li>
                <li>
                  <span className="vigil-li-marker me-2">2.</span>
                  <span className="vigil-strong-muted font-medium">
                    OHIF هو نواة مستقلة قابلة للدمج داخل المشروع الأكبر
                  </span>
                  <span className="vigil-rose mt-2 block text-lg font-extrabold tracking-wide">
                    Vigil PACS
                  </span>
                  <span className="vigil-violet mt-1 block text-xs font-semibold tracking-[0.16em]">
                    Picture Archiving and Communication System
                  </span>
                </li>
              </ul>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-7">
              <h2 className="text-xl font-semibold text-white">الخطوة التالية</h2>
              <p className="vigil-body-soft mt-4 text-sm leading-8">
                انتقل الآن إلى واجهة المشاهدة لبدء تجربة OHIF Viewer ضمن بيئة جاهزة للعرض والتطوير.
              </p>
              <Link
                to={OHIF_VIEWER_HOME_PATH}
                className="vigil-cta mt-6 inline-flex items-center gap-3 rounded-2xl border border-teal-300/40 bg-teal-300/10 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-teal-300/20 animate-[float_3s_ease-in-out_infinite]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-300/20">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
                    <path d="m3 12 9 5 9-5" />
                    <path d="m3 16 9 5 9-5" />
                  </svg>
                </span>
                ابدأ الآن OHIF Viewer
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default VigilLandingPage;
