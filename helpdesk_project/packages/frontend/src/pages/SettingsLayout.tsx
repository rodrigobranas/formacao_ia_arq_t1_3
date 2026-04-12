import { Outlet } from "react-router";

function SettingsLayout() {
  return (
    <main className="px-6 py-8 animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default SettingsLayout;
